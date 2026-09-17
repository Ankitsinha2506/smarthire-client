import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Bell, Clock3, CheckCircle2, XCircle, CalendarPlus} from 'lucide-react';
import {api} from '../api';
import {formatInterviewTime} from '../time';
import './booking-requests.css';

export const refreshBookingNotifications = () => window.dispatchEvent(new Event('booking-requests-updated'));
export default function BookingNotifications({role, userId}) {
  const [data, setData] = useState({count: 0, items: []}), [open, setOpen] = useState(false), [error, setError] = useState('');
  const [interviews, setInterviews] = useState({count: 0, items: []}), [interviewError, setInterviewError] = useState(''), [reading, setReading] = useState(false);
  const root = useRef(null);
  const count = data.count + interviews.count;
  useEffect(() => {
    let controller;
    const load = () => {
      if (document.hidden) return;
      controller?.abort(); controller = new AbortController();
      const signal = controller.signal;
      api('/interview-notifications', {signal}).then(result => {if (!signal.aborted) {setInterviews(result); setInterviewError(result.warning || '')}}).catch(error => {if (!signal.aborted && error.name !== 'AbortError') setInterviewError('New interview notifications could not be refreshed.')});
      api('/booking-requests/notifications', {signal}).then(result => {if (!signal.aborted) {setData(result); setError('')}}).catch(error => {if (!signal.aborted && error.name !== 'AbortError') setError('Notifications could not be refreshed.')});
    };
    load();
    const interval = setInterval(load, 10000);
    window.addEventListener('booking-requests-updated', load);
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', load);
    return () => {clearInterval(interval); controller?.abort(); window.removeEventListener('booking-requests-updated', load); window.removeEventListener('focus', load); document.removeEventListener('visibilitychange', load)};
  }, [role, userId]);
  useEffect(() => {
    const close = event => {if (!root.current?.contains(event.target)) setOpen(false)};
    const escape = event => {if (event.key === 'Escape') setOpen(false)};
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => {document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape)};
  }, []);
  async function markRead(items) {
    setReading(true);
    try {
      for (const source of ['database', 'google-sheet']) {
        const ids = items.filter(item => item.source === source).map(item => item._id);
        if (ids.length) await api('/interview-notifications/read', {method: 'PATCH', body: JSON.stringify({source, ids})});
      }
      setInterviewError('');
    } catch {setInterviewError('Could not mark notifications as read. Please retry.')}
    finally {setReading(false); refreshBookingNotifications()}
  }
  return <div className="booking-notifications" ref={root}>
    <button className="theme-toggle booking-bell" aria-label={`Notifications: ${count} pending or unread`} aria-expanded={open} onClick={() => setOpen(value => !value)}><Bell size={19}/>{count > 0 && <b>{count > 99 ? '99+' : count}</b>}</button>
    {open && <div className="booking-notification-panel"><header><strong>Notifications</strong><span aria-live="polite">{count} pending / unread</span></header>
      <div className="notification-section-heading"><strong>New interviews · {interviews.count}</strong>{interviews.items.length > 0 && <button disabled={reading} onClick={() => markRead(interviews.items)}>{reading ? 'Saving…' : 'Mark displayed as read'}</button>}</div>
      {interviewError && <p role="alert">{interviewError}</p>}
      <div className="interview-notification-list">
        {interviews.items.length ? interviews.items.map(item => <div className="interview-notification-item" key={`${item.source}-${item._id}`}>
          <CalendarPlus size={19}/><div><strong>{item.candidateName}</strong>
          <small>{item.interviewDate ? new Date(item.interviewDate).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: 'numeric'}) : 'Date not provided'} · {formatInterviewTime(item.interviewTime)}</small>
          <small className="notification-technology">{item.technology || 'Technology not provided'}</small>
          <small>{item.companyName}{item.source === 'google-sheet' ? ' · Google Form' : ''}</small></div>
          <button disabled={reading} title="Mark as read" aria-label={`Mark notification for ${item.candidateName} as read`} onClick={() => markRead([item])}><CheckCircle2 size={17}/></button>
        </div>) : <p>No new interviews.</p>}
      </div>
      <div className="notification-section-heading"><strong>Booking requests</strong><span>{data.count} {role === 'admin' ? 'pending' : 'unread'}</span></div>
      {error && <p role="alert">{error}</p>}
      {data.items.length ? data.items.map(item => <Link key={item._id} to="/booking-requests" onClick={() => {setOpen(false); refreshBookingNotifications()}}>
        {item.status === 'Pending' ? <Clock3 size={19}/> : item.status === 'Approved' ? <CheckCircle2 size={19}/> : <XCircle size={19}/>}
        <span><strong>{role === 'admin' ? `${item.staff?.name || 'Staff'} requested an interview slot` : `Your interview slot is ${item.status.toLowerCase()} by admin`}</strong><small>{item.details.candidateName} · {new Date(item.details.interviewDate).toLocaleDateString('en-IN')} · {formatInterviewTime(item.details.interviewTime)}</small><small>{item.details.technology}</small></span>
      </Link>) : <p>No {role === 'admin' ? 'pending requests' : 'unread notifications'}.</p>}
      <Link className="booking-notification-footer" to="/booking-requests" onClick={() => {setOpen(false); refreshBookingNotifications()}}>View all booking requests</Link>
    </div>}
  </div>;
}
