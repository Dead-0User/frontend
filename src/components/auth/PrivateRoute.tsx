import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  // ⏳ Still checking token validity
  if (loading) {
    return <div>Loading...</div>; // Can upgrade to a spinner component
  }

  // ❌ Not logged in → redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Authenticated → render protected route
  return <Outlet />;
};

export default PrivateRoute;