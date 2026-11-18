
import React from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness } from "lucide-react";
import "../../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-main">

          <div className="footer-about">
            <Link to="/" className="footer-brand">
              <span className="footer-brand-icon">
                <BriefcaseBusiness size={18} />
              </span>
              Hiring Portal
            </Link>

            <p>
              Connecting talented people with meaningful
              career opportunities.
            </p>
          </div>

          <div className="footer-navigation">
            <h3>Quick Links</h3>

            <div className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/jobs">Find Jobs</Link>
              <Link to="/track">Track Application</Link>
            </div>
          </div>

          <div className="footer-navigation">
            <h3>For Employers</h3>

            <div className="footer-links">
              <Link to="/hr/login">HR Portal</Link>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Hiring Portal.
            All rights reserved.
          </p>

          <span>Built for better opportunities.</span>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
