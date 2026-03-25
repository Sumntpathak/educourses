/* ════════════════════════════════════════════════════════════════
   Local Store — localStorage CRUD abstraction for new features
════════════════════════════════════════════════════════════════ */

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function _get(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function _getObj(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

/* ── Modules ── */
export function getModules(batchId) {
  return _get('eduC_modules').filter(m => m.batchId === batchId).sort((a, b) => a.order - b.order);
}
export function getAllModules() { return _get('eduC_modules'); }
export function addModule(batchId, data) {
  const all = _get('eduC_modules');
  const order = all.filter(m => m.batchId === batchId).length;
  const mod = { id: uid(), batchId, ...data, topics: data.topics || [], order, createdAt: new Date().toISOString() };
  all.push(mod); _set('eduC_modules', all);
  return mod;
}
export function updateModule(id, data) {
  const all = _get('eduC_modules');
  const idx = all.findIndex(m => m.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...data };
  _set('eduC_modules', all);
  return all[idx];
}
export function deleteModule(id) {
  const all = _get('eduC_modules').filter(m => m.id !== id);
  _set('eduC_modules', all);
  // also delete linked notes & test links
  _set('eduC_notes', _get('eduC_notes').filter(n => n.moduleId !== id));
  _set('eduC_testModules', _get('eduC_testModules').filter(t => t.moduleId !== id));
}
export function addTopic(moduleId, name) {
  const all = _get('eduC_modules');
  const mod = all.find(m => m.id === moduleId);
  if (!mod) return null;
  const topic = { id: uid(), name, done: false };
  mod.topics = [...(mod.topics || []), topic];
  _set('eduC_modules', all);
  return topic;
}
export function toggleTopic(moduleId, topicId) {
  const all = _get('eduC_modules');
  const mod = all.find(m => m.id === moduleId);
  if (!mod) return;
  const t = (mod.topics || []).find(t => t.id === topicId);
  if (t) t.done = !t.done;
  _set('eduC_modules', all);
}
export function deleteTopic(moduleId, topicId) {
  const all = _get('eduC_modules');
  const mod = all.find(m => m.id === moduleId);
  if (!mod) return;
  mod.topics = (mod.topics || []).filter(t => t.id !== topicId);
  _set('eduC_modules', all);
}

/* ── Notes ── */
export function getNotes(moduleId) {
  return _get('eduC_notes').filter(n => n.moduleId === moduleId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export function getNotesByBatch(batchId) {
  return _get('eduC_notes').filter(n => n.batchId === batchId);
}
export function getAllNotes() { return _get('eduC_notes'); }
export function addNote(moduleId, batchId, data) {
  const all = _get('eduC_notes');
  const note = { id: uid(), moduleId, batchId, ...data, createdAt: new Date().toISOString() };
  all.push(note); _set('eduC_notes', all);
  return note;
}
export function updateNote(id, data) {
  const all = _get('eduC_notes');
  const idx = all.findIndex(n => n.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
  _set('eduC_notes', all);
  return all[idx];
}
export function deleteNote(id) {
  _set('eduC_notes', _get('eduC_notes').filter(n => n.id !== id));
}

/* ── Test-Module Links ── */
export function linkTestToModule(testId, moduleId) {
  const all = _get('eduC_testModules');
  if (all.find(l => l.testId === testId)) {
    const idx = all.findIndex(l => l.testId === testId);
    all[idx].moduleId = moduleId;
  } else {
    all.push({ testId, moduleId });
  }
  _set('eduC_testModules', all);
}
export function getTestModuleLinks() { return _get('eduC_testModules'); }
export function getModuleForTest(testId) {
  return _get('eduC_testModules').find(l => l.testId === testId)?.moduleId || null;
}

/* ── Referrals ── */
const QUOTA_KEY = 'eduC_quota';
const REFERRAL_KEY = 'eduC_referrals';

export function getQuota() {
  return _getObj(QUOTA_KEY, { base: 30, perReferral: 20, freeBatches: 1 });
}
export function getReferrals() { return _get(REFERRAL_KEY); }
export function addReferral(data) {
  const all = _get(REFERRAL_KEY);
  const ref = { id: uid(), ...data, status: 'pending', createdAt: new Date().toISOString() };
  all.push(ref); _set(REFERRAL_KEY, all);
  return ref;
}
export function updateReferralStatus(id, status) {
  const all = _get(REFERRAL_KEY);
  const idx = all.findIndex(r => r.id === id);
  if (idx >= 0) { all[idx].status = status; _set(REFERRAL_KEY, all); }
}
export function getReferralStats() {
  const quota = getQuota();
  const refs = getReferrals();
  const verified = refs.filter(r => r.status === 'verified').length;
  const totalStudents = quota.base + (verified * quota.perReferral);
  const freeBatches = quota.freeBatches;
  return { base: quota.base, verified, pending: refs.filter(r => r.status === 'pending').length, totalStudents, freeBatches, referrals: refs };
}
export function getReferralCode() {
  let code = localStorage.getItem('eduC_refCode');
  if (!code) { code = 'EDU-' + Math.random().toString(36).slice(2, 8).toUpperCase(); localStorage.setItem('eduC_refCode', code); }
  return code;
}

/* ── Certificates ── */
export function getCertificates() { return _get('eduC_certificates'); }
export function addCertificate(data) {
  const all = _get('eduC_certificates');
  const cert = { id: uid(), ...data, generatedAt: new Date().toISOString(), verifyCode: 'EC-' + uid().toUpperCase() };
  all.push(cert); _set('eduC_certificates', all);
  return cert;
}

/* ── Saved Pamphlets ── */
export function getSavedPamphlets() { return _get('eduC_pamphlets'); }
export function savePamphlet(data) {
  const all = _get('eduC_pamphlets');
  const p = { id: uid(), ...data, createdAt: new Date().toISOString() };
  all.push(p); _set('eduC_pamphlets', all);
  return p;
}
export function deletePamphlet(id) {
  _set('eduC_pamphlets', _get('eduC_pamphlets').filter(p => p.id !== id));
}

/* ── Module Completion (student progress) ── */
export function getStudentProgress(studentId, batchId) {
  const all = _getObj('eduC_progress', {});
  return all[`${studentId}_${batchId}`] || {};
}
export function markTopicDone(studentId, batchId, moduleId, topicId, done) {
  const all = _getObj('eduC_progress', {});
  const key = `${studentId}_${batchId}`;
  if (!all[key]) all[key] = {};
  if (!all[key][moduleId]) all[key][moduleId] = {};
  all[key][moduleId][topicId] = done;
  _set('eduC_progress', all);
}

/* ══════════════════════════════════════════════════════════════
   TEACHERS
══════════════════════════════════════════════════════════════ */
export function getTeachers() { return _get('eduC_teachers'); }
export function getTeacher(id) { return _get('eduC_teachers').find(t => t.id === id) || null; }
export function addTeacher(data) {
  const all = _get('eduC_teachers');
  const pin = data.pin || String(Math.floor(1000 + Math.random() * 9000));
  const t = { id: uid(), ...data, pin, status: 'active', assignedBatches: [], createdAt: new Date().toISOString() };
  all.push(t); _set('eduC_teachers', all);
  return t;
}
export function updateTeacher(id, data) {
  const all = _get('eduC_teachers');
  const idx = all.findIndex(t => t.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], ...data };
  _set('eduC_teachers', all);
  return all[idx];
}
export function deleteTeacher(id) {
  _set('eduC_teachers', _get('eduC_teachers').filter(t => t.id !== id));
}
export function assignTeacherToBatch(teacherId, batchId) {
  const all = _get('eduC_teachers');
  const t = all.find(x => x.id === teacherId);
  if (!t) return;
  if (!t.assignedBatches) t.assignedBatches = [];
  if (!t.assignedBatches.includes(batchId)) t.assignedBatches.push(batchId);
  _set('eduC_teachers', all);
}
export function unassignTeacherFromBatch(teacherId, batchId) {
  const all = _get('eduC_teachers');
  const t = all.find(x => x.id === teacherId);
  if (!t) return;
  t.assignedBatches = (t.assignedBatches || []).filter(b => b !== batchId);
  _set('eduC_teachers', all);
}
export function teacherLogin(name, pin) {
  const t = _get('eduC_teachers').find(x => x.name.toLowerCase() === name.toLowerCase() && x.pin === pin && x.status === 'active');
  return t || null;
}

/* ── Teacher Live Status (heartbeat) ── */
export function teacherHeartbeat(teacherId) {
  const all = _getObj('eduC_teacher_live', {});
  all[teacherId] = Date.now();
  _set('eduC_teacher_live', all);
}
export function getTeacherLiveStatus() {
  const all = _getObj('eduC_teacher_live', {});
  const now = Date.now();
  const result = {};
  Object.entries(all).forEach(([id, ts]) => {
    result[id] = (now - ts) < 120000 ? 'online' : (now - ts) < 600000 ? 'away' : 'offline';
  });
  return result;
}
export function clearTeacherHeartbeat(teacherId) {
  const all = _getObj('eduC_teacher_live', {});
  delete all[teacherId];
  _set('eduC_teacher_live', all);
}

/* ── Teacher Schedule ── */
export function getTeacherSchedule(teacherId) {
  return _get('eduC_schedules').filter(s => s.teacherId === teacherId);
}
export function addScheduleEntry(data) {
  const all = _get('eduC_schedules');
  const s = { id: uid(), ...data, createdAt: new Date().toISOString() };
  all.push(s); _set('eduC_schedules', all);
  return s;
}
export function deleteScheduleEntry(id) {
  _set('eduC_schedules', _get('eduC_schedules').filter(s => s.id !== id));
}
export function getAllSchedules() { return _get('eduC_schedules'); }
