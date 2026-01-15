import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Award,
  Download,
  Calendar,
  Loader2,
  RefreshCw,
  BarChart3,
  Info,
  Activity,
  Banknote,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { HeroButton, GlassButton } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TooltipProps } from "recharts";
import {
  getDashboardAnalytics,
  getOrdersOverTime,
  getPopularHours,
  getRecentActivity,
} from "../../services/analyticsService";
import { useCurrency } from "../../contexts/CurrencyContext";

const CHART_COLORS = {
  primary: "hsl(262.1 83.3% 57.8%)",
  success: "hsl(142.1 76.2% 36.3%)",
  accent: "hsl(346.8 77.2% 49.8%)",
  warning: "hsl(47.9 95.8% 53.1%)",
  orange: "hsl(24.6 95% 53.1%)",
};

const CARD_GRADIENTS = {
  orders: "bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10",
  revenue: "bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10",
  avg: "bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/10",
  top: "bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-indigo-500/10",
  active: "bg-gradient-to-br from-pink-500/10 via-rose-500/10 to-red-500/10",
};

const ICON_GRADIENTS = {
  orders: "bg-gradient-to-br from-blue-500 to-purple-600",
  revenue: "bg-gradient-to-br from-green-500 to-emerald-600",
  avg: "bg-gradient-to-br from-orange-500 to-amber-600",
  top: "bg-gradient-to-br from-purple-500 to-indigo-600",
  active: "bg-gradient-to-br from-pink-500 to-rose-600",
};

import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MetricCard = ({
  title,
  value,
  change,
  trend,
  changeType,
  icon: Icon,
  tooltip,
  gradient,
  iconGradient,
  compareLabel,
}) => {
  // Determine display based on changeType
  const getChangeDisplay = () => {
    if (changeType === 'neutral') {
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <div className="p-1 rounded-full bg-muted">
            <div className="h-3.5 w-3.5 rounded-full bg-muted-foreground/50" />
          </div>
          <span className="font-semibold text-muted-foreground">{change}</span>
          <span className="text-muted-foreground">{compareLabel || "from yesterday"}</span>
        </div>
      );
    }

    if (changeType === 'new') {
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <div className="p-1 rounded-full bg-primary/10">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-semibold text-primary">{change}</span>
          <span className="text-muted-foreground">- first activity</span>
        </div>
      );
    }

    // Normal trend display
    return (
      <div className="flex items-center gap-1.5 text-xs">
        {trend === "up" ? (
          <div className="p-1 rounded-full bg-success/10">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          </div>
        ) : (
          <div className="p-1 rounded-full bg-destructive/10">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          </div>
        )}
        <span
          className={`font-semibold ${trend === "up" ? "text-success" : "text-destructive"
            }`}
        >
          {change}
        </span>
        <span className="text-muted-foreground">{compareLabel || "vs last period"}</span>
      </div>
    );
  };

  return (
    <Card
      className={`stat-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 border-border/50 h-full overflow-hidden ${gradient}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-foreground/80">
            {title}
          </CardTitle>
          {tooltip && (
            <TooltipProvider>
              <UITooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help transition-colors hover:text-primary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          )}
        </div>
        <div
          className={`h-11 w-11 rounded-xl ${iconGradient} flex items-center justify-center shadow-soft`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          {value}
        </div>
        {getChangeDisplay()}
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ icon: Icon, message, subtitle }) => (
  <div className="h-80 flex flex-col items-center justify-center text-center px-4">
    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 shadow-soft">
      <Icon className="text-primary/60" size={40} />
    </div>
    <p className="text-base font-semibold text-foreground mb-2">
      {message}
    </p>
    {subtitle && (
      <p className="text-sm text-muted-foreground max-w-sm">
        {subtitle}
      </p>
    )}
  </div>
);

type CustomChartTooltipProps = TooltipProps<number | string, string> & {
  formatter?: (value: number | string) => string | number;
};

const CustomChartTooltip = ({
  active,
  payload,
  label,
  formatter,
}: CustomChartTooltipProps) => {
  const safeLabel = typeof label === "number" ? label.toString() : label ?? "";

  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-elevated p-4 animate-fade-in">
        <p className="text-sm font-semibold text-foreground mb-2">
          {safeLabel}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-foreground ml-auto">
              {formatter ? formatter(entry.value ?? "") : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-32 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl"></div>
  </div>
);

export default function AnalyticsPage() {
  const { formatPrice } = useCurrency();
  const [dateRange, setDateRange] = useState("This Week");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [metrics, setMetrics] = useState(null);
  const [ordersOverTime, setOrdersOverTime] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [popularHours, setPopularHours] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchAllData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const period =
          dateRange === "Today"
            ? "today"
            : dateRange === "This Week"
              ? "week"
              : dateRange === "Last Week"
                ? "lastweek"
                : dateRange === "This Month"
                  ? "month"
                  : "week";

        const [analyticsData, ordersTimeData, hoursData, activityData] =
          await Promise.all([
            getDashboardAnalytics(period),
            getOrdersOverTime(period),
            getPopularHours(),
            getRecentActivity(20),
          ]);

        setMetrics({
          totalOrders: analyticsData.totalOrdersToday,
          ordersChange: analyticsData.ordersChange,
          ordersChangePositive: analyticsData.ordersChangePositive,
          ordersChangeType: analyticsData.ordersChangeType,

          totalRevenue: analyticsData.revenueToday,
          revenueChange: analyticsData.revenueChange,
          revenueChangePositive: analyticsData.revenueChangePositive,
          revenueChangeType: analyticsData.revenueChangeType,

          avgOrderValue: analyticsData.avgOrderValue,
          avgOrderValueChange: analyticsData.avgOrderValueChange,
          avgOrderValueChangePositive: analyticsData.avgOrderValueChangePositive,
          avgOrderValueChangeType: analyticsData.avgOrderValueChangeType,

          activeToday: analyticsData.activeToday,
          topItem: analyticsData.popularDish.name,
          topItemCount: analyticsData.popularDish.count,
        });

        setOrdersOverTime(ordersTimeData.ordersOverTime);
        setRevenueData(ordersTimeData.revenueData);
        setCategorySales(analyticsData.categorySales);
        setPopularHours(hoursData);
        setRecentOrders(activityData);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError(err.message || "Failed to load analytics data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange]
  );

  useEffect(() => {
    fetchAllData();

    const interval = setInterval(() => fetchAllData(true), 10000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return (
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20 font-medium shadow-soft">
            Completed
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 font-medium shadow-soft">
            Pending
          </Badge>
        );
      case "Cancelled":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 font-medium shadow-soft">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="font-medium">
            {status}
          </Badge>
        );
    }
  };

  const filteredOrders = recentOrders.filter((order) => {
    // Only show paid/completed orders
    const isPaid = order.status.toLowerCase() === 'paid' || order.status.toLowerCase() === 'completed';
    if (!isPaid) return false;

    return (
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const exportToCSV = () => {
    const csvContent = [
      ["Order ID", "Date", "Table", "Items", "Amount", "Payment", "Status"],
      ...recentOrders.map((order) => [
        order.id,
        order.date,
        order.table,
        `"${order.items}"`,
        order.amount,
        order.payment,
        order.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <div className="relative h-16 w-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary/50 animate-pulse opacity-50" />
                <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Loading analytics data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-center h-96">
            <Card className="max-w-md w-full shadow-elevated border-destructive/20">
              <CardContent className="p-8 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 shadow-soft">
                  <TrendingDown className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">
                    Failed to Load Analytics
                  </h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button
                  onClick={() => fetchAllData()}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:shadow-glow"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const getCompareLabel = () => {
    switch (dateRange) {
      case "Today":
        return "from yesterday";
      case "This Week":
        return "from last week";
      case "Last Week":
        return "vs 2 weeks ago";
      case "This Month":
        return "from last month";
      default:
        return "vs last period";
    }
  };

  const compareLabel = getCompareLabel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-2">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent tracking-tight">
              Analytics Dashboard
            </h1>
            <p className="text-base text-muted-foreground font-medium">
              Track your restaurant performance and insights in real-time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <GlassButton className="gap-2 min-w-[140px] shadow-soft hover:shadow-medium transition-all">
                  <Calendar className="h-4 w-4" />
                  <span>{dateRange}</span>
                </GlassButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-elevated">
                <DropdownMenuLabel>Select Period</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDateRange("Today")}>
                  Today
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateRange("This Week")}>
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateRange("Last Week")}>
                  Last Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDateRange("This Month")}>
                  This Month
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="gap-2 shadow-soft hover:shadow-medium transition-all"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <HeroButton
              className="gap-2 shadow-soft hover:shadow-glow transition-all"
              onClick={exportToCSV}
              size="sm"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </HeroButton>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <MetricCard
            title="Total Orders"
            value={metrics?.totalOrders?.toString() || "0"}
            change={metrics?.ordersChange || "No change"}
            trend={metrics?.ordersChangePositive ? "up" : "down"}
            changeType={metrics?.ordersChangeType}
            icon={ShoppingCart}
            tooltip="Total number of orders received in the selected period. This includes all completed and pending orders."
            gradient={CARD_GRADIENTS.orders}
            iconGradient={ICON_GRADIENTS.orders}
            compareLabel={compareLabel}
          />
          <MetricCard
            title="Total Revenue"
            value={formatPrice(parseFloat(metrics?.totalRevenue || 0))}
            change={metrics?.revenueChange || "No change"}
            trend={metrics?.revenueChangePositive ? "up" : "down"}
            changeType={metrics?.revenueChangeType}
            icon={Banknote}
            tooltip="Total revenue generated from all completed orders. Cancelled orders are excluded."
            gradient={CARD_GRADIENTS.revenue}
            iconGradient={ICON_GRADIENTS.revenue}
            compareLabel={compareLabel}
          />
          <MetricCard
            title="Avg Order Value"
            value={formatPrice(parseFloat(metrics?.avgOrderValue || 0))}
            change={metrics?.avgOrderValueChange || "No change"}
            trend={metrics?.avgOrderValueChangePositive ? "up" : "down"}
            changeType={metrics?.avgOrderValueChangeType}
            icon={TrendingUp}
            tooltip="Average value per order, calculated as Total Revenue divided by Total Orders."
            gradient={CARD_GRADIENTS.avg}
            iconGradient={ICON_GRADIENTS.avg}
            compareLabel={compareLabel}
          />
          <MetricCard
            title="Top Item"
            value={metrics?.topItem || "N/A"}
            change={`${metrics?.topItemCount || 0} orders`}
            trend="up"
            changeType="normal"
            icon={Award}
            tooltip="Most frequently ordered item during the selected period."
            gradient={CARD_GRADIENTS.top}
            iconGradient={ICON_GRADIENTS.top}
            compareLabel={compareLabel}
          />
          <MetricCard
            title="Active Tables"
            value={metrics?.activeToday?.toString() || "0"}
            change="Unique tables"
            trend="up"
            changeType="normal"
            icon={Activity}
            tooltip="Number of unique tables that placed orders today."
            gradient={CARD_GRADIENTS.active}
            iconGradient={ICON_GRADIENTS.active}
            compareLabel={compareLabel}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Orders Over Time */}
          <Card className="glass transition-all duration-300 hover:shadow-elevated border-border/50 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <CardHeader className="pb-4 space-y-1.5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                Orders Over Time
              </CardTitle>
              <CardDescription className="text-sm">
                {dateRange === "Today" ? "Hourly" : "Daily"} order volume for{" "}
                {dateRange.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              {loading && ordersOverTime.length === 0 ? (
                <LoadingSkeleton />
              ) : ordersOverTime.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  message="No order data available"
                  subtitle="Order data will appear here once you start receiving orders for the selected period"
                />
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart
                    data={ordersOverTime}
                    margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient
                        id="lineGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      angle={dateRange === "This Month" ? -45 : 0}
                      textAnchor={dateRange === "This Month" ? "end" : "middle"}
                      height={dateRange === "This Month" ? 80 : 50}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{
                        stroke: "hsl(var(--border))",
                        strokeWidth: 1.5,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={{
                        fill: "#8b5cf6",
                        r: 5,
                        strokeWidth: 2,
                        stroke: "white",
                      }}
                      activeDot={{ r: 7, fill: "#8b5cf6" }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card className="glass transition-all duration-300 hover:shadow-elevated border-border/50 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
            <CardHeader className="pb-4 space-y-1.5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                Revenue Trend
              </CardTitle>
              <CardDescription className="text-sm">
                {dateRange === "Today" ? "Hourly" : "Daily"} revenue performance
                with growth indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              {loading && revenueData.length === 0 ? (
                <LoadingSkeleton />
              ) : revenueData.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  message="No revenue data available"
                  subtitle="Revenue trends will appear once you start receiving completed orders"
                />
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart
                    data={revenueData}
                    margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      angle={dateRange === "This Month" ? -45 : 0}
                      textAnchor={dateRange === "This Month" ? "end" : "middle"}
                      height={dateRange === "This Month" ? 80 : 50}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={
                        <CustomChartTooltip
                          formatter={(value) => formatPrice(value)}
                        />
                      }
                      cursor={{
                        stroke: "hsl(var(--border))",
                        strokeWidth: 1.5,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#colorRevenue)"
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Category Sales */}
          <Card className="glass transition-all duration-300 hover:shadow-elevated border-border/50 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
            <CardHeader className="pb-4 space-y-1.5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500" />
                Category Sales
              </CardTitle>
              <CardDescription className="text-sm">
                Revenue distribution by menu category
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              {loading && categorySales.length === 0 ? (
                <LoadingSkeleton />
              ) : categorySales.length === 0 ||
                categorySales.every((c) => c.value === 0) ? (
                <EmptyState
                  icon={BarChart3}
                  message="No category sales data"
                  subtitle="Category breakdown will appear once you receive orders across different menu categories"
                />
              ) : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <defs>
                        <linearGradient
                          id="grad1"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                        <linearGradient
                          id="grad2"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#14b8a6" />
                        </linearGradient>
                        <linearGradient
                          id="grad3"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                        <linearGradient
                          id="grad4"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                        <linearGradient
                          id="grad5"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={categorySales}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.percentage}%`}
                        outerRadius={90}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {categorySales.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={`url(#grad${(index % 5) + 1})`}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={
                          <CustomChartTooltip
                            formatter={(value) => formatPrice(value)}
                          />
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4">
                    {categorySales.map((entry, index) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 shadow-soft"
                      >
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{
                            background:
                              index === 0
                                ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                                : index === 1
                                  ? "linear-gradient(135deg, #10b981, #14b8a6)"
                                  : index === 2
                                    ? "linear-gradient(135deg, #f59e0b, #ef4444)"
                                    : index === 3
                                      ? "linear-gradient(135deg, #ec4899, #8b5cf6)"
                                      : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                          }}
                        />
                        <span className="text-xs text-foreground font-semibold">
                          {entry.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Hours */}
          <Card className="glass transition-all duration-300 hover:shadow-elevated border-border/50 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500" />
            <CardHeader className="pb-4 space-y-1.5">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
                Popular Hours
              </CardTitle>
              <CardDescription className="text-sm">
                Busiest times of the day - Peak hour analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              {loading && popularHours.length === 0 ? (
                <LoadingSkeleton />
              ) : popularHours.length === 0 ||
                popularHours.every((h) => h.orders === 0) ? (
                <EmptyState
                  icon={Users}
                  message="No hourly activity data"
                  subtitle="Peak hours analysis will show up once you start receiving orders throughout the day"
                />
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart
                    data={popularHours}
                    margin={{ top: 10, right: 20, left: -10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient
                        id="barGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="hour"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<CustomChartTooltip />}
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.1 }}
                    />
                    <Bar
                      dataKey="orders"
                      name="Orders"
                      fill="url(#barGradient)"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Table */}
        <Card className="glass border-border/50 overflow-hidden shadow-card">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <CardHeader className="pb-4 bg-gradient-to-br from-card to-muted/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-sm">
                  Latest orders from your restaurant - Live updates
                </CardDescription>
              </div>
              <div className="relative">
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-80 pl-4 pr-10 shadow-soft border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto shadow-soft">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {searchQuery
                      ? "No orders match your search"
                      : "No orders found"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "New orders will appear here"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden shadow-soft">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/50">
                        <TableHead className="font-semibold text-foreground">
                          Order ID
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Date
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Table
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Items
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Amount
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Payment
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order, index) => (
                        <TableRow
                          key={order.id}
                          className="hover:bg-muted/30 transition-all duration-200 border-b border-border/30 cursor-pointer"
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: "fade-in 0.3s ease-out forwards",
                          }}
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsDialogOpen(true);
                          }}
                        >
                          <TableCell className="font-mono text-sm font-medium">
                            <span className="px-2 py-1 rounded-md bg-primary/5 text-primary border border-primary/10">
                              {order.id.slice(-6).toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {order.date}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            <span className="px-2 py-1 rounded-md bg-accent/5 text-accent border border-accent/10">
                              {order.table}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {order.items}
                          </TableCell>
                          <TableCell className="font-semibold text-sm">
                            <span className="text-success">
                              {formatPrice(order.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="px-2 py-1 rounded-md bg-muted/50 text-foreground border border-border/50 text-xs font-medium">
                              {order.payment}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>


      </div>

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
              {/* Table & Date Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-semibold">{selectedOrder.id.slice(-6).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-semibold">{selectedOrder.table}</p>
                </div>
              </div>

              {/* Payment & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <Badge variant="outline" className="mt-1">
                    {selectedOrder.payment}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{selectedOrder.date}</p>
              </div>

              {/* Items List */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Items Ordered</p>
                <div className="bg-muted/50 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {selectedOrder.items ? (
                    <ul className="space-y-2">
                      {selectedOrder.items.split(',').map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          <span className="text-sm">{item.trim()}</span>
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
                    {formatPrice(selectedOrder.amount ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}