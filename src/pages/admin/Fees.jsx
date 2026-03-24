import { useState, useEffect } from 'react';
import { coaching_getFees, coaching_collectFee, coaching_getBatches, coaching_getStudents } from '../../api/client';
import { fmt } from '../../utils/format';
import { Plus } from 'lucide-react';

const MN = () => new Date().toISOString().slice(0, 7);

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ student_id: '', batch_id: '', month: MN(), amount: 0, payMode: 'Cash' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [fMonth, setFMonth] = useState(MN());
  const [fBatch, setFBatch] = useState('');

  useEffect(() => {
    Promise.all([coaching_getFees({ month: MN() }), coaching_getBatches(), coaching_getStudents()])
      .then(([f, b, s]) => { setFees(f.fees || []); setBatches(b.batches || []); setStudents(s.students || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function collect() {
    if (!form.student_id || !form.batch_id || !form.amount) { setMsg({ type: 'error', text: 'Fill all fields' }); return; }
    setSaving(true);
    const stu = students.find(s => s.id === form.student_id);
    const bat = batches.find(b => b.id === form.batch_id);
    try {
      await coaching_collectFee({ ...form, student_name: stu?.name || '', batch_name: bat?.name || '' });
      const f = await coaching_getFees({ month: fMonth });
      setFees(f.fees || []); setShowForm(false); setMsg(null);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  }

  function reload() {
    setLoading(true);
    coaching_getFees({ batch_id: fBatch, month: fMonth })
      .then(d => { setFees(d.fees || []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  if (loading) return <div className="loader"><div className="loader-ring"></div><div className="loader-dots"><span></span><span></span><span></span></div></div>;

  const paid = fees.filter(f => f.status === 'Paid').reduce((a, f) => a + (f.paid || 0), 0);
  const pending = fees.filter(f => f.status === 'Pending').reduce((a, f) => a + (f.amount || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="shdr">
        <div>
          <div className="stitle">Fee Collection</div>
          <div className="ssub">
            Collected: <span style={{ color: 'var(--accent3)' }}>₹{fmt(paid)}</span> · Pending: <span style={{ color: 'var(--danger)' }}>₹{fmt(pending)}</span>
          </div>
        </div>
        <button className="form-btn primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={14} /> Collect Fee
        </button>
      </div>

      {/* Filters */}
      <div className="table-toolbar" style={{ background: 'transparent', border: 'none', padding: '0 0 16px' }}>
        <div className="fg" style={{ width: '160px' }}>
          <label className="fl">Month</label>
          <input className="fi" type="month" value={fMonth} onChange={e => setFMonth(e.target.value)} />
        </div>
        <div className="fg" style={{ width: '160px' }}>
          <label className="fl">Batch</label>
          <select className="filter-select" value={fBatch} onChange={e => setFBatch(e.target.value)}>
            <option value="">All</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button className="form-btn ghost" onClick={reload} style={{ fontSize: '12px', marginTop: '16px' }}>Load</button>
      </div>

      {/* Collect Form */}
      {showForm && (
        <div className="form-card">
          <div className="form-section-title">Collect Fee</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">Student</label>
              <select className="fi" value={form.student_id} onChange={e => setF('student_id', e.target.value)}>
                <option value="">Select</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Batch</label>
              <select className="fi" value={form.batch_id} onChange={e => { setF('batch_id', e.target.value); const b = batches.find(x => x.id === e.target.value); if (b) setF('amount', b.fee_monthly); }}>
                <option value="">Select</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name} (₹{fmt(b.fee_monthly)})</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Month</label><input className="fi" type="month" value={form.month} onChange={e => setF('month', e.target.value)} /></div>
            <div className="fg"><label className="fl">Amount ₹</label><input className="fi" type="number" value={form.amount} onChange={e => setF('amount', e.target.value)} /></div>
            <div className="fg"><label className="fl">Mode</label>
              <select className="fi" value={form.payMode} onChange={e => setF('payMode', e.target.value)}>
                <option>Cash</option><option>UPI</option><option>Online</option>
              </select>
            </div>
          </div>
          {msg && <div className="login-error" style={{ marginTop: '10px', textAlign: 'left' }}>{msg.text}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button className="form-btn primary" onClick={collect} disabled={saving}>{saving ? '...' : 'Save'}</button>
            <button className="form-btn secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Fee Table */}
      <div className="table-wrap">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Student</th><th>Batch</th><th>Month</th><th style={{ textAlign: 'right' }}>Amount</th><th>Mode</th><th>Status</th></tr>
            </thead>
            <tbody>
              {fees.length === 0 ? (
                <tr><td colSpan={6} className="empty">No records</td></tr>
              ) : fees.map((f, i) => (
                <tr key={f.id || i}>
                  <td style={{ fontWeight: 500 }}>{f.student_name}</td>
                  <td><span className="cbadge">{f.batch_name || '—'}</span></td>
                  <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{f.month}</td>
                  <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: f.status === 'Paid' ? 'var(--accent3)' : 'var(--danger)' }}>
                    ₹{fmt(f.paid || f.amount)}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{f.payMode}</td>
                  <td>
                    <span className={`badge ${f.status === 'Paid' ? 'paid' : 'pending'}`}>{f.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
