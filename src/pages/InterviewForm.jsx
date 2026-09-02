import React,{useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {UploadCloud,Check,UserRound,Building2,CalendarClock,ClipboardCheck,LockKeyhole} from 'lucide-react';
import {api} from '../api';
import {useAuth} from '../App';

const technologies=['SQL Support / Developer','AWS / DevOps','Testing','Power BI / Tableau / Data Analytics','Data Science','Python Developer','AR Caller','Medical Coding / Billing','DV360','OSI Soft PI','Full Stack Developer','AI Engineer','Java Developer','.NET Developer','Other'];
const roundOptions=['Test','Round 1','Round 2','Round 3','AI Interview','Manager Round','Final Round'];
const initial={candidateName:'',interviewDate:'',interviewTime:'',candidateMobile:'',candidateEmail:'',technology:'',companyName:'',hrName:'',hrEmail:'',hrMobile:'',rounds:[],status:'Scheduled',selectedCompanyName:'',remarks:''};
const validName=value=>/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(value.trim());
const validMobile=value=>/^\d{10}$/.test(value);
const nameOnly=value=>value.replace(/[^A-Za-z\s]/g,'');
const mobileOnly=value=>value.replace(/\D/g,'').slice(0,10);
const todayISO=()=>{const date=new Date();date.setMinutes(date.getMinutes()-date.getTimezoneOffset());return date.toISOString().slice(0,10)};

export default function InterviewForm(){
  const {user}=useAuth(), navigate=useNavigate(), profileLocked=user.role==='user';
  const [data,setData]=useState(()=>({...initial,...(profileLocked?{candidateName:user.name,candidateEmail:user.email,candidateMobile:user.phone||''}:{})}));
  const [files,setFiles]=useState({}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const set=(key,value)=>setData(current=>({...current,[key]:value}));
  const chooseRound=round=>set('rounds',[round]);

  async function submit(event){
    event.preventDefault(); setError('');
    if(!validName(data.candidateName))return setError('Please enter a valid candidate name.');
    if(!validMobile(data.candidateMobile))return setError('Please enter a valid 10-digit candidate mobile number.');
    if(data.interviewDate<todayISO())return setError('Interview date cannot be in the past.');
    if(!/[A-Za-z]/.test(data.companyName))return setError('Please enter a valid company name.');
    if(!validName(data.hrName))return setError('Please enter a valid HR name.');
    if(!validMobile(data.hrMobile))return setError('Please enter a valid 10-digit HR mobile number.');
    setBusy(true);
    try{
      const form=new FormData();
      Object.entries(data).forEach(([key,value])=>form.append(key,key==='rounds'?JSON.stringify(value):value));
      if(files.resume)form.append('resume',files.resume);
      if(files.introduction)form.append('introduction',files.introduction);
      await api('/interviews',{method:'POST',body:form});
      navigate('/interviews');
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  return <form className="formpage" onSubmit={submit}>
    <div className="pagehead"><div><span className="eyebrow">NEW INTERVIEW</span><h1>Interview details</h1><p>Your registered candidate details are filled automatically.</p></div><button className="primary" disabled={busy}><Check size={18}/>{busy?'Saving…':'Save interview'}</button></div>
    {error&&<div className="alert">{error}</div>}
    <FormSection icon={UserRound} title="Candidate information" desc={profileLocked?'Taken securely from your registration profile':'Personal and contact details'}>
      {profileLocked&&<div className="profile-note"><LockKeyhole size={16}/> These details are protected and reused for every interview.</div>}
      <div className="formgrid">
        <Field label="Candidate name" required><input required pattern="[A-Za-z ]+" readOnly={profileLocked} value={data.candidateName} onChange={e=>set('candidateName',nameOnly(e.target.value))}/></Field>
        <Field label="Candidate email" required><input required readOnly={profileLocked} type="email" value={data.candidateEmail} onChange={e=>set('candidateEmail',e.target.value)}/></Field>
        <Field label="Candidate mobile" required><input required readOnly={profileLocked} inputMode="numeric" maxLength="10" value={data.candidateMobile} onChange={e=>set('candidateMobile',mobileOnly(e.target.value))}/></Field>
        <Field label="Technology" required><select required value={data.technology} onChange={e=>set('technology',e.target.value)}><option value="">Select technology</option>{technologies.map(x=><option key={x}>{x}</option>)}</select></Field>
      </div>
    </FormSection>
    <FormSection icon={CalendarClock} title="Schedule & rounds" desc="Choose the date, time and interview flow">
      <div className="formgrid">
        <Field label="Interview date" required><input required type="date" min={todayISO()} value={data.interviewDate} onChange={e=>set('interviewDate',e.target.value)}/></Field>
        <Field label="Interview time" required><input required type="time" value={data.interviewTime} onChange={e=>set('interviewTime',e.target.value)}/></Field>
        <div className="full"><span className="fieldlabel">Interview round <b>*</b></span><div className="checks radios">{roundOptions.map(x=><label className={data.rounds[0]===x?'checked':''} key={x}><input required type="radio" name="interviewRound" value={x} checked={data.rounds[0]===x} onChange={()=>chooseRound(x)}/><i>{data.rounds[0]===x&&<span/>}</i>{x}</label>)}</div></div>
      </div>
    </FormSection>
    <FormSection icon={Building2} title="Company & HR" desc="Organization and point-of-contact details">
      <div className="formgrid">
        <Field label="Company name" required><input required value={data.companyName} onChange={e=>set('companyName',e.target.value)}/></Field>
        <Field label="HR name" required><input required pattern="[A-Za-z ]+" value={data.hrName} onChange={e=>set('hrName',nameOnly(e.target.value))}/></Field>
        <Field label="HR email" required><input required type="email" value={data.hrEmail} onChange={e=>set('hrEmail',e.target.value)}/></Field>
        <Field label="HR mobile" required><input required inputMode="numeric" maxLength="10" value={data.hrMobile} onChange={e=>set('hrMobile',mobileOnly(e.target.value))}/></Field>
      </div>
    </FormSection>
    <FormSection icon={ClipboardCheck} title="Outcome & documents" desc="Track status and attach supporting files">
      <div className="formgrid">
        <Field label="Interview status"><select value={data.status} onChange={e=>set('status',e.target.value)}>{['Scheduled','In Progress','Selected','Rejected','On Hold'].map(x=><option key={x}>{x}</option>)}</select></Field>
        <Field label="Selected company name"><input value={data.selectedCompanyName} onChange={e=>set('selectedCompanyName',e.target.value)}/></Field>
        <Field label="Resume"><FileInput file={files.resume} onChange={file=>setFiles({...files,resume:file})}/></Field>
        <Field label="Candidate introduction"><FileInput file={files.introduction} onChange={file=>setFiles({...files,introduction:file})}/></Field>
        <div className="full"><Field label="Remarks"><textarea rows="4" value={data.remarks} onChange={e=>set('remarks',e.target.value)} placeholder="Add notes, preparation details or feedback…"/></Field></div>
      </div>
    </FormSection>
    <div className="formactions"><button type="button" className="secondary" onClick={()=>navigate(-1)}>Cancel</button><button className="primary" disabled={busy}>Save interview</button></div>
  </form>
}

function FormSection({icon:Icon,title,desc,children}){return <section className="formsection"><div className="sectiontitle"><span><Icon/></span><div><h3>{title}</h3><p>{desc}</p></div></div>{children}</section>}
function Field({label,required,children}){return <label><span className="fieldlabel">{label}{required&&<b>*</b>}</span>{children}</label>}
function FileInput({file,onChange}){return <label className="upload"><UploadCloud/><strong>{file?file.name:'Choose a file'}</strong><small>PDF, DOC, DOCX, JPG or PNG · Max 100 MB</small><input hidden type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e=>onChange(e.target.files[0])}/></label>}
