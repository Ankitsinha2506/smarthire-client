import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {Check, X, Clock3, RefreshCw, CalendarDays, UserRound, Layers, ChevronRight} from 'lucide-react';
import {useAuth} from '../App';
import {api} from '../api';
import {formatInterviewTime} from '../time';
import usePagedData from '../hooks/usePagedData';
import Pagination from '../components/Pagination';
import {refreshBookingNotifications} from '../components/BookingNotifications';
import '../components/booking-requests.css';

export default function BookingRequests() {
  const {user} = useAuth(), admin = user.role === 'admin';
  const location = useLocation();
  const [status, setStatus] = useState(admin ? 'Pending' : ''), [busy, setBusy] = useState(null), [error, setError] = useState(''), [notice, setNotice] = useState(location.state?.message || ''), [notes, setNotes] = useState({});
  const paging = usePagedData('/booking-requests?status=' + status);
  useEffect(() => {window.addEventListener('booking-requests-updated', paging.load);window.addEventListener('focus', paging.load);return () => {window.removeEventListener('booking-requests-updated', paging.load);window.removeEventListener('focus', paging.load)}}, [paging.load]);
  async function review(id, decision) {
    setBusy(id); setError(''); setNotice('');
    try {
      const result = await api(`/booking-requests/${id}/review`, {method: 'PATCH', body: JSON.stringify({decision, note: notes[id] || ''})});
      setNotice(result.warning || (decision === 'Approved' ? 'Request approved. The interview slot is now booked.' : 'Request rejected. The staff member has been notified.'));
      refreshBookingNotifications();
    } catch (error) {setError(error.message)} finally {setBusy(null)}
  }
  async function markRead(id) {
    setBusy(id); setError('');
    try {await api(`/booking-requests/${id}/read`, {method:'PATCH'}); refreshBookingNotifications()}
    catch (error) {setError(error.message)} finally {setBusy(null)}
  }
  return <section className="panel tablepanel booking-page">
    <div className="pagehead"><div><span className="eyebrow">STAFF SLOT REQUESTS</span><h1>{admin ? 'Booking approvals' : 'My booking requests'}</h1><p>{admin ? 'Review staff requests before confirming an interview slot.' : 'Your slot is booked only after an administrator approves your request.'}</p></div><button className="secondary" disabled={paging.loading} onClick={() => {refreshBookingNotifications()}}><RefreshCw size={16}/> Refresh</button></div>
    <div className="booking-toolbar"><label>Show requests <select value={status} onChange={event => {setStatus(event.target.value); paging.setPage(1)}}><option value="">All requests</option>{['Pending','Approved','Rejected'].map(value => <option key={value}>{value}</option>)}</select></label><span className="booking-count">{paging.result.total} {paging.result.total === 1 ? 'request' : 'requests'}</span></div>
    {(error || paging.error) && <div className="alert" role="alert">{error || paging.error}</div>}
    {notice && <div className="success-alert" role="status">{notice}<button type="button" className="notice-close" aria-label="Dismiss" onClick={() => setNotice('')}><X size={16}/></button></div>}
    <div className="booking-list">{paging.loading ? <div className="empty">Loading booking requests…</div> : !paging.result.items.length ? <div className="empty"><Clock3 size={24}/><p>No requests in this view.</p></div> : paging.result.items.map(request => {
      const item = request.details;
      return <article className="booking-card" key={request._id}>
        <div className="booking-card-heading"><div className="booking-identity"><span className="booking-avatar" aria-hidden="true">{item.candidateName?.trim().split(/\s+/).slice(0,2).map(part => part[0]).join('') || '?'}</span><div><h3>{item.candidateName}</h3><p>{item.companyName} · {item.technology}</p></div></div><span className={`booking-status ${request.status.toLowerCase()}`}>{request.status === 'Approved' ? <Check size={13} aria-hidden="true"/> : request.status === 'Rejected' ? <X size={13} aria-hidden="true"/> : <Clock3 size={13} aria-hidden="true"/>}{request.status === 'Pending' ? 'Pending approval' : request.status}</span></div>
        <div className="booking-facts"><div><small><CalendarDays size={13} aria-hidden="true"/> Requested slot</small><strong>{new Date(item.interviewDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})} · {formatInterviewTime(item.interviewTime)}</strong></div><div><small><UserRound size={13} aria-hidden="true"/>{admin ? 'Requested by' : 'Submitted'}</small><strong>{admin ? request.staff?.name || 'Staff' : new Date(request.createdAt).toLocaleString('en-IN')}</strong></div><div><small><Layers size={13} aria-hidden="true"/> Interview round</small><strong>{item.rounds?.join(', ') || '—'}</strong></div></div>
        <details className="booking-details"><summary><ChevronRight size={15} aria-hidden="true"/> View complete request</summary><div className="booking-facts">{[['Candidate email',item.candidateEmail],['Candidate mobile',item.candidateMobile],['HR name',item.hrName],['HR email',item.hrEmail],['HR mobile',item.hrMobile],['Selected company',item.selectedCompanyName],['Remarks',item.remarks],['Resume',item.resume?.name],['Introduction',item.introduction?.name]].map(([label,value]) => <div key={label}><small>{label}</small><strong>{value || '—'}</strong></div>)}</div></details>
        {request.status === 'Pending' && <p className="booking-note">This slot is not booked yet. {admin ? 'Approval will confirm it in Interviews.' : 'Waiting for admin approval.'}</p>}
        {request.status !== 'Pending' && <p className="booking-note">{request.status === 'Approved' ? 'Your interview slot is approved by admin.' : 'This request was rejected. No slot was booked.'} {request.reviewedBy?.name && `Reviewed by ${request.reviewedBy.name}.`}{request.reviewNote && <span className="block">Admin note: {request.reviewNote}</span>}</p>}
        {request.sheetSyncError && admin && <p className="alert">Approved booking saved. Google Sheet sync needs attention.</p>}
        {admin && request.status === 'Pending' && <div className="booking-review"><label>Note to staff (optional)<textarea rows={2} maxLength={1000} value={notes[request._id] || ''} onChange={event => setNotes(current => ({...current,[request._id]:event.target.value}))} placeholder="Add a note about this request…"/></label><div><button className="secondary" disabled={!!busy} onClick={() => review(request._id,'Rejected')}><X size={16}/> Reject</button><button className="primary" disabled={!!busy} onClick={() => review(request._id,'Approved')}><Check size={16}/>{busy === request._id ? 'Saving…' : 'Approve slot'}</button></div></div>}
        {!admin && request.status !== 'Pending' && !request.notificationReadAt && <button className="secondary" disabled={!!busy} onClick={() => markRead(request._id)}>Mark notification as read</button>}
      </article>;
    })}</div>
    <Pagination {...paging} total={paging.result.total}/>
  </section>;
}
