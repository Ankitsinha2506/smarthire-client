import React, {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Bell, Clock3, CheckCircle2, XCircle} from 'lucide-react';
import {api} from '../api';
import './booking-requests.css';

export const refreshBookingNotifications = () => window.dispatchEvent(new Event('booking-requests-updated'));
export default function BookingNotifications({role}) {
  const [data, setData] = useState({count: 0, items: []}), [open, setOpen] = useState(false), [error, setError] = useState('');
  const root = useRef(null);
  useEffect(() => {
    let controller;
    const load = () => {
      if (document.hidden) return;
      controller?.abort(); controller = new AbortController();
      const signal = controller.signal;
      api('/booking-requests/notifications', {signal}).then(result => {if (!signal.aborted) {setData(result); setError('')}}).catch(error => {if (!signal.aborted && error.name !== 'AbortError') setError('Notifications could not be refreshed.')});
    };
    load();
    const interval = setInterval(load, 20000);
    window.addEventListener('booking-requests-updated', load);
    window.addEventListener('focus', load);
    document.addEventListener('visibilitychange', load);
    return () => {clearInterval(interval); controller?.abort(); window.removeEventListener('booking-requests-updated', load); window.removeEventListener('focus', load); document.removeEventListener('visibilitychange', load)};
  }, [role]);
  useEffect(() => {
    const close = event => {if (!root.current?.contains(event.target)) setOpen(false)};
    const escape = event => {if (event.key === 'Escape') setOpen(false)};
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', escape);
    return () => {document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape)};
  }, []);
  return <div className="booking-notifications" ref={root}>
    <button className="theme-toggle booking-bell" aria-label={`Booking notifications: ${data.count} ${role === 'admin' ? 'pending' : 'unread'}`} aria-expanded={open} onClick={() => setOpen(value => !value)}><Bell size={19}/>{data.count > 0 && <b>{data.count > 99 ? '99+' : data.count}</b>}</button>
    {open && <div className="booking-notification-panel"><header><strong>Booking notifications</strong><span>{data.count} {role === 'admin' ? 'pending' : 'unread'}</span></header>
      {error && <p role="alert">{error}</p>}
      {data.items.length ? data.items.map(item => <Link key={item._id} to="/booking-requests" onClick={() => {setOpen(false); refreshBookingNotifications()}}>
        {item.status === 'Pending' ? <Clock3 size={19}/> : item.status === 'Approved' ? <CheckCircle2 size={19}/> : <XCircle size={19}/>}
        <span><strong>{role === 'admin' ? `${item.staff?.name || 'Staff'} requested an interview slot` : `Your interview slot is ${item.status.toLowerCase()} by admin`}</strong><small>{item.details.candidateName} · {new Date(item.details.interviewDate).toLocaleDateString('en-IN')} · {item.details.interviewTime}</small></span>
      </Link>) : <p>No {role === 'admin' ? 'pending requests' : 'unread notifications'}.</p>}
      <Link className="booking-notification-footer" to="/booking-requests" onClick={() => {setOpen(false); refreshBookingNotifications()}}>View all booking requests</Link>
    </div>}
  </div>;
}
