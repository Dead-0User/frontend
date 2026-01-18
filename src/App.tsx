// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import ScrollToTop from "@/components/ScrollToTop";
import PrivateRoute from "@/components/auth/PrivateRoute";
import StaffProtectedRoute from "@/components/auth/StaffProtectedRoute";

import { ThemeProvider } from "@/components/theme-provider";

// Regular Pages
import Index from "./pages/Index";
// import Landing from "./pages/Landing";
import PlatoLanding from "./pages/PlatoLanding";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CustomerOrdering from "./pages/CustomerOrdering";
import NotFound from "./pages/NotFound";

// ✅ NEW: Forgot Password Pages
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";

// ✅ NEW: Signup OTP Page
import SignupOTP from "./pages/SignupOTP";

// Staff Pages
import StaffLogin from "./pages/staff/StaffLogin";
import WaiterPage from "./pages/staff/WaiterPage";
import ChefPage from "./pages/staff/ChefPage";
import ManagerDashboard from "./pages/staff/ManagerDashboard";
import CashierPage from "./pages/staff/CashierPage";

// Super Admin
import SuperAdminPage from "./pages/SuperAdminPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <CurrencyProvider>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                {/* ===== PUBLIC ROUTES ===== */}
                {/* <Route path="/" element={<Landing />} /> */}
                <Route path="/" element={<PlatoLanding />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/signup-otp" element={<SignupOTP />} /> {/* ✅ NEW */}
                <Route path="/index" element={<Index />} />

                {/* ✅ Forgot Password Routes */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* ===== SUPER ADMIN ROUTE ===== */}
                <Route element={<PrivateRoute />}>
                  <Route path="/super-admin" element={<SuperAdminPage />} />
                </Route>

                {/* ===== OWNER PROTECTED ROUTES ===== */}
                <Route element={<PrivateRoute />}>
                  <Route path="/dashboard/*" element={<Dashboard />} />
                </Route>

                {/* ===== STAFF LOGIN ROUTES (Public) ===== */}
                <Route
                  path="/staff/:staffRole/login"
                  element={<StaffLogin />}
                />

                {/* ===== STAFF ROLE-SPECIFIC DASHBOARDS ===== */}
                <Route
                  path="/staff/waiter/dashboard"
                  element={
                    <ThemeProvider defaultTheme="system" storageKey="waiter-theme" attribute="class">
                      <WaiterPage />
                    </ThemeProvider>
                  }
                />
                <Route
                  path="/staff/chef/dashboard"
                  element={
                    <ThemeProvider defaultTheme="system" storageKey="chef-theme" attribute="class">
                      <ChefPage />
                    </ThemeProvider>
                  }
                />
                <Route
                  path="/staff/cashier/dashboard"
                  element={
                    <ThemeProvider defaultTheme="system" storageKey="cashier-theme" attribute="class">
                      <CashierPage />
                    </ThemeProvider>
                  }
                />

                {/* ===== MANAGER PROTECTED ROUTES (Same pages as owner) ===== */}
                <Route
                  element={<StaffProtectedRoute allowedRoles={["manager"]} />}
                >
                  <Route path="/staff/manager/*" element={<ManagerDashboard />} />
                </Route>

                {/* ===== CUSTOMER ORDER PAGES ===== */}
                <Route path="/order/:tableId" element={<CustomerOrdering />} />
                <Route
                  path="/customer/order/:tableId"
                  element={<CustomerOrdering />}
                />

                {/* ===== 404 FALLBACK ===== */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </CurrencyProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;