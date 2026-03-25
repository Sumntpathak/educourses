import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import {
  GraduationCap, Users, BookOpen, BarChart3, CheckCircle, Star,
  Download, Share2, ArrowRight, Zap, Shield, Clock, Award,
  Phone, ChevronDown, TrendingUp, IndianRupee, Layers, FileText,
  CheckSquare, CreditCard, Smartphone, QrCode, Megaphone
} from 'lucide-react';

const SITE_URL = 'https://courses.eduportal.solutions';

/* ═══════════════════════════════════════════════════════════════
   QR CODE — Tiny inline SVG QR generator (no dependency)
   Uses a simple pattern — for production use a proper QR lib
═══════════════════════════════════════════════════════════════ */
function QRCode({ url, size = 140 }) {
  // Use Google Charts API for a real QR code image
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=0f172a&color=10b981&format=svg`;
  return <img src={qrUrl} alt="QR Code" width={size} height={size} style={{ borderRadius: 8, background: '#0f172a' }} />;
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — Sell educourses to coaching owners
═══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const posterRef = useRef(null);
  const [posterDownloading, setPosterDownloading] = useState(false);

  const downloadPoster = useCallback(async () => {
    if (!posterRef.current) return;
    setPosterDownloading(true);
    try {
      const canvas = await html2canvas(posterRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'educourses-poster.png';
      a.click();
    } catch {}
    setPosterDownloading(false);
  }, []);

  const shareWhatsApp = () => {
    const text = `*educourses — Complete Coaching Management Portal*\n\nManage your coaching institute digitally:\n✓ Students, Batches, Fees\n✓ Tests, Attendance, Analytics\n✓ Teacher Portal with live tracking\n✓ Digital Certificates\n✓ WhatsApp Pamphlet Generator\n\n*Free for 30 students!*\n\nRegister now: ${SITE_URL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

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
            <a href="#pricing">Pricing</a>
            <a href="#poster">Share</a>
            <button className="ln-nav-cta" onClick={() => navigate('/login')}>Start Free</button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="ln-hero">
        <div className="ln-hero-bg" />
        <div className="ln-hero-content">
          <div className="ln-hero-badge">
            <Zap size={14} /> Free for coaching institutes — No credit card needed
          </div>
          <h1>
            Your Coaching Deserves a <span className="ln-grad-text">Digital Upgrade</span>
          </h1>
          <p className="ln-hero-sub">
            Stop managing students in registers and spreadsheets. educourses gives your coaching
            a complete digital portal — students, batches, fees, tests, attendance, analytics, teacher management,
            certificates, and promotions. All in one place.
          </p>
          <div className="ln-hero-actions">
            <button className="ln-btn-primary" onClick={() => navigate('/login')}>
              <Zap size={18} /> Register Your Institute — Free
            </button>
            <button className="ln-btn-outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              See What You Get <ArrowRight size={16} />
            </button>
          </div>
          <div className="ln-hero-stats">
            <div className="ln-stat"><span className="ln-stat-val">30</span><span className="ln-stat-label">Free Students</span></div>
            <div className="ln-stat-sep" />
            <div className="ln-stat"><span className="ln-stat-val">∞</span><span className="ln-stat-label">Batches</span></div>
            <div className="ln-stat-sep" />
            <div className="ln-stat"><span className="ln-stat-val">100%</span><span className="ln-stat-label">Free to Start</span></div>
            <div className="ln-stat-sep" />
            <div className="ln-stat"><span className="ln-stat-val">0</span><span className="ln-stat-label">Setup Cost</span></div>
          </div>
        </div>
        <div className="ln-scroll-hint"><ChevronDown size={20} /></div>
      </section>

      {/* ─── PROBLEM → SOLUTION ─── */}
      <section className="ln-section" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,.03) 0%, transparent 100%)' }}>
        <div className="ln-section-inner">
          <div className="ln-section-badge"><TrendingUp size={14} /> Why educourses?</div>
          <h2 className="ln-section-title">Running a Coaching? You Know These Problems.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 32 }}>
            {[
              { problem: 'Fee collection is messy', solution: 'Digital fee tracking with receipts, pending alerts, and monthly reports' },
              { problem: 'No idea which student is weak', solution: 'Test analytics show exactly who needs help and in what subject' },
              { problem: 'Attendance taken on paper', solution: 'One-tap attendance with daily/monthly reports sent to parents' },
              { problem: 'Teachers operate in silos', solution: 'Teacher portal with live status, assigned batches, and test management' },
              { problem: 'Parents keep calling for updates', solution: 'Student portal — parents check scores, attendance, fees anytime' },
              { problem: 'No way to promote courses', solution: 'Built-in poster generator with WhatsApp share + digital certificates' },
            ].map((item, i) => (
              <div key={i} className="ln-feature-card" style={{ borderLeft: '3px solid var(--accent)' }}>
                <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Problem</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{item.problem}</div>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Solution</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{item.solution}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="ln-section" id="features">
        <div className="ln-section-inner">
          <div className="ln-section-badge"><BookOpen size={14} /> Complete Platform</div>
          <h2 className="ln-section-title">Everything You Need to Run Your Coaching</h2>
          <p className="ln-section-sub">One portal. Every feature. No juggling multiple apps.</p>
          <div className="ln-features-grid">
            {[
              { icon: <Users size={24} />, title: 'Student Management', desc: 'Add students, assign to batches, track complete history. Parents get their own login.' },
              { icon: <GraduationCap size={24} />, title: 'Teacher Portal', desc: 'Teachers login separately. Manage their batches, mark attendance, create tests. Live online tracking.' },
              { icon: <Layers size={24} />, title: 'Batch & Module System', desc: 'Create batches with subjects, schedules. Add teaching modules with topics. Track completion.' },
              { icon: <CreditCard size={24} />, title: 'Fee Collection', desc: 'Record fees by month, track pending, send reminders. Complete payment history per student.' },
              { icon: <FileText size={24} />, title: 'Tests & Grading', desc: 'Create tests per batch/module. Enter marks, auto-calculate grades, rank students, track performance.' },
              { icon: <CheckSquare size={24} />, title: 'Attendance Tracking', desc: 'Mark Present/Absent/Late per batch per day. Monthly reports. Below 75% alerts.' },
              { icon: <BarChart3 size={24} />, title: 'Analytics Dashboard', desc: 'Student-wise and module-wise performance analytics. Identify weak areas instantly.' },
              { icon: <Award size={24} />, title: 'Digital Certificates', desc: 'Generate branded certificates for course completion. Download as image or print directly.' },
              { icon: <Megaphone size={24} />, title: 'Course Promotion', desc: 'Build WhatsApp-ready course posters with your coaching branding. Share in one tap.' },
              { icon: <Users size={24} />, title: 'Referral Program', desc: 'Start with 30 students. Refer other coaching institutes — each referral adds 20 more students.' },
              { icon: <Shield size={24} />, title: 'Student Notes', desc: 'Share module-wise study notes with students. They access it from their portal anytime.' },
              { icon: <Smartphone size={24} />, title: 'Works Everywhere', desc: 'Mobile-friendly. Works on any phone, tablet, or computer. No app download needed.' },
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

      {/* ─── HOW IT WORKS ─── */}
      <section className="ln-section" style={{ background: 'linear-gradient(180deg, transparent, rgba(16,185,129,.03), transparent)' }}>
        <div className="ln-section-inner">
          <div className="ln-section-badge"><Clock size={14} /> Get Started in 2 Minutes</div>
          <h2 className="ln-section-title">How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginTop: 32 }}>
            {[
              { step: '1', title: 'Register Free', desc: 'Enter your name, email, and institute name. Takes 30 seconds.' },
              { step: '2', title: 'Add Your Batches', desc: 'Create batches with subjects, schedule, and fee amount.' },
              { step: '3', title: 'Add Students & Teachers', desc: 'Add students and teachers. They get their own login instantly.' },
              { step: '4', title: 'Start Managing', desc: 'Track fees, mark attendance, create tests, generate reports. Done.' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '28px 20px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, margin: '0 auto 14px' }}>{s.step}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="ln-section" id="pricing">
        <div className="ln-section-inner" style={{ textAlign: 'center' }}>
          <div className="ln-section-badge"><IndianRupee size={14} /> Simple Pricing</div>
          <h2 className="ln-section-title">Start Free. Grow with Referrals.</h2>
          <p className="ln-section-sub">No hidden charges. No monthly fees. Just register and start.</p>

          <div style={{ display: 'inline-block', maxWidth: 420, width: '100%', textAlign: 'left', marginTop: 20 }}>
            <div className="ln-feature-card" style={{ borderTop: '3px solid var(--accent)', padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Free Plan</div>
                  <div style={{ fontSize: 36, fontWeight: 900, marginTop: 4 }}>₹0</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>forever</div>
                </div>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={28} style={{ color: 'var(--accent)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {[
                  '30 students included',
                  'Unlimited batches',
                  'Fee tracking & collection',
                  'Tests, grades, & analytics',
                  'Attendance tracking',
                  'Teacher portal with login',
                  'Student & parent portal',
                  'Digital certificates',
                  'Course poster generator',
                  'Referral: +20 students per referral',
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <CheckCircle size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button className="ln-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
                Register Free <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="ln-section">
        <div className="ln-section-inner">
          <div className="ln-section-badge"><Star size={14} /> Trusted by Coaching Owners</div>
          <h2 className="ln-section-title">What Coaching Owners Say</h2>
          <div className="ln-testimonials">
            {[
              { name: 'Rajesh Sharma', role: 'Sharma Classes, Bhopal', text: 'I was managing 150 students in a register. Now everything is digital — fees, attendance, tests. Parents love it. My workload dropped by half.' },
              { name: 'Priya Verma', role: 'Bright Minds Academy, Indore', text: 'The teacher portal is a game-changer. My 5 teachers each manage their own batches and I can see everything from my dashboard. Real-time live tracking!' },
              { name: 'Amit Patel', role: 'Excel Coaching, Raipur', text: 'The poster generator alone saved me thousands. I create course posters in 2 minutes and share on WhatsApp. Admissions increased 30%.' },
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

      {/* ─── SHAREABLE POSTER WITH QR CODE ─── */}
      <section className="ln-section" id="poster" style={{ background: 'linear-gradient(180deg, rgba(16,185,129,.03), transparent)' }}>
        <div className="ln-section-inner" style={{ textAlign: 'center' }}>
          <div className="ln-section-badge"><QrCode size={14} /> Spread the Word</div>
          <h2 className="ln-section-title">Share educourses with Other Coaching Owners</h2>
          <p className="ln-section-sub">Download this poster and share on WhatsApp groups, print it, or send it to coaching owners you know.</p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            <button className="ln-btn-primary ln-btn-lg" onClick={downloadPoster} disabled={posterDownloading}>
              <Download size={18} /> {posterDownloading ? 'Generating...' : 'Download Poster (PNG)'}
            </button>
            <button className="ln-btn-whatsapp ln-btn-lg" onClick={shareWhatsApp}>
              <Share2 size={18} /> Share on WhatsApp
            </button>
          </div>

          {/* ── HTML POSTER (capture target) ── */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div ref={posterRef} style={{
              width: 400, background: 'linear-gradient(180deg, #080d1a 0%, #0f172a 40%, #080d1a 100%)',
              borderRadius: 14, overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif",
              color: '#e2e8f0', textAlign: 'center', display: 'flex', flexDirection: 'column',
            }}>
              {/* Top accent */}
              <div style={{ height: 4, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />

              {/* Header */}
              <div style={{ padding: '24px 28px 18px' }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,.25), transparent 50%, rgba(0,0,0,.1))' }} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" style={{ position: 'relative', zIndex: 1 }}>
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-.02em' }}>edu<span style={{ color: '#10b981' }}>courses</span></div>
                    <div style={{ fontSize: 8, color: '#546580', letterSpacing: '.05em' }}>COACHING & COURSE MANAGEMENT</div>
                  </div>
                </div>

                {/* Headline */}
                <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, lineHeight: 1.2, marginBottom: 10 }}>
                  Digitize Your<br /><span style={{ color: '#10b981' }}>Coaching Institute</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 14 }}>
                  Complete management portal for coaching classes — students, fees, tests, attendance, teachers, certificates & more.
                </div>

                {/* FREE badge */}
                <div style={{ display: 'inline-block', padding: '8px 24px', borderRadius: 20, background: '#10b981', color: '#000', fontWeight: 800, fontSize: 14, marginBottom: 16, boxShadow: '0 4px 16px rgba(16,185,129,.3)' }}>
                  100% FREE — 30 Students Included
                </div>
              </div>

              {/* Features grid */}
              <div style={{ padding: '0 24px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'left' }}>
                  {[
                    { icon: '👨‍🎓', text: 'Student & Parent Portal' },
                    { icon: '👩‍🏫', text: 'Teacher Management' },
                    { icon: '💰', text: 'Fee Tracking' },
                    { icon: '📝', text: 'Tests & Grading' },
                    { icon: '✅', text: 'Attendance System' },
                    { icon: '📊', text: 'Performance Analytics' },
                    { icon: '🏆', text: 'Digital Certificates' },
                    { icon: '📱', text: 'WhatsApp Posters' },
                  ].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,.03)', fontSize: 11, fontWeight: 500 }}>
                      <span style={{ fontSize: 14 }}>{f.icon}</span> {f.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code section */}
              <div style={{ padding: '16px 28px', background: 'rgba(255,255,255,.03)', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Scan to Register</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <QRCode url={SITE_URL} size={100} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Register Now</div>
                    <div style={{ fontSize: 10, color: '#10b981', wordBreak: 'break-all' }}>{SITE_URL.replace('https://', '')}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>Free for coaching institutes</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>No credit card required</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div style={{ padding: '14px 28px' }}>
                <div style={{ padding: '12px', background: '#10b981', borderRadius: 20, fontWeight: 800, fontSize: 14, color: '#000' }}>
                  Register Free → {SITE_URL.replace('https://', '')}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '8px 20px 10px', borderTop: '1px solid rgba(16,185,129,.15)', background: 'rgba(255,255,255,.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 8 }}>
                <span style={{ color: '#546580' }}>Share with coaching owners you know!</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>educourses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="ln-cta-section">
        <div className="ln-section-inner">
          <h2>Your Coaching Deserves Better Than Registers & Excel Sheets</h2>
          <p>Join hundreds of coaching institutes already using educourses. It's free to start.</p>
          <div className="ln-cta-btns">
            <button className="ln-btn-primary ln-btn-lg" onClick={() => navigate('/login')}>
              <Zap size={20} /> Register Your Institute — Free
            </button>
            <button className="ln-btn-whatsapp ln-btn-lg" onClick={shareWhatsApp}>
              <Share2 size={20} /> Share with Coaching Owners
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
            <div><Phone size={14} /> +91 62658-46547</div>
          </div>
          <div className="ln-footer-bottom">
            <span>{SITE_URL.replace('https://', '')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
