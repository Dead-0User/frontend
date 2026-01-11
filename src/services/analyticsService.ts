// src/services/analyticsService.ts

import { API_BASE_URL as BASE_URL } from "@/config";

const API_BASE_URL = `${BASE_URL}/api`;

interface Order {
  _id: string;
  createdAt: string;
  totalPrice: number;
  status: string;
  orderType?: string;
  customerName?: string;
  tableId?: {
    tableName: string;
  };
  items: OrderItem[];
  paymentMethod?: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  menuItemId?: {
    _id: string;
    sectionId?: {
      _id: string;
      name: string;
    };
  };
}

interface PercentageChange {
  change: string;
  positive: boolean;
  isNoChange?: boolean;
  isNew?: boolean;
}

interface DashboardAnalytics {
  totalOrdersToday: number;
  ordersChange: string;
  ordersChangePositive: boolean;
  ordersChangeType: "neutral" | "new" | "normal";
  revenueToday: string;
  revenueChange: string;
  revenueChangePositive: boolean;
  revenueChangeType: "neutral" | "new" | "normal";
  avgOrderValue: string;
  avgOrderValueChange: string;
  avgOrderValueChangePositive: boolean;
  avgOrderValueChangeType: "neutral" | "new" | "normal";
  activeToday: number;
  pendingOrders: number;
  popularDish: {
    name: string;
    count: number;
  };
  leastOrderedDish: {
    name: string;
    count: number;
  };
  recentOrders: RecentOrder[];
  revenueByDay: RevenueByDay[];
  categorySales: CategorySales[];
}

interface RecentOrder {
  id: string;
  tableNumber: string;
  customerName: string;
  items: string[];
  total: number;
  status: string;
  orderType: string;
  timestamp: string;
  createdAt: string;
}

interface RevenueByDay {
  date: string;
  revenue: number;
}

interface CategorySales {
  name: string;
  value: number;
  percentage: number;
}

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    return {
      Authorization: "",
      "Content-Type": "application/json",
    };
  }

  const staffToken = localStorage.getItem("staffToken");
  const token = staffToken || localStorage.getItem("token");

  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

// ============================================================================
// IMPROVED PERCENTAGE CALCULATION WITH PROPER EDGE CASE HANDLING
// ============================================================================
const calculatePercentageChange = (
  current: number,
  previous: number
): PercentageChange => {
  // Case 1: Both are zero → No change (neutral state)
  if (current === 0 && previous === 0) {
    return {
      change: "0",
      positive: true,
      isNoChange: true,
    };
  }

  // Case 2: Previous was 0, current has value → New data
  if (previous === 0 && current > 0) {
    return {
      change: "100",
      positive: true,
      isNew: true,
    };
  }

  // Case 3: Current is 0, previous had value → 100% decrease
  if (previous > 0 && current === 0) {
    return {
      change: "100",
      positive: false,
    };
  }

  // Case 4: Normal calculation
  const changeValue = ((current - previous) / previous) * 100;
  return {
    change: Math.abs(changeValue).toFixed(1),
    positive: changeValue >= 0,
  };
};

export const getDashboardAnalytics = async (
  period: string = "today"
): Promise<DashboardAnalytics> => {
  try {
    const headers = getAuthHeaders();

    const endDate = new Date();
    const startDate = new Date();

    // Calculate date ranges based on period
    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "lastweek") {
      startDate.setDate(startDate.getDate() - 14);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 7);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    // Fetch current period data
    const response = await fetch(
      `${API_BASE_URL}/orders/restaurant?limit=1000&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch analytics data");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch analytics data");
    }

    // Fetch previous period data for comparison
    const prevEndDate = new Date(startDate);
    prevEndDate.setMilliseconds(-1);
    const prevStartDate = new Date(startDate);

    const periodLength = endDate.getTime() - startDate.getTime();
    prevStartDate.setTime(prevStartDate.getTime() - periodLength);

    const prevResponse = await fetch(
      `${API_BASE_URL}/orders/restaurant?limit=1000&startDate=${prevStartDate.toISOString()}&endDate=${prevEndDate.toISOString()}`,
      { headers }
    );

    let prevData = [];
    if (prevResponse.ok) {
      const prevResult = await prevResponse.json();
      if (prevResult.success) {
        prevData = prevResult.data;
      }
    }

    return processAnalyticsData(data.data, prevData, period);
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    throw error;
  }
};

const processAnalyticsData = (
  currentOrders: Order[],
  previousOrders: Order[],
  period: string
): DashboardAnalytics => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Validate and sanitize orders
  const validCurrentOrders = currentOrders.filter(
    (order) =>
      order &&
      order.totalPrice !== null &&
      order.totalPrice !== undefined &&
      order.createdAt &&
      Array.isArray(order.items)
  );

  const validPreviousOrders = previousOrders.filter(
    (order) =>
      order &&
      order.totalPrice !== null &&
      order.totalPrice !== undefined &&
      order.createdAt &&
      Array.isArray(order.items)
  );

  // Filter for today's orders (for display purposes)
  const todayOrders = validCurrentOrders.filter((order) => {
    try {
      return new Date(order.createdAt) >= today;
    } catch {
      return false;
    }
  });

  // Calculate totals for current period
  const totalOrdersCurrent = validCurrentOrders.length;
  const revenueCurrent = validCurrentOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice),
    0
  );

  // Calculate totals for previous period
  const totalOrdersPrevious = validPreviousOrders.length;
  const revenuePrevious = validPreviousOrders.reduce(
    (sum, order) => sum + Number(order.totalPrice),
    0
  );

  // Calculate average order values
  const avgOrderValueCurrent =
    totalOrdersCurrent > 0 ? revenueCurrent / totalOrdersCurrent : 0;
  const avgOrderValuePrevious =
    totalOrdersPrevious > 0 ? revenuePrevious / totalOrdersPrevious : 0;

  // Calculate percentage changes with improved logic
  const ordersChangeData = calculatePercentageChange(
    totalOrdersCurrent,
    totalOrdersPrevious
  );
  const revenueChangeData = calculatePercentageChange(
    revenueCurrent,
    revenuePrevious
  );
  const avgOrderValueChangeData = calculatePercentageChange(
    avgOrderValueCurrent,
    avgOrderValuePrevious
  );

  // Format change strings based on type
  const formatChange = (data: PercentageChange): string => {
    if (data.isNoChange) return "No change";
    if (data.isNew) return "New today";
    return `${data.positive ? "+" : ""}${data.change}%`;
  };

  const getChangeType = (
    data: PercentageChange
  ): "neutral" | "new" | "normal" => {
    if (data.isNoChange) return "neutral";
    if (data.isNew) return "new";
    return "normal";
  };

  const pendingOrders = todayOrders.filter(
    (order) => order.status === "pending" || order.status === "preparing"
  ).length;

  // Count unique active customers/tables today
  const uniqueTables = new Set(
    todayOrders
      .filter((order) => order.status !== "cancelled")
      .map((order) => order.tableId?.tableName)
      .filter(Boolean)
  );
  const activeToday = uniqueTables.size;

  // Calculate dish counts from current period orders
  const dishCount: Record<string, number> = {};
  validCurrentOrders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        if (item && item.name) {
          dishCount[item.name] =
            (dishCount[item.name] || 0) + (item.quantity || 0);
        }
      });
    }
  });

  const sortedDishes = Object.entries(dishCount).sort((a, b) => b[1] - a[1]);
  const popularDish = sortedDishes.length > 0 ? sortedDishes[0] : ["N/A", 0];
  const leastOrderedDish =
    sortedDishes.length > 0
      ? sortedDishes[sortedDishes.length - 1]
      : ["N/A", 0];

  const recentOrders: RecentOrder[] = todayOrders
    .sort((a, b) => {
      try {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch {
        return 0;
      }
    })
    .slice(0, 10)
    .map((order) => ({
      id: order._id,
      tableNumber: order.tableId?.tableName || "Unknown",
      customerName: order.customerName || "Guest",
      items: Array.isArray(order.items)
        ? order.items.map((item) => item.name || "")
        : [],
      total: order.totalPrice,
      status: order.status,
      orderType: order.orderType || "staff",
      timestamp: getTimeAgo(order.createdAt),
      createdAt: order.createdAt,
    }));

  const revenueByDay = calculateRevenueByDay(validCurrentOrders, period);
  const categorySales = calculateCategorySales(validCurrentOrders);

  return {
    totalOrdersToday: todayOrders.length,
    ordersChange: formatChange(ordersChangeData),
    ordersChangePositive: ordersChangeData.positive,
    ordersChangeType: getChangeType(ordersChangeData),

    revenueToday: todayOrders
      .reduce((sum, order) => sum + Number(order.totalPrice), 0)
      .toFixed(2),
    revenueChange: formatChange(revenueChangeData),
    revenueChangePositive: revenueChangeData.positive,
    revenueChangeType: getChangeType(revenueChangeData),

    avgOrderValue: avgOrderValueCurrent.toFixed(2),
    avgOrderValueChange: formatChange(avgOrderValueChangeData),
    avgOrderValueChangePositive: avgOrderValueChangeData.positive,
    avgOrderValueChangeType: getChangeType(avgOrderValueChangeData),

    activeToday,
    pendingOrders,
    popularDish: {
      name: popularDish[0] as string,
      count: popularDish[1] as number,
    },
    leastOrderedDish: {
      name: leastOrderedDish[0] as string,
      count: leastOrderedDish[1] as number,
    },
    recentOrders,
    revenueByDay,
    categorySales,
  };
};

const calculateRevenueByDay = (
  orders: Order[],
  period: string
): RevenueByDay[] => {
  if (period === "today") {
    const businessHours = [
      "9am",
      "10am",
      "11am",
      "12pm",
      "1pm",
      "2pm",
      "3pm",
      "4pm",
      "5pm",
      "6pm",
      "7pm",
      "8pm",
      "9pm",
      "10pm",
      "11pm",
    ];

    const hourMap: Record<string, number> = {};
    businessHours.forEach((hour) => {
      hourMap[hour] = 0;
    });

    orders.forEach((order) => {
      try {
        const orderDate = new Date(order.createdAt);
        const hour = orderDate.getHours();

        let hourLabel: string | undefined;
        if (hour >= 9 && hour <= 11) hourLabel = `${hour}am`;
        else if (hour === 12) hourLabel = "12pm";
        else if (hour >= 13 && hour <= 23) hourLabel = `${hour - 12}pm`;

        if (
          hourLabel &&
          Object.prototype.hasOwnProperty.call(hourMap, hourLabel)
        ) {
          hourMap[hourLabel] += Number(order.totalPrice);
        }
      } catch (error) {
        console.error("Error processing order date:", error);
      }
    });

    return Object.entries(hourMap).map(([hour, revenue]) => ({
      date: hour,
      revenue: Math.round(revenue * 100) / 100,
    }));
  }

  const days = period === "week" ? 7 : period === "lastweek" ? 7 : 30;
  const revenueMap: Record<string, number> = {};

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey =
      period === "month"
        ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
    revenueMap[dateKey] = 0;
  }

  orders.forEach((order) => {
    try {
      const orderDate = new Date(order.createdAt);
      const dateKey =
        period === "month"
          ? orderDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
          : orderDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

      if (Object.prototype.hasOwnProperty.call(revenueMap, dateKey)) {
        revenueMap[dateKey] += Number(order.totalPrice);
      }
    } catch (error) {
      console.error("Error processing order date:", error);
    }
  });

  return Object.entries(revenueMap).map(([date, revenue]) => ({
    date,
    revenue: Math.round(revenue * 100) / 100,
  }));
};


const calculateCategorySales = (orders: Order[]): CategorySales[] => {
  const sales: Record<string, number> = {};

  orders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        if (!item || !item.name) return;

        // Try to get category from populated section data
        let categoryName = "Other";

        if (item.menuItemId && typeof item.menuItemId === 'object' && item.menuItemId.sectionId) {
          if (typeof item.menuItemId.sectionId === 'object' && item.menuItemId.sectionId.name) {
            categoryName = item.menuItemId.sectionId.name;
          }
        }

        // Ensure consistent casing
        categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

        const itemTotal = Number(item.price || 0) * (item.quantity || 0);

        if (!sales[categoryName]) {
          sales[categoryName] = 0;
        }

        sales[categoryName] += itemTotal;
      });
    }
  });

  const total = Object.values(sales).reduce((sum, val) => sum + val, 0);

  return Object.entries(sales)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);
};

export const getOrdersOverTime = async (period: string = "week") => {
  try {
    const headers = getAuthHeaders();

    const endDate = new Date();
    const startDate = new Date();

    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "week") {
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "lastweek") {
      startDate.setDate(startDate.getDate() - 14);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 7);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const response = await fetch(
      `${API_BASE_URL}/orders/restaurant?limit=1000&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch orders data");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch orders data");
    }

    return processOrdersOverTime(data.data, period);
  } catch (error) {
    console.error("Error fetching orders over time:", error);
    throw error;
  }
};

const processOrdersOverTime = (orders: Order[], period: string) => {
  if (period === "today") {
    const businessHours = [
      "9am",
      "10am",
      "11am",
      "12pm",
      "1pm",
      "2pm",
      "3pm",
      "4pm",
      "5pm",
      "6pm",
      "7pm",
      "8pm",
      "9pm",
      "10pm",
      "11pm",
    ];

    const hourMap: Record<string, { orders: number; revenue: number }> = {};
    businessHours.forEach((hour) => {
      hourMap[hour] = { orders: 0, revenue: 0 };
    });

    orders.forEach((order) => {
      try {
        const orderDate = new Date(order.createdAt);
        const hour = orderDate.getHours();

        let hourLabel: string | undefined;
        if (hour >= 9 && hour <= 11) hourLabel = `${hour}am`;
        else if (hour === 12) hourLabel = "12pm";
        else if (hour >= 13 && hour <= 23) hourLabel = `${hour - 12}pm`;

        if (hourLabel && hourMap[hourLabel]) {
          hourMap[hourLabel].orders += 1;
          hourMap[hourLabel].revenue += Number(order.totalPrice || 0);
        }
      } catch (error) {
        console.error("Error processing order:", error);
      }
    });

    return {
      ordersOverTime: Object.entries(hourMap).map(([date, data]) => ({
        date,
        orders: data.orders,
      })),
      revenueData: Object.entries(hourMap).map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
      })),
    };
  }

  const days = period === "week" || period === "lastweek" ? 7 : 30;
  const dataMap: Record<string, { orders: number; revenue: number }> = {};

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey =
      period === "month"
        ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
    dataMap[dateKey] = { orders: 0, revenue: 0 };
  }

  orders.forEach((order) => {
    try {
      const orderDate = new Date(order.createdAt);
      const dateKey =
        period === "month"
          ? orderDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
          : orderDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

      if (dataMap[dateKey]) {
        dataMap[dateKey].orders += 1;
        dataMap[dateKey].revenue += Number(order.totalPrice || 0);
      }
    } catch (error) {
      console.error("Error processing order:", error);
    }
  });

  return {
    ordersOverTime: Object.entries(dataMap).map(([date, data]) => ({
      date,
      orders: data.orders,
    })),
    revenueData: Object.entries(dataMap).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
    })),
  };
};

export const getPopularHours = async () => {
  try {
    const headers = getAuthHeaders();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const response = await fetch(
      `${API_BASE_URL}/orders/restaurant?limit=1000&startDate=${today.toISOString()}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch popular hours data");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch popular hours data");
    }

    return processPopularHours(data.data);
  } catch (error) {
    console.error("Error fetching popular hours:", error);
    throw error;
  }
};

const processPopularHours = (orders: Order[]) => {
  const businessHours = [
    "9am",
    "10am",
    "11am",
    "12pm",
    "1pm",
    "2pm",
    "3pm",
    "4pm",
    "5pm",
    "6pm",
    "7pm",
    "8pm",
    "9pm",
    "10pm",
    "11pm",
  ];

  const hourMap: Record<string, number> = {};
  businessHours.forEach((hour) => {
    hourMap[hour] = 0;
  });

  orders.forEach((order) => {
    try {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();

      let hourLabel: string | undefined;
      if (hour >= 9 && hour <= 11) hourLabel = `${hour}am`;
      else if (hour === 12) hourLabel = "12pm";
      else if (hour >= 13 && hour <= 23) hourLabel = `${hour - 12}pm`;

      if (
        hourLabel &&
        Object.prototype.hasOwnProperty.call(hourMap, hourLabel)
      ) {
        hourMap[hourLabel] += 1;
      }
    } catch (error) {
      console.error("Error processing order hour:", error);
    }
  });

  return Object.entries(hourMap).map(([hour, orders]) => ({
    hour,
    orders,
  }));
};

export const getRecentActivity = async (limit: number = 10) => {
  try {
    const headers = getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/orders/restaurant?limit=${limit}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recent activity");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch recent activity");
    }

    const sortedOrders = data.data.sort((a: Order, b: Order) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedOrders.map((order: Order) => ({
      id: order._id,
      date: order.createdAt
        ? new Date(order.createdAt).toISOString().split("T")[0]
        : "Unknown",
      table: order.tableId?.tableName || "Unknown",
      items: Array.isArray(order.items)
        ? order.items
          .map((item) => `${item.name || "Unknown"} x${item.quantity || 0}`)
          .join(", ")
        : "No items",
      amount: order.totalPrice || 0,
      payment: order.paymentMethod || "Card",
      status: order.status || "Pending",
    }));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    throw error;
  }
};

const getTimeAgo = (dateString: string): string => {
  if (!dateString) return "Just now";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  } catch (error) {
    console.error("Error calculating time ago:", error);
    return "Just now";
  }
};
