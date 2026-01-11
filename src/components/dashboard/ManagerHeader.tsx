import {
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  X,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/contexts/NotificationContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { API_BASE_URL } from "@/config";

interface ManagerHeaderProps {
  restaurantName: string;
  managerName: string;
  managerEmail?: string;
  restaurantLogo?: string;
  onMobileMenuClick?: () => void;
  basePath?: string; // Base path for navigation (default: "/staff/manager")
}

export const ManagerHeader = ({
  restaurantName,
  managerName,
  managerEmail,
  restaurantLogo,
  onMobileMenuClick,
  basePath = "/staff/manager",
}: ManagerHeaderProps) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
  } = useNotifications();
  const { currency } = useCurrency();
  const { theme, setTheme } = useTheme();

  // Construct the full logo URL
  const logoUrl = restaurantLogo
    ? `${API_BASE_URL}${restaurantLogo}`
    : null;

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMobileMenuClick) {
      onMobileMenuClick();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffData");
    navigate("/staff/manager/login");
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 backdrop-blur-md bg-background/80 z-40">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* LEFT SIDE: Mobile Menu Button + Restaurant Logo & Name */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={handleMenuClick}
            className="flex items-center justify-center lg:hidden p-2 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors flex-shrink-0 touch-manipulation"
            aria-label="Open menu"
            type="button"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <Menu className="h-6 w-6 text-foreground" strokeWidth={2} />
          </button>

          {/* Restaurant Info */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {logoUrl ? (
              <Avatar className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0 border-2 border-border">
                <AvatarImage
                  src={logoUrl}
                  alt={restaurantName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {restaurantName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-9 w-9 md:h-10 md:w-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-semibold text-base md:text-lg">
                  {restaurantName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-base md:text-lg lg:text-xl font-semibold text-foreground truncate">
                {restaurantName}
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground truncate">
                Manager Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Notifications & Profile */}
        <div className="flex items-center gap-1 md:gap-2 lg:gap-4 flex-shrink-0">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 md:h-10 md:w-10 p-0"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Real-time Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 md:h-10 md:w-10 p-0"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-foreground truncate">
                    Order Notifications
                  </h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {unreadCount > 0
                      ? `${unreadCount} new order${unreadCount > 1 ? "s" : ""}`
                      : "All caught up!"}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs flex-shrink-0 ml-2"
                  >
                    Mark all
                  </Button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border hover:bg-muted/50 transition-colors relative group ${!notification.read ? "bg-primary/5" : ""
                        }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      {!notification.read && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(notification.id);
                        }}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>

                      <div className="pl-3 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-semibold text-foreground truncate">
                            New Order - Table {notification.tableNumber}
                          </p>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2 truncate">
                          {notification.customerName} • {notification.itemCount}{" "}
                          item{notification.itemCount > 1 ? "s" : ""} • {currency.symbol}
                          {notification.totalPrice.toFixed(2)}
                        </p>

                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {notification.items.join(", ")}
                        </p>

                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-primary"
                      onClick={() => navigate(`${basePath}/orders`)}
                    >
                      View all orders
                    </Button>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-9 md:h-10 px-2"
              >
                <Avatar className="h-7 w-7 md:h-8 md:w-8">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                    {managerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium hidden md:block text-sm">
                  {managerName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {managerName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {managerEmail || "Manager"}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate(`${basePath}/settings`)}
              >
                <User className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => navigate(`${basePath}/settings`)}
              >
                <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Restaurant Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

