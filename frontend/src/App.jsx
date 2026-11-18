
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Hero from "./components/home/Hero";
import LatestJobs from "./components/home/LatestJobs";

import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import ApplyForm from "./pages/ApplyForm";
import TrackApplication from "./pages/TrackApplication";

import HRLogin from "./pages/HRLogin";
import HRDashboard from "./pages/HRDashboard";
import HRJobs from "./pages/HRJobs";
import HRApplicants from "./pages/HRApplicants";

import ProtectedRoute from "./components/ProtecteRoute";

function Home() {
  return (
    <>
      <Hero />
      <LatestJobs />
    </>
  );
}

export default function App() {
  const location = useLocation();
  const isHRPage = location.pathname.startsWith("/hr");

  return (
    <>
      {!isHRPage && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/apply/:id" element={<ApplyForm />} />
        <Route path="/track" element={<TrackApplication />} />

        {/* Public HR login */}
        <Route path="/hr/login" element={<HRLogin />} />

        {/* Protected HR routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/jobs" element={<HRJobs />} />
          <Route path="/hr/applicants" element={<HRApplicants />} />
        </Route>
      </Routes>

      {!isHRPage && <Footer />}
    </>
  );
}
