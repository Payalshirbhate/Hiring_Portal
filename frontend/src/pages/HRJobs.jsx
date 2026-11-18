
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Plus,
  Search,
  BriefcaseBusiness,
  MapPin,
  Pencil,
  X,
  Check,
  LogOut,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import HRNavbar from "../components/layout/HRNavbar";

const API_URL = "http://127.0.0.1:8000/api/jobs/";

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);

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

    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const response = await axios.get(API_URL, config);
      setJobs(Array.isArray(response.data) ? response.data : []);

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        sessionStorage.clear();
        navigate("/hr/login");
      } else {
        setError("Unable to load jobs. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await axios.patch(
          `${API_URL}${editingId}/`,
          form,
          config
        );

        setMessage("Job updated successfully!");
      } else {
        await axios.post(API_URL, form, config);
        setMessage("Job created successfully!");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(initialForm);

      await fetchJobs();

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
      await axios.patch(
        `${API_URL}${job.id}/`,
        { status: newStatus },
        config
      );

      setMessage(`Job ${newStatus} successfully!`);
      await fetchJobs();

    } catch (err) {
      console.error(err);
      setError("Unable to update job status.");
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

  const statusStyle = {
    published: "bg-green-100 text-green-700",
    draft: "bg-yellow-100 text-yellow-700",
    closed: "bg-red-100 text-red-700",
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
        <section className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 dashboard-enter">
          <div>
            <p className="text-yellow-600 text-sm font-semibold tracking-wider">
              RECRUITMENT MANAGEMENT
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              Manage Jobs
            </h2>

            <p className="text-gray-500 mt-2">
              Create and manage your organization's job openings.
            </p>
          </div>

          <button
            onClick={openCreateForm}
            className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-5 py-3 rounded-xl shadow-md hover:-translate-y-1 transition-all"
          >
            <Plus size={19} />
            Create New Job
          </button>
        </section>

        {/* Messages */}
        {message && (
          <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
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
          <section className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 dashboard-enter">

            <div className="flex justify-between items-center mb-7">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Job" : "Create New Job"}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Enter the job information below.
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="grid md:grid-cols-2 gap-5">

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Title *
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Python Developer"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department
                  </label>

                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. IT"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>

                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Pune"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description *
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the job role and responsibilities..."
                  required
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Requirements
                </label>

                <textarea
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  placeholder="Enter skills, qualifications and requirements..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition resize-y"
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
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>

            </form>
          </section>
        )}

        {/* Filters */}
        <section className="mt-9 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">

          <div className="flex flex-col md:flex-row gap-4 justify-between">

            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by job title, department or location..."
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-yellow-400 transition"
              />
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-yellow-400"
            >
              <option value="all">All Jobs</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>

            <button
              onClick={fetchJobs}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-yellow-50 transition"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

          </div>
        </section>

        {/* Jobs list */}
        <section className="mt-6">

          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900">
              All Job Openings
            </h3>

            <span className="text-sm text-gray-500">
              {filteredJobs.length} jobs found
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-500">
              Loading jobs...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <BriefcaseBusiness
                size={40}
                className="mx-auto text-gray-300 mb-4"
              />

              <h3 className="font-semibold text-gray-800">
                No jobs found
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Try changing your search or create a new job opening.
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-3">

              {filteredJobs.map((job) => (
                <article
                  key={job.id}
                  className="dashboard-card bg-white rounded-lg border border-gray-200 shadow-sm p-4"
                >

                  <div className="flex justify-between items-start gap-3">

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700">
                        <BriefcaseBusiness size={18} />
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {job.title}
                        </h4>

                        <p className="text-sm text-gray-500 mt-1">
                          {job.department || "General Department"}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${statusStyle[job.status] || "bg-gray-100 text-gray-600"}`}>
                      {job.status}
                    </span>

                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
                    <MapPin size={16} />
                    {job.location || "Location not specified"}
                  </div>

                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="border-t border-gray-100 mt-3 pt-4 flex flex-wrap gap-2">

                    <button
                      onClick={() => openEditForm(job)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-yellow-100 hover:text-yellow-800 transition"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    {job.status === "draft" && (
                      <button
                        onClick={() => updateJobStatus(job, "published")}
                        className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-semibold hover:bg-green-200 transition"
                      >
                        Publish
                      </button>
                    )}

                    {job.status === "published" && (
                      <button
                        onClick={() => updateJobStatus(job, "closed")}
                        className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold hover:bg-red-200 transition"
                      >
                        Close Job
                      </button>
                    )}

                    {job.status === "closed" && (
                      <button
                        onClick={() => updateJobStatus(job, "published")}
                        className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-semibold hover:bg-green-200 transition"
                      >
                        Reopen Job
                      </button>
                    )}

                  </div>
                </article>
              ))}

            </div>
          )}

        </section>

      </main>
    </div>
    </HRNavbar>
  );
}

export default HRJobs;
