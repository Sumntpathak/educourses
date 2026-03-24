import { useState, useEffect } from 'react';
import { coaching_getStudents, coaching_getStudentPerformance } from '../../api/client';
import { fmt, fmtDate, getGrade } from '../../utils/format';

export default function Performance() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState('');
  const [perf, setPerf] = useState(null);
  const [lp, setLp] = useState(false);

  useEffect(() => {
    coaching_getStudents().then(d => { setStudents(d.students || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function load(sid) {
    setSel(sid);
    if (!sid) { setPerf(null); return; }
    setLp(true);
    try { setPerf(await coaching_getStudentPerformance({ student_id: sid })); }
    catch { setPerf(null); }
    setLp(false);
  }

  if (loading) return <div className="loader"><div className="loader-ring"></div><div className="loader-dots"><span></span><span></span><span></span></div></div>;

  return (
    <div>
      {/* Header */}
      <div className="shdr">
        <div>
          <div className="stitle">Student Performance</div>
          <div className="ssub">View detailed analytics per student</div>
        </div>
      </div>

      {/* Student Selector */}
      <div className="form-card">
        <label className="fl">Select Student</label>
        <select className="fi" value={sel} onChange={e => load(e.target.value)} style={{ maxWidth: '400px' }}>
          <option value="">— Choose —</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.father ? `(${s.father})` : ''}</option>)}
        </select>
      </div>

      {lp && <div className="loader"><div className="loader-ring"></div><div className="loader-dots"><span></span><span></span><span></span></div></div>}

      {perf && perf.student && (
        <div>
          {/* KPI Cards */}
          <div className="kpi-grid">
            {[
              { l: 'Attendance', v: `${perf.attendance.percentage}%`, s: `${perf.attendance.present}/${perf.attendance.total}`, c: '#06b6d4' },
              { l: 'Test Average', v: `${perf.testAvg}%`, s: `${perf.scores.length} tests`, c: '#8b5cf6' },
              { l: 'Fee Paid', v: `₹${fmt(perf.feeSummary.totalPaid)}`, c: '#10b981' },
              { l: 'Fee Pending', v: `₹${fmt(perf.feeSummary.totalPending)}`, c: perf.feeSummary.totalPending > 0 ? '#ef4444' : '#10b981' },
            ].map(k => (
              <div key={k.l} className="kpi-card" style={{ borderTop: `3px solid ${k.c}`, textAlign: 'center' }}>
                <div className="kpi-label">{k.l}</div>
                <div className="kpi-value" style={{ color: k.c, fontFamily: "'JetBrains Mono',monospace" }}>{k.v}</div>
                {k.s && <div className="kpi-sub">{k.s}</div>}
              </div>
            ))}
          </div>

          {/* Test Scores Table */}
          {perf.scores.length > 0 && (
            <div className="form-card">
              <div className="form-section-title">Test Scores</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Test</th><th>Subject</th><th style={{ textAlign: 'center' }}>Marks</th><th style={{ textAlign: 'center' }}>Grade</th></tr>
                  </thead>
                  <tbody>
                    {perf.scores.map((s, i) => {
                      const g = getGrade(s.absent ? null : s.obtained, s.maxMarks);
                      return (
                        <tr key={i}>
                          <td style={{ fontSize: '11px', color: 'var(--muted)' }}>{fmtDate(s.date)}</td>
                          <td style={{ fontWeight: 500 }}>{s.testName}</td>
                          <td style={{ color: 'var(--muted)' }}>{s.subject || '—'}</td>
                          <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", color: s.absent ? 'var(--muted)' : 'var(--accent3)' }}>
                            {s.absent ? 'AB' : `${s.obtained}/${s.maxMarks}`}
                          </td>
                          <td style={{ textAlign: 'center' }}><span className={`grade-pill grade-${g}`}>{g}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fee History */}
          {perf.fees.length > 0 && (
            <div className="form-card">
              <div className="form-section-title">Fee History</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {perf.fees.map((f, i) => (
                  <div key={i} style={{
                    padding: '10px 16px', borderRadius: 'var(--radius-sm)',
                    background: f.status === 'Paid' ? 'rgba(16,185,129,.06)' : 'rgba(239,68,68,.06)',
                    border: `1px solid ${f.status === 'Paid' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)'}`,
                    minWidth: '100px',
                  }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{f.month}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '14px', fontWeight: 700, color: f.status === 'Paid' ? 'var(--accent3)' : 'var(--danger)' }}>
                      ₹{fmt(f.paid || f.amount)}
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 600, color: f.status === 'Paid' ? 'var(--accent3)' : 'var(--danger)' }}>{f.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
