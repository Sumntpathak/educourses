import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getReferrals, addReferral, updateReferralStatus, getReferralStats, getReferralCode,
  // getCertificates, addCertificate — not needed, generate on the fly
  getSavedPamphlets, savePamphlet, deletePamphlet, getAllModules
} from '../../store/localStore';
import { coaching_getBatches, coaching_getStudents, coaching_getStudentPerformance } from '../../api/client';
import { fmt, fmtDate, currency } from '../../utils/format';
import { shareOnWhatsApp } from '../../utils/canvas';
import html2canvas from 'html2canvas';
import {
  Megaphone, Award, Users, Share2, Download, Plus, Trash2, Copy,
  CheckCircle, Gift, TrendingUp, Sparkles, Palette, BookOpen, Phone, Mail, MapPin, Zap
} from 'lucide-react';

/* ── Download helper for HTML-rendered posters ── */
async function captureAndDownload(el, filename) {
  if (!el) return;
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
}

/* ════════════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════════════ */
const TABS = [
  { key: 'promote', label: 'Promote', icon: Megaphone },
  { key: 'certificates', label: 'Certificates', icon: Award },
  { key: 'referrals', label: 'Referrals', icon: Users },
];

const TEMPLATES = [
  { id: 'dark', label: 'Modern Dark', bg: '#0f172a', accent: '#10b981', text: '#e2e8f0', sub: '#94a3b8' },
  { id: 'vibrant', label: 'Vibrant', bg: '#4c1d95', accent: '#818cf8', text: '#ffffff', sub: '#c4b5fd' },
  { id: 'light', label: 'Clean Light', bg: '#ffffff', accent: '#059669', text: '#1e293b', sub: '#64748b' },
];

const ACCENT_PRESETS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const BASE_QUOTA = 30;
const PER_REFERRAL = 20;

// ── Auto-fill suggestions ──
const SUGGESTIONS = [
  { label: 'JEE / NEET Crash Course', coachingName: '', courseName: 'JEE / NEET Crash Course', tagline: 'Crack the exam in one shot', subjects: 'Physics, Chemistry, Mathematics, Biology', classes: '11th - 12th', duration: '6 Months', highlights: 'Expert IIT/AIIMS faculty\nDaily practice problems\nWeekly mock tests with ranking\nOne-on-one doubt sessions\nComplete study material\nParent progress updates' },
  { label: 'Foundation Batch (8-10)', coachingName: '', courseName: 'Foundation Batch', tagline: 'Build a strong base for competitive exams', subjects: 'Maths, Science, English, SST', classes: '8th - 10th', duration: '1 Year', highlights: 'Concept-first teaching\nBoard + competitive exam prep\nMonthly parent meetings\nRegular tests & reports\nPersonalized attention\nFree study material' },
  { label: 'Summer Crash Course', coachingName: '', courseName: 'Summer Crash Course 2026', tagline: 'Make this summer count', subjects: 'Mathematics, Science', classes: '6th - 10th', duration: '2 Months', highlights: 'Intensive daily classes\nFun + learning approach\nWeekly tests\nDoubt clearing sessions\nCertificate on completion\nLimited seats only' },
  { label: 'Board Exam Prep', coachingName: '', courseName: 'Board Exam Preparation', tagline: 'Score 95%+ in boards', subjects: 'All Subjects', classes: '10th, 12th', duration: '4 Months', highlights: 'Previous year paper solving\nChapter-wise revision\nSample paper practice\nTime management training\nExpert tips & tricks\nDaily homework review' },
];

/* ════════════════════════════════════════════════════════════════
   SHARED COACHING PROFILE (persisted in localStorage)
════════════════════════════════════════════════════════════════ */
function getCoachingProfile() {
  try { return JSON.parse(localStorage.getItem('eduC_coaching_profile') || '{}'); } catch { return {}; }
}
function saveCoachingProfile(p) { localStorage.setItem('eduC_coaching_profile', JSON.stringify(p)); }

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function Tools() {
  const [tab, setTab] = useState('promote');

  return (
    <div>
      <div className="shdr">
        <div>
          <div className="stitle">Tools</div>
          <div className="ssub">Promote, certify, and grow your coaching</div>
        </div>
      </div>

      <div className="rc-tabs" style={{ marginBottom: 24 }}>
        {TABS.map(t => (
          <button key={t.key} className={`rc-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'promote' && <PromoteTab />}
      {tab === 'certificates' && <CertificatesTab />}
      {tab === 'referrals' && <ReferralsTab />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB 1 — PROMOTE (Pamphlet Generator)
   Coaching is the hero. "Powered by educourses" is a tiny watermark.
════════════════════════════════════════════════════════════════ */
function PromoteTab() {
  const posterRef = useRef(null);
  const [saved, setSaved] = useState(() => getSavedPamphlets());
  const [template, setTemplate] = useState('dark');
  const [accent, setAccent] = useState('#10b981');
  const profile = getCoachingProfile();
  const [form, setForm] = useState({
    coachingName: profile.coachingName || '', courseName: '', tagline: '',
    subjects: '', classes: '', duration: '', price: '', offerPrice: '',
    highlights: '', phone: profile.phone || '', email: profile.email || '',
    address: profile.address || '',
  });

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (['coachingName', 'phone', 'email', 'address'].includes(k)) {
      const p = getCoachingProfile(); p[k] = v; saveCoachingProfile(p);
    }
  };

  const applySuggestion = (s) => {
    setForm(f => ({ ...f, courseName: s.courseName, tagline: s.tagline, subjects: s.subjects, classes: s.classes, duration: s.duration, highlights: s.highlights }));
  };

  const tpl = TEMPLATES.find(t => t.id === template) || TEMPLATES[0];
  const isLight = template === 'light';
  const subjects = (form.subjects || '').split(',').map(s => s.trim()).filter(Boolean);
  const highlights = (form.highlights || '').split('\n').map(h => h.trim()).filter(Boolean);
  const subColors = [accent, '#06b6d4', '#a78bfa', '#f59e0b', '#ec4899', '#ef4444'];

  const handleDownload = () => captureAndDownload(posterRef.current, `pamphlet-${form.coachingName || 'poster'}-${Date.now()}.png`);
  const handleWhatsApp = () => {
    shareOnWhatsApp([
      form.coachingName && `*${form.coachingName}*`,
      form.courseName && `*${form.courseName}*`,
      form.tagline, '',
      form.subjects && `Subjects: ${form.subjects}`,
      form.classes && `Classes: ${form.classes}`,
      form.duration && `Duration: ${form.duration}`,
      form.offerPrice ? `Price: ~₹${form.price}~ *₹${form.offerPrice}*` : form.price ? `Price: ₹${form.price}` : '',
      '', ...highlights.map(h => `✓ ${h}`),
      '', form.phone && `📞 ${form.phone}`, form.email && `📧 ${form.email}`,
      form.address && `📍 ${form.address}`, '', 'Register now!',
    ].filter(Boolean).join('\n'));
  };
  const handleSave = () => { savePamphlet({ ...form, template, accent }); setSaved(getSavedPamphlets()); };
  const handleDelete = (id) => { deletePamphlet(id); setSaved(getSavedPamphlets()); };
  const loadSaved = (p) => {
    setForm(f => ({ ...f, coachingName: p.coachingName || f.coachingName, courseName: p.courseName || '', tagline: p.tagline || '', subjects: p.subjects || '', classes: p.classes || '', duration: p.duration || '', price: p.price || '', offerPrice: p.offerPrice || '', highlights: p.highlights || '', phone: p.phone || f.phone, email: p.email || f.email, address: p.address || f.address }));
    if (p.template) setTemplate(p.template); if (p.accent) setAccent(p.accent);
  };

  // ── Poster background style per template ──
  const posterBg = template === 'dark'
    ? { background: 'linear-gradient(180deg, #080d1a 0%, #0f172a 40%, #080d1a 100%)' }
    : template === 'vibrant'
    ? { background: 'linear-gradient(135deg, #1e1046 0%, #3b1d8e 50%, #0f1a4a 100%)' }
    : { background: '#f8fafc' };

  return (
    <div>
      {/* ── Suggestions ── */}
      <div className="form-card" style={{ marginBottom: 14 }}>
        <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={14} /> Quick Start</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="form-btn ghost" onClick={() => applySuggestion(s)} style={{ fontSize: 12, padding: '6px 14px' }}>
              <Sparkles size={12} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* Left — Form */}
        <div>
          <div className="form-card">
            <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Megaphone size={16} /> Pamphlet Designer</div>
            {/* Coaching identity */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(16,185,129,.04)', border: '1px solid rgba(16,185,129,.12)', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Coaching Identity (auto-saved)</div>
              <div className="form-grid">
                <div className="fg"><label className="fl">Coaching Name <span style={{ color: 'var(--danger)' }}>*</span></label><input className="fi" value={form.coachingName} onChange={e => set('coachingName', e.target.value)} placeholder="Sharma Classes" /></div>
                <div className="fg"><label className="fl">Phone</label><input className="fi" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
                <div className="fg"><label className="fl">Email</label><input className="fi" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@coaching.com" /></div>
                <div className="fg"><label className="fl">Address</label><input className="fi" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Sector 5, Bhopal" /></div>
              </div>
            </div>
            <div className="form-grid">
              <div className="fg"><label className="fl">Course Name</label><input className="fi" value={form.courseName} onChange={e => set('courseName', e.target.value)} placeholder="IIT Foundation 2026" /></div>
              <div className="fg"><label className="fl">Tagline</label><input className="fi" value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Excel in every exam" /></div>
              <div className="fg"><label className="fl">Subjects (comma-sep)</label><input className="fi" value={form.subjects} onChange={e => set('subjects', e.target.value)} placeholder="Physics, Chemistry, Math" /></div>
              <div className="fg"><label className="fl">Classes</label><input className="fi" value={form.classes} onChange={e => set('classes', e.target.value)} placeholder="9th - 12th" /></div>
              <div className="fg"><label className="fl">Duration</label><input className="fi" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="6 Months" /></div>
              <div className="fg"><label className="fl">Original Price ₹</label><input className="fi" type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="6000" /></div>
              <div className="fg"><label className="fl">Offer Price ₹</label><input className="fi" type="number" value={form.offerPrice} onChange={e => set('offerPrice', e.target.value)} placeholder="4999" /></div>
            </div>
            <div className="fg" style={{ marginTop: 12 }}>
              <label className="fl">Highlights (one per line)</label>
              <textarea className="fi" rows={4} value={form.highlights} onChange={e => set('highlights', e.target.value)} placeholder={"Expert faculty\nWeekly tests\nDoubt sessions"} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
              <div>
                <label className="fl" style={{ marginBottom: 8, display: 'block' }}>Template</label>
                <div style={{ display: 'flex', gap: 8 }}>{TEMPLATES.map(t => (
                  <button key={t.id} className={`form-btn ${template === t.id ? 'primary' : 'ghost'}`} onClick={() => setTemplate(t.id)} style={{ fontSize: 12, padding: '6px 12px' }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: t.bg, border: '1px solid rgba(255,255,255,.2)' }} />{t.label}
                  </button>
                ))}</div>
              </div>
              <div>
                <label className="fl" style={{ marginBottom: 8, display: 'block' }}>Accent</label>
                <div style={{ display: 'flex', gap: 6 }}>{ACCENT_PRESETS.map(c => (
                  <button key={c} onClick={() => setAccent(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: accent === c ? '3px solid #fff' : '2px solid rgba(255,255,255,.12)', cursor: 'pointer', transform: accent === c ? 'scale(1.15)' : 'scale(1)' }} />
                ))}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <button className="form-btn primary" onClick={handleDownload}><Download size={14} /> Download PNG</button>
              <button className="form-btn secondary" onClick={handleWhatsApp}><Share2 size={14} /> WhatsApp</button>
              <button className="form-btn outline" onClick={handleSave}><Plus size={14} /> Save</button>
            </div>
          </div>
          {saved.length > 0 && (
            <div className="form-card" style={{ marginTop: 14 }}>
              <div className="form-section-title"><BookOpen size={14} /> Saved ({saved.length})</div>
              {saved.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--glass-card)', border: '1px solid var(--glass-border)', marginBottom: 6 }}>
                  <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => loadSaved(p)}>
                    <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>{p.courseName || 'Untitled'}</div>
                    <div style={{ color: 'var(--muted)', fontSize: 11 }}>{p.coachingName} · {fmtDate(p.createdAt)}</div>
                  </div>
                  <button className="form-btn ghost" onClick={() => handleDelete(p.id)} style={{ padding: '4px 8px', color: 'var(--danger)' }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
           RIGHT — HTML POSTER (live preview + capture target)
        ══════════════════════════════════════════════════════ */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="form-card" style={{ padding: 10, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, textAlign: 'center' }}>Live Preview (this is the exported image)</div>
            <div ref={posterRef} style={{
              ...posterBg, width: 360, minHeight: 640, borderRadius: 10, overflow: 'hidden',
              fontFamily: "'Inter', system-ui, sans-serif", color: tpl.text, position: 'relative',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* ══════ HEADER BAND — Coaching identity (like eduportal) ══════ */}
              <div style={{ background: isLight ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.06)', padding: '16px 20px 14px', textAlign: 'center', borderBottom: `2px solid ${accent}` }}>
                {/* educourses logo — tiny, top-left corner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,.25) 0%, transparent 50%, rgba(0,0,0,.1) 100%)' }} />
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" style={{ position: 'relative', zIndex: 1 }}>
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: tpl.sub + '80', letterSpacing: '-.02em' }}>edu<span style={{ color: accent + '90' }}>courses</span></span>
                </div>
                {/* Coaching name — BIG, bold, hero */}
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: form.coachingName?.length > 22 ? 22 : 28, color: tpl.text, lineHeight: 1.2, fontWeight: 400 }}>
                  {form.coachingName || 'Your Coaching Name'}
                </div>
                {/* Address below — institutional subline */}
                {form.address && (
                  <div style={{ fontSize: 10, color: tpl.sub, marginTop: 5, lineHeight: 1.5 }}>
                    {form.address}
                  </div>
                )}
              </div>

              {/* ══════ COURSE TITLE BAND ══════ */}
              <div style={{ background: accent, padding: '10px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#000', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {form.courseName || 'Course Name'}
                  {form.tagline && <span style={{ fontWeight: 400, fontSize: 11, display: 'block', marginTop: 2, opacity: 0.7, textTransform: 'none', letterSpacing: 0 }}>{form.tagline}</span>}
                </div>
              </div>

              {/* ══════ MAIN CONTENT ══════ */}
              <div style={{ flex: 1, padding: '18px 22px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>

                {/* Subject pills */}
                {subjects.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                    {subjects.map((s, i) => (
                      <span key={i} style={{ padding: '4px 12px', borderRadius: 14, fontSize: 11, fontWeight: 700, background: subColors[i % subColors.length] + (isLight ? '15' : '1a'), color: subColors[i % subColors.length], border: `1px solid ${subColors[i % subColors.length]}35` }}>{s}</span>
                    ))}
                  </div>
                )}

                {/* Classes & Duration */}
                {(form.classes || form.duration) && (
                  <div style={{ fontSize: 11, color: tpl.sub, marginBottom: 10 }}>
                    {[form.classes && `Classes: ${form.classes}`, form.duration && `Duration: ${form.duration}`].filter(Boolean).join('  •  ')}
                  </div>
                )}

                {/* Price card */}
                {(form.price || form.offerPrice) && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '10px 20px', borderRadius: 10, background: isLight ? 'rgba(0,0,0,.03)' : 'rgba(255,255,255,.03)', border: `1px solid ${accent}20`, marginBottom: 10, width: '100%' }}>
                    {form.price && form.offerPrice && (
                      <span style={{ fontSize: 14, color: tpl.sub + 'aa', textDecoration: 'line-through' }}>₹{Number(form.price).toLocaleString('en-IN')}</span>
                    )}
                    <span style={{ fontSize: 26, fontWeight: 900, color: accent }}>₹{Number(form.offerPrice || form.price || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Highlights */}
                {highlights.length > 0 && (
                  <div style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: isLight ? 'rgba(0,0,0,.015)' : 'rgba(255,255,255,.018)', textAlign: 'left', marginBottom: 10 }}>
                    {highlights.map((h, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: tpl.text }}>
                        <span style={{ width: 17, height: 17, borderRadius: '50%', background: accent + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, fontWeight: 700, color: accent }}>✓</span>
                        {h}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ══════ FOOTER ZONE ══════ */}
              <div style={{ padding: '0 22px 14px', marginTop: 'auto' }}>
                {/* CTA Button */}
                <div style={{ padding: '13px 0', background: accent, borderRadius: 22, textAlign: 'center', fontWeight: 800, fontSize: 14, color: '#000', boxShadow: `0 4px 16px ${accent}35`, marginBottom: 10 }}>
                  Register Now  →
                </div>
                {/* Contact row */}
                {(form.phone || form.email) && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: tpl.text, marginBottom: 4, fontWeight: 500 }}>
                    {[form.phone, form.email].filter(Boolean).join('  •  ')}
                  </div>
                )}
              </div>

              {/* ══════ STANDARD FOOTER BAR ══════ */}
              <div style={{ borderTop: `1px solid ${accent}18`, background: isLight ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.025)', padding: '7px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: tpl.text + '99' }}>{form.coachingName || ''}</span>
                <span style={{ fontSize: 8, color: tpl.sub + '55' }}>powered by <span style={{ color: accent + '70' }}>educourses</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB 2 — CERTIFICATES
   Issued BY the coaching. "Powered by educourses" as watermark.
════════════════════════════════════════════════════════════════ */
function CertificatesTab() {
  const certRef = useRef(null);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selBatch, setSelBatch] = useState('');
  const [selStudent, setSelStudent] = useState('');
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState(false);
  const profile = getCoachingProfile();
  const [coachingName, setCoachingName] = useState(profile.coachingName || '');

  useEffect(() => {
    Promise.all([coaching_getBatches(), coaching_getStudents()])
      .then(([b, s]) => { setBatches(b.batches || []); setStudents(s.students || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const batchStudents = selBatch ? students.filter(s => (s.batches || []).some(b => b.id === selBatch)) : [];
  const selectedBatch = batches.find(b => b.id === selBatch);
  const selectedStudent = students.find(s => s.id === selStudent);

  const loadPerformance = useCallback(async () => {
    if (!selStudent) return;
    try { setPerf(await coaching_getStudentPerformance({ student_id: selStudent })); }
    catch { setPerf(null); }
  }, [selStudent]);

  useEffect(() => { if (selStudent) loadPerformance(); }, [selStudent, loadPerformance]);

  const gold = '#d4af37', green = '#10b981';
  const att = perf?.attendance?.percentage ?? perf?.attendancePercent ?? '—';
  const avg = perf?.testAvg ?? perf?.testAverage ?? '—';
  const grade = typeof avg === 'number' ? (avg >= 91 ? 'O' : avg >= 71 ? 'A' : avg >= 56 ? 'B' : avg >= 41 ? 'C' : avg >= 33 ? 'D' : 'F') : '—';
  const modules = getAllModules().filter(m => m.batchId === selBatch);
  const verifyCode = useRef('EC-' + Date.now().toString(36).toUpperCase());

  const handleGenerate = () => {
    const p = getCoachingProfile(); p.coachingName = coachingName; saveCoachingProfile(p);
    verifyCode.current = 'EC-' + Date.now().toString(36).toUpperCase();
    setGenerated(true);
  };

  const handleDownload = () => captureAndDownload(certRef.current, `certificate-${selectedStudent?.name || 'cert'}-${Date.now()}.png`);
  const handleWhatsApp = () => {
    shareOnWhatsApp([`*Certificate of Completion*`, '', `Congratulations to *${selectedStudent?.name}* for completing *${selectedBatch?.name}*!`, '', perf ? `Attendance ${att}% | Test Avg ${avg}%` : '', '', `Issued by *${coachingName}*`].filter(Boolean).join('\n'));
  };

  if (loading) return <div className="loader"><div className="loader-ring"></div><div className="loader-dots"><span></span><span></span><span></span></div></div>;

  const details = [selectedBatch?.subject && `Subjects: ${selectedBatch.subject}`, selectedBatch?.schedule && `Schedule: ${selectedBatch.schedule}`].filter(Boolean);

  return (
    <div>
      <div className="form-card">
        <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Award size={16} /> Generate Certificate</div>
        <div className="fg" style={{ marginBottom: 14 }}>
          <label className="fl">Coaching Name (on certificate) *</label>
          <input className="fi" value={coachingName} onChange={e => setCoachingName(e.target.value)} placeholder="Your Coaching Name" style={{ maxWidth: 400 }} />
        </div>
        <div className="form-grid">
          <div className="fg"><label className="fl">Batch</label>
            <select className="fi" value={selBatch} onChange={e => { setSelBatch(e.target.value); setSelStudent(''); setGenerated(false); }}>
              <option value="">Choose</option>{batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select></div>
          <div className="fg"><label className="fl">Student</label>
            <select className="fi" value={selStudent} onChange={e => { setSelStudent(e.target.value); setGenerated(false); }} disabled={!selBatch}>
              <option value="">Choose</option>{batchStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
        </div>
        {selStudent && perf && (
          <div className="kpi-grid" style={{ marginTop: 14 }}>
            <div className="kpi-card"><div className="kpi-label">Attendance</div><div className="kpi-value">{att}%</div></div>
            <div className="kpi-card"><div className="kpi-label">Test Avg</div><div className="kpi-value">{typeof avg === 'number' ? avg.toFixed(1) + '%' : avg}</div></div>
            <div className="kpi-card"><div className="kpi-label">Fees</div><div className="kpi-value" style={{ fontSize: 16 }}>{perf.feeSummary ? `₹${fmt(perf.feeSummary.totalPaid)}` : '—'}</div></div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="form-btn primary" onClick={handleGenerate} disabled={!selBatch || !selStudent || !coachingName}><Award size={14} /> Generate</button>
          {generated && <>
            <button className="form-btn secondary" onClick={handleDownload}><Download size={14} /> Download</button>
            <button className="form-btn outline" onClick={() => { const w = window.open('', '_blank'); const el = certRef.current; if (!el || !w) return; w.document.write(`<html><head><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Serif+Display&display=swap" rel="stylesheet"><style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0e1629}@media print{body{background:#0e1629!important}@page{margin:0;size:landscape}}</style></head><body>${el.outerHTML}</body></html>`); w.document.close(); setTimeout(() => w.print(), 600); }}>
              <Download size={14} /> Print
            </button>
            <button className="form-btn ghost" onClick={handleWhatsApp}><Share2 size={14} /> WhatsApp</button>
          </>}
        </div>
      </div>

      {/* ══════ HTML CERTIFICATE ══════ */}
      {generated && selectedStudent && selectedBatch && (
        <div className="form-card" style={{ marginTop: 14, padding: 10, overflow: 'auto' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, textAlign: 'center' }}>Certificate Preview</div>
          <div ref={certRef} style={{
            width: 760, minHeight: 428, background: 'linear-gradient(135deg, #070c18 0%, #0e1629 40%, #0e1629 60%, #070c18 100%)',
            fontFamily: "'Inter', system-ui, sans-serif", color: '#e2e8f0', position: 'relative',
            border: `3px solid ${gold}`, borderRadius: 4, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>

            {/* ══════ HEADER BAND — Coaching as issuing authority ══════ */}
            <div style={{ background: 'rgba(255,255,255,.05)', padding: '14px 24px 10px', textAlign: 'center', borderBottom: `2px solid ${gold}60`, position: 'relative', zIndex: 1 }}>
              {/* educourses logo — tiny */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,.25) 0%, transparent 50%, rgba(0,0,0,.1) 100%)' }} />
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" style={{ position: 'relative', zIndex: 1 }}>
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#475569' }}>edu<span style={{ color: green + '80' }}>courses</span></span>
              </div>
              {/* Coaching name — BIG */}
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: coachingName.length > 28 ? 18 : 24, color: '#e2e8f0', lineHeight: 1.2 }}>{coachingName}</div>
              {/* Address subline */}
              {profile.address && (
                <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>{profile.address}</div>
              )}
            </div>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '14px 40px 12px', gap: 2 }}>

              {/* Certificate heading */}
              <div style={{ fontSize: 26, fontWeight: 900, color: gold, letterSpacing: 1, marginBottom: 2 }}>Certificate of Completion</div>
              <div style={{ width: 160, height: 1.5, background: `linear-gradient(90deg, transparent, ${gold}80, transparent)`, marginBottom: 16 }} />

              {/* Certify text */}
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>This is to certify that</div>

              {/* Student name */}
              <div style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', marginBottom: 2 }}>{selectedStudent.name}</div>
              <div style={{ width: 200, height: 1, background: `${gold}35`, marginBottom: 10 }} />

              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>has successfully completed</div>

              {/* Batch */}
              <div style={{ fontSize: 20, fontWeight: 700, color: green, marginBottom: 4 }}>{selectedBatch.name}</div>
              {details.length > 0 && <div style={{ fontSize: 10, color: '#64748b', marginBottom: 12 }}>{details.join('  •  ')}</div>}

              {/* Performance metrics */}
              {perf && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                  {[{ label: 'ATTENDANCE', value: typeof att === 'number' ? att + '%' : att, color: '#06b6d4' },
                    { label: 'TEST AVG', value: typeof avg === 'number' ? avg.toFixed(1) + '%' : avg, color: green },
                    { label: 'GRADE', value: grade, color: gold },
                  ].map((m, i) => (
                    <div key={i} style={{ padding: '8px 16px', borderRadius: 8, background: m.color + '10', border: `1px solid ${m.color}25`, textAlign: 'center', minWidth: 90 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.value}</div>
                      <div style={{ fontSize: 8, fontWeight: 500, color: '#64748b', letterSpacing: '.06em' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {modules.length > 0 && <div style={{ fontSize: 9, color: '#64748b' }}>{modules.length} module(s) completed</div>}
            </div>

            {/* Footer */}
            <div style={{ borderTop: `1px solid ${gold}20`, background: 'rgba(255,255,255,.03)', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, fontSize: 9, gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: '#c8cdd5', fontSize: 10 }}>{coachingName}</div>
                {(profile.phone || profile.address) && <div style={{ color: '#64748b', marginTop: 2 }}>{[profile.phone, profile.address].filter(Boolean).join('  •  ')}</div>}
              </div>
              <div style={{ color: '#475569', textAlign: 'center', flexShrink: 0, fontSize: 8 }}>powered by <span style={{ color: green + '80' }}>educourses</span></div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ color: '#94a3b8' }}>Issued: {fmtDate(new Date().toISOString())}</div>
                <div style={{ fontWeight: 700, color: '#94a3b8', marginTop: 2, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.03em' }}>{verifyCode.current}</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TAB 3 — REFERRALS
════════════════════════════════════════════════════════════════ */
function ReferralsTab() {
  const [stats, setStats] = useState(() => getReferralStats());
  const [code] = useState(() => getReferralCode());
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ referrerName: '', referrerPhone: '', referredInstitute: '', referredPhone: '' });

  const refresh = () => setStats(getReferralStats());
  const handleCopy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };
  const handleAdd = () => {
    if (!form.referrerName || !form.referrerPhone || !form.referredInstitute) return;
    addReferral(form); setForm({ referrerName: '', referrerPhone: '', referredInstitute: '', referredPhone: '' }); setShowForm(false); refresh();
  };
  const handleStatus = (id, status) => { updateReferralStatus(id, status); refresh(); };
  const handleShareReferral = () => {
    shareOnWhatsApp([`*Join educourses!*`, '', `I'm using educourses to manage my coaching and it's amazing!`, `Use my referral code: *${code}*`, '', `Sign up now and we both get benefits!`].join('\n'));
  };

  const totalQuota = stats.base + stats.verified * PER_REFERRAL;

  return (
    <div>
      {/* Referral Code */}
      <div className="form-card" style={{ marginBottom: 14 }}>
        <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Gift size={16} /> Your Referral Code</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <div style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--glass-card)', border: '2px dashed var(--accent)', fontSize: 20, fontWeight: 700, letterSpacing: 3, color: 'var(--accent)' }}>{code}</div>
          <button className="form-btn outline" onClick={handleCopy} style={{ gap: 6 }}>{copied ? <><CheckCircle size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}</button>
          <button className="form-btn secondary" onClick={handleShareReferral}><Share2 size={14} /> WhatsApp</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-label">Student Quota</div><div className="kpi-value">{fmt(totalQuota)}</div><div className="kpi-sub">{stats.base} base + {stats.verified * PER_REFERRAL} referral</div></div>
        <div className="kpi-card"><div className="kpi-label">Verified Referrals</div><div className="kpi-value" style={{ color: 'var(--accent)' }}>{stats.verified}</div><div className="kpi-sub">+{PER_REFERRAL} students each</div></div>
        <div className="kpi-card"><div className="kpi-label">Pending</div><div className="kpi-value" style={{ color: 'var(--accent2)' }}>{stats.pending}</div><div className="kpi-sub">Awaiting verification</div></div>
        <div className="kpi-card"><div className="kpi-label">Free Batches</div><div className="kpi-value" style={{ color: 'var(--hostel)' }}>{stats.freeBatches}</div><div className="kpi-sub">Included</div></div>
      </div>

      {/* Quota bar */}
      <div className="form-card" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>Student Quota</span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>0 / {totalQuota}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, width: '0%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', transition: 'width .4s' }} />
        </div>
      </div>

      {/* How it works */}
      <div className="form-card" style={{ marginTop: 14 }}>
        <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><TrendingUp size={14} /> How it works</div>
        <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 2 }}>
          {[`Start with *${BASE_QUOTA} free students*`, `Each verified referral adds *${PER_REFERRAL} more students*`, `*1 batch* is always free`].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} /> <span dangerouslySetInnerHTML={{ __html: t.replace(/\*(.*?)\*/g, '<strong style="color:var(--text)">$1</strong>') }} /></div>
          ))}
        </div>
      </div>

      {/* Referrals */}
      <div className="form-card" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="form-section-title" style={{ margin: 0 }}>Referrals ({stats.referrals.length})</div>
          <button className="form-btn primary" onClick={() => setShowForm(s => !s)}><Plus size={14} /> Add</button>
        </div>

        {showForm && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: 'var(--glass-card)', border: '1px solid var(--glass-border)' }}>
            <div className="form-grid">
              <div className="fg"><label className="fl">Referrer Name *</label><input className="fi" value={form.referrerName} onChange={e => setForm(f => ({ ...f, referrerName: e.target.value }))} placeholder="Who referred?" /></div>
              <div className="fg"><label className="fl">Referrer Phone *</label><input className="fi" value={form.referrerPhone} onChange={e => setForm(f => ({ ...f, referrerPhone: e.target.value }))} placeholder="+91..." /></div>
              <div className="fg"><label className="fl">Referred Institute *</label><input className="fi" value={form.referredInstitute} onChange={e => setForm(f => ({ ...f, referredInstitute: e.target.value }))} placeholder="Institute name" /></div>
              <div className="fg"><label className="fl">Referred Phone</label><input className="fi" value={form.referredPhone} onChange={e => setForm(f => ({ ...f, referredPhone: e.target.value }))} placeholder="Optional" /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="form-btn primary" onClick={handleAdd}><Plus size={14} /> Add</button>
              <button className="form-btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {stats.referrals.length > 0 ? (
          <div className="table-wrap" style={{ marginTop: 14 }}><table style={{ minWidth: 'auto' }}>
            <thead><tr><th>Referrer</th><th>Referred</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>
              {stats.referrals.slice().reverse().map(r => (
                <tr key={r.id}>
                  <td><div style={{ fontWeight: 500 }}>{r.referrerName}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.referrerPhone}</div></td>
                  <td>{r.referredInstitute}{r.referredPhone && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.referredPhone}</div>}</td>
                  <td style={{ color: 'var(--muted)' }}>{fmtDate(r.createdAt)}</td>
                  <td><span className="badge" style={{ background: r.status === 'verified' ? 'rgba(16,185,129,.15)' : r.status === 'rejected' ? 'rgba(248,113,113,.15)' : 'rgba(6,182,212,.15)', color: r.status === 'verified' ? 'var(--accent)' : r.status === 'rejected' ? 'var(--danger)' : 'var(--accent2)' }}>{r.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    {r.status === 'pending' && <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="form-btn ghost" onClick={() => handleStatus(r.id, 'verified')} style={{ color: 'var(--accent)', padding: '3px 8px', fontSize: 11 }}><CheckCircle size={11} /> Verify</button>
                      <button className="form-btn ghost" onClick={() => handleStatus(r.id, 'rejected')} style={{ color: 'var(--danger)', padding: '3px 8px', fontSize: 11 }}><Trash2 size={11} /> Reject</button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        ) : (
          <div className="empty" style={{ marginTop: 14 }}>No referrals yet. Share your code!</div>
        )}
      </div>
    </div>
  );
}
