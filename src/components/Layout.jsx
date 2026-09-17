import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  FilePlus2,
  Users,
  History,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  KeyRound,
  Sheet,
} from "lucide-react";
import BookingNotifications from "./BookingNotifications";
import { useAuth } from "../App";

export default function Layout() {
  const { user, logout } = useAuth(),
    [open, setOpen] = useState(false),
    [collapsed, setCollapsed] = useState(
      () => localStorage.getItem("sidebar-collapsed") === "true",
    );
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem("theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);
  useEffect(() => {
    const media = matchMedia("(max-width: 1024px)");
    const syncLayout = (event) => {
      if (!event.matches) setOpen(false);
    };
    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);
  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    const closeOnEscape = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("nav-open");
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  const has = (permission) =>
    user.role !== "staff" || user.permissions?.[permission] !== false;
  const toggleSidebarFromLogo = () => {
    if (matchMedia("(max-width: 1024px)").matches) return setOpen(false);
    setCollapsed((current) => !current);
  };
  const links = [
    ...(has("dashboard") ? [["/", LayoutDashboard, "Overview"]] : []),
    ...(has("interviews") ? [["/interviews", CalendarDays, "Interviews"]] : []),
    ...(user.role !== "admin" && has("createInterview")
      ? [["/interviews/new", FilePlus2, "Book Your Slot"]]
      : []),
    ...(["admin", "staff"].includes(user.role) ? [["/booking-requests", CalendarDays, user.role === "admin" ? "Booking approvals" : "My requests"]] : []),
    ...(user.role !== "user" && has("googleSheet")
      ? [["/google-sheet", Sheet, "Google responses"]]
      : []),
    ...(["admin", "staff", "user"].includes(user.role)
      ? [["/change-password", KeyRound, "Change password"]]
      : []),
    ...(user.role === "admin"
      ? [
          ["/users", Users, "Users & staff"],
          ["/audit", History, "Activity log"],
        ]
      : []),
  ];
  return (
    <div className={collapsed ? "shell sidebar-collapsed" : "shell"}>
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <button
            type="button"
            className="brand-toggle"
            onClick={toggleSidebarFromLogo}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="brand-symbol" aria-hidden="true">
              <img src="/smarthire-full.png" alt="" />
            </span>
            <span className="brand-word"><span>Smart</span><b>Hire</b></span>
          </button>
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X />
          </button>
        </div>
        <nav>
          {links.map(([to, Icon, label]) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setOpen(false)}
              title={collapsed ? label : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="profile">
          <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
          <div className="profiletext">
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button title="Sign out" onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
      <main>
        <header className="topbar">
          <button className="menu" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open}>
            <Menu />
          </button>
          <div>
            <h2>Interview workspace</h2>
            <p>Plan better. Hire smarter.</p>
          </div>
          <div className="topactions">
            {["admin", "staff"].includes(user.role) && <BookingNotifications key={user.id || user._id} role={user.role} userId={user.id || user._id}/>}
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={`Use ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </button>
            <span className={`role ${user.role}`}>{user.role}</span>
          </div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
