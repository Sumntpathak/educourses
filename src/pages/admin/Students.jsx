import { useState, useEffect } from 'react';
import { coaching_getStudents, coaching_addStudent } from '../../api/client';
import { Plus } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', father: '', mobile: '', gender: '', dob: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    coaching_getStudents().then(d => { setStudents(d.students || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name) { setMsg({ type: 'error', text: 'Enter name' }); return; }
    setSaving(true);
    try {
      const r = await coaching_addStudent(form);
      setStudents(p => [{ ...form, id: r.id, status: 'Active', batches: [] }, ...p]);
      setShowForm(false); setForm({ name: '', father: '', mobile: '', gender: '', dob: '', address: '' }); setMsg(null);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || (s.father || '').toLowerCase().includes(q);
  });

  if (loading) return <div className="loader"><div className="loader-ring"></div><div className="loader-dots"><span></span><span></span><span></span></div></div>;

  return (
    <div>
      {/* Header */}
      <div className="shdr">
        <div>
          <div className="stitle">Students</div>
          <div className="ssub">{filtered.length} student(s)</div>
        </div>
        <button className="form-btn primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={14} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="table-toolbar" style={{ background: 'transparent', border: 'none', padding: '0 0 16px' }}>
        <input className="search-box" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '360px' }} />
        <span className="tcount">{filtered.length} results</span>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="form-card">
          <div className="form-section-title">New Student</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">Name <span className="req">*</span></label><input className="fi" value={form.name} onChange={e => setF('name', e.target.value)} /></div>
            <div className="fg"><label className="fl">Father</label><input className="fi" value={form.father} onChange={e => setF('father', e.target.value)} /></div>
            <div className="fg"><label className="fl">Mobile</label><input className="fi" type="tel" value={form.mobile} onChange={e => setF('mobile', e.target.value)} /></div>
            <div className="fg"><label className="fl">Gender</label><select className="fi" value={form.gender} onChange={e => setF('gender', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
            <div className="fg"><label className="fl">DOB</label><input className="fi" type="date" value={form.dob} onChange={e => setF('dob', e.target.value)} /></div>
            <div className="fg"><label className="fl">Address</label><input className="fi" value={form.address} onChange={e => setF('address', e.target.value)} /></div>
          </div>
          {msg && <div className="login-error" style={{ marginTop: '10px', textAlign: 'left' }}>{msg.text}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button className="form-btn primary" onClick={save} disabled={saving}>{saving ? '...' : 'Save'}</button>
            <button className="form-btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Student Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '12px' }}>
        {filtered.map((s, i) => (
          <div key={s.id || i} className="kpi-card" style={{
            borderLeft: `3px solid ${s.status === 'Active' ? 'var(--accent)' : 'var(--muted)'}`,
            cursor: 'default', padding: '16px',
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="spav" style={{
                width: '42px', height: '42px', borderRadius: 'var(--radius-sm)',
                fontSize: '15px',
              }}>
                {s.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {s.father || '—'}{s.mobile ? ` · ${s.mobile}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {(s.batches || []).map(b => <span key={b.id} className="cbadge">{b.name}</span>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
