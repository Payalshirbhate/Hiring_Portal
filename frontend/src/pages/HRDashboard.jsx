
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import HRNavbar from "../components/layout/HRNavbar.jsx";

import {
  BriefcaseBusiness, Users, FileText,
  CheckCircle, Plus, ArrowUpRight,
  MapPin, Clock3, UserRound
} from "lucide-react";


const API = "http://127.0.0.1:8000/api/";

const getList = (data) =>
  Array.isArray(data) ? data : data?.results || [];

export default function HRDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("access");

    if (!token) {
      navigate("/hr/login", { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const [jobsRes, appsRes] = await Promise.all([
          axios.get(`${API}jobs/`, config),
          axios.get(`${API}hr/applications/`, config)
        ]);

        setJobs(getList(jobsRes.data));
        setApplications(getList(appsRes.data));
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          sessionStorage.removeItem("access");
          sessionStorage.removeItem("refresh");
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

  const stats = [
    {
      title: "Total Jobs",
      value: jobs.length,
      icon: BriefcaseBusiness,
      color: "bg-yellow-100 text-yellow-700"
    },
    {
      title: "Total Applications",
      value: applications.length,
      icon: Users,
      color: "bg-blue-100 text-blue-700"
    },
    {
      title: "Published Jobs",
      value: jobs.filter(j => j.status === "published").length,
      icon: FileText,
      color: "bg-green-100 text-green-700"
    },
    {
      title: "Shortlisted",
      value: applications.filter(a => a.status === "shortlisted").length,
      icon: CheckCircle,
      color: "bg-purple-100 text-purple-700"
    }
  ];

  return (
    <HRNavbar>
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-yellow-600 font-semibold text-sm mb-2">
              RECRUITMENT OVERVIEW
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome to your Dashboard!
            </h1>
            <p className="text-gray-500 mt-2">
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

        {error && (
          <p role="alert" className="mt-6 text-red-600 text-sm">
            {error}
          </p>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                className="h-28 bg-white rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* STATISTICS */}
            <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
              {stats.map(({ title, value, icon: Icon, color }) => (
                <div
                  key={title}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-gray-500 text-sm font-medium">
                      {title}
                    </p>
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mt-2">
                    {String(value).padStart(2, "0")}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Current recruitment records
                  </p>
                </div>
              ))}
            </section>

            {/* RECENT DATA */}
            <section className="grid xl:grid-cols-2 gap-4 mt-6">

              {/* RECENT JOBS */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Recent Jobs
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Your latest job openings
                    </p>
                  </div>
                  <BriefcaseBusiness
                    className="text-yellow-500"
                    size={24}
                  />
                </div>

                {jobs.length === 0 ? (
                  <p className="text-gray-500 py-8 text-center">
                    No jobs available yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {jobs.slice(0, 5).map(job => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:border-yellow-300 hover:bg-yellow-50/40 transition"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800">
                            {job.title}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                            <span>{job.department || "General"}</span>
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {job.location || "Not specified"}
                            </span>
                          </div>
                        </div>

                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize whitespace-nowrap ${
                          job.status === "published"
                            ? "bg-green-100 text-green-700"
                            : job.status === "closed"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => navigate("/hr/jobs")}
                  className="flex items-center gap-2 text-sm text-yellow-700 font-semibold mt-4 hover:underline"
                >
                  Manage all jobs <ArrowUpRight size={17} />
                </button>
              </div>

              {/* RECENT APPLICANTS */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Recent Applicants
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Latest candidate applications
                    </p>
                  </div>
                  <Users className="text-yellow-500" size={24} />
                </div>

                {applications.length === 0 ? (
                  <p className="text-gray-500 py-8 text-center">
                    No applications received yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {applications.slice(0, 5).map(app => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:border-yellow-300 hover:bg-yellow-50/40 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 shrink-0 rounded-full bg-yellow-100 flex items-center justify-center">
                            <UserRound
                              size={19}
                              className="text-yellow-700"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 truncate">
                              {app.candidate_name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {app.tracking_id}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs capitalize bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full whitespace-nowrap">
                          {app.status?.replaceAll("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => navigate("/hr/applicants")}
                  className="flex items-center gap-2 text-sm text-yellow-700 font-semibold mt-4 hover:underline"
                >
                  View all applicants <ArrowUpRight size={17} />
                </button>
              </div>
            </section>

            <div className="flex items-center gap-2 text-xs text-gray-400 mt-5">
              <Clock3 size={14} />
              Dashboard data is loaded from your Hiring Portal backend.
            </div>
          </>
        )}
      </div>
    </HRNavbar>
  );
}
