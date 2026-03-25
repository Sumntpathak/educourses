import { useState, useEffect } from 'react';
import { coaching_getStudents, coaching_getStudentPerformance, coaching_getBatches, coaching_getTests } from '../../api/client';
import { fmt, fmtDate, getGrade } from '../../utils/format';
import { getAllModules, getTestModuleLinks } from '../../store/localStore';
import { BookOpen, BarChart3 } from 'lucide-react';

export default function Performance() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState('');
  const [perf, setPerf] = useState(null);
  const [lp, setLp] = useState(false);
  const [view, setView] = useState('student'); // 'student' | 'module'
  const [batches, setBatches] = useState([]);
  const [tests, setTests] = useState([]);
  const [selBatch, setSelBatch] = useState('');

  useEffect(() => {
    Promise.all([coaching_getStudents(), coaching_getBatches(), coaching_getTests()])
      .then(([d, b, t]) => { setStudents(d.students || []); setBatches(b.batches || []); setTests(t.tests || []); setLoading(false); })
      .catch(() => setLoading(false));
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

  // Module analytics data
  const moduleAnalytics = (() => {
    if (!selBatch) return [];
    const modules = getAllModules().filter(m => m.batchId === selBatch);
    const links = getTestModuleLinks();
    return modules.map(mod => {
      const linkedTestIds = links.filter(l => l.moduleId === mod.id).map(l => l.testId);
      const linkedTests = tests.filter(t => linkedTestIds.includes(t.id));
      const topicsDone = (mod.topics || []).filter(t => t.done).length;
      const topicsTotal = (mod.topics || []).length;
      const allScores = linkedTests.flatMap(t => (t.scores || []).filter(s => !s.absent));
      const avg = allScores.length ? (allScores.reduce((a, s) => a + (s.obtained / (t => t.maxMarks)(tests.find(tt => tt.scores?.includes(s)) || { maxMarks: 100 }) * 100), 0) / allScores.length).toFixed(1) : null;
      // simpler avg calculation
      let totalPct = 0, cnt = 0;
      linkedTests.forEach(t => {
        (t.scores || []).filter(s => !s.absent && s.obtained != null).forEach(s => {
          totalPct += (s.obtained / t.maxMarks) * 100;
          cnt++;
        });
      });
      return { ...mod, topicsDone, topicsTotal, testCount: linkedTests.length, avgScore: cnt ? (totalPct / cnt).toFixed(1) : null };
    });
  })();

  return (
    <div>
      {/* Header */}
      <div className="shdr">
        <div>
          <div className="stitle">Analytics</div>
          <div className="ssub">Student performance & module-wise analysis</div>
        </div>
      </div>

      {/* View tabs */}
      <div className="rc-tabs" style={{ marginBottom: 18 }}>
        <button className={`rc-tab${view === 'student' ? ' active' : ''}`} onClick={() => setView('student')}>
          <BarChart3 size={14} /> Student Performance
        </button>
        <button className={`rc-tab${view === 'module' ? ' active' : ''}`} onClick={() => setView('module')}>
          <BookOpen size={14} /> Module Analytics
        </button>
      </div>

      {view === 'student' && <>
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
      </>}

      {/* MODULE ANALYTICS VIEW */}
      {view === 'module' && (
        <div>
          <div className="form-card">
            <label className="fl">Select Batch</label>
            <select className="fi" value={selBatch} onChange={e => setSelBatch(e.target.value)} style={{ maxWidth: '400px' }}>
              <option value="">— Choose Batch —</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {selBatch && moduleAnalytics.length === 0 && (
            <div className="empty">No modules found for this batch. Add modules from Batches → Modules & Details.</div>
          )}

          {moduleAnalytics.length > 0 && (
            <>
              {/* Module KPIs */}
              <div className="kpi-grid">
                <div className="kpi-card" style={{ borderTop: '3px solid #10b981', textAlign: 'center' }}>
                  <div className="kpi-label">Total Modules</div>
                  <div className="kpi-value" style={{ color: '#10b981' }}>{moduleAnalytics.length}</div>
                </div>
                <div className="kpi-card" style={{ borderTop: '3px solid #06b6d4', textAlign: 'center' }}>
                  <div className="kpi-label">Total Topics</div>
                  <div className="kpi-value" style={{ color: '#06b6d4' }}>{moduleAnalytics.reduce((a, m) => a + m.topicsTotal, 0)}</div>
                  <div className="kpi-sub">{moduleAnalytics.reduce((a, m) => a + m.topicsDone, 0)} completed</div>
                </div>
                <div className="kpi-card" style={{ borderTop: '3px solid #8b5cf6', textAlign: 'center' }}>
                  <div className="kpi-label">Linked Tests</div>
                  <div className="kpi-value" style={{ color: '#8b5cf6' }}>{moduleAnalytics.reduce((a, m) => a + m.testCount, 0)}</div>
                </div>
              </div>

              {/* Module Cards */}
              {moduleAnalytics.map(mod => {
                const pct = mod.topicsTotal ? Math.round((mod.topicsDone / mod.topicsTotal) * 100) : 0;
                return (
                  <div key={mod.id} className="form-card" style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BookOpen size={16} style={{ color: 'var(--accent)' }} /> {mod.name}
                        </div>
                        {mod.description && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>{mod.description}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: 700, color: 'var(--accent)' }}>{pct}%</div>
                          <div style={{ color: 'var(--muted)' }}>Topics Done</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: 700, color: '#8b5cf6' }}>{mod.testCount}</div>
                          <div style={{ color: 'var(--muted)' }}>Tests</div>
                        </div>
                        {mod.avgScore && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: 700, color: '#06b6d4' }}>{mod.avgScore}%</div>
                            <div style={{ color: 'var(--muted)' }}>Avg Score</div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: '12px', height: '6px', background: 'var(--subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: '3px', width: `${pct}%`, transition: 'width .3s' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{mod.topicsDone}/{mod.topicsTotal} topics completed</div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
