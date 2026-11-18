
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  BriefcaseBusiness,
  MapPin,
  ArrowRight,
  LoaderCircle,
  AlertCircle
} from "lucide-react";
import "../../styles/LatestJobs.css";

function LatestJobs() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    axios.get("http://127.0.0.1:8000/api/jobs/")
      .then((response) => {
        if (!active) return;

        const data = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        const publishedJobs = data.filter(
          (job) => job.status === "published"
        );

        setJobs(publishedJobs);
        setSelectedJob(publishedJobs[0] || null);
      })
      .catch(() => {
        if (active) {
          setError("Unable to load jobs. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="latest-jobs">
      <div className="jobs-container">

        <div className="jobs-section-heading">
          <div>
            <span className="jobs-eyebrow">
              OPEN POSITIONS
            </span>

            <h2>
              Latest <span>opportunities</span>
            </h2>

            <p className="jobs-subtitle">
              Explore available positions and find your next role.
            </p>
          </div>

          <Link to="/jobs" className="all-jobs-link">
            View all jobs <ArrowRight size={15} />
          </Link>
        </div>

        {loading && (
          <div className="jobs-feedback">
            <LoaderCircle size={20} className="jobs-spinner" />
            Loading opportunities...
          </div>
        )}

        {!loading && error && (
          <div className="jobs-feedback">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="jobs-feedback">
            No open positions available currently.
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <div className="jobs-browser">

            {/* LEFT: JOB LIST */}
            <div className="jobs-list-panel">

              <div className="jobs-list-header">
                <h3>Jobs for you</h3>
                <span>{jobs.length} available</span>
              </div>

              <div className="jobs-list">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    className={`job-list-card ${
                      selectedJob?.id === job.id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => setSelectedJob(job)}
                    aria-pressed={selectedJob?.id === job.id}
                  >
                    <div className="job-card-top">
                      <span className="job-type-badge">
                        <BriefcaseBusiness size={12} />
                        {job.department || "Open position"}
                      </span>

                      <ArrowRight size={16} />
                    </div>

                    <h3>{job.title}</h3>

                    <p className="job-card-department">
                      {job.department || "General"}
                    </p>

                    <p className="job-card-location">
                      <MapPin size={14} />
                      {job.location || "Location not specified"}
                    </p>

                    <span className="job-card-footer">
                      View position details
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: SELECTED JOB DETAILS */}
            <div className="job-preview-panel">

              {selectedJob && (
                <>
                  <div className="job-preview-header">

                    <span className="job-type-badge">
                      <BriefcaseBusiness size={12} />
                      {selectedJob.department || "Open position"}
                    </span>

                    <h2>{selectedJob.title}</h2>

                    <p className="preview-location">
                      <MapPin size={15} />
                      {selectedJob.location || "Location not specified"}
                    </p>

                    <div className="preview-actions">
                      <Link
                        to={`/apply/${selectedJob.id}`}
                        className="preview-apply-btn"
                      >
                        Apply Now
                        <ArrowRight size={16} />
                      </Link>

                      <Link
                        to={`/jobs/${selectedJob.id}`}
                        className="preview-details-btn"
                      >
                        Full Details
                      </Link>
                    </div>
                  </div>

                  <div className="job-preview-content">

                    <div className="preview-section">
                      <h3>Job Description</h3>
                      <p>
                        {selectedJob.description ||
                          "No description available."}
                      </p>
                    </div>

                    <div className="preview-section">
                      <h3>Requirements</h3>
                      <p>
                        {selectedJob.requirements ||
                          "No requirements specified."}
                      </p>
                    </div>

                  </div>
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default LatestJobs;
