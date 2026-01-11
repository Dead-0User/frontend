import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import OverviewPage from "./dashboard/OverviewPage";
import OrdersPage from "./dashboard/OrdersPage";
import MenuManagementPage from "./dashboard/MenuManagementPage";
import TablesPage from "./dashboard/TablesPage";
import ReservationsPage from "./dashboard/ReservationsPage";
import FeedbackPage from "./dashboard/FeedbackPage";
import StaffManagementPage from "./dashboard/StaffManagementPage";
import AnalyticsPage from "./dashboard/AnalyticsPage";
import SettingsPage from "./dashboard/SettingsPage";
import { API_BASE_URL } from "@/config";
import { ThemeProvider } from "@/components/theme-provider";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unpaidOrdersCount, setUnpaidOrdersCount] = useState(0);
  const { user, loading } = useAuth();

  // Fetch unpaid orders count
  const fetchUnpaidOrdersCount = async () => {
    try {
      // Get auth token
      const staffToken = localStorage.getItem("staffToken");
      const token = staffToken || localStorage.getItem("token");

      if (!token) return;


      const response = await fetch(
        `${API_BASE_URL}/api/orders/restaurant?status=&limit=1000`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Count orders that are not paid and not cancelled
          const count = data.data.filter(
            (order: any) => order.status !== "paid" && order.status !== "cancelled"
          ).length;
          setUnpaidOrdersCount(count);
        }
      }
    } catch (error) {
      console.error("Error fetching unpaid orders count:", error);
    }
  };

  // Fetch count on mount and set up polling
  useEffect(() => {
    fetchUnpaidOrdersCount();

    const interval = setInterval(() => {
      fetchUnpaidOrdersCount();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  const handleMobileMenuToggle = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleMobileClose = () => {
    setSidebarOpen(false);
  };

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user data, show error
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p>Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class">
      <div className="min-h-screen bg-background flex h-screen overflow-hidden">
        {/* Mobile Overlay with fade animation */}
        <div
          className={`
            fixed inset-0 bg-black/50 lg:hidden
            transition-opacity duration-300 ease-in-out
            ${sidebarOpen ? 'opacity-100 z-40 pointer-events-auto' : 'opacity-0 -z-10 pointer-events-none'}
          `}
          onClick={handleMobileClose}
        />

        {/* Sidebar with slide animation */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 h-screen
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0 z-50' : '-translate-x-full lg:translate-x-0'}
            lg:z-auto
          `}
        >
          <DashboardSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            onMobileClose={handleMobileClose}
            ordersBadgeCount={unpaidOrdersCount}
          />

          {/* Mobile Close Button with fade animation */}
          <button
            onClick={handleMobileClose}
            className={`
              lg:hidden absolute top-4 right-4 p-2 rounded-lg 
              bg-sidebar-accent hover:bg-sidebar-accent/80 
              text-sidebar-foreground shadow-lg
              transition-opacity duration-300 ease-in-out
              ${sidebarOpen ? 'opacity-100 z-[60]' : 'opacity-0 -z-10 pointer-events-none'}
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
            <DashboardHeader
              restaurantName={user.restaurantName || user.email || "Restaurant"}
              ownerName={user.name || "Owner"}
              ownerEmail={user.email}
              restaurantLogo={user.logo}
              onMobileMenuClick={handleMobileMenuToggle}
            />
          </div>

          {/* Page Content - Scrollable */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route index element={<OverviewPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="menu" element={<MenuManagementPage />} />
              <Route path="tables" element={<TablesPage />} />
              <Route path="reservations" element={<ReservationsPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="staff" element={<StaffManagementPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Dashboard;