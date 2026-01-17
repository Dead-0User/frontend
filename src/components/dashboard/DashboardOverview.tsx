import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HeroButton, GlassButton } from "@/components/ui/button-variants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Banknote,
  ShoppingBag,
  Star,
  Plus,
  Eye,
  Users,
  ChefHat,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  AlertCircle,
  Smartphone,
  UserCircle,
  Minus,
} from "lucide-react";
import { getDashboardAnalytics } from "@/services/analyticsService";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { useCurrency } from "@/contexts/CurrencyContext";

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "status-pending";
    case "preparing":
      return "status-preparing";
    case "ready":
      return "status-ready";
    case "served":
      return "status-completed";
    case "cancelled":
      return "bg-red-500/20 text-red-600 border-red-500/30";
    default:
      return "bg-muted";
  }
};

const getOrderTypeInfo = (orderType) => {
  if (orderType === "qr") {
    return {
      icon: <Smartphone className="h-3 w-3" />,
      label: "QR Order",
      className: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    };
  }
  return {
    icon: <UserCircle className="h-3 w-3" />,
    label: "Staff Order",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  };
};

export const DashboardOverview = ({ basePath = "/dashboard" }: { basePath?: string }) => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📊 Fetching dashboard analytics...");
      const data = await getDashboardAnalytics("today");
      console.log("✅ Analytics data received:", data);

      if (!data || typeof data !== "object") {
        throw new Error("Invalid data format received from analytics service");
      }

      setAnalytics(data);
    } catch (err) {
      console.error("❌ Error fetching analytics:", err);
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !analytics) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleClearDataAndRetry = () => {
    // Clear any potentially corrupted cached data
    try {
      // Clear service worker cache if available
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    } catch (err) {
      console.error("Error clearing cache:", err);
    }

    // Reset error state and retry
    setError(null);
    fetchAnalytics();
  };

  if (error && !analytics) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Failed to Load Dashboard
              </h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="space-y-2 text-sm text-muted-foreground mb-6">
                <p className="font-medium">Possible solutions:</p>
                <ul className="list-disc list-inside text-left space-y-1">
                  <li>Check your internet connection</li>
                  <li>Try clearing your browser data</li>
                  <li>Log out and log back in</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={fetchAnalytics} className="gap-2 w-full">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={handleClearDataAndRetry}
                  variant="outline"
                  className="gap-2 w-full"
                >
                  Clear Data & Retry
                </Button>
                <Button
                  onClick={() => setError(null)}
                  variant="ghost"
                  className="gap-2 w-full text-muted-foreground"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Helper function to render change indicator
  const renderChangeIndicator = (changeType, change, positive) => {
    if (changeType === "neutral") {
      return (
        <div className="flex items-center text-xs lg:text-sm mt-1 text-muted-foreground">
          <Minus className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">No change from yesterday</span>
        </div>
      );
    }

    if (changeType === "new") {
      return (
        <div className="flex items-center text-xs lg:text-sm mt-1 text-primary">
          <ArrowUp className="h-4 w-4 mr-1 flex-shrink-0" />
          <span className="truncate">New activity today</span>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center text-xs lg:text-sm mt-1 ${positive ? "text-success" : "text-destructive"
          }`}
      >
        {positive ? (
          <ArrowUp className="h-4 w-4 mr-1 flex-shrink-0" />
        ) : (
          <ArrowDown className="h-4 w-4 mr-1 flex-shrink-0" />
        )}
        <span className="truncate">{change} from yesterday</span>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Welcome back! Here's what's happening at your restaurant today.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <GlassButton onClick={() => navigate(`${basePath}/menu`)}>
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">View Menu</span>
            <span className="sm:hidden">Menu</span>
          </GlassButton>
          <HeroButton onClick={() => navigate(`${basePath}/menu`)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add New Dish</span>
            <span className="sm:hidden">Add</span>
          </HeroButton>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Orders Today Card */}
        <Card className="card-glass border-0 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-sm font-medium">
                  Total Orders Today
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">
                  {analytics?.totalOrdersToday ?? 0}
                </p>
                {renderChangeIndicator(
                  analytics?.ordersChangeType,
                  analytics?.ordersChange,
                  analytics?.ordersChangePositive
                )}
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                <ShoppingBag className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Today Card */}
        <Card className="card-glass border-0 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-sm font-medium">
                  Revenue Today
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">
                  {formatPrice(analytics?.revenueToday ?? 0)}
                </p>
                {renderChangeIndicator(
                  analytics?.revenueChangeType,
                  analytics?.revenueChange,
                  analytics?.revenueChangePositive
                )}
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                <Banknote className="h-5 w-5 lg:h-6 lg:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders Card */}
        <Card className="card-glass border-0 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-sm font-medium">
                  Pending Orders
                </p>
                <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">
                  {analytics?.pendingOrders ?? 0}
                </p>
                <div
                  className={`flex items-center text-xs lg:text-sm mt-1 ${(analytics?.pendingOrders ?? 0) > 0
                    ? "text-warning"
                    : "text-muted-foreground"
                    }`}
                >
                  <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {(analytics?.pendingOrders ?? 0) > 0
                      ? "Needs attention"
                      : "All clear"}
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Dish Card */}
        <Card className="card-glass border-0 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-muted-foreground text-sm font-medium">
                  Popular Dish
                </p>
                {!analytics?.popularDish?.name ||
                  analytics?.popularDish?.name === "N/A" ||
                  analytics?.popularDish?.count === 0 ? (
                  <>
                    <p className="text-base lg:text-lg font-bold text-muted-foreground mt-2">
                      No orders yet
                    </p>
                    <div className="flex items-center text-xs lg:text-sm text-muted-foreground mt-1">
                      <ChefHat className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        Popular dishes will appear here
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-base lg:text-lg font-bold text-foreground mt-2 truncate">
                      {analytics.popularDish.name}
                    </p>
                    <div className="flex items-center text-xs lg:text-sm text-primary mt-1">
                      <ChefHat className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {analytics.popularDish.count} orders today
                      </span>
                    </div>
                  </>
                )}
              </div>
              <div className="h-10 w-10 lg:h-12 lg:w-12 bg-orange-secondary rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                <Star className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 card-glass border-0">
          <CardHeader className="flex flex-row items-center justify-between p-4 lg:p-6">
            <CardTitle className="text-foreground text-base lg:text-lg">
              Recent Orders
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs lg:text-sm"
              onClick={() => navigate(`${basePath}/orders`)}
            >
              View All
            </Button>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            {!analytics?.recentOrders || analytics.recentOrders.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-soft">
                  <ShoppingBag className="h-8 w-8 text-primary/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    No orders yet today
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Orders will appear here once customers start placing them
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.recentOrders.map((order) => {
                  const orderTypeInfo = getOrderTypeInfo(order.orderType);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center space-x-3 lg:space-x-4 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1 flex-wrap">
                            <p className="font-semibold text-foreground truncate">
                              {order.customerName}
                            </p>
                            <Badge
                              className={`${orderTypeInfo.className} text-xs border flex items-center gap-1 pointer-events-none`}
                            >
                              {orderTypeInfo.icon}
                              <span>{orderTypeInfo.label}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.items && order.items.length > 0 ? (
                              <>
                                {order.items.slice(0, 2).join(", ")}
                                {order.items.length > 2 && (
                                  <span className="text-primary font-medium">
                                    {" "}+{order.items.length - 2} more
                                  </span>
                                )}
                              </>
                            ) : (
                              "No items"
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-semibold text-foreground">
                          {formatPrice(order.total ?? 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Table {order.tableNumber}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Sales Chart */}
          <SalesTrendChart
            revenueData={analytics?.revenueByDay || []}
            isLoading={loading}
          />

          {/* Menu Insights */}
          <Card className="card-glass border-0">
            <CardHeader className="p-4 lg:p-6">
              <CardTitle className="text-foreground text-base lg:text-lg">
                Menu Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 lg:p-6 space-y-4">
              {!analytics?.popularDish ||
                analytics.popularDish.name === "N/A" ||
                analytics.popularDish.count === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50">
                    <ChefHat className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Menu insights will appear once you receive orders
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                        <ArrowUp className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Most Ordered
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {analytics.popularDish.name} -{" "}
                          {analytics.popularDish.count} orders
                        </p>
                      </div>
                    </div>
                  </div>

                  {analytics.leastOrderedDish &&
                    analytics.leastOrderedDish.name !== "N/A" &&
                    analytics.leastOrderedDish.count > 0 && (
                      <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center flex-shrink-0">
                            <ArrowDown className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              Least Ordered
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {analytics.leastOrderedDish.name} -{" "}
                              {analytics.leastOrderedDish.count} order
                              {analytics.leastOrderedDish.count !== 1
                                ? "s"
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="card-glass border-0">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-muted-foreground">Quick Actions</h3>
            <div className="flex items-center gap-8">
              <button
                onClick={() => navigate(`${basePath}/menu`)}
                className="flex flex-col items-center gap-2 group transition-all hover:scale-105"
              >
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Add New Dish
                </span>
              </button>

              <button
                onClick={() => navigate(`${basePath}/staff`)}
                className="flex flex-col items-center gap-2 group transition-all hover:scale-105"
              >
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Manage Staff
                </span>
              </button>

              <button
                onClick={() => navigate(`${basePath}/analytics`)}
                className="flex flex-col items-center gap-2 group transition-all hover:scale-105"
              >
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <BarChart3 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  View Reports
                </span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer & Table Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-semibold">{selectedOrder.tableNumber}</p>
                </div>
              </div>

              {/* Order Type & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Type</p>
                  <Badge
                    className={`${getOrderTypeInfo(selectedOrder.orderType).className} text-xs border flex items-center gap-1 w-fit mt-1`}
                  >
                    {getOrderTypeInfo(selectedOrder.orderType).icon}
                    <span>{getOrderTypeInfo(selectedOrder.orderType).label}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="text-sm">{selectedOrder.timestamp}</p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Items Ordered</p>
                <div className="bg-muted/50 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items</p>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(selectedOrder.total ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
