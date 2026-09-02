import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Trophy,
  ClipboardList,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../App";
import { getDateRange, rangeOptions } from "../dateRanges";
import AdminAnalytics from "../components/AdminAnalytics";
import StaffAnalytics from "../components/StaffAnalytics";
import InterviewCalendar from "../components/InterviewCalendar";
import TomorrowSchedule from "../components/TomorrowSchedule";
import { dashboardGreeting } from "../greeting";
import { formatInterviewTime } from "../time";

export default function Dashboard() {
  const { user } = useAuth();
  return user.role === "admin" ? (
    <AdminAnalytics />
  ) : user.role === "staff" ? (
    <StaffAnalytics user={user} />
  ) : (
    <StandardDashboard />
  );
}

function StandardDashboard() {
  const { user } = useAuth(),
    [now, setNow] = useState(() => new Date()),
    greeting = dashboardGreeting(user, now),
    [stats, setStats] = useState(null),
    [allTotal, setAllTotal] = useState(null),
    [recent, setRecent] = useState([]),
    [tomorrow, setTomorrow] = useState([]),
    [period, setPeriod] = useState("all"),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const params = new URLSearchParams(
        Object.entries(getDateRange(period)).filter(([, value]) => value),
      ),
      tomorrowParams = new URLSearchParams(getDateRange("tomorrow"));
    setLoading(true);
    Promise.all([
      api("/interviews/stats?" + params),
      api("/interviews/stats"),
      api("/interviews?limit=5&" + params),
      api("/interviews?limit=100&" + tomorrowParams),
    ])
      .then(([summary, all, recentResult, tomorrowResult]) => {
        setStats(summary);
        setAllTotal(all.total);
        setRecent(recentResult.items);
        setTomorrow(tomorrowResult.items);
      })
      .finally(() => setLoading(false));
  }, [period]);
  const cards = [
      ["My total interviews", allTotal ?? "—", ClipboardList, "purple"],
      ["Scheduled in period", stats?.scheduled ?? "—", CalendarDays, "blue"],
      ["In progress", stats?.inProgress ?? "—", Clock3, "amber"],
      ["Selected / Placed", stats?.selected ?? "—", Trophy, "green"],
    ],
    periodLabel = rangeOptions.find(([key]) => key === period)?.[1];
  return (
    <>
      <div className="welcome">
        <div>
          <div className="bi-meta">
            <span className="eyebrow">{greeting.date} · CANDIDATE WORKSPACE</span>
            <span className="bi-live-clock" title="Live clock">
              <Clock3 size={13} />
              {now.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
              })}
            </span>
          </div>
          <h1>{greeting.title}</h1>
          <p>{greeting.message}</p>
        </div>
        <Link className="primary book-slot-cta" to="/interviews/new">
          + Book Your Slot
        </Link>
      </div>
      <div className="dashboard-period">
        <div>
          <strong>Dashboard period</strong>
          <span>Showing {periodLabel?.toLowerCase()}</span>
        </div>
        <div className="quickranges compactranges">
          {rangeOptions.map(([key, label]) => (
            <button
              key={key}
              className={period === key ? "active" : ""}
              onClick={() => setPeriod(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={loading ? "statgrid loadingstats" : "statgrid"}>
        {cards.map(([label, value, Icon, color]) => (
          <article className="stat" key={label}>
            <span className={`icon ${color}`}>
              <Icon />
            </span>
            <div>
              <strong>{value}</strong>
              <p>{label}</p>
            </div>
          </article>
        ))}
      </div>
      <TomorrowSchedule items={tomorrow} />
      <div className="user-overview-grid">
        <div className="dashgrid">
          <section className="panel">
            <div className="panelhead">
              <div>
                <h3>Recent interviews</h3>
                <p>Latest records from {periodLabel?.toLowerCase()}</p>
              </div>
              <Link to="/interviews">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            <div className="recent">
              {recent.length ? (
                recent.map((item) => (
                  <div className="recentrow" key={item._id}>
                    <div className="avatar soft">
                      {item.candidateName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="grow">
                      <strong>{item.candidateName}</strong>
                      <small>
                        {item.technology} · {item.companyName}
                      </small>
                    </div>
                    <div className="date">
                      <strong>
                        {new Date(item.interviewDate).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short" },
                        )}
                      </strong>
                      <small>{formatInterviewTime(item.interviewTime)}</small>
                    </div>
                    <span
                      className={`status ${item.status.toLowerCase().replace(" ", "-")}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="empty">No interviews in this period.</div>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panelhead">
              <div>
                <h3>Technology mix</h3>
                <p>Top categories for {periodLabel?.toLowerCase()}</p>
              </div>
            </div>
            <div className="bars">
              {stats?.technology?.length ? (
                stats.technology.map((item) => (
                  <div key={item._id}>
                    <div>
                      <span>{item._id}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <i>
                      <b
                        style={{
                          width: `${Math.max(12, (item.count / (stats.total || 1)) * 100)}%`,
                        }}
                      />
                    </i>
                  </div>
                ))
              ) : (
                <div className="empty">No analytics for this period.</div>
              )}
            </div>
          </section>
        </div>
        <InterviewCalendar role={user.role} />
      </div>
    </>
  );
}
