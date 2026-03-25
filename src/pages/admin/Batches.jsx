import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coaching_getBatches, coaching_addBatch, coaching_getStudents, coaching_assignStudents } from '../../api/client';
import { fmt } from '../../utils/format';
import { Plus, Users, ArrowRight } from 'lucide-react';

export default function Batches() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', schedule: '', maxStudents: 30, fee_monthly: 0 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [assignBatch, setAssignBatch] = useState(null);
  const [sel, setSel] = useState([]);

  useEffect(() => {
    Promise.all([coaching_getBatches(), coaching_getStudents()]).then(([b, s]) => {
      setBatches(b.batches || []); setStudents(s.students || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name) { setMsg({ type: 'error', text: 'Enter name' }); return; }
    setSaving(true);
    try {
      const r = await coaching_addBatch(form);
      setBatches(p => [{ ...form, id: r.id, status: 'Active', studentCount: 0, faculty: [] }, ...p]);
      setShowForm(false); setMsg(null);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  }

  async function assign() {
    if (!assignBatch || !sel.length) return;
    setSaving(true);
    try {
      await coaching_assignStudents({ batch_id: assignBatch.id, students: JSON.stringify(sel) });
      const b = await coaching_getBatches();
      setBatches(b.batches || []);
      setAssignBatch(null); setSel([]);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  }

  if (loading) return <div className="loader"><div className="loader-ring"></div><div className="loader-dots"><span></span><span></span><span></span></div></div>;

  return (
    <div>
      {/* Header */}
      <div className="shdr">
        <div>
          <div className="stitle">Batches</div>
          <div className="ssub">{batches.length} batch(es)</div>
        </div>
        <button className="form-btn primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={14} /> New Batch
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="form-card">
          <div className="form-section-title">New Batch</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">Name <span className="req">*</span></label><input className="fi" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. JEE Batch A" /></div>
            <div className="fg"><label className="fl">Subject</label><input className="fi" value={form.subject} onChange={e => setF('subject', e.target.value)} /></div>
            <div className="fg"><label className="fl">Schedule</label><input className="fi" value={form.schedule} onChange={e => setF('schedule', e.target.value)} placeholder="Mon,Wed,Fri 6-8PM" /></div>
            <div className="fg"><label className="fl">Max Students</label><input className="fi" type="number" value={form.maxStudents} onChange={e => setF('maxStudents', e.target.value)} /></div>
            <div className="fg"><label className="fl">Monthly Fee ₹</label><input className="fi" type="number" value={form.fee_monthly} onChange={e => setF('fee_monthly', e.target.value)} /></div>
          </div>
          {msg && <div className="login-error" style={{ marginTop: '10px', textAlign: 'left' }}>{msg.text}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button className="form-btn primary" onClick={save} disabled={saving}>{saving ? '...' : 'Create'}</button>
            <button className="form-btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {assignBatch && (
        <div className="form-card" style={{ borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontWeight: 600, marginBottom: '12px' }}>
            Assign to: <span style={{ color: 'var(--accent)' }}>{assignBatch.name}</span>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
            {students.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', fontSize: '13px' }}>
                <input type="checkbox" checked={sel.includes(s.id)} onChange={e => setSel(p => e.target.checked ? [...p, s.id] : p.filter(x => x !== s.id))} style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }} />
                {s.name}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="form-btn primary" onClick={assign} disabled={saving || !sel.length}>{saving ? '...' : 'Assign'}</button>
            <button className="form-btn secondary" onClick={() => { setAssignBatch(null); setSel([]); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Batch Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
        {batches.map(b => (
          <div key={b.id} className="kpi-card" style={{ borderTop: '3px solid #8b5cf6', cursor: 'default', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{b.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{b.subject || '—'} · {b.schedule || '—'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', fontWeight: 800, color: '#8b5cf6' }}>
                  {b.studentCount}/{b.maxStudents}
                </div>
                <div style={{ width: '60px', height: '4px', borderRadius: '2px', background: 'rgba(139,92,246,.15)', marginTop: '4px' }}>
                  <div style={{ height: '100%', borderRadius: '2px', background: '#8b5cf6', width: `${Math.min(100, (b.studentCount / b.maxStudents) * 100)}%` }} />
                </div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--accent)' }}>₹{fmt(b.fee_monthly)}</span>/mo
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => { setAssignBatch(b); setSel([]); }} className="form-btn outline" style={{ padding: '6px 14px', fontSize: '11px', minHeight: 'auto' }}>
                <Users size={12} /> Add Students
              </button>
              <button onClick={() => navigate(`/batches/${b.id}`)} className="form-btn ghost" style={{ padding: '6px 14px', fontSize: '11px', minHeight: 'auto' }}>
                Modules & Details <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
