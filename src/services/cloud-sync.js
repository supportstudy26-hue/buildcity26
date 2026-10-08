// Persist requests before transmission; uncertain responses retry the same ID.
export class CloudSync {
  constructor({ snapshot, send, persist, notify = () => {}, online = () => true, uuid = () => crypto.randomUUID() }) {
    Object.assign(this, { snapshot, send, persist, notify, online, uuid });
    this.epoch = 0;
    this.busy = false;
    this.use(null);
  }
  use(owner, metadata = {}) {
    this.epoch++;
    this.owner = owner;
    this.cloud = metadata.cloud || null;
    this.pending = metadata.pending || null;
    this.conflict = !!metadata.conflict;
    this.dirty = metadata.dirty ?? true;
    this.error = null;
    this.status = this.conflict ? 'conflict' : this.pending ? 'pending' : this.cloud && !this.dirty ? 'synced' : 'local';
  }
  get metadata() { return { cloud: this.cloud, pending: this.pending, conflict: this.conflict, dirty: this.dirty }; }
  changed() { this.dirty = true; if (this.status === 'synced') this.status = 'pending'; }
  async save({ forceNew = false } = {}) {
    if (!this.owner || this.busy || this.conflict && !forceNew) return false;
    const epoch = this.epoch, owner = this.owner;
    const active = () => this.epoch === epoch && this.owner === owner;
    if (forceNew || !this.pending) {
      const state = this.snapshot();
      const ref = forceNew || !this.cloud ? { id: this.uuid(), revision: 0 } : this.cloud;
      this.pending = { id: ref.id, revision: ref.revision, requestId: this.uuid(), name: state.name, state };
      this.conflict = false;
    }
    if (!this.persist()) { this.status = 'storage-error'; this.notify(); return false; }
    if (!this.online()) { this.status = 'offline'; this.notify(); return false; }
    this.busy = true; this.status = 'saving'; this.error = null; this.notify();
    const request = this.pending;
    try {
      const row = await this.send(request);
      if (!active()) return false;
      if (row.id !== request.id || !Number.isSafeInteger(Number(row.revision)) || Number(row.revision) < 1) throw new Error('Phản hồi bản lưu không hợp lệ.');
      this.cloud = { id: row.id, revision: Number(row.revision) };
      this.pending = null;
      this.dirty = JSON.stringify(this.snapshot()) !== JSON.stringify(request.state);
      this.status = this.dirty ? 'pending' : 'synced'; this.conflict = false;
      if (!this.persist()) this.status = 'storage-error';
      return true;
    } catch (error) {
      if (!active()) return false;
      this.error = error;
      this.conflict = error.code === '40001' || /BC26_CONFLICT/.test(error.message);
      this.status = this.conflict ? 'conflict' : this.online() ? 'error' : 'offline';
      this.persist(); return false;
    } finally { this.busy = false; this.notify(); }
  }
}
