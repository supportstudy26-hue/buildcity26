import {packArchive,unpackArchive} from './archive-codec.js';
import { serialize, validateSave, SIZE, SAVE_VERSION } from '../game/core.js';
const PREFIX = 'bc26:v1:';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const localKey = (owner = 'guest') => PREFIX + owner;
export function saveLocal(city, owner = 'guest', cloud = null, sync = {}, storage = localStorage) {
  const data = { city: serialize(city), cloud, ...sync, modifiedAt: Date.now() };
  const raw=JSON.stringify(data);
  try{storage.setItem(localKey(owner),raw);}catch(error){if(!/quota/i.test(error.name+' '+error.message))throw error;try{storage.setItem(localKey(owner),packArchive(raw));}catch{throw error;}}return data;
}
export function loadLocal(owner = 'guest', storage = localStorage) {
  const raw = storage.getItem(localKey(owner)); if (!raw) return null;
  const data = JSON.parse(unpackArchive(raw)), city = validateSave(data.city);
  const cloud = data.cloud && UUID.test(data.cloud.id) && Number.isSafeInteger(data.cloud.revision) && data.cloud.revision > 0 ? { id: data.cloud.id, revision: data.cloud.revision } : null;
  let pending = null;
  if (data.pending) {
    const p = data.pending;
    if (!UUID.test(p.id) || !UUID.test(p.requestId) || !Number.isSafeInteger(p.revision) || p.revision < 0) throw new Error('Yêu cầu đồng bộ không hợp lệ.');
    // Validate, but retry the exact original payload: the server may already have committed it.
    validateSave(p.state);
    pending = { id: p.id, revision: p.revision, requestId: p.requestId, name: p.name, state: p.state };
  }
  return { city, cloud, pending, conflict: !!data.conflict, dirty: data.dirty ?? true, modifiedAt: data.modifiedAt, migrated: data.city.schemaVersion < SAVE_VERSION || data.city.mapSize < SIZE || !data.city.progression };
}
// Preserve drafts before opening/importing another city. Keep damaged saves too.
export function archiveLocal(owner = 'guest', storage = localStorage, uuid = () => crypto.randomUUID()) {
  const raw = storage.getItem(localKey(owner));
  if (raw) {
    const prefix=`${PREFIX}backup:${owner}:`;
    for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(prefix)){try{if(unpackArchive(storage.getItem(key))===unpackArchive(raw))return;}catch{/* Retain unreadable backups too. */}}}
    const key=`${prefix}${uuid()}`;
    try{storage.setItem(key,raw);}catch(error){
      if(!/quota/i.test(error.name+' '+error.message))throw error;
      // Add a compact copy without deleting existing drafts or backups.
      try{storage.setItem(key,packArchive(unpackArchive(raw)));}catch{throw error;}
    }
  }
}
export function listLocalBackups(owner = 'guest', storage = localStorage) {
  const prefix = `${PREFIX}backup:${owner}:`, rows = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i); if (!key?.startsWith(prefix)) continue;
    try { const data = JSON.parse(unpackArchive(storage.getItem(key))); rows.push({ key, name: data.city?.name || 'Bản lưu cũ', modifiedAt: data.modifiedAt || 0 }); }
    catch { rows.push({ key, name: 'Bản lưu cần phục hồi', modifiedAt: 0 }); }
  }
  return rows.sort((a, b) => b.modifiedAt - a.modifiedAt);
}
export function readLocalBackup(key, owner = 'guest', storage = localStorage) {
  if (!key.startsWith(`${PREFIX}backup:${owner}:`)) throw new Error('Bản lưu không thuộc tài khoản này.');
  const raw = storage.getItem(key); if (!raw) throw new Error('Không tìm thấy bản lưu.'); return unpackArchive(raw);
}
export function removeLocalBackup(key, owner = 'guest', storage = localStorage) {
  readLocalBackup(key, owner, storage); storage.removeItem(key);
}
