import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  success: "hsl(var(--chart-2))",
  accent: "hsl(var(--chart-3))",
};

import { useCurrency } from "@/contexts/CurrencyContext";

const CustomTooltip = ({ active, payload }) => {
  const { currency } = useCurrency();
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-1">
          {payload[0].payload.date}
        </p>
        <p className="text-sm text-muted-foreground">
          Revenue:{" "}
          <span className="font-semibold text-success">
            {currency.symbol}{payload[0].value.toFixed(2)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export const SalesTrendChart = ({ revenueData, isLoading }) => {
  const { currency } = useCurrency();
  const [chartType, setChartType] = useState("area");

  const totalRevenue =
    revenueData?.reduce((sum, day) => sum + (day.revenue || 0), 0) || 0;
  const avgRevenue =
    revenueData?.length > 0 ? totalRevenue / revenueData.length : 0;
  const hasData = revenueData && revenueData.length > 0 && totalRevenue > 0;

  return (
    <Card className="card-glass border-0 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center text-base lg:text-lg">
            <TrendingUp className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
            <span className="truncate">Sales Trends</span>
          </CardTitle>

          {hasData && (
            <button
              onClick={() =>
                setChartType(chartType === "area" ? "line" : "area")
              }
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
            >
              Switch to {chartType === "area" ? "Line" : "Area"}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 lg:p-6">
        {isLoading ? (
          <div className="h-48 rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center border border-border/50">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-primary mx-auto mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading chart...</p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="h-48 rounded-lg bg-gradient-to-br from-primary/5 to-muted/10 flex items-center justify-center border border-border/50 relative overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg
                className="w-full h-full"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 180 Q 100 140, 200 120 T 400 80"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  fill="url(#chartGradient)"
                  opacity="0.5"
                  strokeDasharray="5,5"
                />
              </svg>
            </div>

            {/* Empty state content */}
            <div className="text-center px-4 relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-3 shadow-soft">
                <BarChart3 className="h-8 w-8 text-primary/60" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">
                Waiting for sales data
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your sales trends will show up after you receive a few orders
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-48 lg:h-56 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "area" ? (
                  <AreaChart data={revenueData}>
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
                          stopColor={CHART_COLORS.success}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_COLORS.success}
                          stopOpacity={0}
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
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(value) => `${currency.symbol}${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS.success}
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                      animationDuration={800}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={revenueData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={3}
                      dot={{ fill: CHART_COLORS.primary, r: 4 }}
                      activeDot={{ r: 6 }}
                      animationDuration={800}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Stats Summary */}
            <div className="space-y-2 pt-3 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total (Week)</span>
                <span className="font-semibold text-foreground">
                  {currency.symbol}{totalRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Daily Average</span>
                <span className="font-semibold text-muted-foreground">
                  {currency.symbol}{avgRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Peak Hour </span>
                <span className="font-semibold text-success">
                  {revenueData.reduce(
                    (max, day) =>
                      day.revenue > (max?.revenue || 0) ? day : max,
                    revenueData[0]
                  )?.date || "N/A"}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
