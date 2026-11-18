
import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Menu,
  X,
  ArrowUpRight
} from "lucide-react";
import "../../styles/Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="nav-container">

        <Link
          to="/"
          className="nav-brand"
          onClick={closeMenu}
        >
          <span className="nav-brand-icon">
            <BriefcaseBusiness size={19} strokeWidth={2} />
          </span>

          <span>Hiring Portal</span>
        </Link>

        <button
          type="button"
          className="nav-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <div className={`nav-menu ${menuOpen ? "open" : ""}`}>

          <div className="nav-links">
            <NavLink
              to="/"
              end
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive ? "nav-active" : ""
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/jobs"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive ? "nav-active" : ""
              }
            >
              Find Jobs
            </NavLink>

            <NavLink
              to="/track"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive ? "nav-active" : ""
              }
            >
              Track Application
            </NavLink>
          </div>

          <Link
            to="/hr/login"
            className="hr-login-btn"
            onClick={closeMenu}
          >
            HR Login
            <ArrowUpRight size={15} />
          </Link>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
