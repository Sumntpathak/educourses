import { useState, useEffect } from 'react';
import { coaching_getTests, coaching_addTest, coaching_getBatches, coaching_getStudents } from '../../api/client';
import { fmt, fmtDate, getGrade } from '../../utils/format';
const TD=()=>new Date().toISOString().slice(0,10);
export default function Tests(){
  const [tests,setTests]=useState([]);const [batches,setBatches]=useState([]);const [students,setStudents]=useState([]);
  const [loading,setLoading]=useState(true);const [showForm,setShowForm]=useState(false);
  const [selBatch,setSelBatch]=useState('');const [form,setForm]=useState({testName:'',subject:'',maxMarks:100,type:'weekly',date:TD()});
  const [batchStu,setBatchStu]=useState([]);const [marks,setMarks]=useState({});const [absent,setAbsent]=useState({});
  const [saving,setSaving]=useState(false);const [msg,setMsg]=useState(null);
  useEffect(()=>{Promise.all([coaching_getTests(),coaching_getBatches(),coaching_getStudents()]).then(([t,b,s])=>{setTests(t.tests||[]);setBatches(b.batches||[]);setStudents(s.students||[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
  function onBatch(bid){setSelBatch(bid);setBatchStu(students.filter(s=>(s.batches||[]).some(b=>b.id===bid)));setMarks({});setAbsent({});}
  async function saveTest(){if(!form.testName||!selBatch){setMsg({type:'error',text:'Fill test name & batch'});return;}setSaving(true);const bat=batches.find(b=>b.id===selBatch);const scores=batchStu.map(s=>({student_id:s.id,student_name:s.name,obtained:absent[s.id]?0:(parseFloat(marks[s.id])||0),absent:!!absent[s.id]}));try{await coaching_addTest({...form,batch_id:selBatch,batch_name:bat?.name||'',scores:JSON.stringify(scores)});const t=await coaching_getTests();setTests(t.tests||[]);setShowForm(false);setMsg(null);}catch(e){setMsg({type:'error',text:e.message});}setSaving(false);}
  if(loading)return<div className="loader"><div className="loader-ring"/></div>;
  return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}><div><h2 style={{fontSize:'20px',fontWeight:700,margin:0}}>Tests & Scores</h2><p style={{fontSize:'13px',color:'var(--muted)',margin:0}}>{tests.length} test(s)</p></div><button className="form-btn primary" onClick={()=>setShowForm(s=>!s)}>+ New Test</button></div>
    {showForm&&<div className="form-card"><div className="form-section-title">New Test</div><div className="form-grid">
      <div className="fg"><label className="fl">Batch *</label><select className="fi" value={selBatch} onChange={e=>onBatch(e.target.value)}><option value="">Select</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
      <div className="fg"><label className="fl">Test Name *</label><input className="fi" value={form.testName} onChange={e=>setForm(f=>({...f,testName:e.target.value}))}/></div>
      <div className="fg"><label className="fl">Subject</label><input className="fi" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/></div>
      <div className="fg"><label className="fl">Max Marks</label><input className="fi" type="number" value={form.maxMarks} onChange={e=>setForm(f=>({...f,maxMarks:e.target.value}))}/></div>
      <div className="fg"><label className="fl">Type</label><select className="fi" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="mock">Mock</option></select></div>
      <div className="fg"><label className="fl">Date</label><input className="fi" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
    </div>
    {batchStu.length>0&&<div style={{marginTop:'14px'}}><div style={{fontWeight:600,marginBottom:'8px'}}>{batchStu.length} students</div><table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}><thead><tr style={{background:'var(--subtle)'}}><th style={{padding:'8px'}}>#</th><th style={{padding:'8px'}}>Student</th><th style={{padding:'8px',textAlign:'center'}}>Marks (/{form.maxMarks})</th><th style={{padding:'8px',textAlign:'center'}}>Absent</th></tr></thead>
    <tbody>{batchStu.map((s,i)=>{const isAb=!!absent[s.id];return<tr key={s.id} style={{borderTop:'1px solid var(--border)',opacity:isAb?.5:1}}><td style={{padding:'8px',color:'var(--muted)'}}>{i+1}</td><td style={{padding:'8px',fontWeight:500}}>{s.name}</td><td style={{padding:'8px',textAlign:'center'}}><input type="number" min={0} max={form.maxMarks} value={isAb?'':marks[s.id]??''} disabled={isAb} onChange={e=>{setMarks(m=>({...m,[s.id]:e.target.value}));setAbsent(a=>({...a,[s.id]:false}));}} style={{width:'70px',textAlign:'center',padding:'6px',background:'var(--subtle)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text)',fontSize:'13px'}}/></td><td style={{padding:'8px',textAlign:'center'}}><input type="checkbox" checked={isAb} onChange={()=>{setAbsent(a=>({...a,[s.id]:!a[s.id]}));if(!absent[s.id])setMarks(m=>({...m,[s.id]:''}));}} style={{width:'16px',height:'16px',cursor:'pointer'}}/></td></tr>})}</tbody></table></div>}
    {msg&&<div style={{marginTop:'10px',padding:'8px',borderRadius:'8px',fontSize:'12px',background:'rgba(239,68,68,.1)',color:'#fca5a5'}}>{msg.text}</div>}<div style={{display:'flex',gap:'8px',marginTop:'14px'}}><button className="form-btn primary" onClick={saveTest} disabled={saving}>{saving?'...':'Save Test'}</button><button className="form-btn secondary" onClick={()=>setShowForm(false)}>Cancel</button></div></div>}
    {tests.map((t,ti)=>{const valid=(t.scores||[]).filter(s=>!s.absent&&s.obtained!=null);const avg=valid.length?(valid.reduce((a,s)=>a+s.obtained,0)/valid.length).toFixed(1):'—';const top=[...valid].sort((a,b)=>(b.obtained||0)-(a.obtained||0))[0];
    return<details key={t.id||ti} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'14px',marginBottom:'10px',overflow:'hidden'}}><summary style={{padding:'14px 18px',cursor:'pointer',listStyle:'none',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
      <div><span style={{fontSize:'14px',fontWeight:600}}>{t.testName}</span><span className="cbadge" style={{marginLeft:'8px'}}>{t.batch_name||'—'}</span><span style={{fontSize:'11px',color:'var(--muted)',marginLeft:'8px'}}>{t.subject} · {fmtDate(t.date)} · Max {t.maxMarks}</span></div>
      <div style={{display:'flex',gap:'12px',fontSize:'12px'}}><span style={{color:'#10b981'}}>Avg: {avg}</span>{top&&<span style={{color:'var(--muted)'}}>Top: {top.student_name}</span>}</div>
    </summary><div style={{padding:'0 18px 14px'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}><thead><tr style={{background:'var(--subtle)'}}><th style={{padding:'6px 8px',width:'40px'}}>Rank</th><th style={{padding:'6px 8px'}}>Student</th><th style={{padding:'6px 8px',textAlign:'center'}}>Marks</th><th style={{padding:'6px 8px',textAlign:'center'}}>%</th><th style={{padding:'6px 8px',textAlign:'center'}}>Grade</th></tr></thead>
    <tbody>{[...(t.scores||[])].sort((a,b)=>(b.obtained||0)-(a.obtained||0)).map((sc,i)=>{const p=!sc.absent&&sc.obtained!=null?((sc.obtained/t.maxMarks)*100).toFixed(0):null;const g=getGrade(sc.absent?null:sc.obtained,t.maxMarks);
    return<tr key={i} style={{borderTop:'1px solid var(--border)',background:i<3&&!sc.absent?['rgba(245,158,11,.06)','rgba(192,192,192,.04)','rgba(205,127,50,.04)'][i]:''}}>
      <td style={{padding:'6px 8px',textAlign:'center',fontWeight:700,color:i<3&&!sc.absent?['#f59e0b','#94a3b8','#d97706'][i]:'var(--muted)'}}>{sc.absent?'—':i+1}</td>
      <td style={{padding:'6px 8px',fontWeight:500}}>{sc.student_name}</td>
      <td style={{padding:'6px 8px',textAlign:'center',fontFamily:"'JetBrains Mono',monospace",color:sc.absent?'var(--muted)':parseFloat(p)>=60?'#10b981':'#ef4444'}}>{sc.absent?'AB':`${sc.obtained}/${t.maxMarks}`}</td>
      <td style={{padding:'6px 8px',textAlign:'center',color:'var(--muted)'}}>{p?p+'%':'—'}</td>
      <td style={{padding:'6px 8px',textAlign:'center'}}><span className={`grade-pill grade-${g}`}>{g}</span></td>
    </tr>})}</tbody></table></div></details>})}
  </div>);
}
