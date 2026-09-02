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
  Sparkles,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  KeyRound,
  Sheet,
} from "lucide-react";
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
  const has = (permission) =>
    user.role !== "staff" || user.permissions?.[permission] !== false;
  const links = [
    ...(has("dashboard") ? [["/", LayoutDashboard, "Overview"]] : []),
    ...(has("interviews") ? [["/interviews", CalendarDays, "Interviews"]] : []),
    ...(user.role !== "admin" && has("createInterview")
      ? [["/interviews/new", FilePlus2, "Book Your Slot"]]
      : []),
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
          <span className="brandmark">
            <Sparkles size={21} />
          </span>
          <span className="brandtext">
            Smart<span>Hire</span>
          </span>
          <button className="mobile-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <button
          className="collapse-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span>{collapsed ? "Expand" : "Collapse sidebar"}</span>
        </button>
        <nav>
          {links.map(([to, Icon, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
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
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <main>
        <header className="topbar">
          <button className="menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <h2>Interview workspace</h2>
            <p>Plan better. Hire smarter.</p>
          </div>
          <div className="topactions">
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
