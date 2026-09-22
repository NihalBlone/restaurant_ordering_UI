import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, platform = false }) {
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="panel px-8 py-7 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-line border-t-paprika" />
          <p className="mt-4 text-sm font-semibold text-muted">Opening restaurant workspace...</p>
        </div>
      </main>
    );
  }

  if (!admin) {
    return <Navigate to={platform ? "/platform/login" : "/admin/login"} replace state={{ from: location }} />;
  }

  if (platform !== (admin.role === "PLATFORM_ADMIN")) {
    return <Navigate to={admin.role === "PLATFORM_ADMIN" ? "/platform" : "/dashboard"} replace />;
  }

  return children;
}
