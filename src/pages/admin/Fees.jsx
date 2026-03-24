import { useState, useEffect } from 'react';
import { coaching_getFees, coaching_collectFee, coaching_getBatches, coaching_getStudents } from '../../api/client';
import { fmt } from '../../utils/format';
const MN=()=>new Date().toISOString().slice(0,7);
export default function Fees(){
  const [fees,setFees]=useState([]);const [batches,setBatches]=useState([]);const [students,setStudents]=useState([]);
  const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({student_id:'',batch_id:'',month:MN(),amount:0,payMode:'Cash'});
  const [saving,setSaving]=useState(false);const [msg,setMsg]=useState(null);const [fMonth,setFMonth]=useState(MN());const [fBatch,setFBatch]=useState('');
  useEffect(()=>{Promise.all([coaching_getFees({month:MN()}),coaching_getBatches(),coaching_getStudents()]).then(([f,b,s])=>{setFees(f.fees||[]);setBatches(b.batches||[]);setStudents(s.students||[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function collect(){if(!form.student_id||!form.batch_id||!form.amount){setMsg({type:'error',text:'Fill all fields'});return;}setSaving(true);const stu=students.find(s=>s.id===form.student_id),bat=batches.find(b=>b.id===form.batch_id);try{await coaching_collectFee({...form,student_name:stu?.name||'',batch_name:bat?.name||''});const f=await coaching_getFees({month:fMonth});setFees(f.fees||[]);setShowForm(false);setMsg(null);}catch(e){setMsg({type:'error',text:e.message});}setSaving(false);}
  function reload(){setLoading(true);coaching_getFees({batch_id:fBatch,month:fMonth}).then(d=>{setFees(d.fees||[]);setLoading(false);}).catch(()=>setLoading(false));}
  if(loading)return<div className="loader"><div className="loader-ring"/></div>;
  const paid=fees.filter(f=>f.status==='Paid').reduce((a,f)=>a+(f.paid||0),0),pending=fees.filter(f=>f.status==='Pending').reduce((a,f)=>a+(f.amount||0),0);
  return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}><div><h2 style={{fontSize:'20px',fontWeight:700,margin:0}}>Fee Collection</h2><p style={{fontSize:'13px',color:'var(--muted)',margin:0}}>Collected: <span style={{color:'#10b981'}}>₹{fmt(paid)}</span> · Pending: <span style={{color:'#ef4444'}}>₹{fmt(pending)}</span></p></div><button className="form-btn primary" onClick={()=>setShowForm(s=>!s)}>+ Collect Fee</button></div>
    <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'16px',alignItems:'flex-end'}}><div><div style={{fontSize:'10px',color:'var(--muted)',marginBottom:'4px'}}>Month</div><input className="fi" type="month" value={fMonth} onChange={e=>setFMonth(e.target.value)} style={{width:'150px'}}/></div><div><div style={{fontSize:'10px',color:'var(--muted)',marginBottom:'4px'}}>Batch</div><select className="filter-select" value={fBatch} onChange={e=>setFBatch(e.target.value)}><option value="">All</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div><button className="form-btn ghost" onClick={reload} style={{fontSize:'12px'}}>Load</button></div>
    {showForm&&<div className="form-card"><div className="form-section-title">Collect Fee</div><div className="form-grid">
      <div className="fg"><label className="fl">Student</label><select className="fi" value={form.student_id} onChange={e=>setF('student_id',e.target.value)}><option value="">Select</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div className="fg"><label className="fl">Batch</label><select className="fi" value={form.batch_id} onChange={e=>{setF('batch_id',e.target.value);const b=batches.find(x=>x.id===e.target.value);if(b)setF('amount',b.fee_monthly);}}><option value="">Select</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name} (₹{fmt(b.fee_monthly)})</option>)}</select></div>
      <div className="fg"><label className="fl">Month</label><input className="fi" type="month" value={form.month} onChange={e=>setF('month',e.target.value)}/></div>
      <div className="fg"><label className="fl">Amount ₹</label><input className="fi" type="number" value={form.amount} onChange={e=>setF('amount',e.target.value)}/></div>
      <div className="fg"><label className="fl">Mode</label><select className="fi" value={form.payMode} onChange={e=>setF('payMode',e.target.value)}><option>Cash</option><option>UPI</option><option>Online</option></select></div>
    </div>{msg&&<div style={{marginTop:'10px',padding:'8px',borderRadius:'8px',fontSize:'12px',background:'rgba(239,68,68,.1)',color:'#fca5a5'}}>{msg.text}</div>}<div style={{display:'flex',gap:'8px',marginTop:'14px'}}><button className="form-btn primary" onClick={collect} disabled={saving}>{saving?'...':'Save'}</button><button className="form-btn secondary" onClick={()=>setShowForm(false)}>Cancel</button></div></div>}
    <div className="table-wrap"><div style={{overflowX:'auto'}}><table>
      <thead><tr><th>Student</th><th>Batch</th><th>Month</th><th style={{textAlign:'right'}}>Amount</th><th>Mode</th><th>Status</th></tr></thead>
      <tbody>{fees.length===0?<tr><td colSpan={6} style={{padding:'30px',textAlign:'center',color:'var(--muted)'}}>No records</td></tr>:fees.map((f,i)=><tr key={f.id||i}><td style={{fontWeight:500}}>{f.student_name}</td><td><span className="cbadge">{f.batch_name||'—'}</span></td><td style={{fontSize:'12px',color:'var(--muted)'}}>{f.month}</td><td style={{textAlign:'right',fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:f.status==='Paid'?'#10b981':'#ef4444'}}>₹{fmt(f.paid||f.amount)}</td><td style={{fontSize:'12px',color:'var(--muted)'}}>{f.payMode}</td><td><span style={{fontSize:'10px',padding:'2px 7px',borderRadius:'4px',background:f.status==='Paid'?'rgba(16,185,129,.12)':'rgba(239,68,68,.12)',color:f.status==='Paid'?'#10b981':'#ef4444'}}>{f.status}</span></td></tr>)}</tbody>
    </table></div></div>
  </div>);
}
