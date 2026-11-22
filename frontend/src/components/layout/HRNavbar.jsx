
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";

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
  ArrowLeft,
  Settings,
} from "lucide-react";
import "../../styles/HRNavbar.css";



const navigation = [
  {
    title: "Overview",
    path: "/hr/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Manage Jobs",
    path: "/hr/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Applicants",
    path: "/hr/applicants",
    icon: Users,
  },
];

export default function HRNavbar({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  const [profile, setProfile] = useState(null);

  // Fetch HR profile
  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      const token = sessionStorage.getItem("access");

      if (!token) return;

      try {
        const response = await api.get("/hr/profile/");

        if (active) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error("Unable to load HR profile:", error);
      }
    };

    fetchProfile();

    // Refresh navbar after saving profile in Settings
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener(
      "hr-profile-updated",
      handleProfileUpdate
    );

    return () => {
      active = false;
      window.removeEventListener(
        "hr-profile-updated",
        handleProfileUpdate
      );
    };
  }, []);

  const displayName = profile
    ? `${profile.first_name || ""} ${
        profile.last_name || ""
      }`.trim() || profile.username
    : "HR Administrator";

  // Logout
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

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="hr-mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`hr-sidebar ${
          collapsed ? "hr-sidebar-collapsed" : ""
        } ${
          mobileOpen ? "hr-sidebar-mobile-open" : ""
        }`}
      >

        {/* SIDEBAR BRAND */}
        <div className="hr-sidebar-brand">

          <div className="hr-brand-icon">
            <BriefcaseBusiness size={20} />
          </div>

         <div className="hr-brand-text">
          <strong>
            Hiring <span>Portal</span>
          </strong>
          <small>HR Workspace</small>
        </div>

          {/* COLLAPSE / EXPAND */}
          <button
            type="button"
            className="hr-sidebar-collapse"
            onClick={() =>
              setCollapsed((prev) => !prev)
            }
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

          {/* MOBILE CLOSE */}
          <button
            type="button"
            className="hr-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>

        </div>

        {/* SIDEBAR NAVIGATION */}
        
<nav className="hr-sidebar-navigation">
  <p className="hr-nav-label" aria-hidden={collapsed && !mobileOpen}>
    MAIN MENU
  </p>

  {navigation.map(({ title, path, icon: Icon }) => (
    <button
      key={path}
      type="button"
      className={`hr-nav-item ${
        pathname === path ? "hr-nav-active" : ""
      }`}
      onClick={() => goTo(path)}
      title={title}
    >
      <Icon size={19} />
      <span className="hr-nav-text">{title}</span>
    </button>
  ))}
</nav>

        {/* SETTINGS AND LOGOUT */}
        <div className="hr-sidebar-bottom">

          <button
            type="button"
            className={`hr-nav-item ${
              pathname === "/hr/settings"
                ? "hr-nav-active"
                : ""
            }`}
            onClick={() => goTo("/hr/settings")}
            title="Settings"
          >
            <Settings size={19} />
            <span className="hr-nav-text">Settings</span>
          </button>

          <button
            type="button"
            className="hr-nav-item hr-logout-item"
            onClick={() =>
              setShowLogoutConfirm(true)
            }
            title="Logout"
          >
            <LogOut size={19} />
            <span className="hr-nav-text">Logout</span>
          </button>

        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="hr-main-area">

        {/* TOPBAR */}
        <header className="hr-topbar">

          <div className="hr-topbar-left">

            <button
              type="button"
              className="hr-mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={21} />
            </button>

            <button
              type="button"
              className="hr-dashboard-back"
              onClick={() =>
                navigate("/hr/dashboard")
              }
              title="Go to Dashboard"
            >
              <ArrowLeft size={18} />
              <span>Dashboard</span>
            </button>

          </div>

          {/* PROFILE AND THEME */}
          <div className="hr-topbar-profile">

            

            <div className="hr-profile-info">
              <strong>{displayName}</strong>
              <span>Recruitment Team</span>
            </div>

            {/* HR PROFILE PICTURE */}
            <div className="hr-profile-avatar">
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt="HR Profile"
                  className="hr-avatar-image"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <UserRound size={19} />
              )}
            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <main className="hr-page-content">
          {children}
        </main>

      </div>

      {/* LOGOUT CONFIRMATION */}
      {showLogoutConfirm && (
        <div
          className="hr-logout-overlay"
          onClick={() =>
            setShowLogoutConfirm(false)
          }
        >
          <div
            className="hr-logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hr-logout-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="hr-logout-modal-icon">
              <LogOut size={23} />
            </div>

            <h3 id="hr-logout-title">
              Confirm Logout
            </h3>

            <p>
              Are you sure you want to log out
              of your HR account?
            </p>

            <div className="hr-logout-actions">

              <button
                type="button"
                className="hr-logout-cancel"
                onClick={() =>
                  setShowLogoutConfirm(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="hr-logout-confirm"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
