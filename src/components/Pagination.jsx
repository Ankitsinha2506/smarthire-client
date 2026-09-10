import React from 'react';
import {ChevronLeft, ChevronRight, ChevronDown} from 'lucide-react';
import './pagination.css';

export default function Pagination({page, pages, limit, loading, setPage, setLimit, total}) {
  return <nav className="pagination pager" aria-label="Table pagination" aria-busy={loading}>
    <div className="pager-summary"><span className="pager-indicator" aria-hidden="true"/><span>Page <strong>{page}</strong> of <strong>{pages || 1}</strong>{total != null && <span className="pager-total"> · {total.toLocaleString()} records</span>}</span></div>
    <div className="pager-controls">
      <label className="pager-size">Rows per page <span className="pager-select"><select value={limit} onChange={e => setLimit(Number(e.target.value))}>{[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}</select><ChevronDown size={14} aria-hidden="true"/></span></label>
      <div className="pager-actions">
        <button className="pager-previous" aria-label="Previous page" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} aria-hidden="true"/><span>Previous</span></button>
        <button className="pager-next" aria-label="Next page" disabled={loading || page >= pages} onClick={() => setPage(page + 1)}><span>Next</span><ChevronRight size={16} aria-hidden="true"/></button>
      </div>
    </div>
  </nav>;
}
