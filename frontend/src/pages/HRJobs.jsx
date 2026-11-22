
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import {
  Plus,
  Search,
  BriefcaseBusiness,
  MapPin,
  Pencil,
  X,
  Check,
  RefreshCw,
  Trash2
} from "lucide-react";
import HRNavbar from "../components/layout/HRNavbar";

const API_URL = "/jobs/";
const PAGE_SIZE = 8;

const initialForm = {
  title: "",
  department: "",
  location: "",
  description: "",
  requirements: "",
  status: "draft",
};

function HRJobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);

  const token = sessionStorage.getItem("access") || localStorage.getItem("access");

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(API_URL);
      setJobs(Array.isArray(response.data) ? response.data : response.data?.results || []);

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        sessionStorage.clear();
        localStorage.clear();
        navigate("/hr/login");
      } else {
        setError("Unable to load jobs. Please try again.");
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
    api.get(API_URL)
      .then((response) => {
        if (!active) return;
        setJobs(Array.isArray(response.data) ? response.data : response.data?.results || []);
      })
      .catch((err) => {
        if (!active) return;
        if (err.response?.status === 401) {
          sessionStorage.clear();
          localStorage.clear();
          navigate("/hr/login");
        } else {
          setError("Unable to load jobs. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [token, navigate]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setMessage("");
    setError("");
    setShowForm(true);
  };

  const openEditForm = (job) => {
    setEditingId(job.id);

    setForm({
      title: job.title || "",
      department: job.department || "",
      location: job.location || "",
      description: job.description || "",
      requirements: job.requirements || "",
      status: job.status || "draft",
    });

    setMessage("");
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await api.patch(
          `${API_URL}${editingId}/`,
          form
        );

        setMessage("Job updated successfully!");
      } else {
        await api.post(API_URL, form);
        setMessage("Job created successfully!");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);

      await fetchJobs();
      setPage(1);

    } catch (err) {
      console.error(err);

      const data = err.response?.data;

      setError(
        typeof data === "object"
          ? Object.entries(data)
              .map(([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
              )
              .join(" | ")
          : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateJobStatus = async (job, newStatus) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${newStatus} this job?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.patch(
        `${API_URL}${job.id}/`,
        { status: newStatus }
      );

      setMessage(`Job ${newStatus} successfully!`);
      await fetchJobs();

    } catch (err) {
      console.error(err);
      setError("Unable to update job status.");
    }
  };

  // Delete only after confirmation; backend protects jobs with applicants.
  const handleDeleteJob = async () => {
    if (!jobToDelete || deletingId !== null) return;
    const job = jobToDelete;
    setDeletingId(job.id);
    setError("");
    setMessage("");
    try {
      await api.delete(`${API_URL}${job.id}/`);
      setJobs((previous) => previous.filter((item) => item.id !== job.id));
      setMessage(`Job "${job.title}" deleted successfully.`);
      if (editingId === job.id) {
        setShowForm(false);
        setEditingId(null);
        setForm(initialForm);
      }
      setJobToDelete(null);
    } catch (err) {
      console.error("Delete job failed:", err);
      if (err.response?.status === 401) {
        sessionStorage.removeItem("access");
        sessionStorage.removeItem("refresh");
        navigate("/hr/login");
      } else {
        setError(err.response?.data?.error || err.response?.data?.detail || "Unable to delete job. Please try again.");
        setJobToDelete(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.department.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filter === "all" || job.status === filter;

    return matchesSearch && matchesStatus;
  });

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const statusStyle = {
    published: "bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300",
    draft: "bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-300",
    closed: "bg-red-100 dark:bg-red-400/15 text-red-700 dark:text-red-300",
  };

  return (
    <HRNavbar>
    <div className="hr-theme-page min-h-full bg-[#f5f5f5] dark:bg-[#141414] transition-colors duration-300">

     <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-2 pb-5">

        {/* Page heading */}
        <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 dashboard-enter">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-[#f7f7f7]">
              Manage Jobs
            </h2>

            <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mt-1">
              Create and manage your organization's job openings.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={19} />
            Create New Job
          </button>
        </section>

        {/* Messages */}
        {message && (
          <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 dark:text-green-300 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Job form */}
        {showForm && (
          <section className="mt-8 bg-white dark:bg-[#232323] rounded-2xl border border-gray-200 dark:border-[#393939] shadow-lg dark:shadow-black/30 p-6 sm:p-8 dashboard-enter">

            <div className="flex justify-between items-center mb-7">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-[#f7f7f7]">
                  {editingId ? "Edit Job" : "Create New Job"}
                </h3>

                <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mt-1">
                  Enter the job information below.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#383838] text-gray-500 dark:text-[#aaaaaa]"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid md:grid-cols-2 gap-5">

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#dedede] mb-2">
                    Job Title *
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Python Developer"
                    required
                    className="w-full border border-gray-300 dark:border-[#454545] rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#dedede] mb-2">
                    Department
                  </label>

                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. IT"
                    className="w-full border border-gray-300 dark:border-[#454545] rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#dedede] mb-2">
                    Location
                  </label>

                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Pune"
                    className="w-full border border-gray-300 dark:border-[#454545] rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-[#dedede] mb-2">
                    Job Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-[#454545] rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 bg-white dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#dedede] mb-2">
                  Job Description *
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the job role and responsibilities..."
                  required
                  rows={4}
                  className="w-full border border-gray-300 dark:border-[#454545] rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition resize-y dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-[#dedede] mb-2">
                  Requirements
                </label>

                <textarea
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  placeholder="Enter skills, qualifications and requirements..."
                  rows={4}
                  className="w-full border border-gray-300 dark:border-[#454545] rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition resize-y dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-xl transition disabled:opacity-60"
                >
                  <Check size={18} />
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Job"
                    : "Create Job"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-xl border border-gray-300 dark:border-[#454545] text-gray-600 dark:text-[#c5c5c5] hover:bg-gray-100 dark:hover:bg-[#383838] transition"
                >
                  Cancel
                </button>
              </div>

            </form>
          </section>
        )}

        {/* Filters */}
        <section className="mt-5 bg-white dark:bg-[#232323] rounded-xl border border-gray-200 dark:border-[#393939] p-4">

          <div className="flex flex-col md:flex-row gap-3 justify-between">

            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#a3a3a3]"
              />

              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by job title, department or location..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-[#393939] rounded-xl outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 dark:border-[#393939] rounded-lg px-4 py-2.5 bg-white outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 dark:bg-[#2c2c2c] dark:text-[#f5f5f5] dark:placeholder:text-[#929292]"
            >
              <option value="all">All Jobs</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>

            <button
              onClick={fetchJobs}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-[#393939] rounded-xl hover:bg-yellow-50 dark:hover:bg-[#383120] transition"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

          </div>
        </section>

        {/* Jobs list */}
        <section className="mt-6">

          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-[#f7f7f7]">
              All Job Openings
            </h3>

            <span className="text-sm text-gray-500 dark:text-[#aaaaaa]">
              {filteredJobs.length} jobs found
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500 dark:text-[#aaaaaa]">
              Loading jobs...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white dark:bg-[#232323] rounded-2xl border border-gray-200 dark:border-[#393939] p-12 text-center">
              <BriefcaseBusiness
                size={40}
                className="mx-auto text-gray-300 dark:text-[#888888] mb-4"
              />

              <h3 className="font-semibold text-gray-800 dark:text-[#eeeeee]">
                No jobs found
              </h3>

              <p className="text-sm text-gray-500 dark:text-[#aaaaaa] mt-2">
                Try changing your search or create a new job opening.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-3">

              {visibleJobs.map((job) => (
                <article
                  key={job.id}
                  className="dashboard-card bg-white dark:bg-[#232323] rounded-xl border border-gray-200 dark:border-[#393939] shadow-sm dark:shadow-black/20 hover:shadow-md dark:hover:border-[#555555] transition-all duration-200 p-3.5"
                >

                  <div className="flex justify-between items-start gap-3">

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-400/15 text-yellow-700 dark:text-yellow-300">
                        <BriefcaseBusiness size={18} />
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-[#f7f7f7]">
                          {job.title}
                        </h4>

                        <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mt-1">
                          {job.department || "General Department"}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${statusStyle[job.status] || "bg-gray-100 dark:bg-[#353535] text-gray-600 dark:text-[#c5c5c5]"}`}>
                      {job.status}
                    </span>

                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#aaaaaa] mt-3">
                    <MapPin size={16} />
                    {job.location || "Location not specified"}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-[#aaaaaa] mt-2 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="border-t border-gray-100 dark:border-[#393939] mt-3 pt-3 flex flex-wrap gap-2">

                    <button
                      onClick={() => openEditForm(job)}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-[#353535] text-gray-700 dark:text-[#dedede] text-sm font-medium hover:bg-yellow-100 dark:bg-yellow-400/15 hover:text-yellow-800 dark:text-yellow-300 transition"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobToDelete(job)}
                      disabled={deletingId !== null}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition disabled:opacity-50"
                    >
                      <Trash2 size={15} /> Delete
                    </button>

                    {job.status === "draft" && (
                      <button
                        onClick={() => updateJobStatus(job, "published")}
                        className="px-3 py-1 rounded-lg bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300 text-sm font-semibold hover:bg-green-200 transition"
                      >
                        Publish
                      </button>
                    )}

                    {job.status === "published" && (
                      <button
                        onClick={() => updateJobStatus(job, "closed")}
                        className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-400/15 text-red-700 dark:text-red-300 text-sm font-semibold hover:bg-red-200 transition"
                      >
                        Close Job
                      </button>
                    )}

                    {job.status === "closed" && (
                      <button
                        onClick={() => updateJobStatus(job, "published")}
                        className="px-3 py-1 rounded-lg bg-green-100 dark:bg-green-400/15 text-green-700 dark:text-green-300 text-sm font-semibold hover:bg-green-200 transition"
                      >
                        Reopen Job
                      </button>
                    )}

                  </div>
                </article>
              ))}

            </div>
          )}

          {!loading && filteredJobs.length > PAGE_SIZE && (
            <nav aria-label="Job pagination" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredJobs.length)} of {filteredJobs.length} jobs
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-gray-300 dark:border-[#454545] px-3 py-1.5 text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-yellow-100 dark:hover:bg-[#383120]">Previous</button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                  <button key={number} type="button" aria-label={`Page ${number}`} aria-current={currentPage === number ? "page" : undefined} onClick={() => setPage(number)} className={`min-w-9 rounded-lg border px-2.5 py-1.5 ${currentPage === number ? "border-yellow-400 bg-yellow-400 text-black font-semibold" : "border-gray-300 dark:border-[#454545] text-gray-700 dark:text-gray-200 hover:bg-yellow-100 dark:hover:bg-[#383120]"}`}>{number}</button>
                ))}
                <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-gray-300 dark:border-[#454545] px-3 py-1.5 text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-yellow-100 dark:hover:bg-[#383120]">Next</button>
              </div>
            </nav>
          )}
        </section>

        {/* Delete job confirmation */}
        {jobToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
            <div role="alertdialog" aria-modal="true" aria-labelledby="delete-job-title" aria-describedby="delete-job-description" className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-[#444] bg-white dark:bg-[#242424] p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <Trash2 size={22} />
                <h3 id="delete-job-title" className="text-lg font-semibold">Delete Job?</h3>
              </div>
              <p id="delete-job-description" className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">
                Permanently delete <strong className="text-gray-900 dark:text-white">{jobToDelete.title}</strong>?
                This cannot be undone. Jobs with existing applications cannot be deleted; close them instead.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setJobToDelete(null)} disabled={deletingId !== null} className="rounded-lg border border-gray-300 dark:border-[#555] px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50">Cancel</button>
                <button type="button" onClick={handleDeleteJob} disabled={deletingId !== null} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  <Trash2 size={16} /> {deletingId !== null ? "Deleting..." : "Delete Job"}
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

export default HRJobs;
