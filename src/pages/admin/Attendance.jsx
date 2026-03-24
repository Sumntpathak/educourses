import { useState, useEffect } from 'react';
import { coaching_getBatches, coaching_getStudents, coaching_getAttendance, coaching_markAttendance } from '../../api/client';
const TD=()=>new Date().toISOString().slice(0,10);
export default function Attendance(){
  const [batches,setBatches]=useState([]);const [students,setStudents]=useState([]);
  const [selBatch,setSelBatch]=useState('');const [date,setDate]=useState(TD());
  const [records,setRecords]=useState({});const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);const [msg,setMsg]=useState(null);
  useEffect(()=>{Promise.all([coaching_getBatches(),coaching_getStudents()]).then(([b,s])=>{setBatches(b.batches||[]);setStudents(s.students||[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
  async function load(bid,dt){if(!bid)return;const d=await coaching_getAttendance({batch_id:bid,date:dt});const r={};for(const a of(d.attendance||[]))r[a.student_id]=a.status;setRecords(r);}
  const bStu=students.filter(s=>(s.batches||[]).some(b=>b.id===selBatch));
  async function save(){if(!selBatch)return;setSaving(true);const recs=bStu.map(s=>({student_id:s.id,student_name:s.name,status:records[s.id]||'Present'}));try{await coaching_markAttendance({batch_id:selBatch,date,records:JSON.stringify(recs)});setMsg({type:'success',text:`Saved for ${recs.length} students`});setTimeout(()=>setMsg(null),3000);}catch(e){setMsg({type:'error',text:e.message});}setSaving(false);}
  if(loading)return<div className="loader"><div className="loader-ring"/></div>;
  const pc=Object.values(records).filter(v=>v==='Present').length,ac=Object.values(records).filter(v=>v==='Absent').length;
  return(<div>
    <h2 style={{fontSize:'20px',fontWeight:700,margin:'0 0 20px'}}>Attendance</h2>
    <div className="form-card">
      <div className="form-grid">
        <div className="fg"><label className="fl">Batch</label><select className="fi" value={selBatch} onChange={e=>{setSelBatch(e.target.value);load(e.target.value,date);}}><option value="">Select Batch</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
        <div className="fg"><label className="fl">Date</label><input className="fi" type="date" value={date} onChange={e=>{setDate(e.target.value);if(selBatch)load(selBatch,e.target.value);}}/></div>
      </div>
      {selBatch&&bStu.length>0&&<div style={{marginTop:'10px',fontSize:'12px',display:'flex',gap:'14px'}}><span style={{color:'#10b981'}}>Present: {pc}</span><span style={{color:'#ef4444'}}>Absent: {ac}</span><span style={{color:'var(--muted)'}}>Total: {bStu.length}</span></div>}
    </div>
    {selBatch&&bStu.length>0&&<div>
      <div className="table-wrap"><table>
        <thead><tr><th>#</th><th>Student</th><th style={{textAlign:'center'}}>Present</th><th style={{textAlign:'center'}}>Absent</th><th style={{textAlign:'center'}}>Late</th></tr></thead>
        <tbody>{bStu.map((s,i)=>{const st=records[s.id]||'Present';return<tr key={s.id} style={{background:st==='Absent'?'rgba(239,68,68,.03)':''}}>
          <td style={{color:'var(--muted)'}}>{i+1}</td><td style={{fontWeight:500}}>{s.name}</td>
          {['Present','Absent','Late'].map(v=><td key={v} style={{textAlign:'center'}}><input type="radio" name={`a-${s.id}`} checked={st===v} onChange={()=>setRecords(r=>({...r,[s.id]:v}))} style={{width:'18px',height:'18px',cursor:'pointer',accentColor:v==='Present'?'#10b981':v==='Absent'?'#ef4444':'#f59e0b'}}/></td>)}
        </tr>})}</tbody>
      </table></div>
      {msg&&<div style={{marginTop:'10px',padding:'8px 14px',borderRadius:'8px',fontSize:'12px',background:msg.type==='error'?'rgba(239,68,68,.1)':'rgba(16,185,129,.1)',color:msg.type==='error'?'#fca5a5':'#6ee7b7'}}>{msg.text}</div>}
      <div style={{padding:'14px'}}><button className="form-btn primary" onClick={save} disabled={saving} style={{padding:'12px 28px',fontSize:'14px'}}>{saving?'Saving...':'Save Attendance'}</button></div>
    </div>}
  </div>);
}
