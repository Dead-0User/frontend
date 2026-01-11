import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ManagerHeader } from "@/components/dashboard/ManagerHeader";
import ManagerPage from "./ManagerPage";
import AnalyticsPage from "../dashboard/AnalyticsPage";
import OrdersPage from "../dashboard/OrdersPage";
import MenuManagementPage from "../dashboard/MenuManagementPage";
import StaffManagementPage from "../dashboard/StaffManagementPage";
import { ThemeProvider } from "@/components/theme-provider";

const ManagerDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staffData, setStaffData] = useState<any>(null);
  const navigate = useNavigate();
  const basePath = "/staff/manager";

  // Load staff data
  useEffect(() => {
    const data = localStorage.getItem("staffData");
    const token = localStorage.getItem("staffToken");

    if (!data || !token) {
      navigate("/staff/manager/login");
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setStaffData(parsedData);
    } catch (error) {
      console.error("Failed to parse staff data:", error);
      navigate("/staff/manager/login");
    }
  }, [navigate]);

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  const handleMobileMenuToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleMobileClose = () => {
    setSidebarOpen(false);
  };

  // Show loading if staff data is not loaded
  if (!staffData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="manager-theme" attribute="class">
      <div className="min-h-screen bg-background flex h-screen overflow-hidden">
        {/* Mobile Overlay with fade animation */}
        <div
          className={`
            fixed inset-0 bg-black/50 lg:hidden
            transition-opacity duration-300 ease-in-out
            ${sidebarOpen ? "opacity-100 z-40 pointer-events-auto" : "opacity-0 -z-10 pointer-events-none"}
          `}
          onClick={handleMobileClose}
        />

        {/* Sidebar with slide animation */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 h-screen
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0 z-50" : "-translate-x-full lg:translate-x-0"}
            lg:z-auto
          `}
        >
          <DashboardSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onMobileClose={handleMobileClose}
            basePath={basePath}
            allowedItems={[
              "Dashboard",
              "Staff Management",
              "Menu Management",
              "Analytics & Reports",
              "Orders",
            ]}
          />

          {/* Mobile Close Button with fade animation */}
          <button
            onClick={handleMobileClose}
            className={`
              lg:hidden absolute top-4 right-4 p-2 rounded-lg 
              bg-sidebar-accent hover:bg-sidebar-accent/80 
              text-sidebar-foreground shadow-lg
              transition-opacity duration-300 ease-in-out
              ${sidebarOpen ? "opacity-100 z-[60]" : "opacity-0 -z-10 pointer-events-none"}
            `}
            aria-label="Close menu"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden h-screen">
          {/* Header */}
          <div className="relative z-30 flex-shrink-0">
            <ManagerHeader
              restaurantName={staffData.restaurantName || "Restaurant"}
              managerName={staffData.fullName || staffData.username || "Manager"}
              managerEmail={staffData.email}
              restaurantLogo={staffData.restaurantLogo}
              onMobileMenuClick={handleMobileMenuToggle}
              basePath={basePath}
            />
          </div>

          {/* Page Content - Scrollable */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ManagerPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="menu" element={<MenuManagementPage />} />
              <Route path="staff" element={<StaffManagementPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default ManagerDashboard;

