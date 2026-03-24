import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { coaching_getMyDashboard } from '../../api/client';
import { fmt, fmtDate, getGrade } from '../../utils/format';

export default function CoachingStudentDashboard() {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    coaching_getMyDashboard()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"><div className="loader-ring"/></div>;
  if (!data || !data.student) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '44px', marginBottom: '14px', opacity: '.5' }}>---</div>
      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No data found</div>
      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Your coaching admin hasn't set up your records yet.</div>
    </div>
  );

  const { student, attendance, testAvg, scores, fees, feeSummary } = data;
  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'scores', label: 'Test Scores' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'fees', label: 'Fee History' },
  ];

  return (
    <div>
      <div className="shdr" style={{ marginBottom: '20px' }}>
        <div>
          <div className="stitle">My Dashboard</div>
          <div className="ssub">{student.name} · {session?.institute_name || 'Coaching'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)', marginBottom: '22px', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} className={`rc-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)} style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>{t.label}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div>
          {/* Profile card */}
          <div className="form-card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {student.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{student.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                  {student.father ? `Father: ${student.father}` : ''}{student.mobile ? ` · ${student.mobile}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '12px', marginBottom: '24px' }}>
            <KPI label="Attendance" value={`${attendance.percentage}%`} sub={`${attendance.present}/${attendance.total} days`} color="#06b6d4" />
            <KPI label="Test Average" value={`${testAvg}%`} sub={`${scores.length} tests`} color="#8b5cf6" />
            <KPI label="Fee Paid" value={`₹${fmt(feeSummary.totalPaid)}`} color="#10b981" />
            <KPI label="Fee Pending" value={`₹${fmt(feeSummary.totalPending)}`} color={feeSummary.totalPending > 0 ? '#ef4444' : '#10b981'} />
          </div>

          {/* Recent scores */}
          {scores.length > 0 && (
            <div className="form-card">
              <div className="form-section-title">Recent Test Scores</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {scores.slice(0, 5).map((s, i) => {
                  const pct = !s.absent && s.obtained != null ? ((s.obtained / s.maxMarks) * 100).toFixed(0) : null;
                  const grade = getGrade(s.absent ? null : s.obtained, s.maxMarks);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--subtle)', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{s.testName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{s.subject} · {fmtDate(s.date)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', fontWeight: 700, color: s.absent ? 'var(--muted)' : parseFloat(pct) >= 60 ? 'var(--accent)' : 'var(--danger)' }}>
                          {s.absent ? 'AB' : `${s.obtained}/${s.maxMarks}`}
                        </span>
                        <span className={`grade-pill grade-${grade}`}>{grade}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEST SCORES */}
      {tab === 'scores' && (
        <div>
          <div className="form-section-title">All Test Scores — {scores.length} tests</div>
          {scores.length === 0 ? (
            <div className="empty" style={{ padding: '40px', textAlign: 'center' }}>No test scores yet</div>
          ) : (
            <div className="table-wrap"><div style={{ overflowX: 'auto' }}><table>
              <thead><tr><th>Date</th><th>Test</th><th>Subject</th><th style={{ textAlign: 'center' }}>Marks</th><th style={{ textAlign: 'center' }}>%</th><th style={{ textAlign: 'center' }}>Grade</th></tr></thead>
              <tbody>{scores.map((s, i) => {
                const pct = !s.absent && s.obtained != null ? ((s.obtained / s.maxMarks) * 100).toFixed(0) : null;
                const grade = getGrade(s.absent ? null : s.obtained, s.maxMarks);
                return (
                  <tr key={i}>
                    <td style={{ fontSize: '11px', color: 'var(--muted)' }}>{fmtDate(s.date)}</td>
                    <td style={{ fontWeight: 500 }}>{s.testName}</td>
                    <td style={{ fontSize: '12px', color: 'var(--muted)' }}>{s.subject || '—'}</td>
                    <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: s.absent ? 'var(--muted)' : parseFloat(pct) >= 60 ? 'var(--accent)' : 'var(--danger)' }}>
                      {s.absent ? 'AB' : `${s.obtained}/${s.maxMarks}`}
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>{pct ? pct + '%' : '—'}</td>
                    <td style={{ textAlign: 'center' }}><span className={`grade-pill grade-${grade}`}>{grade}</span></td>
                  </tr>
                );
              })}</tbody>
            </table></div></div>
          )}
        </div>
      )}

      {/* ATTENDANCE */}
      {tab === 'attendance' && (
        <div>
          <div className="form-section-title">Attendance Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '20px' }}>
            <KPI label="Present" value={attendance.present} color="#10b981" />
            <KPI label="Absent" value={attendance.absent} color="#ef4444" />
            <KPI label="Late" value={attendance.late} color="#f59e0b" />
            <KPI label="Total Days" value={attendance.total} color="#06b6d4" />
          </div>
          <div className="form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: attendance.percentage >= 75 ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)', borderRadius: '10px', border: `1px solid ${attendance.percentage >= 75 ? 'rgba(16,185,129,.2)' : 'rgba(239,68,68,.2)'}` }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Overall Attendance</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '28px', fontWeight: 800, color: attendance.percentage >= 75 ? 'var(--accent)' : 'var(--danger)' }}>{attendance.percentage}%</span>
            </div>
            {attendance.percentage < 75 && (
              <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(239,68,68,.06)', borderRadius: '8px', fontSize: '12px', color: '#fca5a5' }}>
                Your attendance is below 75%. Please improve your attendance to maintain good standing.
              </div>
            )}
          </div>
        </div>
      )}

      {/* FEE HISTORY */}
      {tab === 'fees' && (
        <div>
          <div className="form-section-title">Fee History</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <KPI label="Total Paid" value={`₹${fmt(feeSummary.totalPaid)}`} color="#10b981" />
            <KPI label="Total Pending" value={`₹${fmt(feeSummary.totalPending)}`} color={feeSummary.totalPending > 0 ? '#ef4444' : '#10b981'} />
          </div>
          {fees.length === 0 ? (
            <div className="empty" style={{ padding: '40px', textAlign: 'center' }}>No fee records yet</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {fees.map((f, i) => (
                <div key={i} style={{ padding: '12px 18px', borderRadius: '10px', background: f.status === 'Paid' ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)', border: `1px solid ${f.status === 'Paid' ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)'}`, minWidth: '120px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{f.month}</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '15px', fontWeight: 700, color: f.status === 'Paid' ? 'var(--accent)' : 'var(--danger)' }}>₹{fmt(f.paid || f.amount)}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: f.status === 'Paid' ? 'var(--accent)' : 'var(--danger)', marginTop: '2px' }}>{f.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', borderTop: `3px solid ${color}`, textAlign: 'center' }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '20px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}
