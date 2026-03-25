import { useState, useEffect } from 'react';
import { getTeachers, addTeacher, updateTeacher, deleteTeacher, assignTeacherToBatch, unassignTeacherFromBatch, getTeacherLiveStatus, getAllSchedules, addScheduleEntry, deleteScheduleEntry } from '../../store/localStore';
import { coaching_getBatches } from '../../api/client';
import { Plus, Trash2, Edit3, Users, BookOpen, CheckCircle, Circle, Phone, Mail, Clock, Calendar, Shield } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '6:00 AM - 8:00 AM', '8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM',
  '6:00 PM - 8:00 PM', '8:00 PM - 10:00 PM',
];

const statusColor = (s) => s === 'online' ? '#22c55e' : s === 'away' ? '#f59e0b' : '#9ca3af';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [liveStatus, setLiveStatus] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', subject: '', qualification: '' });
  const [createdPin, setCreatedPin] = useState(null);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [batchSelect, setBatchSelect] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Schedule form
  const [schedForm, setSchedForm] = useState({ teacherId: '', batchId: '', day: '', time: '', module: '' });
  const [schedFilter, setSchedFilter] = useState('');

  const reload = () => {
    setTeachers(getTeachers());
    setSchedules(getAllSchedules());
    setLiveStatus(getTeacherLiveStatus());
  };

  useEffect(() => {
    reload();
    coaching_getBatches().then(d => setBatches(d.batches || [])).catch(() => {});
    const iv = setInterval(() => setLiveStatus(getTeacherLiveStatus()), 30000);
    return () => clearInterval(iv);
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function save() {
    if (!form.name.trim()) return;
    const t = addTeacher({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), subject: form.subject.trim(), qualification: form.qualification.trim() });
    setCreatedPin(t.pin);
    setForm({ name: '', phone: '', email: '', subject: '', qualification: '' });
    reload();
  }

  function handleDelete(id) {
    deleteTeacher(id);
    setConfirmDelete(null);
    reload();
  }

  function toggleStatus(t) {
    updateTeacher(t.id, { status: t.status === 'active' ? 'inactive' : 'active' });
    reload();
  }

  function startEdit(t) {
    setEditId(t.id);
    setEditForm({ name: t.name, phone: t.phone || '', email: t.email || '', subject: t.subject || '', qualification: t.qualification || '' });
  }

  function saveEdit(id) {
    updateTeacher(id, { name: editForm.name.trim(), phone: editForm.phone.trim(), email: editForm.email.trim(), subject: editForm.subject.trim(), qualification: editForm.qualification.trim() });
    setEditId(null);
    reload();
  }

  function handleAssignBatch(teacherId) {
    const bId = batchSelect[teacherId];
    if (!bId) return;
    assignTeacherToBatch(teacherId, bId);
    setBatchSelect(s => ({ ...s, [teacherId]: '' }));
    reload();
  }

  function handleUnassignBatch(teacherId, batchId) {
    unassignTeacherFromBatch(teacherId, batchId);
    reload();
  }

  function addSched() {
    if (!schedForm.teacherId || !schedForm.batchId || !schedForm.day || !schedForm.time) return;
    const teacher = teachers.find(t => t.id === schedForm.teacherId);
    const batch = batches.find(b => b.id === schedForm.batchId);
    addScheduleEntry({
      teacherId: schedForm.teacherId,
      teacherName: teacher?.name || '',
      batchId: schedForm.batchId,
      batchName: batch?.name || '',
      day: schedForm.day,
      time: schedForm.time,
      module: schedForm.module.trim(),
    });
    setSchedForm({ teacherId: '', batchId: '', day: '', time: '', module: '' });
    reload();
  }

  function deleteSched(id) {
    deleteScheduleEntry(id);
    reload();
  }

  const batchMap = {};
  batches.forEach(b => { batchMap[b.id] = b.name; });

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) || (t.subject || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q);
  });

  const online = teachers.filter(t => liveStatus[t.id] === 'online').length;
  const away = teachers.filter(t => liveStatus[t.id] === 'away').length;
  const offline = teachers.length - online - away;

  const filteredSchedules = schedFilter ? schedules.filter(s => s.teacherId === schedFilter) : schedules;

  return (
    <div>
      {/* Header */}
      <div className="shdr">
        <div>
          <div className="stitle">Teachers</div>
          <div className="ssub">{teachers.length} teacher(s)</div>
        </div>
        <button className="form-btn primary" onClick={() => { setShowForm(s => !s); setCreatedPin(null); }}>
          <Plus size={14} /> Add Teacher
        </button>
      </div>

      {/* KPI Row */}
      <div className="kpi-grid" style={{ marginBottom: '18px' }}>
        <div className="kpi-card">
          <div className="kpi-label"><Users size={14} /> Total Teachers</div>
          <div className="kpi-value">{teachers.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><CheckCircle size={14} style={{ color: '#22c55e' }} /> Online Now</div>
          <div className="kpi-value" style={{ color: '#22c55e' }}>{online}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><Clock size={14} style={{ color: '#f59e0b' }} /> Away</div>
          <div className="kpi-value" style={{ color: '#f59e0b' }}>{away}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><Circle size={14} style={{ color: '#9ca3af' }} /> Offline</div>
          <div className="kpi-value" style={{ color: '#9ca3af' }}>{offline}</div>
        </div>
      </div>

      {/* Add Teacher Form */}
      {showForm && (
        <div className="form-card" style={{ marginBottom: '18px' }}>
          <div className="form-section-title">New Teacher</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">Name <span className="req">*</span></label><input className="fi" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Full name" /></div>
            <div className="fg"><label className="fl">Phone</label><input className="fi" type="tel" value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="Mobile number" /></div>
            <div className="fg"><label className="fl">Email</label><input className="fi" type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="Email address" /></div>
            <div className="fg"><label className="fl">Subject Specialty</label><input className="fi" value={form.subject} onChange={e => setF('subject', e.target.value)} placeholder="e.g. Mathematics" /></div>
            <div className="fg"><label className="fl">Qualification</label><input className="fi" value={form.qualification} onChange={e => setF('qualification', e.target.value)} placeholder="e.g. M.Sc Mathematics" /></div>
          </div>
          {createdPin && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--success-bg, #ecfdf5)', border: '1px solid var(--success-border, #86efac)', borderRadius: 'var(--radius-sm, 6px)', fontSize: '13px' }}>
              <Shield size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Teacher created! Login PIN: <strong style={{ fontSize: '16px', letterSpacing: '2px' }}>{createdPin}</strong>
              <span style={{ color: 'var(--muted)', marginLeft: '8px' }}>(share this with the teacher)</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button className="form-btn primary" onClick={save}>Save Teacher</button>
            <button className="form-btn secondary" onClick={() => { setShowForm(false); setCreatedPin(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '14px' }}>
        <input className="search-box" placeholder="Search teachers by name, subject, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '400px' }} />
      </div>

      {/* Teacher Cards Grid */}
      {filtered.length === 0 ? (
        <div className="empty" style={{ padding: '40px 0', textAlign: 'center' }}>
          <Users size={32} style={{ color: 'var(--muted)', marginBottom: '8px' }} />
          <div>No teachers found. Add your first teacher above.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '14px', marginBottom: '32px' }}>
          {filtered.map(t => {
            const ls = liveStatus[t.id] || 'offline';
            const isEditing = editId === t.id;

            return (
              <div key={t.id} className="form-card" style={{ position: 'relative', padding: '18px', borderLeft: `3px solid ${t.status === 'active' ? 'var(--accent)' : 'var(--muted)'}` }}>
                {/* Live status dot */}
                <div style={{ position: 'absolute', top: '14px', right: '14px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--muted)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor(ls) }} />
                  {ls}
                </div>

                {isEditing ? (
                  <>
                    <div className="form-grid" style={{ marginBottom: '10px' }}>
                      <div className="fg"><label className="fl">Name</label><input className="fi" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div className="fg"><label className="fl">Phone</label><input className="fi" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
                      <div className="fg"><label className="fl">Email</label><input className="fi" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
                      <div className="fg"><label className="fl">Subject</label><input className="fi" value={editForm.subject} onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))} /></div>
                      <div className="fg"><label className="fl">Qualification</label><input className="fi" value={editForm.qualification} onChange={e => setEditForm(f => ({ ...f, qualification: e.target.value }))} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="form-btn primary" onClick={() => saveEdit(t.id)}>Save</button>
                      <button className="form-btn ghost" onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Name & details */}
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{t.name}</div>
                    {(t.subject || t.qualification) && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                        <BookOpen size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {t.subject}{t.subject && t.qualification ? ' — ' : ''}{t.qualification}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      {t.phone && <span><Phone size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{t.phone}</span>}
                      {t.email && <span><Mail size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{t.email}</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', marginBottom: '8px' }}>
                      <span className="badge" style={{ fontSize: '10px', opacity: 0.7 }}>PIN: {t.pin}</span>
                    </div>

                    {/* Assigned batch pills */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {(t.assignedBatches || []).map(bId => (
                        <span key={bId} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                          {batchMap[bId] || bId}
                          <Trash2 size={10} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => handleUnassignBatch(t.id, bId)} />
                        </span>
                      ))}
                    </div>

                    {/* Assign batch */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
                      <select className="fi" style={{ flex: 1, fontSize: '12px', padding: '4px 8px' }} value={batchSelect[t.id] || ''} onChange={e => setBatchSelect(s => ({ ...s, [t.id]: e.target.value }))}>
                        <option value="">Assign batch...</option>
                        {batches.filter(b => !(t.assignedBatches || []).includes(b.id)).map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <button className="form-btn outline" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => handleAssignBatch(t.id)}>Assign</button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: '10px' }}>
                      <button className="form-btn ghost" style={{ fontSize: '11px' }} onClick={() => startEdit(t)}>
                        <Edit3 size={12} /> Edit
                      </button>
                      <button className="form-btn ghost" style={{ fontSize: '11px' }} onClick={() => toggleStatus(t)}>
                        {t.status === 'active' ? <><Circle size={12} /> Deactivate</> : <><CheckCircle size={12} /> Activate</>}
                      </button>
                      {confirmDelete === t.id ? (
                        <>
                          <button className="form-btn danger" style={{ fontSize: '11px' }} onClick={() => handleDelete(t.id)}>Confirm Delete</button>
                          <button className="form-btn ghost" style={{ fontSize: '11px' }} onClick={() => setConfirmDelete(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="form-btn ghost" style={{ fontSize: '11px', color: 'var(--danger, #ef4444)' }} onClick={() => setConfirmDelete(t.id)}>
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Section */}
      <div style={{ marginTop: '8px' }}>
        <div className="shdr">
          <div>
            <div className="stitle"><Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />Schedule</div>
            <div className="ssub">Manage teacher-batch schedules</div>
          </div>
        </div>

        {/* Add Schedule Form */}
        <div className="form-card" style={{ marginBottom: '16px' }}>
          <div className="form-section-title">Add Schedule Entry</div>
          <div className="form-grid">
            <div className="fg">
              <label className="fl">Teacher <span className="req">*</span></label>
              <select className="fi" value={schedForm.teacherId} onChange={e => setSchedForm(f => ({ ...f, teacherId: e.target.value }))}>
                <option value="">Select teacher</option>
                {teachers.filter(t => t.status === 'active').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Batch <span className="req">*</span></label>
              <select className="fi" value={schedForm.batchId} onChange={e => setSchedForm(f => ({ ...f, batchId: e.target.value }))}>
                <option value="">Select batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Day <span className="req">*</span></label>
              <select className="fi" value={schedForm.day} onChange={e => setSchedForm(f => ({ ...f, day: e.target.value }))}>
                <option value="">Select day</option>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Time Slot <span className="req">*</span></label>
              <select className="fi" value={schedForm.time} onChange={e => setSchedForm(f => ({ ...f, time: e.target.value }))}>
                <option value="">Select time</option>
                {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Module</label>
              <input className="fi" value={schedForm.module} onChange={e => setSchedForm(f => ({ ...f, module: e.target.value }))} placeholder="Optional module/topic" />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <button className="form-btn primary" onClick={addSched}><Plus size={14} /> Add Schedule</button>
          </div>
        </div>

        {/* Filter + Schedule Table */}
        <div style={{ marginBottom: '10px' }}>
          <select className="fi" style={{ maxWidth: '280px', fontSize: '12px' }} value={schedFilter} onChange={e => setSchedFilter(e.target.value)}>
            <option value="">All teachers</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="empty" style={{ padding: '30px 0', textAlign: 'center' }}>
            <Clock size={28} style={{ color: 'var(--muted)', marginBottom: '6px' }} />
            <div>No schedule entries yet.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Batch</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Module</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map(s => (
                  <tr key={s.id}>
                    <td>{s.teacherName}</td>
                    <td>{s.batchName}</td>
                    <td>{s.day}</td>
                    <td>{s.time}</td>
                    <td>{s.module || '—'}</td>
                    <td>
                      <button className="form-btn ghost" style={{ padding: '2px 6px', color: 'var(--danger, #ef4444)' }} onClick={() => deleteSched(s.id)}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
