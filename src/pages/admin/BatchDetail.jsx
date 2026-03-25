import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Edit3, ChevronDown, ChevronUp,
  BookOpen, FileText, Users, BarChart3, CheckCircle, Circle,
  Download, Award, Layers
} from 'lucide-react';
import {
  getModules, addModule, updateModule, deleteModule,
  addTopic, toggleTopic, deleteTopic
} from '../../store/localStore';
import { getNotesByBatch, addNote, updateNote, deleteNote } from '../../store/localStore';
import {
  coaching_getBatches, coaching_getStudents, coaching_getTests,
  coaching_getFees, coaching_getAttendance
} from '../../api/client';
import { fmt, fmtDate, currency, getGrade } from '../../utils/format';
import { roundRect, downloadCanvas, drawBorder, drawDecorativeCorners } from '../../utils/canvas';

const TABS = [
  { key: 'modules', label: 'Modules', icon: BookOpen },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'students', label: 'Students', icon: Users },
  { key: 'audit', label: 'Audit Report', icon: BarChart3 },
];

export default function BatchDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const canvasRef = useRef(null);

  const [tab, setTab] = useState('modules');
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modules state
  const [modules, setModules] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [modForm, setModForm] = useState({ name: '', description: '' });
  const [showModForm, setShowModForm] = useState(false);
  const [topicInputs, setTopicInputs] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Notes state
  const [notes, setNotes] = useState([]);
  const [noteForm, setNoteForm] = useState({ moduleId: '', title: '', content: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Students state
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);

  // Audit state
  const [tests, setTests] = useState([]);
  const [fees, setFees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [bRes, sRes, tRes, fRes, aRes] = await Promise.all([
        coaching_getBatches(),
        coaching_getStudents(),
        coaching_getTests(),
        coaching_getFees(),
        coaching_getAttendance({ batch_id: id }),
      ]);
      const batches = bRes.batches || [];
      const found = batches.find(b => String(b.id) === String(id));
      setBatch(found || null);

      const allStu = sRes.students || [];
      setAllStudents(allStu);
      // Filter students assigned to this batch
      const batchStudents = allStu.filter(s =>
        (s.batches && s.batches.includes(id)) ||
        (s.batch_id && String(s.batch_id) === String(id))
      );
      setStudents(batchStudents);

      setTests((tRes.tests || []).filter(t => String(t.batch_id) === String(id)));
      setFees((fRes.fees || []).filter(f => String(f.batch_id) === String(id)));
      setAttendance(aRes.attendance || aRes.records || []);

      // Local data
      setModules(getModules(id));
      setNotes(getNotesByBatch(id));
    } catch (e) {
      console.error('BatchDetail load error:', e);
    }
    setLoading(false);
  }

  function refreshModules() { setModules(getModules(id)); }
  function refreshNotes() { setNotes(getNotesByBatch(id)); }

  // ── Module handlers ──
  function handleAddModule() {
    if (!modForm.name.trim()) return;
    addModule(id, { name: modForm.name.trim(), description: modForm.description.trim() });
    setModForm({ name: '', description: '' });
    setShowModForm(false);
    refreshModules();
  }

  function handleDeleteModule(modId) {
    deleteModule(modId);
    setDeleteConfirm(null);
    refreshModules();
    refreshNotes();
  }

  function handleAddTopic(modId) {
    const name = (topicInputs[modId] || '').trim();
    if (!name) return;
    addTopic(modId, name);
    setTopicInputs(p => ({ ...p, [modId]: '' }));
    refreshModules();
  }

  function handleToggleTopic(modId, topicId) {
    toggleTopic(modId, topicId);
    refreshModules();
  }

  function handleDeleteTopic(modId, topicId) {
    deleteTopic(modId, topicId);
    refreshModules();
  }

  // ── Note handlers ──
  function handleAddNote() {
    if (!noteForm.title.trim() || !noteForm.moduleId) return;
    addNote(noteForm.moduleId, id, { title: noteForm.title.trim(), content: noteForm.content.trim() });
    setNoteForm({ moduleId: '', title: '', content: '' });
    setShowNoteForm(false);
    refreshNotes();
  }

  function handleUpdateNote() {
    if (!editingNote) return;
    updateNote(editingNote.id, { title: editingNote.title, content: editingNote.content });
    setEditingNote(null);
    refreshNotes();
  }

  function handleDeleteNote(noteId) {
    deleteNote(noteId);
    refreshNotes();
  }

  // ── Audit helpers ──
  function getStudentAttPct(sid) {
    const recs = attendance.filter(a => String(a.student_id) === String(sid));
    if (!recs.length) return 0;
    const present = recs.filter(a => a.status === 'present' || a.status === 'P').length;
    return Math.round((present / recs.length) * 100);
  }

  function getStudentTestAvg(sid) {
    const st = tests.flatMap(t => (t.scores || []).filter(s => String(s.student_id) === String(sid)));
    if (!st.length) return 0;
    const avg = st.reduce((sum, s) => sum + ((s.obtained / s.maxMarks) * 100), 0) / st.length;
    return Math.round(avg);
  }

  function getStudentFeeStatus(sid) {
    const sf = fees.filter(f => String(f.student_id) === String(sid));
    const paid = sf.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
    return { paid, records: sf.length };
  }

  function getAuditKPIs() {
    const totalStudents = students.length;
    const avgAtt = totalStudents ? Math.round(students.reduce((s, st) => s + getStudentAttPct(st.id), 0) / totalStudents) : 0;
    const avgTest = totalStudents ? Math.round(students.reduce((s, st) => s + getStudentTestAvg(st.id), 0) / totalStudents) : 0;
    const totalCollected = fees.reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
    const monthlyFee = parseFloat(batch?.fee_monthly) || 0;
    const totalExpected = totalStudents * monthlyFee;
    const pending = Math.max(0, totalExpected - totalCollected);
    return { totalStudents, avgAtt, avgTest, totalCollected, pending };
  }

  // ── Download Report ──
  function downloadReport() {
    const W = 1920, H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#101520';
    ctx.fillRect(0, 0, W, H);

    drawBorder(ctx, W, H, 4, '#10b981', '#06b6d4');
    drawDecorativeCorners(ctx, W, H, 40, '#10b981');

    // Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText(`Batch Audit Report: ${batch?.name || ''}`, 60, 70);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#546580';
    ctx.fillText(`${batch?.subject || ''} | ${batch?.schedule || ''} | Generated: ${new Date().toLocaleDateString('en-IN')}`, 60, 100);

    // KPIs
    const kpis = getAuditKPIs();
    const kpiData = [
      { l: 'Students', v: kpis.totalStudents, c: '#06b6d4' },
      { l: 'Avg Attendance', v: kpis.avgAtt + '%', c: '#10b981' },
      { l: 'Avg Test Score', v: kpis.avgTest + '%', c: '#8b5cf6' },
      { l: 'Fees Collected', v: currency(kpis.totalCollected), c: '#34d399' },
      { l: 'Fees Pending', v: currency(kpis.pending), c: '#f87171' },
    ];
    const kpiW = 340, kpiH = 80, kpiY = 130;
    kpiData.forEach((k, i) => {
      const x = 60 + i * (kpiW + 16);
      ctx.fillStyle = 'rgba(26,34,52,.7)';
      roundRect(ctx, x, kpiY, kpiW, kpiH, 10);
      ctx.fill();
      ctx.strokeStyle = k.c;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, kpiY + 2); ctx.lineTo(x + kpiW, kpiY + 2);
      ctx.stroke();
      ctx.fillStyle = '#546580';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(k.l, x + 16, kpiY + 30);
      ctx.fillStyle = k.c;
      ctx.font = 'bold 24px JetBrains Mono, monospace';
      ctx.fillText(String(k.v), x + 16, kpiY + 60);
    });

    // Student table
    const tY = 240;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Student-wise Breakdown', 60, tY + 10);

    const cols = [60, 340, 540, 720, 860, 1000];
    const headers = ['Name', 'Attendance %', 'Test Avg %', 'Grade', 'Fee Paid', 'Status'];
    ctx.fillStyle = 'rgba(26,34,52,.7)';
    roundRect(ctx, 50, tY + 24, W - 100, 34, 6);
    ctx.fill();
    ctx.fillStyle = '#546580';
    ctx.font = 'bold 13px system-ui, sans-serif';
    headers.forEach((h, i) => ctx.fillText(h, cols[i], tY + 46));

    ctx.font = '13px system-ui, sans-serif';
    const maxRows = Math.min(students.length, 16);
    students.slice(0, maxRows).forEach((s, i) => {
      const rowY = tY + 64 + i * 30;
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,.02)';
        roundRect(ctx, 50, rowY - 4, W - 100, 28, 4);
        ctx.fill();
      }
      const att = getStudentAttPct(s.id);
      const testA = getStudentTestAvg(s.id);
      const grade = getGrade(testA, 100);
      const feeS = getStudentFeeStatus(s.id);

      ctx.fillStyle = '#e2e8f0'; ctx.fillText(s.name || '—', cols[0], rowY + 14);
      ctx.fillStyle = att >= 75 ? '#10b981' : '#f87171'; ctx.fillText(att + '%', cols[1], rowY + 14);
      ctx.fillStyle = '#06b6d4'; ctx.fillText(testA + '%', cols[2], rowY + 14);
      ctx.fillStyle = grade === 'F' ? '#f87171' : '#34d399'; ctx.fillText(grade, cols[3], rowY + 14);
      ctx.fillStyle = '#e2e8f0'; ctx.fillText(currency(feeS.paid), cols[4], rowY + 14);
      ctx.fillStyle = feeS.paid > 0 ? '#10b981' : '#f87171'; ctx.fillText(feeS.paid > 0 ? 'Paid' : 'Pending', cols[5], rowY + 14);
    });

    // Module completion (right side)
    const mX = 1140, mY = tY;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Module Completion', mX, mY + 10);

    modules.slice(0, 12).forEach((m, i) => {
      const y = mY + 36 + i * 44;
      const topics = m.topics || [];
      const done = topics.filter(t => t.done).length;
      const total = topics.length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      ctx.fillStyle = 'rgba(26,34,52,.7)';
      roundRect(ctx, mX - 10, y, 740, 38, 8);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillText(m.name, mX + 6, y + 16);
      ctx.fillStyle = '#546580';
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillText(`${done}/${total} topics (${pct}%)`, mX + 6, y + 32);

      // Progress bar
      const barX = mX + 500, barW = 220, barH = 8;
      ctx.fillStyle = 'rgba(16,185,129,.15)';
      roundRect(ctx, barX, y + 14, barW, barH, 4);
      ctx.fill();
      if (pct > 0) {
        ctx.fillStyle = '#10b981';
        roundRect(ctx, barX, y + 14, barW * (pct / 100), barH, 4);
        ctx.fill();
      }
    });

    // Watermark
    ctx.fillStyle = '#546580';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('Generated by EduCourses', W - 220, H - 30);

    downloadCanvas(canvas, `batch-report-${batch?.name || id}.png`);
  }

  if (loading) return <div className="loader"><div className="loader-ring"></div><div className="loader-dots"><span></span><span></span><span></span></div></div>;

  if (!batch) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '16px' }}>Batch not found</div>
      <button className="form-btn outline" onClick={() => nav(-1)}><ArrowLeft size={14} /> Go Back</button>
    </div>
  );

  const kpis = getAuditKPIs();

  return (
    <div>
      {/* ── Header ── */}
      <div className="shdr" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button className="form-btn ghost" onClick={() => nav(-1)} style={{ padding: '8px', minHeight: 'auto' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="stitle" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {batch.name}
              <span className="badge" style={{ fontSize: '11px', background: 'rgba(16,185,129,.15)', color: 'var(--accent)' }}>
                {batch.status || 'Active'}
              </span>
            </div>
            <div className="ssub" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
              {batch.subject && <span>{batch.subject}</span>}
              {batch.schedule && <span style={{ color: 'var(--accent2)' }}>{batch.schedule}</span>}
              <span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--accent)' }}>
                {currency(batch.fee_monthly)}/mo
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--muted)' }}>
          <Users size={14} /> {students.length}/{batch.maxStudents || '—'} students
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="rc-tabs" style={{ marginBottom: '20px' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`rc-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ══════════ Tab: Modules ══════════ */}
      {tab === 'modules' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
              <Layers size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              {modules.length} module(s)
            </div>
            <button className="form-btn primary" onClick={() => setShowModForm(s => !s)}>
              <Plus size={14} /> Add Module
            </button>
          </div>

          {/* Add Module Form */}
          {showModForm && (
            <div className="form-card" style={{ marginBottom: '16px' }}>
              <div className="form-section-title">New Module</div>
              <div className="form-grid">
                <div className="fg">
                  <label className="fl">Name <span className="req">*</span></label>
                  <input className="fi" value={modForm.name} onChange={e => setModForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Algebra Basics" />
                </div>
                <div className="fg">
                  <label className="fl">Description</label>
                  <input className="fi" value={modForm.description} onChange={e => setModForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button className="form-btn primary" onClick={handleAddModule}>Create</button>
                <button className="form-btn ghost" onClick={() => setShowModForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Module Accordion Cards */}
          {modules.length === 0 && !showModForm && (
            <div className="empty">No modules yet. Add your first module to get started.</div>
          )}

          {modules.map(mod => {
            const topics = mod.topics || [];
            const done = topics.filter(t => t.done).length;
            const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
            const isExpanded = expanded[mod.id];

            return (
              <div key={mod.id} className="form-card" style={{ marginBottom: '12px', padding: 0, overflow: 'hidden' }}>
                {/* Module Header */}
                <div
                  onClick={() => setExpanded(p => ({ ...p, [mod.id]: !p[mod.id] }))}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 18px', cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>{mod.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: "'JetBrains Mono',monospace" }}>
                        {done}/{topics.length} topics
                      </span>
                    </div>
                    {mod.description && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', marginLeft: '26px' }}>
                        {mod.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Progress bar */}
                    <div style={{ width: '80px', height: '6px', borderRadius: '3px', background: 'rgba(16,185,129,.12)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: 'var(--accent)', transition: 'width .3s' }} />
                    </div>
                    <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono',monospace", color: pct === 100 ? 'var(--accent)' : 'var(--muted)', minWidth: '36px', textAlign: 'right' }}>
                      {pct}%
                    </span>
                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
                  </div>
                </div>

                {/* Expanded Topics */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--glass-border)', padding: '12px 18px' }}>
                    {topics.length === 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '8px 0' }}>No topics yet.</div>
                    )}
                    {topics.map(t => (
                      <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 0', borderBottom: '1px solid var(--border)',
                      }}>
                        <div
                          onClick={() => handleToggleTopic(mod.id, t.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                        >
                          {t.done
                            ? <CheckCircle size={16} style={{ color: 'var(--accent)' }} />
                            : <Circle size={16} style={{ color: 'var(--muted)' }} />
                          }
                          <span style={{
                            fontSize: '13px',
                            textDecoration: t.done ? 'line-through' : 'none',
                            color: t.done ? 'var(--muted)' : 'var(--text)',
                          }}>
                            {t.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteTopic(mod.id, t.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted)' }}
                          title="Delete topic"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}

                    {/* Add topic inline */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input
                        className="fi"
                        placeholder="New topic name..."
                        value={topicInputs[mod.id] || ''}
                        onChange={e => setTopicInputs(p => ({ ...p, [mod.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddTopic(mod.id)}
                        style={{ flex: 1, minHeight: '34px', fontSize: '13px' }}
                      />
                      <button className="form-btn outline" onClick={() => handleAddTopic(mod.id)} style={{ minHeight: '34px', padding: '0 14px', fontSize: '12px' }}>
                        <Plus size={13} /> Add
                      </button>
                    </div>

                    {/* Delete module */}
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                      {deleteConfirm === mod.id ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                          <span style={{ color: 'var(--danger)' }}>Delete this module?</span>
                          <button className="form-btn danger" onClick={() => handleDeleteModule(mod.id)} style={{ minHeight: '28px', padding: '0 12px', fontSize: '11px' }}>
                            Yes, Delete
                          </button>
                          <button className="form-btn ghost" onClick={() => setDeleteConfirm(null)} style={{ minHeight: '28px', padding: '0 12px', fontSize: '11px' }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="form-btn ghost"
                          onClick={() => setDeleteConfirm(mod.id)}
                          style={{ minHeight: '28px', padding: '0 12px', fontSize: '11px', color: 'var(--danger)' }}
                        >
                          <Trash2 size={12} /> Delete Module
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ Tab: Notes ══════════ */}
      {tab === 'notes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
              <FileText size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              {notes.length} note(s)
            </div>
            <button className="form-btn primary" onClick={() => { setShowNoteForm(s => !s); setEditingNote(null); }}>
              <Plus size={14} /> Add Note
            </button>
          </div>

          {/* Add Note Form */}
          {showNoteForm && (
            <div className="form-card" style={{ marginBottom: '16px' }}>
              <div className="form-section-title">New Note</div>
              <div className="form-grid">
                <div className="fg">
                  <label className="fl">Module <span className="req">*</span></label>
                  <select className="fi" value={noteForm.moduleId} onChange={e => setNoteForm(f => ({ ...f, moduleId: e.target.value }))}>
                    <option value="">— Select Module —</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Title <span className="req">*</span></label>
                  <input className="fi" value={noteForm.title} onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))} placeholder="Note title" />
                </div>
              </div>
              <div className="fg" style={{ marginTop: '10px' }}>
                <label className="fl">Content</label>
                <textarea
                  className="fi"
                  rows={4}
                  value={noteForm.content}
                  onChange={e => setNoteForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your note content..."
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button className="form-btn primary" onClick={handleAddNote}>Save Note</button>
                <button className="form-btn ghost" onClick={() => setShowNoteForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {notes.length === 0 && !showNoteForm && (
            <div className="empty">No notes yet. Create modules first, then add notes.</div>
          )}

          {/* Notes grouped by module */}
          {modules.map(mod => {
            const modNotes = notes.filter(n => n.moduleId === mod.id);
            if (!modNotes.length) return null;
            return (
              <div key={mod.id} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={14} /> {mod.name}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '12px' }}>
                  {modNotes.map(note => (
                    <div key={note.id} className="kpi-card" style={{ padding: '16px', borderLeft: '3px solid var(--accent2)' }}>
                      {editingNote?.id === note.id ? (
                        /* Edit Mode */
                        <div>
                          <input
                            className="fi"
                            value={editingNote.title}
                            onChange={e => setEditingNote(p => ({ ...p, title: e.target.value }))}
                            style={{ marginBottom: '8px', fontSize: '13px' }}
                          />
                          <textarea
                            className="fi"
                            rows={3}
                            value={editingNote.content}
                            onChange={e => setEditingNote(p => ({ ...p, content: e.target.value }))}
                            style={{ resize: 'vertical', fontSize: '13px' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button className="form-btn primary" onClick={handleUpdateNote} style={{ minHeight: '30px', padding: '0 12px', fontSize: '11px' }}>Save</button>
                            <button className="form-btn ghost" onClick={() => setEditingNote(null)} style={{ minHeight: '30px', padding: '0 12px', fontSize: '11px' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{note.title}</div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setEditingNote({ ...note })}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent2)', padding: '2px' }}
                                title="Edit"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px' }}
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          {note.content && (
                            <div style={{ fontSize: '13px', color: 'var(--muted)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                              {note.content}
                            </div>
                          )}
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', opacity: 0.7 }}>
                            {fmtDate(note.createdAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Ungrouped notes (if module was deleted) */}
          {(() => {
            const modIds = modules.map(m => m.id);
            const orphan = notes.filter(n => !modIds.includes(n.moduleId));
            if (!orphan.length) return null;
            return (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)', marginBottom: '10px' }}>Ungrouped</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '12px' }}>
                  {orphan.map(note => (
                    <div key={note.id} className="kpi-card" style={{ padding: '16px', borderLeft: '3px solid var(--muted)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{note.title}</div>
                        <button onClick={() => handleDeleteNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {note.content && <div style={{ fontSize: '13px', color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{note.content}</div>}
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', opacity: 0.7 }}>{fmtDate(note.createdAt)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══════════ Tab: Students ══════════ */}
      {tab === 'students' && (
        <div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '14px' }}>
            <Users size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            {students.length} student(s) in this batch
          </div>

          {students.length === 0 && (
            <div className="empty">No students assigned to this batch yet.</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '14px' }}>
            {students.map(s => {
              const att = getStudentAttPct(s.id);
              const testAvg = getStudentTestAvg(s.id);
              return (
                <div key={s.id} className="kpi-card" style={{ padding: '18px', borderTop: '3px solid var(--accent2)' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>{s.name}</div>
                  {s.father && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>
                      Father: {s.father}
                    </div>
                  )}
                  {s.mobile && (
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
                      Mobile: <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{s.mobile}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Attendance</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '16px', color: att >= 75 ? 'var(--accent)' : 'var(--danger)' }}>
                        {att}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Test Avg</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '16px', color: 'var(--accent2)' }}>
                        {testAvg}%
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Grade</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '16px', color: '#8b5cf6' }}>
                        {getGrade(testAvg, 100)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════ Tab: Audit Report ══════════ */}
      {tab === 'audit' && (
        <div>
          {/* KPIs */}
          <div className="kpi-grid">
            {[
              { l: 'Total Students', v: kpis.totalStudents, c: '#06b6d4' },
              { l: 'Avg Attendance', v: kpis.avgAtt + '%', c: '#10b981' },
              { l: 'Avg Test Score', v: kpis.avgTest + '%', c: '#8b5cf6' },
              { l: 'Fees Collected', v: currency(kpis.totalCollected), c: '#34d399' },
              { l: 'Fees Pending', v: currency(kpis.pending), c: '#f87171' },
            ].map(k => (
              <div key={k.l} className="kpi-card" style={{ borderTop: `3px solid ${k.c}`, textAlign: 'center' }}>
                <div className="kpi-label">{k.l}</div>
                <div className="kpi-value" style={{ color: k.c, fontFamily: "'JetBrains Mono',monospace" }}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Student-wise Table */}
          <div className="form-card" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div className="form-section-title" style={{ margin: 0 }}>Student-wise Breakdown</div>
              <button className="form-btn primary" onClick={downloadReport}>
                <Download size={14} /> Download Report
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th style={{ textAlign: 'center' }}>Attendance %</th>
                    <th style={{ textAlign: 'center' }}>Test Avg %</th>
                    <th style={{ textAlign: 'center' }}>Grade</th>
                    <th style={{ textAlign: 'right' }}>Fee Paid</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>No students</td></tr>
                  )}
                  {students.map(s => {
                    const att = getStudentAttPct(s.id);
                    const testAvg = getStudentTestAvg(s.id);
                    const grade = getGrade(testAvg, 100);
                    const feeS = getStudentFeeStatus(s.id);
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td style={{ textAlign: 'center', color: att >= 75 ? 'var(--accent)' : 'var(--danger)', fontFamily: "'JetBrains Mono',monospace" }}>{att}%</td>
                        <td style={{ textAlign: 'center', color: 'var(--accent2)', fontFamily: "'JetBrains Mono',monospace" }}>{testAvg}%</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge" style={{
                            background: grade === 'F' ? 'rgba(248,113,113,.15)' : 'rgba(16,185,129,.15)',
                            color: grade === 'F' ? 'var(--danger)' : 'var(--accent)',
                          }}>
                            {grade}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono',monospace" }}>{currency(feeS.paid)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge" style={{
                            background: feeS.paid > 0 ? 'rgba(16,185,129,.15)' : 'rgba(248,113,113,.15)',
                            color: feeS.paid > 0 ? 'var(--accent)' : 'var(--danger)',
                          }}>
                            {feeS.paid > 0 ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Module Completion Overview */}
          <div className="form-card" style={{ marginTop: '16px' }}>
            <div className="form-section-title">Module Completion</div>
            {modules.length === 0 && (
              <div style={{ fontSize: '13px', color: 'var(--muted)', padding: '12px 0' }}>No modules created yet.</div>
            )}
            {modules.map(mod => {
              const topics = mod.topics || [];
              const done = topics.filter(t => t.done).length;
              const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
              return (
                <div key={mod.id} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '12px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <Layers size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{mod.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: "'JetBrains Mono',monospace" }}>
                      {done}/{topics.length} topics done
                    </div>
                  </div>
                  <div style={{ width: '120px', height: '6px', borderRadius: '3px', background: 'rgba(16,185,129,.12)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: '3px', background: 'var(--accent)', transition: 'width .3s' }} />
                  </div>
                  <span style={{ fontSize: '13px', fontFamily: "'JetBrains Mono',monospace", color: pct === 100 ? 'var(--accent)' : 'var(--muted)', minWidth: '40px', textAlign: 'right' }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
