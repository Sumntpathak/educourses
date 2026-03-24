import { useState, useEffect } from 'react';
import { coaching_getStudents, coaching_addStudent } from '../../api/client';
import { fmt, fmtDate } from '../../utils/format';

export default function Students() {
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
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <div><h2 style={{fontSize:'20px',fontWeight:700,margin:0}}>Students</h2><p style={{fontSize:'13px',color:'var(--muted)',margin:0}}>{filtered.length} student(s)</p></div>
        <button className="form-btn primary" onClick={()=>setShowForm(s=>!s)}>+ Add Student</button>
      </div>
      <input className="search-box" placeholder="Search students..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:'16px',maxWidth:'360px'}}/>
      {showForm && (
        <div className="form-card">
          <div className="form-section-title">New Student</div>
          <div className="form-grid">
            <div className="fg"><label className="fl">Name *</label><input className="fi" value={form.name} onChange={e=>setF('name',e.target.value)}/></div>
            <div className="fg"><label className="fl">Father</label><input className="fi" value={form.father} onChange={e=>setF('father',e.target.value)}/></div>
            <div className="fg"><label className="fl">Mobile</label><input className="fi" type="tel" value={form.mobile} onChange={e=>setF('mobile',e.target.value)}/></div>
            <div className="fg"><label className="fl">Gender</label><select className="fi" value={form.gender} onChange={e=>setF('gender',e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
            <div className="fg"><label className="fl">DOB</label><input className="fi" type="date" value={form.dob} onChange={e=>setF('dob',e.target.value)}/></div>
            <div className="fg"><label className="fl">Address</label><input className="fi" value={form.address} onChange={e=>setF('address',e.target.value)}/></div>
          </div>
          {msg && <div style={{marginTop:'10px',padding:'8px',borderRadius:'8px',fontSize:'12px',background:'rgba(239,68,68,.1)',color:'#fca5a5'}}>{msg.text}</div>}
          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}><button className="form-btn primary" onClick={save} disabled={saving}>{saving?'...':'Save'}</button><button className="form-btn secondary" onClick={()=>setShowForm(false)}>Cancel</button></div>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'12px'}}>
        {filtered.map((s,i) => (
          <div key={s.id||i} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'14px',padding:'16px',borderLeft:`3px solid ${s.status==='Active'?'#10b981':'#6b7280'}`,transition:'transform .15s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e=>e.currentTarget.style.transform=''}>
            <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
              <div style={{width:'42px',height:'42px',borderRadius:'12px',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:800,color:'#fff',flexShrink:0}}>{s.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
              <div><div style={{fontWeight:600,fontSize:'14px'}}>{s.name}</div><div style={{fontSize:'11px',color:'var(--muted)'}}>{s.father||'—'}{s.mobile?` · ${s.mobile}`:''}</div>
                <div style={{display:'flex',gap:'4px',marginTop:'4px'}}>{(s.batches||[]).map(b=><span key={b.id} className="cbadge">{b.name}</span>)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
