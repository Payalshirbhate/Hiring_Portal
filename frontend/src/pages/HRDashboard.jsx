
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import HRNavbar from "../components/layout/HRNavbar.jsx";
import "../styles/HRDashboard.css";

import {
  BriefcaseBusiness,
  Users,
  FileText,
  CheckCircle,
  Plus,
  ArrowUpRight,
  MapPin,
  Clock3,
  UserRound,
} from "lucide-react";

const getList = (data) =>
  Array.isArray(data) ? data : data?.results || [];

export default function HRDashboard() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("access") || localStorage.getItem("access");

    if (!token) {
      navigate("/hr/login", { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const [jobsRes, appsRes] = await Promise.all([
          api.get("/jobs/"),
          api.get("/hr/applications/"),
        ]);

        setJobs(getList(jobsRes.data));
        setApplications(getList(appsRes.data));
      } catch (err) {
        if (
          err.response?.status === 401 ||
          err.response?.status === 403
        ) {
          sessionStorage.removeItem("access");
          sessionStorage.removeItem("refresh");
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");

          navigate("/hr/login", { replace: true });
        } else {
          setError("Unable to load dashboard data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Dashboard statistics
  const stats = [
    {
      title: "Total Jobs",
      value: jobs.length,
      icon: BriefcaseBusiness,
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-400/15 dark:text-yellow-400",
    },
    {
      title: "Total Applications",
      value: applications.length,
      icon: Users,
      color:
        "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-400",
    },
    {
      title: "Published Jobs",
      value: jobs.filter(
        (job) => job.status === "published"
      ).length,
      icon: FileText,
      color:
        "bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-400",
    },
    {
      title: "Shortlisted",
      value: applications.filter(
        (app) => app.status === "shortlisted"
      ).length,
      icon: CheckCircle,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-400",
    },
  ];

  // Job status badge styling
  const getJobStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400";

      case "closed":
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";

      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // Applicant status badge styling
  const getApplicationStatusColor = (status) => {
    switch (status) {
      case "selected":
        return "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400";

      case "shortlisted":
        return "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400";

      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";

      case "under_review":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400";

      case "on_hold":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400";

      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <HRNavbar>
      <div className="hr-dashboard max-w-7xl mx-auto">

        {/* DASHBOARD HEADER */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div>
            <p className="text-yellow-600 dark:text-yellow-400 font-semibold text-sm mb-2">
              RECRUITMENT OVERVIEW
            </p>

            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-[#F5F5F5]">
              Welcome to your Dashboard!
            </h1>

            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Manage job openings and find the right talent for your team.
            </p>
          </div>

          <button
            onClick={() => navigate("/hr/jobs")}
            className="flex items-center justify-center gap-2 bg-yellow-400 text-black px-4 py-2.5 rounded-lg font-semibold hover:bg-yellow-300 transition"
          >
            <Plus size={19} />
            Create New Job
          </button>

        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <p
            role="alert"
            className="mt-4 text-red-600 dark:text-red-400 text-sm"
          >
            {error}
          </p>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-24 bg-white dark:bg-[#222222] border border-gray-200 dark:border-[#363636] rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>

            {/* STATISTICS */}
            <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-4">

              {stats.map(
                ({ title, value, icon: Icon, color }) => (
                  <div
                    key={title}
                    className="bg-white dark:bg-[#222222] border border-gray-200 dark:border-[#363636] rounded-xl p-3 shadow-sm hover:shadow-md dark:hover:border-[#505050] transition-all duration-200"
                  >

                    <div className="flex items-center justify-between">

                      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                        {title}
                      </p>

                      <div
                        className={`p-2 rounded-lg ${color}`}
                      >
                        <Icon size={18} />
                      </div>

                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {String(value).padStart(2, "0")}
                    </h3>

                    <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                      Live overview
                    </p>

                  </div>
                )
              )}

            </section>

            {/* RECENT DATA */}
            <section className="grid xl:grid-cols-2 gap-3 mt-4">

              {/* RECENT JOBS */}
              <div className="bg-white dark:bg-[#222222] border border-gray-200 dark:border-[#363636] rounded-xl shadow-sm p-3">

                <div className="flex items-center justify-between mb-3">

                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Recent Jobs
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Your latest job openings
                    </p>
                  </div>

                  <BriefcaseBusiness
                    className="text-yellow-500 dark:text-yellow-400"
                    size={24}
                  />

                </div>

                {jobs.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
                    No jobs available yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">

                    {[...jobs].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        className="hr-dashboard-record flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gray-100 bg-white dark:border-[#383838] dark:bg-[#2B2B2B] hover:border-yellow-300 dark:hover:border-yellow-500 hover:bg-yellow-50/40 dark:hover:bg-[#333333] transition-all duration-200"
                      >

                        <div className="min-w-0">

                          <p className="font-semibold text-gray-800 dark:text-gray-100">
                            {job.title}
                          </p>

                          <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">

                            <span>
                              {job.department || "General"}
                            </span>

                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {job.location || "Not specified"}
                            </span>

                          </div>

                        </div>

                        <span
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize whitespace-nowrap ${getJobStatusColor(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>

                      </div>
                    ))}

                  </div>
                )}

                <button
                  onClick={() => navigate("/hr/jobs")}
                  className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 font-semibold mt-3 hover:underline"
                >
                  Manage all jobs
                  <ArrowUpRight size={17} />
                </button>

              </div>

              {/* RECENT APPLICANTS */}
              <div className="bg-white dark:bg-[#222222] border border-gray-200 dark:border-[#363636] rounded-xl shadow-sm p-3">

                <div className="flex items-center justify-between mb-3">

                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Recent Applicants
                    </h2>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Latest candidate applications
                    </p>
                  </div>

                  <Users
                    className="text-yellow-500 dark:text-yellow-400"
                    size={24}
                  />

                </div>

                {applications.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
                    No applications received yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">

                    {[...applications].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5).map((app) => (
                      <div
                        key={app.id}
                        className="hr-dashboard-record flex items-center justify-between gap-2 p-2.5 rounded-lg border border-gray-100 bg-white dark:border-[#383838] dark:bg-[#2B2B2B] hover:border-yellow-300 dark:hover:border-yellow-500 hover:bg-yellow-50/40 dark:hover:bg-[#333333] transition-all duration-200"
                      >

                        <div className="flex items-center gap-3 min-w-0">

                          <div className="w-8 h-8 shrink-0 rounded-full bg-yellow-100 dark:bg-yellow-400/15 flex items-center justify-center">
                            <UserRound
                              size={19}
                              className="text-yellow-700 dark:text-yellow-400"
                            />
                          </div>

                          <div className="min-w-0">

                            <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                              {app.candidate_name}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {app.tracking_id}
                            </p>

                          </div>

                        </div>

                        <span
                          className={`text-xs capitalize px-3 py-1.5 rounded-full whitespace-nowrap ${getApplicationStatusColor(
                            app.status
                          )}`}
                        >
                          {app.status?.replaceAll("_", " ")}
                        </span>

                      </div>
                    ))}

                  </div>
                )}

                <button
                  onClick={() => navigate("/hr/applicants")}
                  className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 font-semibold mt-3 hover:underline"
                >
                  View all applicants
                  <ArrowUpRight size={17} />
                </button>

              </div>

            </section>

            {/* FOOTER INFORMATION */}
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-5">
              <Clock3 size={14} />
              Dashboard data is loaded from your Hiring Portal backend.
            </div>

          </>
        )}

      </div>
    </HRNavbar>
  );
}
