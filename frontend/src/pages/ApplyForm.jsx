
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import "../styles/ApplyForm.css";

function ApplyForm() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    candidate_name: "",
    email: "",
    phone: "",
    resume: null,
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}/`);
        setJob(response.data);
      } catch {
        setError("Unable to load job details.");
      } finally {
        setLoadingJob(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError("");

    if (
      !formData.resume ||
      formData.resume.size > 5 * 1024 * 1024
    ) {
      setError("Please upload a resume smaller than 5 MB.");
      setSubmitting(false);
      return;
    }

    const data = new FormData();

    data.append("job", id);
    data.append("candidate_name", formData.candidate_name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("resume", formData.resume);

    try {
      const response = await api.post("/applications/", data);

      console.log("Application response:", response.data);

      const trackingId = response.data?.tracking_id;

      if (!trackingId) {
        setError(
          "Application response did not contain a tracking ID. " +
          "Please check your application status before submitting again."
        );
        return;
      }

      setSuccess({
        tracking_id: trackingId,
        email: formData.email,
        name: formData.candidate_name,
      });

    } catch (err) {
  console.log("Application Error:", err);
  console.log("Backend Error:", err.response?.data);

  const data = err.response?.data;

  if (data?.non_field_errors) {
    setError(
      "You have already applied for this job using this email."
    );
  } else if (data?.error) {
    setError(data.error);
  } else if (data && Object.keys(data).length > 0) {
    setError(
      Object.entries(data)
        .map(([field, messages]) =>
          `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`
        )
        .join(" | ")
    );
  } else {
    setError(
      `Unable to submit application. Server returned ${err.response?.status || "a network error"}.`
    );
  }
}
  };

  if (loadingJob) {
    return (
      <section className="apply-page">
        <div className="apply-container">
          <p>Loading job details...</p>
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="apply-page">
        <div className="apply-container">
          <p>{error || "Job not found."}</p>
          <Link to="/jobs">Back to Jobs</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="apply-page">
      <div className="apply-container">

        {success ? (
          <div className="apply-success" role="status">
            <div className="success-icon">✓</div>

            <h1>Application Submitted Successfully!</h1>

            <p>
              Thank you, {success.name}! Your application
              for <strong>{job.title}</strong> has been received.
            </p>

            <div className="tracking-box">
              <span>Your Tracking ID</span>
              <h2>{success.tracking_id}</h2>

              <button
                type="button"
                onClick={() =>
                  navigator.clipboard.writeText(
                    success.tracking_id
                  )
                }
              >
                Copy Tracking ID
              </button>
            </div>

            <p>
              Please save your tracking ID. You can use it
              with {success.email} to check your status.
            </p>

            <p>
              A confirmation email will be sent if
              email delivery is available.
            </p>

            <Link to="/track" className="apply-track-link">
              Track Application
            </Link>
          </div>
        ) : (
          <>
            <div className="apply-job-info">
              <span className="apply-label">
                JOB APPLICATION
              </span>

              <h1>Apply for {job.title}</h1>

              <div className="apply-job-meta">
                <span>🏢 {job.department}</span>
                <span>📍 {job.location}</span>
              </div>

              <p>
                Complete your details to submit your application.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Full Name</label>
              <input
                type="text"
                name="candidate_name"
                value={formData.candidate_name}
                onChange={handleChange}
                required
              />

              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <label>
                Upload Resume (PDF/DOCX, Max 5 MB)
              </label>
              <input
                type="file"
                name="resume"
                accept=".pdf,.docx"
                onChange={handleChange}
                required
              />

              {error && (
                <p className="apply-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || job.status !== "published"}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Application"}
              </button>

              {job.status !== "published" && (
                <p className="apply-error">
                  This job is not accepting applications.
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default ApplyForm;
