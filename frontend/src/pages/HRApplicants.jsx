
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Users,
  Search,
  ArrowLeft,
  UserRound,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Eye,
  Download,
} from "lucide-react";
import HRNavbar from "../components/layout/HRNavbar";

const API_URL = "http://127.0.0.1:8000/api/hr/applications/";

function HRApplicants() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [error, setError] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [candidateNote, setCandidateNote] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const token = sessionStorage.getItem("access");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    if (!token) {
      navigate("/hr/login");
      return;
    }

    fetchData();
  }, []);

  // Fetch applications and jobs
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [applicationResponse, jobResponse] = await Promise.all([
        axios.get(API_URL, config),
        axios.get("http://127.0.0.1:8000/api/jobs/", config),
      ]);

      const applicationData = applicationResponse.data;
      const jobData = jobResponse.data;

      setApplications(
        Array.isArray(applicationData)
          ? applicationData
          : applicationData.results || []
      );

      setJobs(
        Array.isArray(jobData)
          ? jobData
          : jobData.results || []
      );

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        sessionStorage.clear();
        navigate("/hr/login");
      } else {
        setError("Unable to load applications. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset filters and refresh applications
  const handleRefresh = () => {
    setSearch("");
    setStatusFilter("all");
    setSelectedApplication(null);
    fetchData();
  };

  // Get job title
  const getJobTitle = (jobId) => {
    const job = jobs.find((item) => item.id === jobId);
    return job ? job.title : `Job #${jobId}`;
  };

  // Open applicant details
  const handleViewDetails = (app) => {
    setSelectedApplication(app);
    setNewStatus(app.status);
    setCandidateNote("");
    setInternalNote("");
  };

  // Update application status
  const handleStatusUpdate = async () => {
    if (!selectedApplication || !newStatus) {
      return;
    }

    try {
      setUpdating(true);

      await axios.patch(
        `${API_URL}${selectedApplication.id}/status/`,
        {
          status: newStatus,
          candidate_note: candidateNote,
          internal_note: internalNote,
        },
        config
      );

      alert("Application status updated successfully!");

      setSelectedApplication(null);
      setCandidateNote("");
      setInternalNote("");

      await fetchData();

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        sessionStorage.clear();
        navigate("/hr/login");
      } else {
        alert(
          err.response?.data?.error ||
          "Unable to update application status."
        );
      }
    } finally {
      setUpdating(false);
    }
  };

  // Retrieve resume through the HR-only endpoint (JWT required).
  const handleResume = async (mode) => {
    if (!selectedApplication?.id || resumeLoading) return;

    try {
      setResumeLoading(true);
      const response = await axios.get(
        `${API_URL}${selectedApplication.id}/resume/`,
        { ...config, responseType: "blob" }
      );

      const rawName = selectedApplication.resume || "candidate_resume.pdf";
      const filename = decodeURIComponent(
        rawName.split("?")[0].split("/").pop() || "candidate_resume.pdf"
      );
      const isPdf = filename.toLowerCase().endsWith(".pdf");
      const fileBlob = new Blob([response.data], {
        type: isPdf
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const fileUrl = URL.createObjectURL(fileBlob);

      if (mode === "view" && isPdf) {
        // Opened from a click; popup blockers may require allowing popups.
        window.open(fileUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(fileUrl), 60000);
      } else {
        // DOCX files are downloaded because browsers don't reliably preview them.
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
      }
    } catch (err) {
      console.error("Resume request failed:", err);
      if (err.response?.status === 401) {
        sessionStorage.removeItem("access");
        sessionStorage.removeItem("refresh");
        navigate("/hr/login");
      } else {
        alert("Unable to access resume. Please try again.");
      }
    } finally {
      setResumeLoading(false);
    }
  };

  // Search and filter applications
  const filteredApplications = applications.filter((app) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      app.candidate_name?.toLowerCase().includes(searchText) ||
      app.email?.toLowerCase().includes(searchText) ||
      app.tracking_id?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Status badge colors
  const statusClasses = {
    applied: "bg-blue-100 text-blue-700",
    under_review: "bg-yellow-100 text-yellow-800",
    shortlisted: "bg-green-100 text-green-700",
    on_hold: "bg-orange-100 text-orange-700",
    selected: "bg-purple-100 text-purple-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <HRNavbar>
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* Header */}
      <header className="bg-[#151515] text-white px-5 sm:px-8 py-5 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          HIRING <span className="text-yellow-400">PORTAL</span>
        </h1>

        <button
          onClick={() => navigate("/hr/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-yellow-400 transition"
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-5">

        {/* Page heading */}
        <section className="dashboard-enter flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-yellow-600 text-sm font-semibold tracking-wider">
              TALENT MANAGEMENT
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              Applicants
            </h2>

            <p className="text-gray-500 mt-2">
              Review candidate applications and manage their progress.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3">
            <Users className="text-yellow-600" size={20} />

            <span className="font-semibold text-gray-800">
              {applications.length} Applications
            </span>
          </div>
        </section>

        {/* Search and filters */}
        <section className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col md:flex-row gap-4">

            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate, email or tracking ID..."
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-yellow-400"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="under_review">Under Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="on_hold">On Hold</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-yellow-50 transition disabled:opacity-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <p className="mt-5 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
            {error}
          </p>
        )}

        {/* Applicants */}
        <section className="mt-8">

          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900">
              Candidate Applications
            </h3>

            <span className="text-sm text-gray-500">
              {filteredApplications.length} results
            </span>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-500">
              Loading applications...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Users size={40} className="mx-auto text-gray-300 mb-4" />

              <h3 className="font-semibold text-gray-800">
                No applicants found
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Try another search or status filter.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-3">

              {filteredApplications.map((app) => (
                <article
                  key={app.id}
                  className="dashboard-card bg-white rounded-lg border border-gray-200 shadow-sm p-4"
                >

                  <div className="flex justify-between items-start gap-3">

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center">
                        <UserRound size={18} className="text-yellow-700" />
                      </div>

                      <div>
                        <h4 className="font-bold text-gray-900">
                          {app.candidate_name}
                        </h4>

                        <p className="text-xs text-gray-500 mt-1">
                          {app.tracking_id}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${statusClasses[app.status] || "bg-gray-100 text-gray-600"}`}>
                      {app.status?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-2 mt-3 text-sm text-gray-600">

                    <p className="flex items-center gap-2">
                      <FileText size={16} />
                      {getJobTitle(app.job)}
                    </p>

                    <p className="flex items-center gap-2">
                      <Mail size={16} />
                      {app.email}
                    </p>

                    <p className="flex items-center gap-2">
                      <Phone size={16} />
                      {app.phone}
                    </p>

                  </div>

                  <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center gap-3">

                    <span className="text-xs text-gray-400">
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => handleViewDetails(app)}
                      className="flex items-center gap-2 bg-[#171717] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-yellow-400 hover:text-black transition"
                    >
                      <Eye size={16} />
                      View Details
                    </button>

                  </div>

                </article>
              ))}

            </div>
          )}
        </section>

        {/* Applicant details modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl dashboard-enter">

              <div className="bg-[#171717] text-white p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">
                    Applicant Details
                  </h3>

                  <p className="text-sm text-gray-400 mt-1">
                    {selectedApplication.tracking_id}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-yellow-400"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5">

                <div>
                  <p className="text-xs text-gray-500">Candidate Name</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedApplication.candidate_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedApplication.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedApplication.phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Applied For</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {getJobTitle(selectedApplication.job)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Current Status</p>

                  <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${statusClasses[selectedApplication.status] || "bg-gray-100 text-gray-600"}`}>
                    {selectedApplication.status?.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Resume</p>

                  {selectedApplication.resume ? (
                    <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-3 break-all">
                        <FileText size={18} className="text-yellow-600 shrink-0" />
                        <span>{selectedApplication.resume.split("?")[0].split("/").pop()}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleResume("view")}
                          disabled={resumeLoading}
                          className="flex items-center gap-2 rounded-lg bg-[#171717] px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                        >
                          <Eye size={16} /> View Resume
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResume("download")}
                          disabled={resumeLoading}
                          className="flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-50"
                        >
                          <Download size={16} /> Download Resume
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {resumeLoading ? "Loading resume..." : "PDF opens in a new tab. DOCX downloads for viewing."}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">
                      Resume information unavailable.
                    </p>
                  )}
                </div>

                {/* Update Application Status */}
                <div className="border-t pt-5 space-y-4">

                  <h3 className="font-bold text-gray-900">
                    Update Application Status
                  </h3>

                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-400"
                  >
                    <option value="applied">Applied</option>
                    <option value="under_review">Under Review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="on_hold">On Hold</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <textarea
                    value={candidateNote}
                    onChange={(e) => setCandidateNote(e.target.value)}
                    placeholder="Candidate-visible note..."
                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-yellow-400"
                    rows="3"
                  />

                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Internal HR note (not visible to candidate)..."
                    className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-yellow-400"
                    rows="3"
                  />

                  <button
                    onClick={handleStatusUpdate}
                    disabled={updating}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-3 rounded-xl transition disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Update Status"}
                  </button>

                </div>

                <button
                  onClick={() => setSelectedApplication(null)}
                  className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
                >
                  Close Details
                </button>

              </div>
            </div>
          </div>
        )}

      </main>
    </div>
    </HRNavbar>
  );
}

export default HRApplicants;
