import { useState, useEffect } from 'react';
import {
  coaching_getDashboard, coaching_getStudents, coaching_addStudent, coaching_updateStudent,
  coaching_getBatches, coaching_addBatch, coaching_updateBatch, coaching_assignStudents, coaching_assignFaculty,
  coaching_getFees, coaching_collectFee,
  coaching_getTests, coaching_addTest,
  coaching_getAttendance, coaching_markAttendance,
  coaching_getStudentPerformance,
  getStaff,
} from '../api/client';
import { fmt, fmtDate, CLS_LIST, getGrade } from '../utils/format';

const TODAY = () => new Date().toISOString().slice(0,10);
const MONTH_NOW = () => TODAY().slice(0,7);
const G = '#10b981'; // primary green

export default function CoachingDashboard() {
  const [tab, setTab] = useState('dashboard');
  const TABS = [
    { id:'dashboard', label:'Dashboard', icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
    { id:'students',  label:'Students',  icon:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
    { id:'batches',   label:'Batches',   icon:'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id:'fees',      label:'Fees',      icon:'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { id:'tests',     label:'Tests',     icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id:'attendance',label:'Attendance',icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id:'performance',label:'Performance',icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <div style={{display:'flex',gap:'0',minHeight:'calc(100vh - 60px)'}}>
      {/* Sidebar */}
      <div style={{width:'220px',flexShrink:0,background:'rgba(16,185,129,.03)',borderRight:'1px solid rgba(16,185,129,.1)',padding:'20px 12px'}}>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.1em',padding:'0 12px',marginBottom:'12px'}}>Navigation</div>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{width:'100%',display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',borderRadius:'10px',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'13px',fontWeight:tab===t.id?600:400,marginBottom:'2px',transition:'all .15s',textAlign:'left',
              background:tab===t.id?'linear-gradient(135deg,rgba(16,185,129,.15),rgba(16,185,129,.08))':'transparent',
              color:tab===t.id?'#6ee7b7':'rgba(255,255,255,.4)',
              borderLeft:tab===t.id?'3px solid #10b981':'3px solid transparent'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon}/></svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,padding:'24px',overflowY:'auto'}}>
        {tab === 'dashboard'   && <DashboardTab />}
        {tab === 'students'    && <StudentsTab />}
        {tab === 'batches'     && <BatchesTab />}
        {tab === 'fees'        && <FeesTab />}
        {tab === 'tests'       && <TestsTab />}
        {tab === 'attendance'  && <AttendanceTab />}
        {tab === 'performance' && <PerformanceTab />}
      </div>

      {/* Mobile: collapse sidebar */}
      <style>{`@media(max-width:768px){div[style*="width:220px"]{width:60px!important;padding:12px 6px!important}div[style*="width:220px"] button span,div[style*="width:220px"] button{font-size:0!important}div[style*="width:220px"] svg{margin:0 auto}div[style*="width:220px"] [style*="fontSize:'11px'"]{display:none}}`}</style>
    </div>
  );
}

// ── Shared Card component ──
function Card({children, accent, style}) {
  return <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'16px',padding:'20px',borderTop:`3px solid ${accent||G}`,transition:'transform .15s',...style}}
    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
    onMouseLeave={e=>e.currentTarget.style.transform=''}>{children}</div>;
}
function Stat({label,value,sub,color,icon}) {
  return <Card accent={color||G}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
      <div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'24px',fontWeight:800,color:color||G}}>{value}</div>
        <div style={{fontSize:'11px',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.07em',marginTop:'4px'}}>{label}</div>
        {sub && <div style={{fontSize:'11px',color:'var(--muted)',marginTop:'2px'}}>{sub}</div>}
      </div>
      {icon && <div style={{width:'40px',height:'40px',borderRadius:'12px',background:`${color||G}12`,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color||G} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
      </div>}
    </div>
  </Card>;
}
function SectionTitle({children,action}) {
  return <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
    <h3 style={{fontSize:'16px',fontWeight:700,color:'var(--text)',margin:0,display:'flex',alignItems:'center',gap:'8px'}}>
      <span style={{width:'4px',height:'20px',borderRadius:'2px',background:G,display:'inline-block'}}/>
      {children}
    </h3>
    {action}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { coaching_getDashboard().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }, []);
  if (loading) return <div className="loader"><div className="loader-ring"/></div>;
  if (!data) return <div className="empty">Could not load</div>;
  return (
    <div>
      <SectionTitle>Dashboard Overview</SectionTitle>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'16px',marginBottom:'28px'}}>
        <Stat label="Students" value={data.totalStudents} color="#06b6d4" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/>
        <Stat label="Batches" value={data.totalBatches} color="#8b5cf6" icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        <Stat label="Fee Collected" value={`₹${fmt(data.monthFeeCollected)}`} sub={data.month} color="#10b981" icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
        <Stat label="Fee Pending" value={`₹${fmt(data.monthFeePending)}`} sub={data.month} color="#ef4444" icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        <Stat label="Present Today" value={data.todayPresent} color="#f59e0b" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STUDENTS
// ═══════════════════════════════════════════════════════════════════
function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({name:'',father:'',mobile:'',gender:'',dob:'',address:''});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  useEffect(() => { coaching_getStudents().then(d=>{setStudents(d.students||[]);setLoading(false);}).catch(()=>setLoading(false)); }, []);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  async function save() {
    if (!form.name) { setMsg({type:'error',text:'Enter name'}); return; }
    setSaving(true);
    try { const r = await coaching_addStudent(form); setStudents(p=>[{...form,id:r.id,status:'Active',batches:[]},...p]); setShowForm(false); setForm({name:'',father:'',mobile:'',gender:'',dob:'',address:''}); setMsg(null); }
    catch(e) { setMsg({type:'error',text:e.message}); }
    setSaving(false);
  }
  const filtered = students.filter(s=>{const q=search.toLowerCase();return !q||s.name.toLowerCase().includes(q)||(s.father||'').toLowerCase().includes(q);});
  if (loading) return <div className="loader"><div className="loader-ring"/></div>;
  return (
    <div>
      <SectionTitle action={<button className="form-btn primary" onClick={()=>setShowForm(s=>!s)} style={{fontSize:'12px',padding:'8px 16px',background:G,borderRadius:'10px',border:'none',color:'#fff',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Add Student</button>}>Students ({filtered.length})</SectionTitle>
      <input className="search-box" placeholder="Search students..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:'16px',maxWidth:'360px'}}/>
      {showForm && (
        <Card accent={G} style={{marginBottom:'16px'}}>
          <div style={{fontWeight:600,fontSize:'14px',marginBottom:'14px',color:G}}>New Student</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">Name *</label><input className="fi" value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="Full name"/></div>
            <div className="fg"><label className="fl">Father</label><input className="fi" value={form.father} onChange={e=>setF('father',e.target.value)}/></div>
            <div className="fg"><label className="fl">Mobile</label><input className="fi" type="tel" value={form.mobile} onChange={e=>setF('mobile',e.target.value)}/></div>
            <div className="fg"><label className="fl">Gender</label><select className="fi" value={form.gender} onChange={e=>setF('gender',e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
          </div>
          {msg && <div style={{marginTop:'10px',padding:'8px',borderRadius:'8px',fontSize:'12px',background:'rgba(239,68,68,.1)',color:'#fca5a5'}}>{msg.text}</div>}
          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
            <button className="form-btn primary" onClick={save} disabled={saving} style={{background:G,border:'none',color:'#fff',padding:'8px 18px',borderRadius:'10px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{saving?'...':'Save'}</button>
            <button className="form-btn secondary" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </Card>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}}>
        {filtered.map((s,i) => (
          <Card key={s.id||i} accent={s.status==='Active'?G:'#6b7280'}>
            <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
              <div style={{width:'42px',height:'42px',borderRadius:'12px',background:`linear-gradient(135deg,${G},#059669)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:800,color:'#fff',flexShrink:0}}>
                {s.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:'14px'}}>{s.name}</div>
                <div style={{fontSize:'11px',color:'var(--muted)'}}>{s.father||'—'}{s.mobile?` · ${s.mobile}`:''}</div>
                <div style={{display:'flex',gap:'4px',marginTop:'4px',flexWrap:'wrap'}}>
                  {(s.batches||[]).map(b=><span key={b.id} style={{fontSize:'9px',padding:'2px 6px',borderRadius:'4px',background:'rgba(16,185,129,.12)',color:G,fontWeight:600}}>{b.name}</span>)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BATCHES
// ═══════════════════════════════════════════════════════════════════
function BatchesTab() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({name:'',subject:'',schedule:'',maxStudents:30,fee_monthly:0});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [assignBatch, setAssignBatch] = useState(null);
  const [sel, setSel] = useState([]);
  useEffect(() => {
    Promise.all([coaching_getBatches(), coaching_getStudents()])
      .then(([b,s])=>{setBatches(b.batches||[]);setStudents(s.students||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);
  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  async function save() {
    if (!form.name) { setMsg({type:'error',text:'Enter batch name'}); return; }
    setSaving(true);
    try { const r = await coaching_addBatch(form); setBatches(p=>[{...form,id:r.id,status:'Active',studentCount:0,faculty:[]},...p]); setShowForm(false); setMsg(null); }
    catch(e) { setMsg({type:'error',text:e.message}); }
    setSaving(false);
  }
  async function assign() {
    if (!assignBatch||!sel.length) return; setSaving(true);
    try { await coaching_assignStudents({batch_id:assignBatch.id,students:JSON.stringify(sel)}); const b=await coaching_getBatches(); setBatches(b.batches||[]); setAssignBatch(null); setSel([]); }
    catch(e) { setMsg({type:'error',text:e.message}); }
    setSaving(false);
  }
  if (loading) return <div className="loader"><div className="loader-ring"/></div>;
  return (
    <div>
      <SectionTitle action={<button onClick={()=>setShowForm(s=>!s)} style={{fontSize:'12px',padding:'8px 16px',background:G,borderRadius:'10px',border:'none',color:'#fff',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ New Batch</button>}>Batches ({batches.length})</SectionTitle>
      {showForm && (
        <Card accent="#8b5cf6" style={{marginBottom:'16px'}}>
          <div style={{fontWeight:600,fontSize:'14px',marginBottom:'14px',color:'#a78bfa'}}>New Batch</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">Name *</label><input className="fi" value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="e.g. JEE Batch A"/></div>
            <div className="fg"><label className="fl">Subject</label><input className="fi" value={form.subject} onChange={e=>setF('subject',e.target.value)}/></div>
            <div className="fg"><label className="fl">Schedule</label><input className="fi" value={form.schedule} onChange={e=>setF('schedule',e.target.value)} placeholder="Mon,Wed,Fri 6-8PM"/></div>
            <div className="fg"><label className="fl">Max Students</label><input className="fi" type="number" value={form.maxStudents} onChange={e=>setF('maxStudents',e.target.value)}/></div>
            <div className="fg"><label className="fl">Monthly Fee ₹</label><input className="fi" type="number" value={form.fee_monthly} onChange={e=>setF('fee_monthly',e.target.value)}/></div>
          </div>
          {msg && <div style={{marginTop:'10px',padding:'8px',borderRadius:'8px',fontSize:'12px',background:'rgba(239,68,68,.1)',color:'#fca5a5'}}>{msg.text}</div>}
          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
            <button onClick={save} disabled={saving} style={{background:'#8b5cf6',border:'none',color:'#fff',padding:'8px 18px',borderRadius:'10px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{saving?'...':'Create'}</button>
            <button className="form-btn secondary" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </Card>
      )}
      {assignBatch && (
        <Card accent={G} style={{marginBottom:'16px'}}>
          <div style={{fontWeight:600,marginBottom:'12px'}}>Assign to: <span style={{color:G}}>{assignBatch.name}</span></div>
          <div style={{maxHeight:'200px',overflowY:'auto',marginBottom:'12px'}}>
            {students.map(s=>(
              <label key={s.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px 0',cursor:'pointer',fontSize:'13px'}}>
                <input type="checkbox" checked={sel.includes(s.id)} onChange={e=>setSel(p=>e.target.checked?[...p,s.id]:p.filter(x=>x!==s.id))} style={{width:'16px',height:'16px'}}/>
                {s.name} <span style={{fontSize:'11px',color:'var(--muted)'}}>{s.father||''}</span>
              </label>
            ))}
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={assign} disabled={saving||!sel.length} style={{background:G,border:'none',color:'#fff',padding:'8px 18px',borderRadius:'10px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{saving?'...':'Assign'}</button>
            <button className="form-btn secondary" onClick={()=>{setAssignBatch(null);setSel([]);}}>Cancel</button>
          </div>
        </Card>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'14px'}}>
        {batches.map(b=>(
          <Card key={b.id} accent="#8b5cf6">
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'12px'}}>
              <div>
                <div style={{fontSize:'16px',fontWeight:700}}>{b.name}</div>
                <div style={{fontSize:'12px',color:'var(--muted)',marginTop:'2px'}}>{b.subject||'—'} · {b.schedule||'—'}</div>
              </div>
              <div style={{fontSize:'11px',padding:'4px 10px',borderRadius:'8px',background:'rgba(139,92,246,.12)',color:'#a78bfa',fontWeight:700,height:'fit-content'}}>{b.studentCount}/{b.maxStudents}</div>
            </div>
            <div style={{display:'flex',gap:'8px',fontSize:'12px',color:'var(--muted)',marginBottom:'12px'}}>
              <span>₹{fmt(b.fee_monthly)}/mo</span>
              {(b.faculty||[]).length>0 && <span>· {b.faculty.map(f=>f.faculty_name).join(', ')}</span>}
            </div>
            <button onClick={()=>{setAssignBatch(b);setSel([]);}} style={{padding:'6px 14px',borderRadius:'8px',border:'1px solid rgba(16,185,129,.3)',background:'rgba(16,185,129,.06)',color:G,fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Students</button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FEES
// ═══════════════════════════════════════════════════════════════════
function FeesTab() {
  const [fees,setFees]=useState([]); const [batches,setBatches]=useState([]); const [students,setStudents]=useState([]);
  const [loading,setLoading]=useState(true); const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({student_id:'',batch_id:'',month:MONTH_NOW(),amount:0,payMode:'Cash'});
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState(null);
  const [fMonth,setFMonth]=useState(MONTH_NOW()); const [fBatch,setFBatch]=useState('');
  useEffect(()=>{Promise.all([coaching_getFees({month:MONTH_NOW()}),coaching_getBatches(),coaching_getStudents()]).then(([f,b,s])=>{setFees(f.fees||[]);setBatches(b.batches||[]);setStudents(s.students||[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function collect(){
    if(!form.student_id||!form.batch_id||!form.amount){setMsg({type:'error',text:'Fill all fields'});return;}
    setSaving(true);
    const stu=students.find(s=>s.id===form.student_id), bat=batches.find(b=>b.id===form.batch_id);
    try{await coaching_collectFee({...form,student_name:stu?.name||'',batch_name:bat?.name||''});const f=await coaching_getFees({month:fMonth});setFees(f.fees||[]);setShowForm(false);setMsg(null);}
    catch(e){setMsg({type:'error',text:e.message});}setSaving(false);
  }
  async function reload(){setLoading(true);coaching_getFees({batch_id:fBatch,month:fMonth}).then(d=>{setFees(d.fees||[]);setLoading(false);}).catch(()=>setLoading(false));}
  if(loading) return <div className="loader"><div className="loader-ring"/></div>;
  const paid=fees.filter(f=>f.status==='Paid').reduce((a,f)=>a+(f.paid||0),0);
  const pending=fees.filter(f=>f.status==='Pending').reduce((a,f)=>a+(f.amount||0),0);
  return(
    <div>
      <SectionTitle action={<button onClick={()=>setShowForm(s=>!s)} style={{fontSize:'12px',padding:'8px 16px',background:G,borderRadius:'10px',border:'none',color:'#fff',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ Collect Fee</button>}>Fees</SectionTitle>
      <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'16px',alignItems:'flex-end'}}>
        <div><div style={{fontSize:'10px',color:'var(--muted)',marginBottom:'4px'}}>Month</div><input className="fi" type="month" value={fMonth} onChange={e=>setFMonth(e.target.value)} style={{width:'150px'}}/></div>
        <div><div style={{fontSize:'10px',color:'var(--muted)',marginBottom:'4px'}}>Batch</div><select className="filter-select" value={fBatch} onChange={e=>setFBatch(e.target.value)}><option value="">All</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
        <button className="form-btn ghost" onClick={reload} style={{fontSize:'12px'}}>Load</button>
        <div style={{marginLeft:'auto',display:'flex',gap:'16px',fontSize:'13px'}}>
          <span style={{color:G}}>Collected: ₹{fmt(paid)}</span>
          <span style={{color:'#ef4444'}}>Pending: ₹{fmt(pending)}</span>
        </div>
      </div>
      {showForm && (
        <Card accent={G} style={{marginBottom:'16px'}}>
          <div style={{fontWeight:600,fontSize:'14px',marginBottom:'14px',color:G}}>Collect Fee</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">Student</label><select className="fi" value={form.student_id} onChange={e=>setF('student_id',e.target.value)}><option value="">Select</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="fg"><label className="fl">Batch</label><select className="fi" value={form.batch_id} onChange={e=>{setF('batch_id',e.target.value);const b=batches.find(x=>x.id===e.target.value);if(b)setF('amount',b.fee_monthly);}}><option value="">Select</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name} (₹{fmt(b.fee_monthly)})</option>)}</select></div>
            <div className="fg"><label className="fl">Month</label><input className="fi" type="month" value={form.month} onChange={e=>setF('month',e.target.value)}/></div>
            <div className="fg"><label className="fl">Amount ₹</label><input className="fi" type="number" value={form.amount} onChange={e=>setF('amount',e.target.value)}/></div>
            <div className="fg"><label className="fl">Mode</label><select className="fi" value={form.payMode} onChange={e=>setF('payMode',e.target.value)}><option>Cash</option><option>UPI</option><option>Online</option></select></div>
          </div>
          {msg && <div style={{marginTop:'10px',padding:'8px',borderRadius:'8px',fontSize:'12px',background:'rgba(239,68,68,.1)',color:'#fca5a5'}}>{msg.text}</div>}
          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
            <button onClick={collect} disabled={saving} style={{background:G,border:'none',color:'#fff',padding:'8px 18px',borderRadius:'10px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{saving?'...':'Save'}</button>
            <button className="form-btn secondary" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </Card>
      )}
      <div className="table-wrap"><div style={{overflowX:'auto'}}><table>
        <thead><tr><th>Student</th><th>Batch</th><th>Month</th><th style={{textAlign:'right'}}>Amount</th><th>Mode</th><th>Status</th></tr></thead>
        <tbody>{fees.length===0?<tr><td colSpan={6} style={{padding:'30px',textAlign:'center',color:'var(--muted)'}}>No records</td></tr>:
          fees.map((f,i)=><tr key={f.id||i}><td style={{fontWeight:500}}>{f.student_name}</td><td><span className="cbadge">{f.batch_name||'—'}</span></td><td style={{fontSize:'12px',color:'var(--muted)'}}>{f.month}</td><td style={{textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:f.status==='Paid'?G:'#ef4444'}}>₹{fmt(f.paid||f.amount)}</td><td style={{fontSize:'12px',color:'var(--muted)'}}>{f.payMode}</td><td><span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'4px',background:f.status==='Paid'?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)',color:f.status==='Paid'?G:'#ef4444'}}>{f.status}</span></td></tr>)
        }</tbody>
      </table></div></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════
function TestsTab() {
  const [tests,setTests]=useState([]); const [batches,setBatches]=useState([]); const [students,setStudents]=useState([]);
  const [loading,setLoading]=useState(true); const [showForm,setShowForm]=useState(false);
  const [selBatch,setSelBatch]=useState(''); const [form,setForm]=useState({testName:'',subject:'',maxMarks:100,type:'weekly',date:TODAY()});
  const [batchStu,setBatchStu]=useState([]); const [marks,setMarks]=useState({}); const [absent,setAbsent]=useState({});
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState(null);
  useEffect(()=>{Promise.all([coaching_getTests(),coaching_getBatches(),coaching_getStudents()]).then(([t,b,s])=>{setTests(t.tests||[]);setBatches(b.batches||[]);setStudents(s.students||[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
  function onBatch(bid){setSelBatch(bid);setBatchStu(students.filter(s=>(s.batches||[]).some(b=>b.id===bid)));setMarks({});setAbsent({});}
  async function saveTest(){
    if(!form.testName||!selBatch){setMsg({type:'error',text:'Fill test name & batch'});return;}setSaving(true);
    const bat=batches.find(b=>b.id===selBatch);
    const scores=batchStu.map(s=>({student_id:s.id,student_name:s.name,obtained:absent[s.id]?0:(parseFloat(marks[s.id])||0),absent:!!absent[s.id]}));
    try{await coaching_addTest({...form,batch_id:selBatch,batch_name:bat?.name||'',scores:JSON.stringify(scores)});const t=await coaching_getTests();setTests(t.tests||[]);setShowForm(false);setMsg(null);}
    catch(e){setMsg({type:'error',text:e.message});}setSaving(false);
  }
  if(loading) return <div className="loader"><div className="loader-ring"/></div>;
  return(
    <div>
      <SectionTitle action={<button onClick={()=>setShowForm(s=>!s)} style={{fontSize:'12px',padding:'8px 16px',background:'#8b5cf6',borderRadius:'10px',border:'none',color:'#fff',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>+ New Test</button>}>Tests & Scores ({tests.length})</SectionTitle>
      {showForm && (
        <Card accent="#8b5cf6" style={{marginBottom:'16px'}}>
          <div style={{fontWeight:600,fontSize:'14px',marginBottom:'14px',color:'#a78bfa'}}>New Test</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">Batch *</label><select className="fi" value={selBatch} onChange={e=>onBatch(e.target.value)}><option value="">Select</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div className="fg"><label className="fl">Test Name *</label><input className="fi" value={form.testName} onChange={e=>setForm(f=>({...f,testName:e.target.value}))} placeholder="e.g. Weekly 3"/></div>
            <div className="fg"><label className="fl">Subject</label><input className="fi" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Max Marks</label><input className="fi" type="number" value={form.maxMarks} onChange={e=>setForm(f=>({...f,maxMarks:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Type</label><select className="fi" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="mock">Mock</option></select></div>
            <div className="fg"><label className="fl">Date</label><input className="fi" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
          </div>
          {batchStu.length>0 && (
            <div style={{marginTop:'14px'}}>
              <div style={{fontWeight:600,fontSize:'13px',marginBottom:'8px'}}>Scores — {batchStu.length} students</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                <thead><tr style={{background:'var(--subtle)'}}><th style={{padding:'8px',textAlign:'left'}}>#</th><th style={{padding:'8px',textAlign:'left'}}>Student</th><th style={{padding:'8px',textAlign:'center'}}>Marks (/{form.maxMarks})</th><th style={{padding:'8px',textAlign:'center'}}>AB</th></tr></thead>
                <tbody>{batchStu.map((s,i)=>{const isAb=!!absent[s.id];return(
                  <tr key={s.id} style={{borderTop:'1px solid var(--border)',opacity:isAb?.5:1}}>
                    <td style={{padding:'8px',color:'var(--muted)'}}>{i+1}</td><td style={{padding:'8px',fontWeight:500}}>{s.name}</td>
                    <td style={{padding:'8px',textAlign:'center'}}><input type="number" min={0} max={form.maxMarks} value={isAb?'':marks[s.id]??''} disabled={isAb} onChange={e=>{setMarks(m=>({...m,[s.id]:e.target.value}));setAbsent(a=>({...a,[s.id]:false}));}} style={{width:'70px',textAlign:'center',padding:'6px',background:'var(--subtle)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontSize:'13px'}}/></td>
                    <td style={{padding:'8px',textAlign:'center'}}><input type="checkbox" checked={isAb} onChange={()=>{setAbsent(a=>({...a,[s.id]:!a[s.id]}));if(!absent[s.id])setMarks(m=>({...m,[s.id]:''}));}} style={{width:'16px',height:'16px',cursor:'pointer'}}/></td>
                  </tr>);})}</tbody>
              </table>
            </div>
          )}
          {msg && <div style={{marginTop:'10px',padding:'8px',borderRadius:'8px',fontSize:'12px',background:'rgba(239,68,68,.1)',color:'#fca5a5'}}>{msg.text}</div>}
          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
            <button onClick={saveTest} disabled={saving} style={{background:'#8b5cf6',border:'none',color:'#fff',padding:'8px 18px',borderRadius:'10px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>{saving?'...':'Save Test'}</button>
            <button className="form-btn secondary" onClick={()=>setShowForm(false)}>Cancel</button>
          </div>
        </Card>
      )}
      {tests.map((t,ti)=>{
        const valid=(t.scores||[]).filter(s=>!s.absent&&s.obtained!=null);
        const avg=valid.length?(valid.reduce((a,s)=>a+s.obtained,0)/valid.length).toFixed(1):'—';
        return(
          <details key={t.id||ti} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'14px',marginBottom:'10px',overflow:'hidden'}}>
            <summary style={{padding:'14px 18px',cursor:'pointer',listStyle:'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div><span style={{fontSize:'14px',fontWeight:600}}>{t.testName}</span><span className="cbadge" style={{marginLeft:'8px'}}>{t.batch_name||'—'}</span><span style={{fontSize:'11px',color:'var(--muted)',marginLeft:'8px'}}>{t.subject} · {fmtDate(t.date)} · Max {t.maxMarks}</span></div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",color:G}}>Avg: {avg}</span>
            </summary>
            <div style={{padding:'0 18px 14px'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
              <thead><tr style={{background:'var(--subtle)'}}><th style={{padding:'6px 8px',textAlign:'left'}}>#</th><th style={{padding:'6px 8px',textAlign:'left'}}>Student</th><th style={{padding:'6px 8px',textAlign:'center'}}>Marks</th><th style={{padding:'6px 8px',textAlign:'center'}}>%</th><th style={{padding:'6px 8px',textAlign:'center'}}>Grade</th></tr></thead>
              <tbody>{[...(t.scores||[])].sort((a,b)=>(b.obtained||0)-(a.obtained||0)).map((sc,i)=>{const p=!sc.absent&&sc.obtained!=null?((sc.obtained/t.maxMarks)*100).toFixed(0):null;const g=getGrade(sc.absent?null:sc.obtained,t.maxMarks);return<tr key={i} style={{borderTop:'1px solid var(--border)'}}><td style={{padding:'6px 8px',color:'var(--muted)'}}>{i+1}</td><td style={{padding:'6px 8px',fontWeight:500}}>{sc.student_name}</td><td style={{padding:'6px 8px',textAlign:'center',fontFamily:"'JetBrains Mono',monospace",color:sc.absent?'var(--muted)':parseFloat(p)>=60?G:'#ef4444'}}>{sc.absent?'AB':`${sc.obtained}/${t.maxMarks}`}</td><td style={{padding:'6px 8px',textAlign:'center',color:'var(--muted)'}}>{p?p+'%':'—'}</td><td style={{padding:'6px 8px',textAlign:'center'}}><span className={`grade-pill grade-${g}`}>{g}</span></td></tr>;})}</tbody>
            </table></div>
          </details>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════════
function AttendanceTab() {
  const [batches,setBatches]=useState([]); const [students,setStudents]=useState([]);
  const [selBatch,setSelBatch]=useState(''); const [date,setDate]=useState(TODAY());
  const [records,setRecords]=useState({}); const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState(null);
  useEffect(()=>{Promise.all([coaching_getBatches(),coaching_getStudents()]).then(([b,s])=>{setBatches(b.batches||[]);setStudents(s.students||[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
  async function load(bid,dt){if(!bid)return;const d=await coaching_getAttendance({batch_id:bid,date:dt});const r={};for(const a of(d.attendance||[]))r[a.student_id]=a.status;setRecords(r);}
  const bStu=students.filter(s=>(s.batches||[]).some(b=>b.id===selBatch));
  async function save(){if(!selBatch)return;setSaving(true);const recs=bStu.map(s=>({student_id:s.id,student_name:s.name,status:records[s.id]||'Present'}));try{await coaching_markAttendance({batch_id:selBatch,date,records:JSON.stringify(recs)});setMsg({type:'success',text:`Saved for ${recs.length} students`});setTimeout(()=>setMsg(null),3000);}catch(e){setMsg({type:'error',text:e.message});}setSaving(false);}
  if(loading) return <div className="loader"><div className="loader-ring"/></div>;
  const pc=Object.values(records).filter(v=>v==='Present').length, ac=Object.values(records).filter(v=>v==='Absent').length;
  return(
    <div>
      <SectionTitle>Live Attendance</SectionTitle>
      <Card accent="#f59e0b" style={{marginBottom:'16px'}}>
        <div className="form-grid">
          <div className="fg"><label className="fl">Batch</label><select className="fi" value={selBatch} onChange={e=>{setSelBatch(e.target.value);load(e.target.value,date);}}><option value="">Select</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div className="fg"><label className="fl">Date</label><input className="fi" type="date" value={date} onChange={e=>{setDate(e.target.value);if(selBatch)load(selBatch,e.target.value);}}/></div>
        </div>
        {selBatch && bStu.length>0 && <div style={{marginTop:'8px',fontSize:'12px',display:'flex',gap:'16px'}}><span style={{color:G}}>Present: {pc}</span><span style={{color:'#ef4444'}}>Absent: {ac}</span><span style={{color:'var(--muted)'}}>Total: {bStu.length}</span></div>}
      </Card>
      {selBatch && bStu.length>0 && (
        <div>
          <div className="table-wrap"><table>
            <thead><tr><th>#</th><th>Student</th><th style={{textAlign:'center'}}>Present</th><th style={{textAlign:'center'}}>Absent</th><th style={{textAlign:'center'}}>Late</th></tr></thead>
            <tbody>{bStu.map((s,i)=>{const st=records[s.id]||'Present';return(
              <tr key={s.id} style={{background:st==='Absent'?'rgba(239,68,68,.03)':st==='Late'?'rgba(245,158,11,.03)':''}}>
                <td style={{color:'var(--muted)'}}>{i+1}</td><td style={{fontWeight:500}}>{s.name}</td>
                {['Present','Absent','Late'].map(v=><td key={v} style={{textAlign:'center'}}><input type="radio" name={`a-${s.id}`} checked={st===v} onChange={()=>setRecords(r=>({...r,[s.id]:v}))} style={{width:'18px',height:'18px',cursor:'pointer',accentColor:v==='Present'?G:v==='Absent'?'#ef4444':'#f59e0b'}}/></td>)}
              </tr>);})}</tbody>
          </table></div>
          {msg && <div style={{marginTop:'10px',padding:'8px 14px',borderRadius:'8px',fontSize:'12px',background:msg.type==='error'?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)',color:msg.type==='error'?'#fca5a5':'#6ee7b7'}}>{msg.text}</div>}
          <div style={{padding:'14px'}}><button onClick={save} disabled={saving} style={{background:G,border:'none',color:'#fff',padding:'10px 24px',borderRadius:'10px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',fontSize:'14px'}}>{saving?'...':'Save Attendance'}</button></div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE
// ═══════════════════════════════════════════════════════════════════
function PerformanceTab() {
  const [students,setStudents]=useState([]); const [loading,setLoading]=useState(true);
  const [sel,setSel]=useState(''); const [perf,setPerf]=useState(null); const [lp,setLp]=useState(false);
  useEffect(()=>{coaching_getStudents().then(d=>{setStudents(d.students||[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
  async function load(sid){setSel(sid);if(!sid){setPerf(null);return;}setLp(true);try{setPerf(await coaching_getStudentPerformance({student_id:sid}));}catch{setPerf(null);}setLp(false);}
  if(loading) return <div className="loader"><div className="loader-ring"/></div>;
  return(
    <div>
      <SectionTitle>Student Performance</SectionTitle>
      <Card accent="#06b6d4" style={{marginBottom:'16px'}}>
        <label className="fl">Select Student</label>
        <select className="fi" value={sel} onChange={e=>load(e.target.value)}><option value="">— Choose —</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} {s.father?`(${s.father})`:''}</option>)}</select>
      </Card>
      {lp && <div className="loader"><div className="loader-ring"/></div>}
      {perf && perf.student && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'14px',marginBottom:'20px'}}>
            <Stat label="Attendance" value={`${perf.attendance.percentage}%`} sub={`${perf.attendance.present}/${perf.attendance.total}`} color="#06b6d4" icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            <Stat label="Test Average" value={`${perf.testAvg}%`} sub={`${perf.scores.length} tests`} color="#8b5cf6" icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <Stat label="Fee Paid" value={`₹${fmt(perf.feeSummary.totalPaid)}`} color={G} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2"/>
            <Stat label="Fee Pending" value={`₹${fmt(perf.feeSummary.totalPending)}`} color={perf.feeSummary.totalPending>0?'#ef4444':G} icon="M12 8v4m0 4h.01"/>
          </div>
          {perf.scores.length>0 && (
            <Card style={{marginBottom:'16px'}}>
              <div style={{fontWeight:600,marginBottom:'12px'}}>Test Scores</div>
              <div className="table-wrap"><table>
                <thead><tr><th>Date</th><th>Test</th><th>Subject</th><th style={{textAlign:'center'}}>Marks</th><th style={{textAlign:'center'}}>Grade</th></tr></thead>
                <tbody>{perf.scores.map((s,i)=>{const g=getGrade(s.absent?null:s.obtained,s.maxMarks);return<tr key={i}><td style={{fontSize:'11px',color:'var(--muted)'}}>{fmtDate(s.date)}</td><td style={{fontWeight:500}}>{s.testName}</td><td style={{color:'var(--muted)'}}>{s.subject||'—'}</td><td style={{textAlign:'center',fontFamily:"'JetBrains Mono',monospace",color:s.absent?'var(--muted)':G}}>{s.absent?'AB':`${s.obtained}/${s.maxMarks}`}</td><td style={{textAlign:'center'}}><span className={`grade-pill grade-${g}`}>{g}</span></td></tr>;})}</tbody>
              </table></div>
            </Card>
          )}
          {perf.fees.length>0 && (
            <Card>
              <div style={{fontWeight:600,marginBottom:'12px'}}>Fee History</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                {perf.fees.map((f,i)=><div key={i} style={{padding:'10px 16px',borderRadius:'10px',background:f.status==='Paid'?'rgba(16,185,129,.06)':'rgba(239,68,68,.06)',border:`1px solid ${f.status==='Paid'?'rgba(16,185,129,.15)':'rgba(239,68,68,.15)'}`,minWidth:'100px'}}>
                  <div style={{fontSize:'11px',color:'var(--muted)'}}>{f.month}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'14px',fontWeight:700,color:f.status==='Paid'?G:'#ef4444'}}>₹{fmt(f.paid||f.amount)}</div>
                  <div style={{fontSize:'9px',fontWeight:600,color:f.status==='Paid'?G:'#ef4444'}}>{f.status}</div>
                </div>)}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
