
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

import {
  Users,
  Search,
  UserRound,
  FileText,
  Mail,
  Phone,
  RefreshCw,
  Eye,
  Download,
  Trash2,
} from "lucide-react";
import HRNavbar from "../components/layout/HRNavbar";

const PAGE_SIZE = 8;
const API_URL = "/hr/applications/";

function HRApplicants() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [error, setError] = useState("");

  const [newStatus, setNewStatus] = useState("");
  const [candidateNote, setCandidateNote] = useState("");
  const [internalNote, setInternalNote] = useState("");

  const token = sessionStorage.getItem("access") || localStorage.getItem("access");

  // Fetch applications and jobs
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [applicationResponse, jobResponse] = await Promise.all([
        api.get(API_URL),
        api.get("/jobs/"),
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
        localStorage.clear();
        navigate("/hr/login");
      } else {
        setError("Unable to load applications. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/hr/login");
      return;
    }

    let active = true;
    Promise.all([api.get(API_URL), api.get("/jobs/")])
      .then(([applicationResponse, jobResponse]) => {
        if (!active) return;
        setApplications(
          Array.isArray(applicationResponse.data)
            ? applicationResponse.data
            : applicationResponse.data?.results || []
        );
        setJobs(
          Array.isArray(jobResponse.data)
            ? jobResponse.data
            : jobResponse.data?.results || []
        );
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) {
          sessionStorage.clear();
          localStorage.clear();
          navigate("/hr/login");
        } else {
          setError("Unable to load applications. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [token, navigate]);

  // Reset filters and refresh applications
  const handleRefresh = () => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
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

      await api.patch(
        `${API_URL}${selectedApplication.id}/status/`,
        {
          status: newStatus,
          candidate_note: candidateNote,
          internal_note: internalNote,
        }
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

  // Delete only after explicit confirmation from HR.
  const handleDeleteApplication = async () => {
    if (!deleteTarget || deleting) return;
    try {
      setDeleting(true);
      setError("");
      await api.delete(`${API_URL}${deleteTarget.id}/`);
      setApplications((previous) => previous.filter((app) => app.id !== deleteTarget.id));
      if (selectedApplication?.id === deleteTarget.id) setSelectedApplication(null);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Unable to delete application:", err);
      if (err.response?.status === 401) {
        sessionStorage.removeItem("access");
        sessionStorage.removeItem("refresh");
        navigate("/hr/login");
      } else {
        setError(err.response?.data?.error || err.response?.data?.detail || "Unable to delete application. Please try again.");
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Retrieve resume through the HR-only endpoint (JWT required).
  const handleResume = async (mode) => {
    if (!selectedApplication?.id || resumeLoading) return;

    try {
      setResumeLoading(true);
      const response = await api.get(
        `${API_URL}${selectedApplication.id}/resume/`,
        { responseType: "blob" }
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

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedApplications = filteredApplications.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // Status badge colors
  const statusClasses = {
    applied: "bg-blue-100 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300",
    under_review: "bg-yellow-100 dark:bg-yellow-400/15 text-yellow-800 dark:text-yellow-300",
    shortlisted: "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300",
    on_hold: "bg-orange-100 dark:bg-orange-400/15 text-orange-700 dark:text-orange-300",
    selected: "bg-purple-100 dark:bg-purple-400/15 text-purple-700 dark:text-purple-300",
    rejected: "bg-red-100 dark:bg-red-400/15 text-red-700 dark:text-red-300",
  };

  return (
    <HRNavbar>
    <div className="hr-theme-page min-h-screen bg-[#f5f5f5] dark:bg-[#141414] transition-colors duration-300">

      <main className="max-w-7xl mx-auto px-3 sm:px-5 py-5">

        {/* Compact page heading */}
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Applicants</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Review applications and update candidate status.</p>
          </div>
          <span className="rounded-lg border border-gray-200 dark:border-[#393939] bg-white dark:bg-[#232323] px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200">
            {applications.length} total applications
          </span>
        </section>

        {/* Search and filters */}
        <section className="mt-5 bg-white dark:bg-[#232323] rounded-xl border border-gray-200 dark:border-[#393939] shadow-sm p-3 sm:p-4">
          <div className="flex flex-col md:flex-row gap-3">

            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#a3a3a3]"
              />

              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search candidate, email or tracking ID..."
                className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-[#393939] rounded-xl outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="border border-gray-200 dark:border-[#393939] rounded-xl px-4 py-3 bg-white outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
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
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-[#393939] rounded-xl hover:bg-yellow-50 dark:hover:bg-[#383120] transition disabled:opacity-50"
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
        <section className="mt-5">

          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Candidate list</p>
            <span className="text-xs text-gray-500 dark:text-gray-400">{filteredApplications.length} results</span>
          </div>

          {loading ? (
            <div className="bg-white dark:bg-[#232323] rounded-2xl p-12 text-center text-gray-500 dark:text-[#aaaaaa]">
              Loading applications...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white dark:bg-[#232323] rounded-2xl border border-gray-200 dark:border-[#393939] p-12 text-center">
              <Users size={40} className="mx-auto text-gray-300 dark:text-[#888888] mb-4" />

              <h3 className="font-semibold text-gray-800 dark:text-[#eeeeee]">
                No applicants found
              </h3>

              <p className="text-sm text-gray-500 dark:text-[#aaaaaa] mt-2">
                Try another search or status filter.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-3">

              {paginatedApplications.map((app) => (
                <article
                  key={app.id}
                  className="dashboard-card min-w-0 bg-white dark:bg-[#232323] rounded-lg border border-gray-200 dark:border-[#393939] shadow-sm hover:shadow-md dark:hover:border-[#555555] transition-all duration-200 p-3"
                >

                  <div className="flex justify-between items-start gap-3">

                    <div className="flex min-w-0 items-center gap-2">
                      <div className="w-8 h-8 shrink-0 rounded-lg bg-yellow-100 dark:bg-yellow-400/15 flex items-center justify-center">
                        <UserRound size={18} className="text-yellow-700 dark:text-yellow-300" />
                      </div>

                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-gray-900 dark:text-[#f7f7f7]">
                          {app.candidate_name}
                        </h4>

                        <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mt-1">
                          {app.tracking_id}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${statusClasses[app.status] || "bg-gray-100 dark:bg-[#353535] text-gray-600 dark:text-[#c5c5c5]"}`}>
                      {app.status?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-3 text-xs text-gray-600 dark:text-[#c5c5c5]">

                    <p className="flex min-w-0 items-center gap-2 truncate">
                      <FileText size={16} />
                      {getJobTitle(app.job)}
                    </p>

                    <p className="flex min-w-0 items-center gap-2 truncate">
                      <Mail size={16} />
                      {app.email}
                    </p>

                    <p className="flex min-w-0 items-center gap-2 truncate">
                      <Phone size={16} />
                      {app.phone}
                    </p>

                  </div>

                  <div className="border-t border-gray-100 dark:border-[#393939] mt-3 pt-2 flex flex-wrap justify-between items-center gap-2">

                    <span className="text-xs text-gray-400 dark:text-[#a3a3a3]">
                      Applied: {new Date(app.created_at).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(app)}
                      title={`Delete ${app.candidate_name}'s application`}
                      aria-label={`Delete ${app.candidate_name}'s application`}
                      className="flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-900 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                    <button
                      onClick={() => handleViewDetails(app)}
                      className="flex items-center gap-1.5 bg-[#171717] text-white px-2.5 py-1.5 rounded-lg text-xs hover:bg-yellow-400 hover:text-black transition"
                    >
                      <Eye size={16} />
                      View Details
                    </button>
                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}
          {!loading && filteredApplications.length > PAGE_SIZE && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 dark:border-[#393939] pt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredApplications.length)} of {filteredApplications.length}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)} className="rounded-lg border border-gray-300 dark:border-[#454545] px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 disabled:opacity-40">Previous</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button key={page} type="button" onClick={() => setCurrentPage(page)} aria-current={safePage === page ? "page" : undefined} className={`h-8 min-w-8 rounded-lg text-xs font-semibold ${safePage === page ? "bg-yellow-400 text-black" : "border border-gray-300 dark:border-[#454545] text-gray-700 dark:text-gray-200"}`}>{page}</button>
                ))}
                <button type="button" disabled={safePage === totalPages} onClick={() => setCurrentPage(safePage + 1)} className="rounded-lg border border-gray-300 dark:border-[#454545] px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </section>

        {/* Delete confirmation: no deletion until HR confirms. */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="presentation">
            <div role="dialog" aria-modal="true" aria-labelledby="delete-applicant-title" className="w-full max-w-md rounded-xl border border-gray-200 dark:border-[#444] bg-white dark:bg-[#242424] p-5 shadow-2xl">
              <h2 id="delete-applicant-title" className="text-lg font-semibold text-gray-900 dark:text-white">Delete application?</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Delete the application of <strong>{deleteTarget.candidate_name}</strong> ({deleteTarget.tracking_id})? This cannot be undone, and their tracking ID will stop working.
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-gray-300 dark:border-[#555] px-4 py-2 text-sm text-gray-800 dark:text-white disabled:opacity-50">Cancel</button>
                <button type="button" disabled={deleting} onClick={handleDeleteApplication} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  <Trash2 size={16} /> {deleting ? "Deleting..." : "Delete Application"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applicant details modal */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="bg-white dark:bg-[#242424] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl dashboard-enter">

              <div className="bg-[#171717] text-white p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">
                    Applicant Details
                  </h3>

                  <p className="text-sm text-gray-400 dark:text-[#a3a3a3] mt-1">
                    {selectedApplication.tracking_id}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 dark:text-[#a3a3a3] hover:text-yellow-400"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5">

                <div>
                  <p className="text-xs text-gray-500 dark:text-[#aaaaaa]">Candidate Name</p>
                  <p className="font-semibold text-gray-900 dark:text-[#f7f7f7] mt-1">
                    {selectedApplication.candidate_name}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-[#aaaaaa]">Email</p>
                  <p className="font-semibold text-gray-900 dark:text-[#f7f7f7] mt-1">
                    {selectedApplication.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-[#aaaaaa]">Phone</p>
                  <p className="font-semibold text-gray-900 dark:text-[#f7f7f7] mt-1">
                    {selectedApplication.phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-[#aaaaaa]">Applied For</p>
                  <p className="font-semibold text-gray-900 dark:text-[#f7f7f7] mt-1">
                    {getJobTitle(selectedApplication.job)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-[#aaaaaa]">Current Status</p>

                  <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${statusClasses[selectedApplication.status] || "bg-gray-100 dark:bg-[#353535] text-gray-600 dark:text-[#c5c5c5]"}`}>
                    {selectedApplication.status?.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-[#aaaaaa]">Resume</p>

                  {selectedApplication.resume ? (
                    <div className="mt-3 rounded-xl border border-gray-200 dark:border-[#393939] bg-gray-50 dark:bg-[#2b2b2b] p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-[#dedede] mb-3 break-all">
                        <FileText size={18} className="text-yellow-600 dark:text-yellow-400 shrink-0" />
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
                      <p className="mt-2 text-xs text-gray-500 dark:text-[#aaaaaa]">
                        {resumeLoading ? "Loading resume..." : "PDF opens in a new tab. DOCX downloads for viewing."}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-[#a3a3a3] mt-2">
                      Resume information unavailable.
                    </p>
                  )}
                </div>

                {/* Update Application Status */}
                <div className="border-t dark:border-[#393939] pt-5 space-y-4">

                  <h3 className="font-bold text-gray-900 dark:text-[#f7f7f7]">
                    Update Application Status
                  </h3>

                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-gray-300 dark:border-[#454545] rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
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
                    className="w-full border border-gray-300 dark:border-[#454545] rounded-xl p-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
                    rows="3"
                  />

                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Internal HR note (not visible to candidate)..."
                    className="w-full border border-gray-300 dark:border-[#454545] rounded-xl p-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
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
                  className="w-full border border-gray-300 dark:border-[#454545] text-gray-700 dark:text-[#dedede] font-semibold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#303030] dark:bg-[#2b2b2b] transition"
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
