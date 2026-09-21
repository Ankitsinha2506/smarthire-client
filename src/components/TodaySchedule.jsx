import React from 'react';
import { formatInterviewTime, sortInterviewsByTime } from '../time';
import '../today-schedule.css';

function Phone({ value, name }) {
  const number = String(value || '').trim();
  const dial = number.replace(/[^\d+]/g, '');
  return /\d{7,}/.test(dial)
    ? <a className="schedule-phone" href={`tel:${dial}`} aria-label={`Call ${name}: ${number}`}>{number}</a>
    : <small>Phone not available</small>;
}

export default function TodaySchedule({ items = [] }) {
  if (!items.length) return <div className="bi-empty">No interviews scheduled today</div>;
  return <div className="today-schedule-list">{sortInterviewsByTime(items).map(item => (
    <article key={item._id}>
      <time>{formatInterviewTime(item.interviewTime)}</time>
      <div className="schedule-candidate">
        <div className="avatar soft" aria-hidden="true">{(item.candidateName || '').slice(0, 2).toUpperCase()}</div>
        <div><strong>{item.candidateName}</strong><small>{item.candidateEmail || 'Email not available'}</small><Phone value={item.candidateMobile} name={item.candidateName || 'candidate'}/></div>
      </div>
      <div className="schedule-domain"><strong>{item.technology || 'Domain not specified'}</strong><small>{item.companyName || 'Company not specified'}</small></div>
      <div className="schedule-contact"><small>HR contact</small><strong>{item.hrName || 'HR not specified'}</strong><Phone value={item.hrMobile} name={item.hrName || 'HR'}/></div>
      <div className="schedule-support"><small>Support staff</small>{item.assignedStaff?.length ? item.assignedStaff.map(person => (
        <div className="schedule-employee" key={person._id || person.name}><strong>{person.name}</strong><Phone value={person.phone} name={person.name}/></div>
      )) : <strong>Unassigned</strong>}</div>
      <span className={`status ${(item.status || '').toLowerCase().replace(' ', '-')}`}>{item.status}</span>
    </article>
  ))}</div>;
}
