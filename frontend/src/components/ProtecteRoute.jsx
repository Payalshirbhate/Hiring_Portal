import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = sessionStorage.getItem("access");

  if (!token) {
    return <Navigate to="/hr/login" replace />;
  }

  return <Outlet />;
}