import React,{useEffect,useMemo,useState} from 'react';
import {ClipboardList,CalendarCheck2,Trophy,UsersRound,Sparkles,ArrowUpRight,Clock3} from 'lucide-react';
import {api} from '../api';
import {getDateRange,rangeOptions} from '../dateRanges';
import InterviewCalendar from './InterviewCalendar';
import TomorrowSchedule from './TomorrowSchedule';
import {dashboardGreeting} from '../greeting';

const assignedTo=(item,userId)=>item.assignedStaff?.some(person=>String(person._id||person)===String(userId));
const mergeInterviews=(database,sheet,userId)=>[...database,...sheet.filter(item=>assignedTo(item,userId))].sort((a,b)=>new Date(b.interviewDate)-new Date(a.interviewDate));

export default function StaffAnalytics({user}){
  const [now,setNow]=useState(()=>new Date()),greeting=dashboardGreeting(user,now);
  const [period,setPeriod]=useState('all'),[stats,setStats]=useState(null),[work,setWork]=useState({total:0,interviews:[]}),[todayWork,setTodayWork]=useState([]),[todaySchedule,setTodaySchedule]=useState([]),[tomorrowSchedule,setTomorrowSchedule]=useState([]),[loading,setLoading]=useState(false);
  useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(timer)},[]);
  useEffect(()=>{
    const params=new URLSearchParams(Object.entries(getDateRange(period)).filter(([,value])=>value)),todayParams=new URLSearchParams(getDateRange('today')),tomorrowParams=new URLSearchParams({...getDateRange('tomorrow'),upcoming:'tomorrow'}),sheetEnabled=user.permissions?.googleSheet!==false;
    if(period==='tomorrow')params.set('upcoming','tomorrow');
    setLoading(true);
    Promise.all([
      api('/interviews/stats?'+params),api('/interviews/staff-workload?'+params),sheetEnabled?api('/google-sheet/normalized?'+params):Promise.resolve({items:[]}),
      api('/interviews/staff-workload?'+todayParams),api('/interviews?limit=100&'+todayParams),sheetEnabled?api('/google-sheet/normalized?'+todayParams):Promise.resolve({items:[]}),
      api('/interviews?limit=100&'+tomorrowParams),sheetEnabled?api('/google-sheet/normalized?'+tomorrowParams):Promise.resolve({items:[]})
    ]).then(([summary,periodDatabase,periodSheet,todayDatabase,allTodayDatabase,todaySheet,allTomorrowDatabase,tomorrowSheet])=>{
      const assignedSheet=periodSheet.items.filter(item=>assignedTo(item,user.id)),groups=new Map((summary.technology||[]).map(item=>[item._id,item.count]));
      assignedSheet.forEach(item=>groups.set(item.technology||'Unknown',(groups.get(item.technology||'Unknown')||0)+1));
      setStats({...summary,total:summary.total+assignedSheet.length,scheduled:summary.scheduled+assignedSheet.filter(item=>item.status==='Scheduled').length,inProgress:summary.inProgress+assignedSheet.filter(item=>item.status==='In Progress').length,selected:summary.selected+assignedSheet.filter(item=>['Selected','Placed'].includes(item.status)).length,technology:[...groups].map(([_id,count])=>({_id,count})).sort((a,b)=>b.count-a.count)});
      const periodInterviews=mergeInterviews(periodDatabase.interviews,periodSheet.items,user.id);
      setWork({total:periodInterviews.length,interviews:periodInterviews});
      setTodayWork(mergeInterviews(todayDatabase.interviews,todaySheet.items,user.id));
      setTodaySchedule([...allTodayDatabase.items,...todaySheet.items].sort((a,b)=>String(a.interviewTime).localeCompare(String(b.interviewTime))));
      setTomorrowSchedule([...allTomorrowDatabase.items,...tomorrowSheet.items].sort((a,b)=>String(a.interviewTime).localeCompare(String(b.interviewTime))));
    }).finally(()=>setLoading(false));
  },[period,user.id,user.permissions?.googleSheet]);

  const todayTechnologies=useMemo(()=>todayWork.reduce((groups,item)=>groups.set(item.technology||'Unknown',(groups.get(item.technology||'Unknown')||0)+1),new Map()),[todayWork]);
  const cards=[['Supporting today',todayWork.length,UsersRound,'violet'],["Today's interviews",todaySchedule.length,CalendarCheck2,'cyan'],['In this period',stats?.total,ClipboardList,'blue'],['Selected / placed',stats?.selected,Trophy,'green']];
  const maxTechnology=Math.max(...(stats?.technology||[]).map(item=>item.count),1);

  return <div className={loading?'staff-analytics bi-loading':'staff-analytics'}>
    <section className="staff-hero"><div><div className="bi-meta staff-meta"><span className="eyebrow">{greeting.date} · STAFF WORKSPACE</span><span className="bi-live-clock staff-hero-clock" title="Live clock"><Clock3 size={13}/>{now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true})}</span></div><h1>{greeting.title}</h1><p>{greeting.message}</p></div><div className="staff-hero-badge"><Sparkles/><span><small>Today’s focus</small><strong>{todayWork.length?`${todayWork.length} candidate${todayWork.length===1?'':'s'} need your support`:'You are all caught up'}</strong></span></div></section>
    <div className="quickranges staff-ranges">{rangeOptions.map(([key,label])=><button key={key} className={period===key?'active':''} onClick={()=>setPeriod(key)}>{label}</button>)}</div>
    <section className="staff-kpis">{cards.map(([label,value,Icon,tone])=><article className={`bi-kpi ${tone}`} key={label}><div><span>{label}</span><strong>{value??'—'}</strong></div><i><Icon/></i></article>)}</section>
    <section className="staff-today panel"><div className="panelhead"><div><span className="eyebrow">TODAY’S SUPPORT</span><h3>People counting on you today</h3><p>{todayWork.length} assigned candidate{todayWork.length===1?'':'s'} across {todayTechnologies.size} technolog{todayTechnologies.size===1?'y':'ies'}</p></div><CalendarCheck2/></div><div className="staff-today-list">{todayWork.length?todayWork.map(item=><article key={item._id}><div className="avatar support-avatar">{item.candidateName.slice(0,2).toUpperCase()}</div><div><strong>{item.candidateName}</strong><small>{item.candidateEmail||'Email not available'}</small></div><div className="today-interview-detail"><strong>{item.technology||'Technology not specified'}</strong><small>{item.companyName||'Company not specified'}</small></div><div className="today-interview-detail"><strong>{item.hrName||'HR not specified'}</strong><small>{item.hrMobile||item.hrEmail||'Contact not available'}</small></div><time>{item.interviewTime||'Time pending'}</time><span className={`status ${item.status.toLowerCase().replace(' ','-')}`}>{item.status}</span></article>):<div className="staff-today-empty"><Sparkles/><strong>No support interviews today</strong><span>Your newly assigned candidates will appear here.</span></div>}</div></section>
    <section className="bi-card wide staff-all-today"><header><div><h3>Today's schedule ({todaySchedule.length})</h3><p>All candidates, domains and support staff</p></div><span className="live-dot">Live</span></header><div className="bi-chart">{todaySchedule.length?<div className="todaylist">{todaySchedule.map(item=><article key={item._id}><time>{item.interviewTime||'—'}</time><div className="candidate"><strong>{item.candidateName}</strong><small>{item.companyName}</small></div><span className="domain">{item.technology}</span><div className="support"><small>Supported by</small><strong>{item.assignedStaff?.map(person=>person.name).join(', ')||'Unassigned'}</strong></div><span className={`status ${item.status.toLowerCase().replace(' ','-')}`}>{item.status}</span></article>)}</div>:<div className="bi-empty">No interviews scheduled today</div>}</div></section>
    <TomorrowSchedule items={tomorrowSchedule} showSupport/>
    <section className="staff-main-grid"><div><section className="panel staff-domain"><div className="panelhead"><div><span className="eyebrow">WORKLOAD MIX</span><h3>My technology distribution</h3><p>Assigned interviews by domain for the selected period</p></div><strong className="domain-total">{stats?.total||0}<small>Total</small></strong></div><div className="staff-domain-bars">{stats?.technology?.length?stats.technology.map((item,index)=><div className="domain-row" key={item._id}><span className="domain-rank">{String(index+1).padStart(2,'0')}</span><div><div><span>{item._id||'Unknown'}</span><strong>{item.count} <small>{Math.round(item.count/(stats.total||1)*100)}%</small></strong></div><i><b style={{width:`${item.count/maxTechnology*100}%`}}/></i></div></div>):<div className="empty">No assigned interview data.</div>}</div></section><section className="panel staff-assignments"><div className="panelhead"><div><h3>Candidates I support</h3><p>{work.total} assigned candidate interviews in this period</p></div><ArrowUpRight/></div><div>{work.interviews?.slice(0,8).map(item=><article key={item._id}><time>{new Date(item.interviewDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}<small>{item.interviewTime}</small></time><div className="avatar soft">{item.candidateName.slice(0,2).toUpperCase()}</div><div className="staff-candidate"><span>Candidate</span><strong>{item.candidateName}</strong><small>{item.candidateEmail}</small><small>{item.technology} · {item.companyName}</small></div><span className={`status ${item.status.toLowerCase().replace(' ','-')}`}>{item.status}</span></article>)}{!work.interviews?.length&&<div className="empty">No assigned candidates in this period.</div>}</div></section></div><InterviewCalendar role="staff"/></section>
  </div>
}
