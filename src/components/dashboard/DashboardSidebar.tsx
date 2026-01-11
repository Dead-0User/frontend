import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  ShoppingBag,
  Menu,
  Calendar,
  Users,
  Star,
  Settings,
  ChevronLeft,
  Home,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

// Generate sidebar items based on base path
const getSidebarItems = (basePath: string): SidebarItem[] => [
  {
    title: "Dashboard",
    href: basePath === "/dashboard" ? "/dashboard" : `${basePath}/dashboard`,
    icon: Home,
  },
  {
    title: "Orders",
    href: `${basePath}/orders`,
    icon: ShoppingBag,
  },
  {
    title: "Menu Management",
    href: `${basePath}/menu`,
    icon: Menu,
  },
  {
    title: "Tables & QR Codes",
    href: `${basePath}/tables`,
    icon: QrCode,
  },
  {
    title: "Staff Management",
    href: `${basePath}/staff`,
    icon: Users,
  },
  {
    title: "Analytics & Reports",
    href: `${basePath}/analytics`,
    icon: BarChart3,
  },
  {
    title: "Reservations",
    href: `${basePath}/reservations`,
    icon: Calendar,
  },
  {
    title: "Customers & Feedback",
    href: `${basePath}/feedback`,
    icon: Star,
  },
  {
    title: "Settings",
    href: `${basePath}/settings`,
    icon: Settings,
  },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
  basePath?: string; // Base path for navigation (default: "/dashboard")
  allowedItems?: string[]; // Optional: filter which items to show (e.g., ["Orders", "Menu Management", "Staff Management", "Analytics & Reports"])
  ordersBadgeCount?: number; // Optional: dynamic count for Orders badge
}

export const DashboardSidebar = ({
  collapsed,
  onToggle,
  onMobileClose,
  basePath = "/dashboard",
  allowedItems,
  ordersBadgeCount,
}: DashboardSidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Get all sidebar items and filter if allowedItems is provided
  const allItems = getSidebarItems(basePath);
  const sidebarItems = allowedItems
    ? allItems.filter((item) => allowedItems.includes(item.title))
    : allItems;

  // Handle navigation click - check window width directly to ensure accuracy
  const handleNavClick = () => {
    // Check if we're in mobile view (< 1024px is the lg breakpoint)
    const isMobileView = window.innerWidth < 1024;

    if (isMobileView && onMobileClose) {
      // Add small delay to let navigation animation start
      setTimeout(() => {
        onMobileClose();
      }, 150);
    }
  };

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col h-full",
        // Mobile: always full width (256px)
        // Desktop (lg+): responsive to collapsed prop
        "w-64",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}
    >
      {/* Collapse Toggle - Desktop Only */}
      <div className="hidden lg:block p-4 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft
            className={cn(
              "h-5 w-5 transition-transform",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          // For dashboard route, check if we're at the dashboard path or base path
          const dashboardHref = basePath === "/dashboard" ? "/dashboard" : `${basePath}/dashboard`;
          const isDashboard = item.href === dashboardHref;

          let isActive = false;
          if (isDashboard) {
            // Dashboard is active if we're at the dashboard path or at the base path (which redirects to dashboard)
            isActive = currentPath === item.href || currentPath === basePath;
          } else {
            // For other routes, check if current path starts with the item href
            isActive = currentPath.startsWith(item.href);
          }

          // Determine badge value - use dynamic count for Orders, otherwise use item.badge
          const badgeValue = item.title === "Orders" && ordersBadgeCount !== undefined
            ? ordersBadgeCount
            : item.badge;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg transition-colors group relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-sidebar-primary" : "text-sidebar-foreground"
                )}
              />
              {/* Show text on mobile always, on desktop only when not collapsed */}
              <span
                className={cn(
                  "font-medium flex-1 ml-3",
                  "lg:hidden", // Always show on mobile
                  !collapsed && "lg:inline" // Show on desktop when expanded
                )}
              >
                {item.title}
              </span>

              {/* Badge - same logic as text, only show if badgeValue > 0 */}
              {badgeValue !== undefined && badgeValue > 0 && (
                <span
                  className={cn(
                    "bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-5 h-5 flex items-center justify-center ml-2",
                    "lg:hidden", // Always show on mobile
                    !collapsed && "lg:flex" // Show on desktop when expanded
                  )}
                >
                  {badgeValue}
                </span>
              )}

              {/* Tooltip for collapsed state - Desktop only */}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-sidebar text-sidebar-foreground text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 hidden lg:block shadow-lg border border-sidebar-border">
                  {item.title}
                  {badgeValue !== undefined && badgeValue > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                      {badgeValue}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer - hide on mobile, show on desktop when expanded */}
      <div
        className={cn(
          "p-4 border-t border-sidebar-border",
          "hidden", // Hide on mobile
          !collapsed && "lg:block" // Show on desktop when expanded
        )}
      >
        <div className="text-xs text-muted-foreground text-center">
          <p>QRMenu Dashboard</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  );
};