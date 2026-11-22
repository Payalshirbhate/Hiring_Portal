import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { Search, BriefcaseBusiness, MapPin, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import "../styles/Jobs.css";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/jobs/")
      .then(({ data }) => {
        if (active) setJobs(Array.isArray(data) ? data : data?.results || []);
      })
      .catch(() => { if (active) setError("Unable to load jobs. Please try again later."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredJobs = jobs.filter((job) =>
    `${job.title || ""} ${job.department || ""} ${job.location || ""}`
      .toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <section className="jobs-page">
      <div className="jobs-page-container">
        <div className="jobs-heading">
          <span className="jobs-eyebrow">EXPLORE OPPORTUNITIES</span>
          <h1>Find your next <span>opportunity.</span></h1>
          <p>Discover open roles and take the next step in your career.</p>
        </div>

        <div className="jobs-toolbar">
          <div className="jobs-search-wrap">
            <Search size={19} aria-hidden="true" />
            <input
              className="jobs-search"
              type="search"
              placeholder="Search jobs, departments or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search jobs"
            />
          </div>
          <div className="jobs-count"><SlidersHorizontal size={16} /> {filteredJobs.length} {filteredJobs.length === 1 ? "position" : "positions"}</div>
        </div>

        {error && <p className="jobs-feedback jobs-error" role="alert">{error}</p>}
        {loading ? (
          <p className="jobs-feedback">Loading available positions...</p>
        ) : filteredJobs.length === 0 ? (
          <div className="jobs-empty"><BriefcaseBusiness size={28} /><h2>No jobs found</h2><p>Try another keyword or check back soon.</p></div>
        ) : (
          <div className="all-jobs-grid">
            {filteredJobs.map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-card-top">
                  <div className="job-card-icon"><BriefcaseBusiness size={20} /></div>
                  <span className="job-card-tag">Open position</span>
                </div>
                <h2>{job.title}</h2>
                <div className="job-card-meta">
                  <span><BriefcaseBusiness size={15} /> {job.department || "General"}</span>
                  <span><MapPin size={15} /> {job.location || "Not specified"}</span>
                </div>
                <div className="job-card-bottom">
                  <Link to={`/jobs/${job.id}`} className="job-card-link">View details <ArrowUpRight size={17} /></Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
