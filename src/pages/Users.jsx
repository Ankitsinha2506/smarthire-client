import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";
import {
  UserPlus,
  X,
  Search,
  UsersRound,
  CalendarCheck2,
  Trophy,
  Activity,
  ShieldCheck,
  Settings2,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
function PwdInput({ value, onChange, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pwd-wrap">
      <input
        required
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        minLength={minLength}
      />
      <button
        type="button"
        className="pwd-toggle"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

const permissionOptions = [
  ["dashboard", "Dashboard", "View staff dashboard and analytics"],
  ["interviews", "Interview section", "View interview records and details"],
  ["createInterview", "Create schedules", "Add new interview schedules"],
  ["exportInterviews", "Export Excel", "Download filtered interview data"],
  ["selfAssign", "Self support", "Mark themselves as interview support"],
  ["googleSheet", "Google Sheet data", "View linked Google Form responses"],
];
const defaultPermissions = Object.fromEntries(
  permissionOptions.map(([key]) => [key, true]),
);
const totalPermissionSlots = permissionOptions.length + 1;
const nameOnly = (value) => value.replace(/[^A-Za-z\s]/g, "");
const mobileOnly = (value) => value.replace(/\D/g, "").slice(0, 10);

function enabledPermissionCount(permissions = {}) {
  const value = { ...defaultPermissions, ...permissions };
  const enabledFeatures = permissionOptions.filter(
    ([key]) => value[key] !== false,
  ).length;

  // Google Sheet visibility is the seventh configurable access setting.
  // It only applies while Google Sheet access itself is enabled.
  const hasSheetVisibility =
    value.googleSheet !== false && ["today", "all"].includes(value.googleSheetScope || "today");

  return enabledFeatures + Number(hasSheetVisibility);
}

export default function Users() {
  const [users, setUsers] = useState([]),
    [candidates, setCandidates] = useState([]),
    [query, setQuery] = useState(""),
    [show, setShow] = useState(false),
    [editingStaff, setEditingStaff] = useState(null);
  const [data, setData] = useState({
      name: "",
      email: "",
      password: "",
      phone: "",
      permissions: { ...defaultPermissions, googleSheetScope: "today" },
    }),
    [error, setError] = useState("");
  const load = () =>
    Promise.all([api("/admin/users"), api("/admin/candidate-summary")]).then(
      ([u, c]) => {
        setUsers(u);
        setCandidates(c);
      },
    );
  useEffect(() => {
    load();
  }, []);
  const visible = useMemo(
    () =>
      candidates.filter((c) =>
        `${c.name} ${c.email} ${c.phone}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [candidates, query],
  );
  const totals = useMemo(
    () => ({
      candidates: candidates.length,
      interviews: candidates.reduce((n, c) => n + c.totalInterviews, 0),
      selected: candidates.reduce((n, c) => n + c.selected, 0),
      active: candidates.filter((c) => c.active).length,
    }),
    [candidates],
  );

  async function create(event) {
    event.preventDefault();
    setError("");
    if (!/^[A-Za-z\s]+$/.test(data.name.trim()))
      return setError("Please enter a valid name (letters and spaces only).");
    if (!/^\d{10}$/.test(data.phone))
      return setError("Please enter a valid 10-digit phone number.");
    try {
      await api("/admin/staff", { method: "POST", body: JSON.stringify(data) });
      setShow(false);
      setData({
        name: "",
        email: "",
        password: "",
        phone: "",
        permissions: { ...defaultPermissions, googleSheetScope: "today" },
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  async function active(id, value) {
    await api("/admin/users/" + id, {
      method: "PATCH",
      body: JSON.stringify({ active: value }),
    });
    load();
  }
  async function savePermissions(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/admin/users/" + editingStaff._id, {
        method: "PATCH",
        body: JSON.stringify({ permissions: editingStaff.permissions }),
      });
      setEditingStaff(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    document.body.style.overflow = show || editingStaff ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [show, editingStaff]);

  return (
    <>
      <div className="pagehead">
        <div>
          <span className="eyebrow">CANDIDATE ANALYTICS</span>
          <h1>Candidate interview counts</h1>
          <p>
            See exactly how many interviews every registered candidate has
            attended.
          </p>
        </div>
        <button className="primary" onClick={() => setShow(true)}>
          <UserPlus size={18} /> Add staff
        </button>
      </div>
      <div className="statgrid adminstats">
        <Mini
          icon={UsersRound}
          label="Registered candidates"
          value={totals.candidates}
          color="purple"
        />
        <Mini
          icon={CalendarCheck2}
          label="Total interviews"
          value={totals.interviews}
          color="blue"
        />
        <Mini
          icon={Trophy}
          label="Total selections"
          value={totals.selected}
          color="green"
        />
        <Mini
          icon={Activity}
          label="Active candidates"
          value={totals.active}
          color="amber"
        />
      </div>
      <section className="panel tablepanel candidatepanel">
        <div className="panelhead">
          <div>
            <h3>Candidate performance</h3>
            <p>Interview totals are linked to each candidate login</p>
          </div>
          <label className="search compact">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates…"
            />
          </label>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Mobile</th>
                <th>Total interviews</th>
                <th>Scheduled</th>
                <th>In progress</th>
                <th>Selected</th>
                <th>Last interview</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {visible.length ? (
                visible.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div className="person">
                        <span>{c.name.slice(0, 2).toUpperCase()}</span>
                        <div>
                          <strong>{c.name}</strong>
                          <small>{c.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{c.phone}</td>
                    <td>
                      <span className="countpill total">
                        {c.totalInterviews}
                      </span>
                    </td>
                    <td>
                      <span className="countpill">{c.scheduled}</span>
                    </td>
                    <td>
                      <span className="countpill progress">{c.inProgress}</span>
                    </td>
                    <td>
                      <span className="countpill success">{c.selected}</span>
                    </td>
                    <td>
                      {c.lastInterview
                        ? new Date(c.lastInterview).toLocaleDateString(
                            "en-IN",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )
                        : "No interviews yet"}
                    </td>
                    <td>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={c.active}
                          onChange={(e) => active(c._id, e.target.checked)}
                        />
                        <i />
                      </label>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty">
                    No candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel tablepanel staffpanel">
        <div className="panelhead">
          <div>
            <h3>Admin & staff accounts</h3>
            <p>Manage internal workspace access</p>
          </div>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Last login</th>
                <th>Password activity</th>
                <th>Permissions</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((u) => u.role !== "user")
                .map((u) => {
                  const passwordDate = u.passwordResetAt || u.passwordChangedAt;
                  return (
                    <tr key={u._id}>
                      <td>
                        <div className="person">
                          <span>{u.name.slice(0, 2).toUpperCase()}</span>
                          <div>
                            <strong>{u.name}</strong>
                            <small>{u.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role ${u.role}`}>{u.role}</span>
                      </td>
                      <td>{u.phone || "—"}</td>
                      <td>
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleString("en-IN")
                          : "Never"}
                      </td>
                      <td>
                        {u.role === "staff" && passwordDate ? (
                          <span className="password-activity">
                            <strong>
                              {u.passwordResetAt ? "Reset" : "Changed"}
                            </strong>
                            <small>
                              {new Date(passwordDate).toLocaleString("en-IN")}
                            </small>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {u.role === "staff" ? (
                          <button
                            className="permission-button"
                            onClick={() =>
                              setEditingStaff({
                                ...u,
                                permissions: {
                                  ...defaultPermissions,
                                  ...u.permissions,
                                },
                              })
                            }
                          >
                            <Settings2 size={15} /> Manage{" "}
                            <span>
                              {enabledPermissionCount(u.permissions)}/
                              {totalPermissionSlots}
                            </span>
                          </button>
                        ) : (
                          <span className="admin-access">
                            <ShieldCheck size={15} /> Full access
                          </span>
                        )}
                      </td>
                      <td>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={u.active}
                            onChange={(e) => active(u._id, e.target.checked)}
                          />
                          <i />
                        </label>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>
      {show && createPortal(
        <div
          className="modalback permission-modalback"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setShow(false)}
        >
          <form
            className="modal permission-modal create-staff-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-staff-title"
            onSubmit={create}
          >
            <button
              type="button"
              className="modalclose"
              aria-label="Close dialog"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setShow(false);
              }}
            >
              <X />
            </button>
            <div className="pm-head">
              <span className="eyebrow">NEW TEAM MEMBER</span>
              <h2 id="create-staff-title">Create staff account</h2>
              <p>Choose exactly which workspace features this staff member can use.</p>
            </div>
            <div className="pm-body">
              {error && <div className="alert">{error}</div>}
              <div className="pm-form-grid">
                <label>Full name
                  <input required pattern="[A-Za-z ]+" value={data.name} onChange={(e) => setData({ ...data, name: nameOnly(e.target.value) })} />
                </label>
                <label>Email
                  <input required type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
                </label>
                <label>Mobile
                  <input required inputMode="numeric" maxLength="10" value={data.phone} onChange={(e) => setData({ ...data, phone: mobileOnly(e.target.value) })} />
                </label>
                <label>Temporary password
                  <PwdInput minLength={8} value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
                </label>
              </div>
              <PermissionChecks value={data.permissions} set={(permissions) => setData({ ...data, permissions })} />
            </div>
            <div className="pm-footer">
              <button className="primary wide">Create staff account</button>
            </div>
          </form>
        </div>,
        document.body,
      )}
      {editingStaff && createPortal(
        <div
          className="modalback permission-modalback"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setEditingStaff(null)}
        >
          <form
            className="modal permission-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-access-title"
            onSubmit={savePermissions}
          >
            <button
              type="button"
              className="modalclose"
              aria-label="Close dialog"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setEditingStaff(null);
              }}
            >
              <X />
            </button>
            <div className="pm-head">
              <span className="eyebrow">STAFF ACCESS</span>
              <h2 id="staff-access-title">{editingStaff.name}</h2>
              <p>Changes apply to this staff account after saving.</p>
            </div>
            <div className="pm-body">
              {error && <div className="alert">{error}</div>}
              <PermissionChecks
                value={editingStaff.permissions}
                set={(permissions) => setEditingStaff({ ...editingStaff, permissions })}
              />
            </div>
            <div className="pm-footer">
              <button className="primary wide"><ShieldCheck size={17} /> Save permissions</button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </>
  );
}

function Mini({ icon: Icon, label, value, color }) {
  return (
    <article className="stat">
      <span className={`icon ${color}`}>
        <Icon />
      </span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </article>
  );
}
function PermissionChecks({ value, set }) {
  return (
    <div className="permission-field">
      <span className="fieldlabel">Feature access</span>
      <div className="permission-grid">
        {permissionOptions.map(([key, label, description]) => (
          <label className={value[key] !== false ? "selected" : ""} key={key}>
            <input
              type="checkbox"
              checked={value[key] !== false}
              onChange={(event) =>
                set({ ...value, [key]: event.target.checked })
              }
            />
            <i>{value[key] !== false && <CheckCircle2 />}</i>
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </label>
        ))}
      </div>
      {value.googleSheet !== false && (
        <label className="sheet-scope">
          Google Sheet visibility
          <select
            value={value.googleSheetScope || "today"}
            onChange={(event) =>
              set({ ...value, googleSheetScope: event.target.value })
            }
          >
            <option value="today">Today's responses only</option>
            <option value="all">All responses</option>
          </select>
        </label>
      )}
    </div>
  );
}
