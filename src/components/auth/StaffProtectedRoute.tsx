// src/components/auth/StaffProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface StaffData {
  id: string;
  username: string;
  fullName: string;
  role: string;
  restaurantId: string;
  restaurantName: string;
}

interface StaffProtectedRouteProps {
  allowedRoles?: string[];
}

/**
 * Protected route component for staff authentication
 * Checks for staffToken in localStorage and validates staff data
 * Optionally restricts access based on staff role
 */
const StaffProtectedRoute = ({ allowedRoles }: StaffProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState<StaffData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("staffToken");
    const data = localStorage.getItem("staffData");

    // If no token or data, user is not authenticated
    if (!token || !data) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(data) as StaffData;
      setStaffData(parsed);
    } catch (error) {
      console.error("Failed to parse staff data:", error);
      // Clear corrupted data
      localStorage.removeItem("staffToken");
      localStorage.removeItem("staffData");
    }
    
    setLoading(false);
  }, []);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to staff login
  if (!staffData) {
    return <Navigate to="/staff/manager/login" replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && !allowedRoles.includes(staffData.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">🚫</span>
          </div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page. This area is restricted to {allowedRoles.join(", ")} only.
          </p>
          <p className="text-sm text-muted-foreground">
            Your role: <span className="font-semibold">{staffData.role}</span>
          </p>
        </div>
      </div>
    );
  }

  // Authenticated and authorized - render the protected content
  return <Outlet />;
};

export default StaffProtectedRoute;