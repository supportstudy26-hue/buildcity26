import {packArchive, unpackArchive} from './archive-codec.js';
import {localKey, listLocalBackups, readLocalBackup, removeLocalBackup} from './local-storage.js';

const prefix = owner => `bc26:v1:backup:${owner}:`;
function owns(key, owner) {
  if (!key.startsWith(prefix(owner))) throw new Error('Bản dự phòng không thuộc tài khoản này.');
}

// Backups belong in IndexedDB, which is separate from localStorage's small quota.
// A successful request is not enough: resolve only when the transaction commits.
export function indexedBackupStore(factory = globalThis.indexedDB) {
  let opening;
  function open() {
    if (!factory) return Promise.reject(new Error('Trình duyệt chưa cho phép lưu dự phòng trên thiết bị.'));
    if (!opening) opening = new Promise((resolve, reject) => {
      const request = factory.open('bc26-backups-v1', 1);
      const timer = setTimeout(() => { opening = null; reject(new Error('Kho dự phòng đang bị tab khác giữ. Đóng tab game cũ rồi thử lại.')); }, 5000);
      request.onupgradeneeded = () => request.result.createObjectStore('backups', {keyPath: 'key'});
      request.onerror = () => {clearTimeout(timer); opening = null; reject(request.error);};
      request.onsuccess = () => {clearTimeout(timer); const db = request.result; db.onversionchange = () => {db.close(); opening = null;}; resolve(db);};
    });
    return opening;
  }
  async function run(mode, operation) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('backups', mode), request = operation(tx.objectStore('backups'));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = tx.onerror = () => reject(tx.error || request.error || new Error('Chưa ghi được bản dự phòng.'));
    });
  }
  return {put: row => run('readwrite', s => s.put(row)), get: key => run('readonly', s => s.get(key)),
    list: () => run('readonly', s => s.getAll()), remove: key => run('readwrite', s => s.delete(key))};
}

export class BackupStore {
  constructor({store = indexedBackupStore(), storage = globalThis.localStorage} = {}) {
    this.store = store; this.storage = storage;
  }
  async archive(owner, raw, key) {
    const unpacked = unpackArchive(raw);
    // Content addressing also deduplicates retries after a lost transaction response.
    if (!key) {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(unpacked));
      key = prefix(owner) + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    }
    owns(key, owner);
    let data; try {data = JSON.parse(unpacked);} catch { /* Damaged legacy files remain recoverable. */ }
    const row = {key, owner, raw: packArchive(unpacked), name: data?.city?.name || 'Bản lưu cần phục hồi', modifiedAt: data?.modifiedAt || 0};
    try {
      await this.store.put(row);
      const verified = await this.store.get(key);
      if (!verified || verified.owner !== owner || unpackArchive(verified.raw) !== unpacked) throw new Error('Chưa kiểm tra được bản dự phòng; thành phố cũ được giữ nguyên.');
    } catch (error) {
      // Private browsing may disable IndexedDB but still permit small local saves.
      this.storage.setItem(key, row.raw);
      if (unpackArchive(this.storage.getItem(key)) !== unpacked) throw error;
    }
    return key;
  }
  async archiveLocal(owner) {
    const raw = this.storage.getItem(localKey(owner));
    if (raw) return this.archive(owner, raw);
  }
  async migrateLocal() {
    const keys = Array.from({length: this.storage.length}, (_, i) => this.storage.key(i)).filter(k => k?.startsWith('bc26:v1:backup:'));
    for (const key of keys) {
      const owner = key.slice('bc26:v1:backup:'.length, key.lastIndexOf(':')), raw = this.storage.getItem(key);
      await this.archive(owner, raw, key);
      // Never discard a backup changed by another tab during this asynchronous copy.
      const copy = await this.store.get(key);
      if (copy?.owner === owner && unpackArchive(copy.raw) === unpackArchive(raw) && this.storage.getItem(key) === raw) this.storage.removeItem(key);
    }
  }
  async list(owner) {
    let stored; try {stored = await this.store.list();} catch {stored = [];}
    const rows = stored.filter(row => row.owner === owner).map(({key, name, modifiedAt}) => ({key, name, modifiedAt}));
    const merged = new Map(listLocalBackups(owner, this.storage).map(row => [row.key, row]));
    for (const row of rows) merged.set(row.key, row);
    return [...merged.values()].sort((a, b) => b.modifiedAt - a.modifiedAt);
  }
  async read(key, owner) {
    owns(key, owner);
    let row; try {row = await this.store.get(key);} catch (error) {if (!this.storage.getItem(key)) throw error;}
    if (row?.owner === owner) return unpackArchive(row.raw);
    return readLocalBackup(key, owner, this.storage);
  }
  async remove(key, owner) {
    await this.read(key, owner);
    try {await this.store.remove(key);} catch (error) {if (!this.storage.getItem(key)) throw error;}
    if (this.storage.getItem(key)) removeLocalBackup(key, owner, this.storage);
  }
}
