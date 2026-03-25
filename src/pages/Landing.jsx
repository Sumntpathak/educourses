import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Users, BookOpen, BarChart3, CheckCircle, Star,
  Download, Share2, ArrowRight, Zap, Shield, Clock, Award,
  Phone, Mail, MapPin, ChevronDown, Sparkles, TrendingUp, Heart
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   SUMMER BATCH CONFIG
═══════════════════════════════════════════════════════════════ */
const SUMMER_BATCH = {
  name: 'Summer Crash Course 2026',
  tagline: 'Master your subjects this summer',
  totalFreeSlots: 50,
  startDate: '2026-04-15',
  endDate: '2026-06-15',
  subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
  classes: ['8th', '9th', '10th', '11th', '12th'],
  features: [
    'Daily live classes',
    'Weekly tests & analysis',
    'Doubt clearing sessions',
    'Study material included',
    'Performance reports',
    'Parent updates via WhatsApp',
  ],
  regularPrice: 4999,
  offerPrice: 0,
  whatsappNumber: '919999999999',
  contactPhone: '+91 99999-99999',
  contactEmail: 'hello@educourses.in',
};

/* ═══════════════════════════════════════════════════════════════
   FREE SLOTS TRACKER (localStorage-based for demo)
═══════════════════════════════════════════════════════════════ */
function getRegistrations() {
  try {
    return JSON.parse(localStorage.getItem('summer_registrations') || '[]');
  } catch { return []; }
}
function addRegistration(data) {
  const regs = getRegistrations();
  regs.push({ ...data, id: Date.now(), registeredAt: new Date().toISOString() });
  localStorage.setItem('summer_registrations', JSON.stringify(regs));
  return regs;
}
function getSlotsRemaining() {
  return Math.max(0, SUMMER_BATCH.totalFreeSlots - getRegistrations().length);
}

/* ═══════════════════════════════════════════════════════════════
   POSTER / PAMPHLET GENERATOR (Canvas-based)
═══════════════════════════════════════════════════════════════ */
function generatePoster(callback) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const accent = '#10b981';

  // ── Background ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#080d1a'); bg.addColorStop(0.4, '#0e1629'); bg.addColorStop(1, '#080d1a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // ── Subtle glows ──
  ctx.globalAlpha = 0.06;
  const glow1 = ctx.createRadialGradient(W / 2, 450, 0, W / 2, 450, 500);
  glow1.addColorStop(0, accent); glow1.addColorStop(1, 'transparent');
  ctx.fillStyle = glow1; ctx.fillRect(0, 0, W, H);
  ctx.beginPath(); ctx.arc(-60, -60, 280, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();
  ctx.beginPath(); ctx.arc(W + 60, H + 60, 280, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // ── Top accent strip ──
  const strip = ctx.createLinearGradient(0, 0, W, 0);
  strip.addColorStop(0, accent); strip.addColorStop(1, '#06b6d4');
  ctx.fillStyle = strip; ctx.fillRect(0, 0, W, 6);

  // ── Side lines ──
  ctx.fillStyle = accent + '15';
  ctx.fillRect(0, 0, 3, H); ctx.fillRect(W - 3, 0, 3, H);

  let y = 56;

  // ── Logo mark ──
  const logoSize = 52;
  roundRect(ctx, W / 2 - logoSize / 2, y, logoSize, logoSize, 14);
  ctx.fillStyle = accent; ctx.fill();
  const logoShine = ctx.createLinearGradient(W / 2 - logoSize / 2, y, W / 2 + logoSize / 2, y + logoSize);
  logoShine.addColorStop(0, 'rgba(255,255,255,.28)'); logoShine.addColorStop(0.5, 'transparent'); logoShine.addColorStop(1, 'rgba(0,0,0,.1)');
  roundRect(ctx, W / 2 - logoSize / 2, y, logoSize, logoSize, 14);
  ctx.fillStyle = logoShine; ctx.fill();
  // Cap icon
  ctx.save(); ctx.translate(W / 2, y + logoSize / 2);
  const sc = logoSize / 50;
  ctx.scale(sc, sc); ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(18, -2); ctx.lineTo(18, 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(0, -11); ctx.lineTo(16, -2); ctx.lineTo(0, 7); ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-10, 9); ctx.quadraticCurveTo(0, 16, 10, 9); ctx.lineTo(10, 2); ctx.stroke();
  ctx.restore();
  y += logoSize + 18;

  // ── Brand text ──
  ctx.font = '900 28px Inter, system-ui, sans-serif';
  const eduW = ctx.measureText('edu').width;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e2e8f0'; ctx.fillText('edu', W / 2 - (eduW + ctx.measureText('courses').width) / 2, y);
  ctx.fillStyle = accent; ctx.fillText('courses', W / 2 - (eduW + ctx.measureText('courses').width) / 2 + eduW, y);
  ctx.textAlign = 'center';
  ctx.font = '500 14px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#546580'; ctx.fillText('COACHING & COURSE MANAGEMENT', W / 2, y + 22);
  y += 56;

  // ── FREE badge ──
  roundRect(ctx, W / 2 - 200, y, 400, 48, 24);
  ctx.fillStyle = accent; ctx.fill();
  ctx.shadowColor = accent + '55'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
  roundRect(ctx, W / 2 - 200, y, 400, 48, 24); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.font = '800 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#000'; ctx.fillText('FIRST 50 STUDENTS FREE!', W / 2, y + 32);
  y += 80;

  // ── Main heading ──
  ctx.font = '900 78px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#f1f5f9'; ctx.fillText('SUMMER', W / 2, y);
  y += 88;
  ctx.fillText('CRASH COURSE', W / 2, y);
  y += 100;
  ctx.font = '900 92px Inter, system-ui, sans-serif';
  ctx.fillStyle = accent; ctx.fillText('2026', W / 2, y);
  y += 60;

  // ── Date pill ──
  roundRect(ctx, W / 2 - 220, y, 440, 50, 25);
  ctx.fillStyle = accent + '14'; ctx.fill();
  ctx.strokeStyle = accent + '35'; ctx.lineWidth = 1.5;
  roundRect(ctx, W / 2 - 220, y, 440, 50, 25); ctx.stroke();
  ctx.font = '700 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#34d399'; ctx.fillText('15 APRIL \u2014 15 JUNE 2026', W / 2, y + 33);
  y += 78;

  // ── Subject pills ──
  const subjects = SUMMER_BATCH.subjects;
  const subColors = [accent, '#06b6d4', '#a78bfa', '#f59e0b'];
  ctx.font = '700 22px Inter, system-ui, sans-serif';
  const pillPad = 22, pillGap = 12, pillH = 44, pillR = 22;
  const pillWidths = subjects.map(s => ctx.measureText(s).width + pillPad * 2);
  const totalPW = pillWidths.reduce((a, b) => a + b + pillGap, -pillGap);
  let px = (W - totalPW) / 2;
  subjects.forEach((sub, i) => {
    const c = subColors[i % subColors.length];
    roundRect(ctx, px, y, pillWidths[i], pillH, pillR);
    ctx.fillStyle = c + '20'; ctx.fill();
    ctx.strokeStyle = c + '50'; ctx.lineWidth = 1;
    roundRect(ctx, px, y, pillWidths[i], pillH, pillR); ctx.stroke();
    ctx.fillStyle = c; ctx.fillText(sub, px + pillWidths[i] / 2, y + 30);
    px += pillWidths[i] + pillGap;
  });
  y += pillH + 18;

  // ── Classes ──
  ctx.font = '500 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#64748b'; ctx.fillText('Classes 8th to 12th', W / 2, y);
  y += 48;

  // ── Features card ──
  const features = SUMMER_BATCH.features;
  const featCardH = features.length * 52 + 70;
  roundRect(ctx, 70, y, W - 140, featCardH, 20);
  ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();

  ctx.font = '800 26px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#e2e8f0'; ctx.fillText('What You Get', W / 2, y + 42);
  let fy = y + 74;
  const cols = 2, colW = (W - 200) / cols;
  features.forEach((feat, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const fx = 120 + col * colW;
    const fiy = fy + row * 52;
    ctx.beginPath(); ctx.arc(fx + 14, fiy + 4, 13, 0, Math.PI * 2);
    ctx.fillStyle = accent + '25'; ctx.fill();
    ctx.font = '700 15px Inter, system-ui, sans-serif'; ctx.fillStyle = accent;
    ctx.fillText('\u2713', fx + 14, fiy + 10);
    ctx.textAlign = 'left';
    ctx.font = '500 21px Inter, system-ui, sans-serif'; ctx.fillStyle = '#e2e8f0';
    ctx.fillText(feat, fx + 38, fiy + 10);
    ctx.textAlign = 'center';
  });
  y += featCardH + 28;

  // ── Price section ──
  ctx.font = '500 22px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#64748b'; ctx.fillText('Regular Price', W / 2, y);
  y += 42;
  const priceText = '\u20B9' + SUMMER_BATCH.regularPrice.toLocaleString('en-IN');
  ctx.font = '600 32px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#f87171'; ctx.fillText(priceText, W / 2, y);
  const tw = ctx.measureText(priceText).width;
  ctx.strokeStyle = '#f87171'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(W / 2 - tw / 2 - 8, y - 8); ctx.lineTo(W / 2 + tw / 2 + 8, y - 8); ctx.stroke();
  y += 60;
  ctx.font = '900 80px Inter, system-ui, sans-serif';
  ctx.fillStyle = accent; ctx.fillText('FREE', W / 2, y);
  y += 30;
  ctx.font = '500 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#34d399'; ctx.fillText('for first 50 students only!', W / 2, y);
  y += 56;

  // ── CTA button ──
  y = Math.max(y, H - 290);
  const ctaGrad = ctx.createLinearGradient(180, 0, W - 180, 0);
  ctaGrad.addColorStop(0, accent); ctaGrad.addColorStop(1, '#06b6d4');
  roundRect(ctx, 200, y, W - 400, 76, 38);
  ctx.fillStyle = ctaGrad; ctx.fill();
  ctx.shadowColor = accent + '44'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
  roundRect(ctx, 200, y, W - 400, 76, 38); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.font = '800 28px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#000'; ctx.fillText('REGISTER NOW  \u2192', W / 2, y + 48);
  y += 100;

  // ── Contact ──
  ctx.font = '500 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#64748b'; ctx.fillText(SUMMER_BATCH.contactPhone + '  \u2022  ' + SUMMER_BATCH.contactEmail, W / 2, y);
  y += 44;

  // ── WhatsApp hint ──
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#25d366'; ctx.fillText('Share on WhatsApp \u2192', W / 2, y);

  // ── Bottom strip ──
  ctx.fillStyle = accent + '15'; ctx.fillRect(0, H - 6, W, 6);
  ctx.font = '400 15px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#334155'; ctx.fillText('courses.eduportal.solutions', W / 2, H - 20);

  canvas.toBlob(blob => callback(blob, canvas), 'image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ═══════════════════════════════════════════════════════════════
   COUNTDOWN TIMER
═══════════════════════════════════════════════════════════════ */
function useCountdown(targetDate) {
  const [time, setTime] = useState(() => calcTime(targetDate));
  useEffect(() => {
    const id = setInterval(() => setTime(calcTime(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}
function calcTime(target) {
  const diff = new Date(target) - new Date();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [slotsLeft, setSlotsLeft] = useState(getSlotsRemaining);
  const [showRegForm, setShowRegForm] = useState(false);
  const [form, setForm] = useState({});
  const [regErr, setRegErr] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [posterGenerating, setPosterGenerating] = useState(false);
  const countdown = useCountdown(SUMMER_BATCH.startDate);
  const regRef = useRef(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const scrollToReg = () => {
    regRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowRegForm(true);
  };

  // Download poster
  const downloadPoster = useCallback(() => {
    setPosterGenerating(true);
    generatePoster((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'EduCourses-Summer-2026.png';
      a.click();
      URL.revokeObjectURL(url);
      setPosterGenerating(false);
    });
  }, []);

  // Share on WhatsApp
  const shareWhatsApp = useCallback(() => {
    const text = encodeURIComponent(
      `*${SUMMER_BATCH.name}*\n\n` +
      `FIRST 50 STUDENTS FREE!\n\n` +
      `Subjects: ${SUMMER_BATCH.subjects.join(', ')}\n` +
      `Classes: ${SUMMER_BATCH.classes.join(', ')}\n` +
      `Duration: 15 Apr - 15 Jun 2026\n\n` +
      `Regular Price: Rs.${SUMMER_BATCH.regularPrice}\n` +
      `Offer: *ABSOLUTELY FREE* (limited seats)\n\n` +
      `Features:\n${SUMMER_BATCH.features.map(f => `- ${f}`).join('\n')}\n\n` +
      `Register now: ${window.location.origin}\n` +
      `Contact: ${SUMMER_BATCH.contactPhone}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, []);

  // Register for summer batch
  const handleRegister = async () => {
    setRegErr('');
    if (!form.studentName?.trim()) return setRegErr('Enter student name');
    if (!form.parentName?.trim()) return setRegErr('Enter parent/guardian name');
    if (!form.mobile?.trim() || form.mobile.trim().length < 10) return setRegErr('Enter valid 10-digit mobile');
    if (!form.class) return setRegErr('Select a class');
    if (!form.subject) return setRegErr('Select a subject');

    if (getSlotsRemaining() <= 0) return setRegErr('Sorry, all 50 free slots are filled! Contact us for paid enrollment.');

    setBusy(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    const regs = addRegistration({
      studentName: form.studentName.trim(),
      parentName: form.parentName.trim(),
      mobile: form.mobile.trim(),
      class: form.class,
      subject: form.subject,
      email: form.email?.trim() || '',
    });
    setSlotsLeft(Math.max(0, SUMMER_BATCH.totalFreeSlots - regs.length));
    setRegSuccess(true);
    setBusy(false);
  };

  const slotsPercent = ((SUMMER_BATCH.totalFreeSlots - slotsLeft) / SUMMER_BATCH.totalFreeSlots) * 100;

  return (
    <div className="landing">
      {/* ─── NAVBAR ─── */}
      <nav className="ln-nav">
        <div className="ln-nav-inner">
          <div className="ln-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="ln-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span>edu<b>courses</b></span>
          </div>
          <div className="ln-nav-links">
            <a href="#features">Features</a>
            <a href="#summer">Summer Batch</a>
            <a href="#poster">Poster</a>
            <button className="ln-nav-cta" onClick={() => navigate('/login')}>Login</button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="ln-hero">
        <div className="ln-hero-bg" />
        <div className="ln-hero-content">
          <div className="ln-hero-badge">
            <Sparkles size={14} /> Summer 2026 Batch Open
          </div>
          <h1>
            Transform Your <span className="ln-grad-text">Coaching Institute</span> Into a Digital Powerhouse
          </h1>
          <p className="ln-hero-sub">
            Complete coaching management — batches, fees, attendance, tests, performance analytics.
            Everything you need, beautifully designed.
          </p>
          <div className="ln-hero-actions">
            <button className="ln-btn-primary" onClick={scrollToReg}>
              <Zap size={18} /> Register Free — Summer Batch
            </button>
            <button className="ln-btn-outline" onClick={() => navigate('/login')}>
              Admin Login <ArrowRight size={16} />
            </button>
          </div>
          <div className="ln-hero-stats">
            <div className="ln-stat"><span className="ln-stat-val">{slotsLeft}</span><span className="ln-stat-label">Free Slots Left</span></div>
            <div className="ln-stat-sep" />
            <div className="ln-stat"><span className="ln-stat-val">4</span><span className="ln-stat-label">Subjects</span></div>
            <div className="ln-stat-sep" />
            <div className="ln-stat"><span className="ln-stat-val">2</span><span className="ln-stat-label">Months</span></div>
            <div className="ln-stat-sep" />
            <div className="ln-stat"><span className="ln-stat-val">100%</span><span className="ln-stat-label">Free for 50</span></div>
          </div>
        </div>
        <div className="ln-scroll-hint">
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="ln-section" id="features">
        <div className="ln-section-inner">
          <div className="ln-section-badge"><BookOpen size={14} /> Platform Features</div>
          <h2 className="ln-section-title">Everything Your Institute Needs</h2>
          <p className="ln-section-sub">Powerful tools designed for modern coaching institutes</p>
          <div className="ln-features-grid">
            {[
              { icon: <Users size={24} />, title: 'Student Management', desc: 'Complete student profiles with batch assignments, contact details, and history' },
              { icon: <BookOpen size={24} />, title: 'Batch Organization', desc: 'Create unlimited batches with subjects, schedules, and faculty assignments' },
              { icon: <BarChart3 size={24} />, title: 'Performance Analytics', desc: 'Track test scores, grades, trends and identify areas for improvement' },
              { icon: <CheckCircle size={24} />, title: 'Attendance Tracking', desc: 'Mark & monitor attendance with daily/monthly reports and alerts' },
              { icon: <Shield size={24} />, title: 'Fee Management', desc: 'Collect, track, and report fees with pending reminders and receipts' },
              { icon: <Clock size={24} />, title: 'Real-time Sync', desc: 'All data syncs instantly across devices — always up to date' },
            ].map((f, i) => (
              <div key={i} className="ln-feature-card">
                <div className="ln-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SUMMER BATCH OFFER ─── */}
      <section className="ln-section ln-summer" id="summer" ref={regRef}>
        <div className="ln-section-inner">
          <div className="ln-section-badge ln-badge-hot"><Zap size={14} /> Limited Time Offer</div>
          <h2 className="ln-section-title">Summer Crash Course 2026</h2>
          <p className="ln-section-sub">First 50 students get the entire course <strong>absolutely FREE!</strong></p>

          {/* Countdown */}
          <div className="ln-countdown">
            <div className="ln-count-label">Course starts in</div>
            <div className="ln-count-grid">
              {[
                [countdown.days, 'Days'],
                [countdown.hours, 'Hours'],
                [countdown.minutes, 'Minutes'],
                [countdown.seconds, 'Seconds'],
              ].map(([val, label]) => (
                <div key={label} className="ln-count-item">
                  <div className="ln-count-val">{String(val).padStart(2, '0')}</div>
                  <div className="ln-count-lbl">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Slots progress */}
          <div className="ln-slots">
            <div className="ln-slots-header">
              <span className="ln-slots-label">
                <Award size={16} /> Free Slots
              </span>
              <span className="ln-slots-count">{slotsLeft} / {SUMMER_BATCH.totalFreeSlots} remaining</span>
            </div>
            <div className="ln-slots-bar">
              <div className="ln-slots-fill" style={{ width: `${slotsPercent}%` }} />
            </div>
            {slotsLeft <= 10 && slotsLeft > 0 && (
              <div className="ln-slots-urgent">Hurry! Only {slotsLeft} free spots left!</div>
            )}
            {slotsLeft === 0 && (
              <div className="ln-slots-full">All 50 free slots are filled! Contact us for paid enrollment.</div>
            )}
          </div>

          {/* Course details grid */}
          <div className="ln-course-grid">
            <div className="ln-course-card">
              <h3>Subjects</h3>
              <div className="ln-tags">
                {SUMMER_BATCH.subjects.map(s => <span key={s} className="ln-tag">{s}</span>)}
              </div>
            </div>
            <div className="ln-course-card">
              <h3>Classes</h3>
              <div className="ln-tags">
                {SUMMER_BATCH.classes.map(c => <span key={c} className="ln-tag">{c}</span>)}
              </div>
            </div>
            <div className="ln-course-card">
              <h3>Duration</h3>
              <div className="ln-course-val">15 Apr — 15 Jun 2026</div>
              <div className="ln-course-sub">2 months intensive</div>
            </div>
            <div className="ln-course-card">
              <h3>Price</h3>
              <div className="ln-price-strike">Rs. {SUMMER_BATCH.regularPrice.toLocaleString('en-IN')}</div>
              <div className="ln-price-free">FREE</div>
              <div className="ln-course-sub">for first 50 students</div>
            </div>
          </div>

          {/* What's included */}
          <div className="ln-includes">
            <h3>What's Included</h3>
            <div className="ln-includes-grid">
              {SUMMER_BATCH.features.map((f, i) => (
                <div key={i} className="ln-include-item">
                  <CheckCircle size={18} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Registration form */}
          {!regSuccess ? (
            <div className="ln-reg-card" id="register">
              <div className="ln-reg-header">
                <h3><GraduationCap size={22} /> Register for Summer Batch</h3>
                {slotsLeft > 0 && <span className="ln-free-badge">FREE</span>}
              </div>

              {showRegForm ? (
                <div className="ln-reg-form">
                  <div className="ln-reg-grid">
                    <div className="ln-fg">
                      <label>Student Name <span className="ln-req">*</span></label>
                      <input value={form.studentName || ''} onChange={e => set('studentName', e.target.value)} placeholder="Full name of student" />
                    </div>
                    <div className="ln-fg">
                      <label>Parent/Guardian Name <span className="ln-req">*</span></label>
                      <input value={form.parentName || ''} onChange={e => set('parentName', e.target.value)} placeholder="Parent or guardian name" />
                    </div>
                    <div className="ln-fg">
                      <label>Mobile Number <span className="ln-req">*</span></label>
                      <input type="tel" value={form.mobile || ''} onChange={e => set('mobile', e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
                    </div>
                    <div className="ln-fg">
                      <label>Email (optional)</label>
                      <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
                    </div>
                    <div className="ln-fg">
                      <label>Class <span className="ln-req">*</span></label>
                      <select value={form.class || ''} onChange={e => set('class', e.target.value)}>
                        <option value="">Select class</option>
                        {SUMMER_BATCH.classes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="ln-fg">
                      <label>Preferred Subject <span className="ln-req">*</span></label>
                      <select value={form.subject || ''} onChange={e => set('subject', e.target.value)}>
                        <option value="">Select subject</option>
                        {SUMMER_BATCH.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <button className="ln-btn-primary ln-reg-submit" onClick={handleRegister} disabled={busy || slotsLeft === 0}>
                    {busy ? 'Registering...' : slotsLeft > 0 ? 'Register for Free' : 'All Free Slots Filled'}
                    {!busy && <ArrowRight size={18} />}
                  </button>

                  {regErr && <div className="ln-reg-err">{regErr}</div>}
                </div>
              ) : (
                <button className="ln-btn-primary" onClick={() => setShowRegForm(true)} style={{ width: '100%', marginTop: '16px' }}>
                  <Zap size={18} /> Claim Your Free Spot Now
                </button>
              )}
            </div>
          ) : (
            <div className="ln-reg-success">
              <div className="ln-success-icon"><CheckCircle size={48} /></div>
              <h3>Registration Successful!</h3>
              <p>Welcome to the Summer Crash Course 2026! You've secured one of the {SUMMER_BATCH.totalFreeSlots} free spots.</p>
              <p className="ln-success-sub">We'll contact you on <strong>{form.mobile}</strong> with further details.</p>
              <div className="ln-success-actions">
                <button className="ln-btn-primary" onClick={shareWhatsApp}>
                  <Share2 size={16} /> Share with Friends
                </button>
                <button className="ln-btn-outline" onClick={downloadPoster}>
                  <Download size={16} /> Download Poster
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── POSTER SECTION ─── */}
      <section className="ln-section" id="poster">
        <div className="ln-section-inner">
          <div className="ln-section-badge"><Download size={14} /> Spread the Word</div>
          <h2 className="ln-section-title">Download & Share</h2>
          <p className="ln-section-sub">Get the poster to share with parents and students via WhatsApp</p>

          <div className="ln-poster-actions">
            <button className="ln-btn-primary ln-btn-lg" onClick={downloadPoster} disabled={posterGenerating}>
              <Download size={20} /> {posterGenerating ? 'Generating...' : 'Download Poster (PNG)'}
            </button>
            <button className="ln-btn-whatsapp ln-btn-lg" onClick={shareWhatsApp}>
              <Share2 size={20} /> Share on WhatsApp
            </button>
          </div>

          <div className="ln-poster-preview">
            <div className="ln-poster-mock">
              <div className="ln-poster-top-bar" />
              <div className="ln-poster-logo-area">
                <div className="ln-poster-logo-box">EC</div>
                <span>edu<b>courses</b></span>
              </div>
              <div className="ln-poster-free-badge">FIRST 50 STUDENTS FREE!</div>
              <h2>SUMMER<br />CRASH COURSE<br /><span>2026</span></h2>
              <div className="ln-poster-date">15 APRIL - 15 JUNE 2026</div>
              <div className="ln-poster-subjects">
                {SUMMER_BATCH.subjects.map((s, i) => (
                  <span key={s} className={`ln-ps ln-ps-${i}`}>{s}</span>
                ))}
              </div>
              <div className="ln-poster-price">
                <span className="ln-pp-strike">Rs.{SUMMER_BATCH.regularPrice}</span>
                <span className="ln-pp-free">FREE</span>
              </div>
              <div className="ln-poster-cta-btn">REGISTER NOW</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="ln-section">
        <div className="ln-section-inner">
          <div className="ln-section-badge"><Star size={14} /> Trusted by Institutes</div>
          <h2 className="ln-section-title">What Educators Say</h2>
          <div className="ln-testimonials">
            {[
              { name: 'Rajesh Sharma', role: 'Director, Sharma Classes', text: 'Educourses transformed how we manage our 200+ students. Fee tracking alone saved us hours every week.' },
              { name: 'Priya Verma', role: 'Owner, Bright Minds Academy', text: 'Parents love the transparency. They can check attendance and test scores anytime. Our retention improved 40%.' },
              { name: 'Amit Patel', role: 'Faculty, Excel Coaching', text: 'The performance analytics help me identify weak students early. The batch management is incredibly intuitive.' },
            ].map((t, i) => (
              <div key={i} className="ln-testimonial">
                <div className="ln-test-stars">{[...Array(5)].map((_, j) => <Star key={j} size={14} fill="var(--accent)" stroke="none" />)}</div>
                <p>"{t.text}"</p>
                <div className="ln-test-author">
                  <div className="ln-test-avatar">{t.name[0]}</div>
                  <div>
                    <div className="ln-test-name">{t.name}</div>
                    <div className="ln-test-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="ln-cta-section">
        <div className="ln-section-inner">
          <h2>Ready to Get Started?</h2>
          <p>Join the Summer Crash Course 2026 — first 50 students absolutely free!</p>
          <div className="ln-cta-btns">
            <button className="ln-btn-primary ln-btn-lg" onClick={scrollToReg}>
              <Zap size={20} /> Register Now — It's Free
            </button>
            <button className="ln-btn-outline ln-btn-lg" onClick={() => navigate('/login')}>
              Admin Portal <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="ln-footer">
        <div className="ln-footer-inner">
          <div className="ln-footer-brand">
            <div className="ln-logo">
              <div className="ln-logo-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <span>edu<b>courses</b></span>
            </div>
            <p>Complete coaching & course management portal</p>
          </div>
          <div className="ln-footer-contact">
            <div><Phone size={14} /> {SUMMER_BATCH.contactPhone}</div>
            <div><Mail size={14} /> {SUMMER_BATCH.contactEmail}</div>
          </div>
          <div className="ln-footer-bottom">
            <span>courses.eduportal.solutions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
