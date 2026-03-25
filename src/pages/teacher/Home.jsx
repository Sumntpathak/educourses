import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTeacher, getModules, getNotesByBatch, getTeacherSchedule, teacherHeartbeat, getTeacherLiveStatus } from '../../store/localStore';
import { coaching_getBatches, coaching_getStudents, coaching_getTests, coaching_getAttendance, coaching_markAttendance, coaching_addTest } from '../../api/client';
import { fmt, fmtDate, getGrade } from '../../utils/format';
import { LayoutDashboard, Users, BookOpen, FileText, CheckSquare, Calendar, Clock, Layers, Plus } from 'lucide-react';

const TD = () => new Date().toISOString().slice(0, 10);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function useTab() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/teacher/batches')) return 'batches';
  if (pathname.startsWith('/teacher/students')) return 'students';
  if (pathname.startsWith('/teacher/tests')) return 'tests';
  if (pathname.startsWith('/teacher/attendance')) return 'attendance';
  if (pathname.startsWith('/teacher/schedule')) return 'schedule';
  return 'dashboard';
}

function KPI({ label, value, sub, color }) {
  return (
    <div className="kpi-card" style={{ borderTop: `3px solid ${color}`, textAlign: 'center' }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export default function TeacherHome() {
  const tab = useTab();
  const navigate = useNavigate();

  // Read session ID, then always get LIVE teacher data from store
  const [sessionId] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eduC_teacher_session'))?.id; } catch { return null; }
  });
  const [teacher, setTeacher] = useState(() => sessionId ? getTeacher(sessionId) : null);

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Heartbeat + refresh live teacher data every 30s (picks up new batch assignments)
  useEffect(() => {
    if (!sessionId) return;
    teacherHeartbeat(sessionId);
    const iv = setInterval(() => {
      teacherHeartbeat(sessionId);
      const fresh = getTeacher(sessionId);
      if (fresh) setTeacher(fresh);
    }, 30000);
    return () => clearInterval(iv);
  }, [sessionId]);

  // Load data using live teacher
  useEffect(() => {
    if (!teacher) { setLoading(false); return; }
    const assignedIds = teacher.assignedBatches || [];
    Promise.all([coaching_getBatches(), coaching_getStudents(), coaching_getTests()])
      .then(([b, s, t]) => {
        setBatches((b.batches || []).filter(bat => assignedIds.includes(bat.id)));
        setStudents(s.students || []);
        setTests(t.tests || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [teacher]);

  if (!teacher) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '14px' }}>!</div>
        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>No session found</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Please login.</div>
      </div>
    );
  }

  if (loading) return <div className="loader"><div className="loader-ring"></div><div className="loader-dots"><span></span><span></span><span></span></div></div>;

  const assignedIds = teacher.assignedBatches || [];
  const myStudents = students.filter(s => (s.batches || []).some(b => assignedIds.includes(b.id)));
  const myTests = tests.filter(t => assignedIds.includes(t.batch_id));
  const schedule = getTeacherSchedule(teacher.id);
  const todayDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  const todaySchedule = schedule.filter(s => s.day === todayDay);

  return (
    <div>
      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <div>
          {/* Profile card */}
          <div className="sprofile">
            <div className="sph">
              <div className="spav" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#000' }}>
                {teacher.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <div className="spname">{teacher.name}</div>
                <div className="spmeta">
                  {teacher.subject ? `Subject: ${teacher.subject}` : ''}
                  {teacher.qualification ? ` | ${teacher.qualification}` : ''}
                  {teacher.phone ? ` | ${teacher.phone}` : ''}
                  {teacher.email ? ` | ${teacher.email}` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <KPI label="Assigned Batches" value={batches.length} sub={`${batches.length} batch(es)`} color="#06b6d4" />
            <KPI label="Total Students" value={myStudents.length} sub="across batches" color="#8b5cf6" />
            <KPI label="Tests Created" value={myTests.length} sub="total tests" color="#f59e0b" />
            <KPI label="Schedule Today" value={todaySchedule.length} sub={todayDay} color="#10b981" />
          </div>

          {/* Quick Actions */}
          <div className="form-card">
            <div className="form-section-title">Quick Actions</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="form-btn primary" onClick={() => navigate('/teacher/attendance')}>
                <CheckSquare size={14} /> Mark Attendance
              </button>
              <button className="form-btn outline" onClick={() => navigate('/teacher/tests')}>
                <Plus size={14} /> Create Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MY BATCHES */}
      {tab === 'batches' && (
        <div>
          <div className="shdr">
            <div>
              <div className="stitle">My Batches</div>
              <div className="ssub">{batches.length} assigned batch(es)</div>
            </div>
          </div>
          {batches.length === 0 ? (
            <div className="empty">No batches assigned to you yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {batches.map(b => {
                const bStu = students.filter(s => (s.batches || []).some(sb => sb.id === b.id));
                const mods = getModules(b.id);
                return (
                  <div key={b.id} className="form-card" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700 }}>{b.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                          {b.subject ? `Subject: ${b.subject}` : ''}
                          {b.schedule ? ` | Schedule: ${b.schedule}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="badge"><Users size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {bStu.length} students</span>
                        <span className="badge"><Layers size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {mods.length} modules</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MY STUDENTS */}
      {tab === 'students' && <StudentsTab batches={batches} students={myStudents} />}

      {/* TESTS */}
      {tab === 'tests' && (
        <TestsTab
          batches={batches}
          students={students}
          tests={myTests}
          assignedIds={assignedIds}
          onRefresh={async () => {
            const t = await coaching_getTests();
            setTests(t.tests || []);
          }}
        />
      )}

      {/* ATTENDANCE */}
      {tab === 'attendance' && <AttendanceTab batches={batches} students={students} />}

      {/* MY SCHEDULE */}
      {tab === 'schedule' && <ScheduleTab schedule={schedule} batches={batches} />}
    </div>
  );
}

/* ── Students Tab ── */
function StudentsTab({ batches, students }) {
  const [search, setSearch] = useState('');
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="shdr">
        <div>
          <div className="stitle">My Students</div>
          <div className="ssub">{students.length} student(s) across assigned batches</div>
        </div>
      </div>
      <div className="form-card" style={{ marginBottom: '12px' }}>
        <input
          className="fi"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '320px' }}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="empty">No students found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {filtered.map(s => {
            const sBatches = (s.batches || []).filter(b => batches.some(ab => ab.id === b.id));
            return (
              <div key={s.id} className="form-card" style={{ marginBottom: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{s.name}</div>
                {s.father && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Father: {s.father}</div>}
                {s.mobile && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{s.mobile}</div>}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {sBatches.map(b => (
                    <span key={b.id} className="badge">{b.name}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Tests Tab ── */
function TestsTab({ batches, students, tests, assignedIds, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [selBatch, setSelBatch] = useState('');
  const [form, setForm] = useState({ testName: '', subject: '', maxMarks: 100, type: 'weekly', date: TD() });
  const [batchStu, setBatchStu] = useState([]);
  const [marks, setMarks] = useState({});
  const [absent, setAbsent] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  function onBatch(bid) {
    setSelBatch(bid);
    setBatchStu(students.filter(s => (s.batches || []).some(b => b.id === bid)));
    setMarks({});
    setAbsent({});
  }

  async function saveTest() {
    if (!form.testName || !selBatch) { setMsg({ type: 'error', text: 'Fill test name & batch' }); return; }
    setSaving(true);
    const bat = batches.find(b => b.id === selBatch);
    const scores = batchStu.map(s => ({
      student_id: s.id,
      student_name: s.name,
      obtained: absent[s.id] ? 0 : (parseFloat(marks[s.id]) || 0),
      absent: !!absent[s.id],
    }));
    try {
      await coaching_addTest({ ...form, batch_id: selBatch, batch_name: bat?.name || '', scores: JSON.stringify(scores) });
      await onRefresh();
      setShowForm(false);
      setMsg(null);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  }

  return (
    <div>
      <div className="shdr">
        <div>
          <div className="stitle">Tests & Scores</div>
          <div className="ssub">{tests.length} test(s)</div>
        </div>
        <button className="form-btn primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={14} /> New Test
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="form-card">
          <div className="form-section-title">New Test</div>
          <div className="form-grid">
            <div className="fg">
              <label className="fl">Batch <span className="req">*</span></label>
              <select className="fi" value={selBatch} onChange={e => onBatch(e.target.value)}>
                <option value="">Select</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Test Name <span className="req">*</span></label>
              <input className="fi" value={form.testName} onChange={e => setForm(f => ({ ...f, testName: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">Subject</label>
              <input className="fi" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">Max Marks</label>
              <input className="fi" type="number" value={form.maxMarks} onChange={e => setForm(f => ({ ...f, maxMarks: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">Type</label>
              <select className="fi" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="mock">Mock</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Date</label>
              <input className="fi" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          </div>

          {/* Marks Entry */}
          {batchStu.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div className="form-section-title">{batchStu.length} students — Enter Marks</div>
              <div className="table-wrap">
                <table style={{ minWidth: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Student</th>
                      <th style={{ textAlign: 'center' }}>Marks (/{form.maxMarks})</th>
                      <th style={{ textAlign: 'center' }}>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchStu.map((s, i) => {
                      const isAb = !!absent[s.id];
                      return (
                        <tr key={s.id} style={{ opacity: isAb ? 0.5 : 1 }}>
                          <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                          <td style={{ fontWeight: 500 }}>{s.name}</td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number" min={0} max={form.maxMarks}
                              value={isAb ? '' : marks[s.id] ?? ''}
                              disabled={isAb}
                              onChange={e => { setMarks(m => ({ ...m, [s.id]: e.target.value })); setAbsent(a => ({ ...a, [s.id]: false })); }}
                              className="fi"
                              style={{ width: '70px', textAlign: 'center', padding: '6px', minHeight: 'auto' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox" checked={isAb}
                              onChange={() => { setAbsent(a => ({ ...a, [s.id]: !a[s.id] })); if (!absent[s.id]) setMarks(m => ({ ...m, [s.id]: '' })); }}
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--danger)' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {msg && <div className="login-error" style={{ marginTop: '10px', textAlign: 'left' }}>{msg.text}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button className="form-btn primary" onClick={saveTest} disabled={saving}>{saving ? '...' : 'Save Test'}</button>
            <button className="form-btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Test Results */}
      {tests.length === 0 && !showForm && <div className="empty">No tests yet. Create your first test.</div>}
      {tests.map((t, ti) => {
        const valid = (t.scores || []).filter(s => !s.absent && s.obtained != null);
        const avg = valid.length ? (valid.reduce((a, s) => a + s.obtained, 0) / valid.length).toFixed(1) : '--';
        const top = [...valid].sort((a, b) => (b.obtained || 0) - (a.obtained || 0))[0];

        return (
          <details key={t.id || ti} className="form-card" style={{ overflow: 'hidden', cursor: 'pointer' }}>
            <summary style={{
              padding: '0', listStyle: 'none', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px',
            }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.testName}</span>
                <span className="badge" style={{ marginLeft: '8px' }}>{t.batch_name || '--'}</span>
                <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '8px' }}>{t.subject} · {fmtDate(t.date)} · Max {t.maxMarks}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <span style={{ color: 'var(--accent)' }}>Avg: {avg}</span>
                {top && <span style={{ color: 'var(--muted)' }}>Top: {top.student_name}</span>}
              </div>
            </summary>
            <div style={{ paddingTop: '14px' }}>
              <div className="table-wrap">
                <table style={{ minWidth: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Rank</th>
                      <th>Student</th>
                      <th style={{ textAlign: 'center' }}>Marks</th>
                      <th style={{ textAlign: 'center' }}>%</th>
                      <th style={{ textAlign: 'center' }}>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(t.scores || [])].sort((a, b) => (b.obtained || 0) - (a.obtained || 0)).map((sc, i) => {
                      const p = !sc.absent && sc.obtained != null ? ((sc.obtained / t.maxMarks) * 100).toFixed(0) : null;
                      const g = getGrade(sc.absent ? null : sc.obtained, t.maxMarks);
                      return (
                        <tr key={i} style={{ background: i < 3 && !sc.absent ? ['rgba(245,158,11,.06)', 'rgba(192,192,192,.04)', 'rgba(205,127,50,.04)'][i] : '' }}>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: i < 3 && !sc.absent ? ['#f59e0b', '#94a3b8', '#d97706'][i] : 'var(--muted)' }}>
                            {sc.absent ? '--' : i + 1}
                          </td>
                          <td style={{ fontWeight: 500 }}>{sc.student_name}</td>
                          <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono',monospace", color: sc.absent ? 'var(--muted)' : parseFloat(p) >= 60 ? 'var(--accent)' : 'var(--danger)' }}>
                            {sc.absent ? 'AB' : `${sc.obtained}/${t.maxMarks}`}
                          </td>
                          <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{p ? p + '%' : '--'}</td>
                          <td style={{ textAlign: 'center' }}><span className={`grade-pill grade-${g}`}>{g}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

/* ── Attendance Tab ── */
function AttendanceTab({ batches, students }) {
  const [selBatch, setSelBatch] = useState('');
  const [date, setDate] = useState(TD());
  const [records, setRecords] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  async function load(bid, dt) {
    if (!bid) return;
    const d = await coaching_getAttendance({ batch_id: bid, date: dt });
    const r = {};
    for (const a of (d.attendance || [])) r[a.student_id] = a.status;
    setRecords(r);
  }

  const bStu = students.filter(s => (s.batches || []).some(b => b.id === selBatch));

  async function save() {
    if (!selBatch) return;
    setSaving(true);
    const recs = bStu.map(s => ({ student_id: s.id, student_name: s.name, status: records[s.id] || 'Present' }));
    try {
      await coaching_markAttendance({ batch_id: selBatch, date, records: JSON.stringify(recs) });
      setMsg({ type: 'success', text: `Saved for ${recs.length} students` });
      setTimeout(() => setMsg(null), 3000);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  }

  const pc = Object.values(records).filter(v => v === 'Present').length;
  const ac = Object.values(records).filter(v => v === 'Absent').length;

  return (
    <div>
      <div className="shdr">
        <div>
          <div className="stitle">Attendance</div>
          <div className="ssub">Mark daily attendance for your batches</div>
        </div>
      </div>

      {/* Filters */}
      <div className="form-card">
        <div className="form-grid" style={{ maxWidth: '500px' }}>
          <div className="fg">
            <label className="fl">Batch</label>
            <select className="fi" value={selBatch} onChange={e => { setSelBatch(e.target.value); load(e.target.value, date); }}>
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="fl">Date</label>
            <input className="fi" type="date" value={date} onChange={e => { setDate(e.target.value); if (selBatch) load(selBatch, e.target.value); }} />
          </div>
        </div>
        {selBatch && bStu.length > 0 && (
          <div style={{ marginTop: '12px', fontSize: '12px', display: 'flex', gap: '16px' }}>
            <span className="badge">Present: {pc}</span>
            <span className="badge">Absent: {ac}</span>
            <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Total: {bStu.length}</span>
          </div>
        )}
      </div>

      {/* Attendance Table */}
      {selBatch && bStu.length > 0 && (
        <div>
          <div className="table-wrap">
            <table style={{ minWidth: 'auto' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th style={{ textAlign: 'center' }}>Present</th>
                  <th style={{ textAlign: 'center' }}>Absent</th>
                  <th style={{ textAlign: 'center' }}>Late</th>
                </tr>
              </thead>
              <tbody>
                {bStu.map((s, i) => {
                  const st = records[s.id] || 'Present';
                  return (
                    <tr key={s.id} style={{ background: st === 'Absent' ? 'rgba(239,68,68,.03)' : '' }}>
                      <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      {['Present', 'Absent', 'Late'].map(v => (
                        <td key={v} style={{ textAlign: 'center' }}>
                          <input
                            type="radio" name={`a-${s.id}`} checked={st === v}
                            onChange={() => setRecords(r => ({ ...r, [s.id]: v }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: v === 'Present' ? '#10b981' : v === 'Absent' ? '#ef4444' : '#f59e0b' }}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {msg && (
            <div style={{
              marginTop: '12px', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px',
              background: msg.type === 'error' ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)',
              color: msg.type === 'error' ? 'var(--danger)' : 'var(--accent)',
              border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,.2)' : 'rgba(16,185,129,.2)'}`,
            }}>{msg.text}</div>
          )}

          <div style={{ padding: '16px 0' }}>
            <button className="form-btn primary" onClick={save} disabled={saving} style={{ padding: '12px 28px', fontSize: '14px' }}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      {selBatch && bStu.length === 0 && (
        <div className="empty">No students in this batch</div>
      )}
    </div>
  );
}

/* ── Schedule Tab ── */
function ScheduleTab({ schedule, batches }) {
  const grouped = {};
  DAYS.forEach(d => { grouped[d] = []; });
  schedule.forEach(s => {
    if (grouped[s.day]) grouped[s.day].push(s);
  });

  const hasAny = schedule.length > 0;

  return (
    <div>
      <div className="shdr">
        <div>
          <div className="stitle">My Schedule</div>
          <div className="ssub">{schedule.length} scheduled slot(s)</div>
        </div>
      </div>

      {!hasAny ? (
        <div className="empty">
          <Calendar size={32} style={{ color: 'var(--muted)', marginBottom: '10px' }} />
          <div>No schedule set yet</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>Your admin will manage your schedule</div>
        </div>
      ) : (
        DAYS.map(day => {
          const entries = grouped[day];
          if (entries.length === 0) return null;
          return (
            <div key={day} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} style={{ color: 'var(--accent)' }} />
                {day}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {entries.map(entry => {
                  const batch = batches.find(b => b.id === entry.batchId);
                  return (
                    <div key={entry.id} className="form-card" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Clock size={14} style={{ color: 'var(--accent2)' }} />
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', fontWeight: 600 }}>
                            {entry.time || entry.startTime || '--'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge">{batch ? batch.name : entry.batchName || '--'}</span>
                          {entry.module && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{entry.module}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
