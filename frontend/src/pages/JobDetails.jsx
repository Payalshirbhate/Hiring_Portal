import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, MapPin, FileText, ClipboardList } from "lucide-react";
import "../styles/JobDetails.css";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get(`/jobs/${id}/`)
      .then(({ data }) => { if (active) setJob(data); })
      .catch(() => { if (active) setError("This job could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="job-details-state">Loading job details...</div>;
  if (error || !job) return <div className="job-details-state"><p>{error || "Job not found."}</p><Link to="/jobs">Back to jobs</Link></div>;

  return (
    <section className="job-details">
      <div className="details-container">
        <Link to="/jobs" className="details-back"><ArrowLeft size={16} /> All jobs</Link>
        <div className="details-header">
          <div className="details-header-icon"><BriefcaseBusiness size={23} /></div>
          <div className="details-header-copy">
            <span className="details-eyebrow">JOB OPPORTUNITY</span>
            <h1>{job.title}</h1>
            <div className="details-meta">
              <span><BriefcaseBusiness size={16} /> {job.department || "General"}</span>
              <span><MapPin size={16} /> {job.location || "Not specified"}</span>
            </div>
          </div>
        </div>
        <div className="details-body">
          <div className="detail-section">
            <h2><FileText size={19} /> Job description</h2>
            <p>{job.description || "No description provided."}</p>
          </div>
          <div className="detail-section">
            <h2><ClipboardList size={19} /> Requirements</h2>
            <p>{job.requirements || "No requirements specified."}</p>
          </div>
        </div>
        <div className="details-footer">
          <p>Interested in this opportunity?</p>
          <Link to={`/apply/${job.id}`} className="apply-btn">Apply now <ArrowRight size={17} /></Link>
        </div>
      </div>
    </section>
  );
}
