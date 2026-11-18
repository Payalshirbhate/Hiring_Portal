import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import "../../styles/HRNavbar.css";

const navigation = [
  { title: "Overview", path: "/hr/dashboard", icon: LayoutDashboard },
  { title: "Manage Jobs", path: "/hr/jobs", icon: BriefcaseBusiness },
  { title: "Applicants", path: "/hr/applicants", icon: Users },
];

export default function HRNavbar({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    sessionStorage.removeItem("access");
    sessionStorage.removeItem("refresh");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.replace("/hr/login");
  };

  const goTo = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className="hr-layout">
      {mobileOpen && (
        <div className="hr-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`hr-sidebar ${collapsed ? "hr-sidebar-collapsed" : ""} ${mobileOpen ? "hr-sidebar-mobile-open" : ""}`}>
        <div className="hr-sidebar-brand">
          <div className="hr-brand-icon"><BriefcaseBusiness size={20} /></div>
          {(!collapsed || mobileOpen) && (
            <div className="hr-brand-text">
              <strong>Hiring <span>Portal</span></strong>
              <small>HR Workspace</small>
            </div>
          )}
          <button
            type="button"
            className="hr-sidebar-collapse"
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button type="button" className="hr-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close sidebar">
            <X size={19} />
          </button>
        </div>

        <nav className="hr-sidebar-navigation">
          {(!collapsed || mobileOpen) && <p className="hr-nav-label">MAIN MENU</p>}
          {navigation.map(({ title, path, icon: Icon }) => (
            <button
              key={path}
              type="button"
              className={`hr-nav-item ${pathname === path ? "hr-nav-active" : ""}`}
              onClick={() => goTo(path)}
              title={title}
            >
              <Icon size={19} />
              {(!collapsed || mobileOpen) && <span>{title}</span>}
            </button>
          ))}
        </nav>

        <div className="hr-sidebar-bottom">
          <button
            type="button"
            className="hr-nav-item hr-logout-item"
            onClick={() => setShowLogoutConfirm(true)}
            title="Logout"
          >
            <LogOut size={19} />
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="hr-main-area">
        <header className="hr-topbar">
          <div className="hr-topbar-left">
            <button type="button" className="hr-mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open sidebar">
              <Menu size={21} />
            </button>
            <div className="hr-topbar-heading">
              <h2>HR Workspace</h2>
              <p>Hiring Portal / {navigation.find((item) => item.path === pathname)?.title || "Overview"}</p>
            </div>
          </div>
          <div className="hr-topbar-profile">
            <div className="hr-profile-info">
              <strong>HR Administrator</strong>
              <span>Recruitment Team</span>
            </div>
            <div className="hr-profile-avatar"><UserRound size={19} /></div>
          </div>
        </header>
        <main className="hr-page-content">{children}</main>
      </div>

      {showLogoutConfirm && (
        <div className="hr-logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div
            className="hr-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hr-logout-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="hr-logout-modal-icon"><LogOut size={23} /></div>
            <h3 id="hr-logout-title">Confirm Logout</h3>
            <p>Are you sure you want to log out of your HR account?</p>
            <div className="hr-logout-actions">
              <button type="button" className="hr-logout-cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button type="button" className="hr-logout-confirm" onClick={confirmLogout}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
