
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

import "../styles/HRLogin.css";

export default function HRLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post(
        "http://127.0.0.1:8000/api/hr/login/",
        {
          username: username.trim(),
          password
        }
      );

      sessionStorage.setItem("access", data.access);
      sessionStorage.setItem("refresh", data.refresh);

      navigate("/hr/dashboard", { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Invalid username or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="hr-login-page">

      {/* HEADER */}
      <header className="hr-login-header">

        <Link to="/" className="hr-login-brand">
          Hiring<span className="hr-login-accent">Portal</span>
        </Link>

        <Link to="/" className="hr-login-back">
          <ArrowLeft size={16} />
          Back to website
        </Link>

      </header>

      {/* LOGIN SECTION */}
      <div className="hr-login-container">

        <div className="hr-login-card">

          <p className="hr-login-eyebrow">
            HR WORKSPACE
          </p>

          <h1>Welcome back</h1>

          <p className="hr-login-subtitle">
            Sign in to access your recruitment dashboard.
          </p>

          <form onSubmit={handleLogin}>

            {/* USERNAME */}
            <div className="hr-login-field">
              <label htmlFor="hr-username">
                Username
              </label>

              <input
                id="hr-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>

            {/* PASSWORD */}
            <div className="hr-login-field">
              <label htmlFor="hr-password">
                Password
              </label>

              <div className="hr-login-password">
                <input
                  id="hr-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? <EyeOff size={18} />
                    : <Eye size={18} />
                  }
                </button>
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <p className="hr-login-error" role="alert">
                {error}
              </p>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="hr-login-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}

              {!loading && <ArrowRight size={17} />}
            </button>

          </form>

        </div>

        <p className="hr-login-help">
          Need access? Contact your system administrator.
        </p>

      </div>

      {/* FOOTER */}
      <footer className="hr-login-footer">
        © 2026 Hiring Portal. All rights reserved.
      </footer>

    </main>
  );
}
