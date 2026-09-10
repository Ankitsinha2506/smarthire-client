import {interviewSteps,validateInterviewStep} from '../utils/interviewSteps';
import './interview-wizard.css';
import React,{useEffect,useRef,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft,ArrowRight,UploadCloud,Check,UserRound,Building2,CalendarClock,ClipboardCheck,LockKeyhole} from 'lucide-react';
import {api} from '../api';
import {refreshBookingNotifications} from '../components/BookingNotifications';
import {useAuth} from '../App';

const technologies=['SQL Support / Developer','AWS / DevOps','Testing','Power BI / Tableau / Data Analytics','Data Science','Python Developer','AR Caller','Medical Coding / Billing','DV360','OSI Soft PI','Full Stack Developer','AI Engineer','Java Developer','.NET Developer','Other'];
const roundOptions=['Test','Round 1','Round 2','Round 3','AI Interview','Manager Round','Final Round'];
const initial={candidateName:'',interviewDate:'',interviewTime:'',candidateMobile:'',candidateEmail:'',technology:'',companyName:'',hrName:'',hrEmail:'',hrMobile:'',rounds:[],status:'Scheduled',selectedCompanyName:'',remarks:''};
const nameOnly=value=>value.replace(/[^A-Za-z\s]/g,'');
const mobileOnly=value=>value.replace(/\D/g,'').slice(0,10);
const todayISO=()=>{const date=new Date();date.setMinutes(date.getMinutes()-date.getTimezoneOffset());return date.toISOString().slice(0,10)};

export default function InterviewForm(){
  const {user}=useAuth(), navigate=useNavigate(), profileLocked=user.role==='user';
  const [data,setData]=useState(()=>({...initial,...(profileLocked?{candidateName:user.name,candidateEmail:user.email,candidateMobile:user.phone||''}:{})}));
  const [files,setFiles]=useState({}),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const [step,setStep]=useState(0);
  const headingRef=useRef(null), progressRef=useRef(null), firstRender=useRef(true);
  useEffect(()=>{const current=progressRef.current?.querySelector('[aria-current=step]');if(current)progressRef.current.scrollLeft=current.offsetLeft-progressRef.current.offsetLeft-12;if(firstRender.current){firstRender.current=false;return}headingRef.current?.focus({preventScroll:true});headingRef.current?.scrollIntoView({block:'start',behavior:'instant'})},[step]);
  const set=(key,value)=>setData(current=>({...current,[key]:value}));
  const chooseRound=round=>set('rounds',[round]);

  async function submit(event){
    event.preventDefault(); setError('');
    if(busy)return;
    if(step<3){
      const message=validateInterviewStep(data,step,todayISO());
      if(message)return setError(message);
      setStep(current=>current+1);return;
    }
    for(let index=0;index<3;index++){
      const message=validateInterviewStep(data,index,todayISO());
      if(message){setStep(index);setError(message);return}
    }
    setBusy(true);
    try{
      const form=new FormData();
      Object.entries(data).forEach(([key,value])=>form.append(key,key==='rounds'?JSON.stringify(value):value));
      if(files.resume)form.append('resume',files.resume);
      if(files.introduction)form.append('introduction',files.introduction);
      const result=await api('/interviews',{method:'POST',body:form});
      if(result.pendingApproval){refreshBookingNotifications();navigate('/booking-requests',{state:{message:result.message}})}else navigate('/interviews');
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  return <form className="formpage interview-wizard" onSubmit={submit}>
    <div className="pagehead"><div><span className="eyebrow">NEW INTERVIEW</span><h1>Interview details</h1><p>{user.role==='staff'?'Submit your request for admin approval. Your slot is booked only after approval.':'Your registered candidate details are filled automatically.'}</p></div><span className="wizard-step-count">Step {step+1} of 4</span></div>
    <div className="wizard-layout"><div className="wizard-top-progress">
    <div className="wizard-progress-caption"><span>YOUR BOOKING JOURNEY</span><small>Four simple steps</small></div>
    <ol ref={progressRef} className="wizard-progress" aria-label="Booking progress" tabIndex={0}>{interviewSteps.map((title,index)=><li key={title} className={index===step?'current':index<step?'complete':''} aria-current={index===step?'step':undefined}><span>{index<step?<Check size={17}/>:String(index+1).padStart(2,'0')}</span><div><strong>{title}</strong><small>{index===3?'Optional':index<step?'Completed':index===step?'In progress':'Up next'}</small></div></li>)}</ol>
    </div><div className="wizard-content">
    <h2 className="wizard-current-title" ref={headingRef} tabIndex={-1}>Step {step+1}: {interviewSteps[step]}{step===3?' (optional)':''}</h2>
    {error&&<div className="alert" role="alert">{error}</div>}
    {step===0&&<FormSection icon={UserRound} title="Candidate information" desc={profileLocked?'Taken securely from your registration profile':'Personal and contact details'}>
      {profileLocked&&<div className="profile-note"><LockKeyhole size={16}/> These details are protected and reused for every interview.</div>}
      <div className="formgrid">
        <Field label="Candidate name" required><input required pattern="[A-Za-z ]+" readOnly={profileLocked} value={data.candidateName} onChange={e=>set('candidateName',nameOnly(e.target.value))}/></Field>
        <Field label="Candidate email" required><input required readOnly={profileLocked} type="email" value={data.candidateEmail} onChange={e=>set('candidateEmail',e.target.value)}/></Field>
        <Field label="Candidate mobile" required><input required readOnly={profileLocked} inputMode="numeric" maxLength="10" value={data.candidateMobile} onChange={e=>set('candidateMobile',mobileOnly(e.target.value))}/></Field>
        <Field label="Technology" required><select required value={data.technology} onChange={e=>set('technology',e.target.value)}><option value="">Select technology</option>{technologies.map(x=><option key={x}>{x}</option>)}</select></Field>
      </div>
    </FormSection>}
    {step===1&&<FormSection icon={CalendarClock} title="Schedule & rounds" desc="Choose the date, time and interview flow">
      <div className="formgrid">
        <Field label="Interview date" required><input required type="date" min={todayISO()} value={data.interviewDate} onChange={e=>set('interviewDate',e.target.value)}/></Field>
        <Field label="Interview time" required><input required type="time" value={data.interviewTime} onChange={e=>set('interviewTime',e.target.value)}/></Field>
        <div className="full"><span className="fieldlabel">Interview round <b>*</b></span><div className="checks radios">{roundOptions.map(x=><label className={data.rounds[0]===x?'checked':''} key={x}><input required type="radio" name="interviewRound" value={x} checked={data.rounds[0]===x} onChange={()=>chooseRound(x)}/><i>{data.rounds[0]===x&&<span/>}</i>{x}</label>)}</div></div>
      </div>
    </FormSection>}
    {step===2&&<FormSection icon={Building2} title="Company & HR" desc="Organization and point-of-contact details">
      <div className="formgrid">
        <Field label="Company name" required><input required value={data.companyName} onChange={e=>set('companyName',e.target.value)}/></Field>
        <Field label="HR name" required><input required pattern="[A-Za-z ]+" value={data.hrName} onChange={e=>set('hrName',nameOnly(e.target.value))}/></Field>
        <Field label="HR email" required><input required type="email" value={data.hrEmail} onChange={e=>set('hrEmail',e.target.value)}/></Field>
        <Field label="HR mobile" required><input required inputMode="numeric" maxLength="10" value={data.hrMobile} onChange={e=>set('hrMobile',mobileOnly(e.target.value))}/></Field>
      </div>
    </FormSection>}
    {step===3&&<FormSection icon={ClipboardCheck} title="Outcome & documents" desc="Optional: add an outcome, notes or supporting files, or continue without them.">
      <div className="formgrid">
        <Field label="Interview status"><select disabled={user.role==='staff'} value={data.status} onChange={e=>set('status',e.target.value)}>{['Scheduled','In Progress','Selected','Rejected','On Hold'].map(x=><option key={x}>{x}</option>)}</select></Field>
        <Field label="Selected company name"><input value={data.selectedCompanyName} onChange={e=>set('selectedCompanyName',e.target.value)}/></Field>
        <Field label="Resume"><FileInput file={files.resume} onChange={file=>setFiles({...files,resume:file})}/></Field>
        <Field label="Candidate introduction"><FileInput file={files.introduction} onChange={file=>setFiles({...files,introduction:file})}/></Field>
        <div className="full"><Field label="Remarks"><textarea rows="4" value={data.remarks} onChange={e=>set('remarks',e.target.value)} placeholder="Add notes, preparation details or feedback…"/></Field></div>
      </div>
    </FormSection>}
    <div className="formactions wizard-actions"><button type="button" className="wizard-cancel" disabled={busy} onClick={()=>navigate(-1)}>Cancel</button><div>{step>0&&<button type="button" className="secondary" disabled={busy} onClick={()=>{setError('');setStep(current=>current-1)}}><ArrowLeft size={17}/> Back</button>}<button type="submit" className="primary" disabled={busy}>{step<3?<>Next <ArrowRight size={17}/></>:<><Check size={17}/>{busy?'Saving…':user.role==='staff'?'Request approval':'Save interview'}</>}</button></div></div>
    {step===3&&<p className="wizard-optional-note">No documents or outcome details are required. {user.role==='staff'?'Request approval':'Save your interview'} whenever you’re ready.</p>}
    </div></div>
  </form>
}

function FormSection({icon:Icon,title,desc,children}){return <section className="formsection"><div className="sectiontitle"><span><Icon/></span><div><h3>{title}</h3><p>{desc}</p></div></div>{children}</section>}
function Field({label,required,children}){return <label><span className="fieldlabel">{label}{required&&<b>*</b>}</span>{children}</label>}
function FileInput({file,onChange}){return <label className="upload"><UploadCloud/><strong>{file?file.name:'Choose a file'}</strong><small>PDF, DOC, DOCX, JPG or PNG · Max 100 MB</small><input hidden type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e=>onChange(e.target.files[0])}/></label>}
