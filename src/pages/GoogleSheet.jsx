import React, { useEffect, useMemo, useState } from "react";
import { Database, RefreshCw, Search, Table2 } from "lucide-react";
import { api } from "../api";

export default function GoogleSheet() {
  const [result, setResult] = useState({ headers: [], rows: [], total: 0 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    api("/google-sheet").then(setResult).catch((error) => setError(error.message)).finally(() => setLoading(false));
  }

  useEffect(load, []);
  const rows = useMemo(() => result.rows.filter((row) => Object.values(row).join(" ").toLowerCase().includes(query.toLowerCase())), [result.rows, query]);
  const responseLabel = result.scope === "today" ? "responses for today" : "total responses";

  return <section className="panel tablepanel sheet-panel">
    <div className="sheet-hero">
      <div className="sheet-title">
        <span className="sheet-title-icon"><Database size={22} /></span>
        <div><span className="eyebrow">GOOGLE FORM RESPONSES</span><h1>Linked response sheet</h1><p>Review and search every response synced from your connected form.</p></div>
      </div>
      <button className="sheet-refresh" onClick={load} disabled={loading}><RefreshCw className={loading ? "spinning" : ""} size={17} />{loading ? "Syncing…" : "Refresh sheet"}</button>
    </div>
    <div className="sheet-summary"><span><b>{result.total}</b> {responseLabel}</span><span>Live Google Sheet connection</span></div>
    {error && <div className="alert sheet-alert">{error}</div>}
    <div className="sheet-toolbar">
      <label className="search sheet-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search candidates, dates, companies…" /></label>
      <span className="sheet-count"><Table2 size={17} /><b>{rows.length}</b> visible rows</span>
    </div>
    <div className="tablewrap sheet-table-wrap"><table><thead><tr>{result.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={Math.max(result.headers.length, 1)} className="empty">Reading Google Sheet…</td></tr> : rows.length ? rows.map((row) => <tr key={row.__row}>{result.headers.map((header) => <td key={header}>{row[header] || "—"}</td>)}</tr>) : <tr><td colSpan={Math.max(result.headers.length, 1)} className="empty">No Google Sheet responses available.</td></tr>}</tbody></table></div>
  </section>;
}
