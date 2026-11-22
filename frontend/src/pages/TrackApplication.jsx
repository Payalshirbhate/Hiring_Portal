
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

import {
  Search,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  AlertCircle,
  ClipboardList,
  MapPin,
  BriefcaseBusiness
} from "lucide-react";

import "../styles/TrackApplication.css";

function TrackApplication() {
  const [trackingId, setTrackingId] = useState("");
  const [email, setEmail] = useState("");
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();

    setError("");
    setApplication(null);
    setLoading(true);

    try {
      const response = await api.post(
        "/track/",
        {
          tracking_id: trackingId.trim(),
          email: email.trim()
        }
      );

      setApplication(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Unable to find your application. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status = "") =>
    status.replaceAll("_", " ");

  const getStatusStyle = (status) => {
    const styles = {
      applied: "status-blue",
      under_review: "status-purple",
      shortlisted: "status-yellow",
      on_hold: "status-orange",
      selected: "status-green",
      rejected: "status-red"
    };

    return styles[status] || "status-default";
  };

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "Date unavailable"
      : parsed.toLocaleString();
  };

  return (
    <main className="candidate-track-page">

      <div className="tracking-container">

        <Link to="/" className="tracking-back-link">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* PAGE HEADER */}

        <div className="tracking-header">

          <div className="tracking-header-icon">
            <ClipboardList size={24} />
          </div>

          <span className="tracking-eyebrow">
            APPLICATION TRACKING
          </span>

          <h1>
            Track Your <span>Application</span>
          </h1>

          <p>
            Enter your tracking ID and registered email
            address to check the latest status of your application.
          </p>

        </div>

        {/* TRACKING FORM */}

        <div className="tracking-card">

          <div className="tracking-card-heading">
            <h2>Check application status</h2>
            <p>
              Please enter the details provided when you applied.
            </p>
          </div>

          <form
            onSubmit={handleTrack}
            className="tracking-form"
          >

            <div className="tracking-input-group">
              <label htmlFor="tracking-id">
                Application Tracking ID
              </label>

              <input
                id="tracking-id"
                type="text"
                placeholder="Enter your tracking ID"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                required
              />
            </div>

            <div className="tracking-input-group">
              <label htmlFor="tracking-email">
                Registered Email Address
              </label>

              <input
                id="tracking-email"
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="tracking-error" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="form-track-button"
            >
              {loading ? (
                <>
                  <span className="form-loader" />
                  Checking application...
                </>
              ) : (
                <>
                  <Search size={17} />
                  Track Application
                  <ArrowRight size={17} />
                </>
              )}
            </button>

          </form>

          <div className="tracking-security">
            <ShieldCheck size={16} />
            <span>
              Your application details are verified using
              your tracking ID and email.
            </span>
          </div>

        </div>

        {/* APPLICATION RESULTS */}

        {application && (
          <div className="tracking-result">

            <div className="tracking-result-header">
              <div className="result-success-icon">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h2>Application Found</h2>
                <p>
                  Here is your current application status.
                </p>
              </div>
            </div>

            <div className="result-details">

              <div className="result-detail-item">
                <span>Tracking ID</span>
                <strong>{application.tracking_id}</strong>
              </div>

              <div className="result-detail-item">
                <span>Candidate Name</span>
                <strong>{application.candidate_name}</strong>
              </div>

              <div className="result-detail-item">
                <span>Current Status</span>

                <span
                  className={`status-badge ${getStatusStyle(
                    application.status
                  )}`}
                >
                  {formatStatus(application.status)}
                </span>
              </div>

              {application.job?.title && (
                <div className="result-detail-item">
                  <span>Applied Position</span>

                  <strong className="detail-with-icon">
                    <BriefcaseBusiness size={15} />
                    {application.job.title}
                  </strong>
                </div>
              )}

              {application.job?.location && (
                <div className="result-detail-item">
                  <span>Job Location</span>

                  <strong className="detail-with-icon">
                    <MapPin size={15} />
                    {application.job.location}
                  </strong>
                </div>
              )}

            </div>

            {/* STATUS HISTORY */}

            <div className="result-timeline">

              <h3>
                <Clock3 size={19} />
                Application History
              </h3>

              {application.status_history?.length > 0 ? (
                <div className="timeline-list">

                  {application.status_history.map(
                    (item, index) => (
                      <div
                        className="timeline-entry"
                        key={index}
                      >
                        <div className="timeline-marker" />

                        <div className="timeline-content">

                          <span
                            className={`status-badge ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {formatStatus(item.status)}
                          </span>

                          {item.candidate_note && (
                            <p>{item.candidate_note}</p>
                          )}

                          <small>
                            {formatDate(item.changed_at)}
                          </small>

                        </div>
                      </div>
                    )
                  )}

                </div>
              ) : (
                <p className="timeline-empty">
                  No application history available yet.
                </p>
              )}

            </div>

          </div>
        )}

      </div>
    </main>
  );
}

export default TrackApplication;
