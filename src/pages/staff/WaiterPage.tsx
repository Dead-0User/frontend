import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LogOut,
  Clock,
  Users,
  ShoppingBag,
  CheckCircle,
  RefreshCw,
  Loader2,
  FileText,
  X,
  Bell,
  Plus,
} from "lucide-react";
import { NewOrderDialog } from '@/components/NewOrderDialog';
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";

import { API_BASE_URL as BASE_URL } from "@/config";

const API_BASE_URL = `${BASE_URL}/api`;

// Type definitions matching OrdersPage
interface Addon {
  name: string;
  group: string;
  price: number;
}

interface ItemDetailed {
  menuItemId?: string;
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  addons?: Addon[];
  isNew?: boolean;
  isRemoved?: boolean;
  isVeg?: boolean;
  status?: string; // e.g. "pending", "preparing", "ready", "served", "cancelled"
}

interface Order {
  id: string;
  tableNumber: string;
  tableId: string;
  items: string[];
  itemsDetailed: ItemDetailed[];
  total: number;
  subtotal: number;
  tax: number;
  status: string;
  orderType: string;
  timestamp: string;
  dateLabel: string;
  fullTime: string;
  customerName: string;
  customerPhone: string;
  specialInstructions: string;
  createdAt: string;
  updatedAt: string;
  isUpdated: boolean;
  updateCount: number;
  paymentMethod?: string;
  paymentCompletedAt?: string;
  rawOrder: Record<string, unknown>;
}

interface Table {
  _id: string;
  tableName: string;
  seats: number;
  status?: "available" | "occupied";
  orderStatus?: "pending" | "preparing" | "ready" | "served";
  activeOrderId?: string;
  guests?: number;
  activeOrder?: Order;
  isCallingWaiter?: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_KOT = "kot_printed_items";

const WaiterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { theme, setTheme } = useTheme();
  const [staffData, setStaffData] = useState<any>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);

  // KOT States - Track printed items and glow state for each order
  const [kotPrintedItems, setKotPrintedItems] = useState<
    Map<string, ItemDetailed[]>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_KOT);
      if (saved) {
        const parsed = JSON.parse(saved);
        const map = new Map<string, ItemDetailed[]>();
        Object.entries(parsed).forEach(([orderId, items]) => {
          map.set(orderId, items as ItemDetailed[]);
        });
        return map;
      }
    } catch (error) {
      console.error(
        "Failed to load KOT printed items from localStorage:",
        error
      );
    }
    return new Map();
  });

  const [kotNeedsGlow, setKotNeedsGlow] = useState<Map<string, boolean>>(
    new Map()
  );

  // Save KOT printed items to localStorage whenever they change
  useEffect(() => {
    try {
      const obj: Record<string, ItemDetailed[]> = {};
      kotPrintedItems.forEach((items, orderId) => {
        obj[orderId] = items;
      });
      localStorage.setItem(STORAGE_KEY_KOT, JSON.stringify(obj));
    } catch (error) {
      console.error("Failed to save KOT printed items to localStorage:", error);
    }
  }, [kotPrintedItems]);

  // Get auth headers for API calls
  const getAuthHeader = () => {
    const staffToken = localStorage.getItem("staffToken");
    if (!staffToken) {
      return { Authorization: "" };
    }
    return { Authorization: `Bearer ${staffToken}` };
  };

  // Transform order data to match Order interface
  const transformOrder = (order: any): Order => {
    const tableName =
      ((order.tableId as Record<string, unknown>)?.tableName as string) ||
      "Unknown";

    const itemsDetailed = (
      (order.items || []) as Record<string, unknown>[]
    ).map((item) => {
      let addonsList: Addon[] = [];
      if (Array.isArray(item.addons)) {
        addonsList = (item.addons as unknown[]).map((addon) => {
          if (typeof addon === "string") {
            return { name: addon, group: "Add-ons", price: 0 };
          } else if (addon && typeof addon === "object") {
            const addonObj = addon as Record<string, unknown>;
            return {
              name: (addonObj.name as string) || String(addon),
              group: (addonObj.group as string) || "Add-ons",
              price: typeof addonObj.price === "number" ? addonObj.price : 0,
            } as Addon;
          }
          return { name: String(addon), group: "Add-ons", price: 0 };
        });
      }

      return {
        ...(item as Record<string, unknown>),
        addons: addonsList,
        isNew: (item.isNew as boolean) || false,
        isRemoved: (item.isRemoved as boolean) || false,
        name: item.name as string,
        price: item.price as number,
        quantity: item.quantity as number,
      } as ItemDetailed;
    });

    const groupedItems: Record<string, ItemDetailed> = {};
    itemsDetailed.forEach((item) => {
      const addonKey = JSON.stringify(
        item.addons?.map((a) => a.name).sort() || []
      );
      const key = `${item.name}-${addonKey}`;

      if (groupedItems[key]) {
        groupedItems[key].quantity += item.quantity;
        if (item.isNew) groupedItems[key].isNew = true;
        if (item.isRemoved) groupedItems[key].isRemoved = true;
      } else {
        groupedItems[key] = { ...item };
      }
    });

    const consolidatedItems = Object.values(groupedItems);

    const date = new Date(order.createdAt || order.updatedAt);
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const dateLabel = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const fullTime = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return {
      id: order._id as string,
      tableNumber: tableName,
      tableId: ((order.tableId as Record<string, unknown>)?._id ||
        order.tableId) as string,
      items: consolidatedItems.map((item) => item.name),
      itemsDetailed: consolidatedItems,
      total: (order.totalPrice as number) || 0,
      subtotal: (order.totalPrice as number) || 0,
      tax: 0,
      status: (order.status as string) || "pending",
      orderType: (order.orderType as string) || "staff",
      timestamp: time,
      dateLabel: dateLabel,
      fullTime: fullTime,
      customerName: (order.customerName as string) || "Guest",
      customerPhone: "",
      specialInstructions: (order.specialInstructions as string) || "",
      createdAt: order.createdAt as string,
      updatedAt: order.updatedAt as string,
      isUpdated: (order.isUpdated as boolean) || false,
      updateCount: (order.updateCount as number) || 0,
      paymentMethod: (order.paymentMethod as string) || undefined,
      paymentCompletedAt: (order.paymentCompletedAt as string) || undefined,
      rawOrder: order,
    } as Order;
  };

  // Fetch tables
  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }

      const data = await response.json();
      if (data.success) {
        return data.data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast({
        title: "Error",
        description: "Failed to load tables",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Fetch active orders
  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/restaurant?excludeStatus=paid,cancelled&limit=100`,
        {
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      if (data.success) {
        return (data.data || []).map(transformOrder);
      }
      return [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tablesData, ordersData] = await Promise.all([
        fetchTables(),
        fetchOrders(),
      ]);

      // Map tables with their order statuses
      const tablesWithStatus: Table[] = tablesData.map((table: any) => {
        // Find active order for this table
        const activeOrder = ordersData.find(
          (order: Order) =>
            order.tableId === table._id.toString() &&
            !["paid", "cancelled"].includes(order.status)
        );

        let status: "available" | "occupied" = "available";
        let orderStatus:
          | "pending"
          | "preparing"
          | "ready"
          | "served"
          | undefined;
        let activeOrderId: string | undefined;

        if (activeOrder) {
          status = "occupied";
          orderStatus = activeOrder.status as any;
          activeOrderId = activeOrder.id;
        }

        return {
          _id: table._id,
          tableName: table.tableName,
          seats: table.seats,
          status,
          orderStatus,
          activeOrderId,
          activeOrder,
          guests: table.seats,
          isCallingWaiter: (table as any).isCallingWaiter || false,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt
        };
      });

      setKotNeedsGlow((prev) => {
        const newKotNeedsGlow = new Map(prev);
        ordersData.forEach((order) => {
          const isUpdated = order.isUpdated || order.rawOrder?.hasUnseenChanges;
          if (isUpdated) {
            newKotNeedsGlow.set(order.id, true);
          }
        });
        return newKotNeedsGlow;
      });

      setTables(tablesWithStatus.sort((a, b) => {
        // Priority Score Calculation
        // Waiter Called: 100
        // Order Ready: 50
        // Order Pending: 20
        // Occupied: 0
        // Available: -100

        const getScore = (table: Table) => {
          if (table.isCallingWaiter) return 100;
          if (table.orderStatus === 'ready') return 50;
          if (table.orderStatus === 'pending') return 20;
          if (table.status === 'occupied') return 0;
          return -100;
        };

        const scoreA = getScore(a);
        const scoreB = getScore(b);

        if (scoreA !== scoreB) {
          return scoreB - scoreA; // Bio-Sort: Higher score first
        }

        // Tie-breaker: Recency (Newest Activity First)
        // For Waiter Called: updateAt of table
        // For Order: updatedAt of order
        const getTime = (table: Table) => {
          if (table.isCallingWaiter) return new Date(table.updatedAt).getTime();
          if (table.activeOrder) return new Date(table.activeOrder.updatedAt).getTime();
          return new Date(table.updatedAt).getTime();
        };

        return getTime(b) - getTime(a);
      }));
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchTables, fetchOrders, toast]);

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    const token = localStorage.getItem("staffToken");

    if (!data || !token) {
      navigate("/staff/waiter/login");
      return;
    }

    const parsedData = JSON.parse(data);
    console.log("Staff data loaded:", parsedData);
    setStaffData(parsedData);
    loadData();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate, loadData]);

  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffData");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/staff/waiter/login");
  };

  const handleViewOrder = (table: Table) => {
    if (table.activeOrder) {
      setSelectedOrder(table.activeOrder);
      setShowOrderDialog(true);
    } else {
      toast({
        title: "No Order",
        description: "No active order found for this table",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsServed = async (orderId: string, tableName: string) => {
    if (!orderId) return;

    setUpdatingOrder(orderId);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "served" }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Order served",
          description: `Table ${tableName} has been marked as served`,
        });
        await loadData();
      } else {
        throw new Error(data.message || "Failed to update order");
      }
    } catch (error: any) {
      console.error("Error marking order as served:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark order as served",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  // KOT Functions (same as OrdersPage)
  const getItemKey = (item: ItemDetailed): string => {
    const addonKey = item.addons
      ? item.addons
        .map((a) => `${a.name}-${a.price}`)
        .sort()
        .join("|")
      : "";
    return `${item.name}-${addonKey}`;
  };

  const findMatchingPrintedItem = (
    item: ItemDetailed,
    printedItems: ItemDetailed[]
  ): ItemDetailed | undefined => {
    const itemKey = getItemKey(item);
    return printedItems.find((printedItem) => {
      const printedKey = getItemKey(printedItem);
      return printedKey === itemKey;
    });
  };

  const getNewItemsToShow = (
    currentItems: ItemDetailed[],
    printedItems: ItemDetailed[]
  ): ItemDetailed[] => {
    if (printedItems.length === 0) {
      return currentItems;
    }

    const newItems: ItemDetailed[] = [];

    currentItems.forEach((item) => {
      const matchingPrinted = findMatchingPrintedItem(item, printedItems);

      if (!matchingPrinted) {
        newItems.push(item);
      } else {
        const printedQuantity = matchingPrinted.quantity || 0;
        const currentQuantity = item.quantity || 0;

        if (currentQuantity > printedQuantity) {
          newItems.push({
            ...item,
            quantity: currentQuantity - printedQuantity,
          });
        }
      }
    });

    return newItems;
  };

  const generateKOTText = (order: Order) => {
    const restaurantName = staffData?.restaurantName || "RESTAURANT";
    const date = new Date(order.updatedAt || order.createdAt);
    const printedItems = kotPrintedItems.get(order.id) || [];

    const currentItems = order.itemsDetailed.filter((item) => !item.isRemoved);
    const itemsToShow = getNewItemsToShow(currentItems, printedItems);

    let kot = "";
    kot += `                ${restaurantName}\n`;
    kot += `-------------------------------\n`;
    kot += `KITCHEN ORDER TICKET (KOT)\n`;
    kot += `Table: ${order.tableNumber}\n`;
    kot += `Date: ${date.toLocaleDateString()}\n`;
    kot += `Time: ${date.toLocaleTimeString()}\n`;
    kot += `Order ID: ${order.id.slice(-8)}\n`;
    if (order.customerName && order.customerName !== "Guest") {
      kot += `Customer: ${order.customerName}\n`;
    }
    kot += `-------------------------------\n`;

    if (printedItems.length > 0) {
      kot += `NEW ITEMS ONLY\n`;
    }
    kot += `Item                Qty\n`;
    kot += `-------------------------------\n`;

    if (itemsToShow.length === 0) {
      kot += `No new items to print\n`;
    } else {
      itemsToShow.forEach((item) => {
        kot += `${item.name.padEnd(20)} ${item.quantity}\n`;

        if (item.addons && item.addons.length > 0) {
          item.addons.forEach((addon) => {
            kot += `  + ${addon.name}\n`;
          });
        }
      });
    }

    kot += `-------------------------------\n`;
    if (order.specialInstructions) {
      kot += `Special Instructions:\n`;
      kot += `${order.specialInstructions}\n`;
      kot += `-------------------------------\n`;
    }
    kot += `Total Items: ${itemsToShow.reduce(
      (sum, item) => sum + item.quantity,
      0
    )}\n`;
    kot += `\n`;

    return kot;
  };

  const handlePrintKOT = (order: Order) => {
    const kotText = generateKOTText(order);
    const printWindow = window.open("", "", "width=400,height=600");
    if (printWindow) {
      printWindow.document.write("<html><head><title>KOT</title>");
      printWindow.document.write(
        "<style>body { font-family: monospace; white-space: pre; padding: 20px; }</style>"
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(kotText);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }

    const currentItems = order.itemsDetailed.filter((item) => !item.isRemoved);
    const printedItems = kotPrintedItems.get(order.id) || [];

    const updatedPrintedItems: ItemDetailed[] = [...printedItems];

    currentItems.forEach((currentItem) => {
      const matchingPrinted = findMatchingPrintedItem(
        currentItem,
        updatedPrintedItems
      );

      if (!matchingPrinted) {
        updatedPrintedItems.push({ ...currentItem });
      } else {
        const index = updatedPrintedItems.indexOf(matchingPrinted);
        updatedPrintedItems[index] = {
          ...matchingPrinted,
          quantity: currentItem.quantity,
        };
      }
    });

    const currentItemKeys = new Set(
      currentItems.map((item) => getItemKey(item))
    );
    const finalPrintedItems = updatedPrintedItems.filter((item) =>
      currentItemKeys.has(getItemKey(item))
    );

    setKotPrintedItems((prev) => {
      const newMap = new Map(prev);
      newMap.set(order.id, finalPrintedItems);
      return newMap;
    });
    setKotNeedsGlow((prev) => {
      const newMap = new Map(prev);
      newMap.delete(order.id);
      return newMap;
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "available":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "occupied":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const getOrderStatusColor = (status?: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      case "accepted":
        return "bg-purple-500/10 text-purple-700 border-purple-200";
      case "preparing":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "ready":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "served":
        return "bg-gray-500/10 text-gray-700 border-gray-200";
      default:
        return "";
    }
  };

  const getStatusColorBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "accepted":
        return "bg-purple-500/10 text-purple-600 border-purple-500/30";
      case "preparing":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "ready":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "served":
        return "bg-gray-500/10 text-gray-600 border-gray-500/30";
      default:
        return "bg-muted";
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    if (!order) return;

    setUpdatingOrder(order.id);
    try {
      const pendingItems = order.itemsDetailed
        .filter(i => !i.isRemoved && (!i.status || i.status === 'pending'))
        .map(i => i._id);

      if (pendingItems.length === 0) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/orders/${order.id}/items/bulk-status`, {
        method: "PATCH",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemIds: pendingItems, status: "accepted" }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Order Accepted",
          description: `Order for Table ${order.tableNumber} is now accepted`,
        });
        await loadData();
        setShowOrderDialog(false);
      } else {
        throw new Error(data.message || "Failed to accept order");
      }
    } catch (error: any) {
      console.error("Error accepting order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept order",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleStartPreparing = async (order: Order) => {
    if (!order) return;

    setUpdatingOrder(order.id);
    try {
      const acceptedItems = order.itemsDetailed
        .filter(i => !i.isRemoved && (i.status === 'accepted' || i.status === 'pending'))
        .map(i => i._id);

      if (acceptedItems.length === 0) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/orders/${order.id}/items/bulk-status`, {
        method: "PATCH",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemIds: acceptedItems, status: "preparing" }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Preparing Order",
          description: `Order for Table ${order.tableNumber} is now preparing`,
        });
        await loadData();
        setShowOrderDialog(false);
      } else {
        throw new Error(data.message || "Failed to start preparing");
      }
    } catch (error: any) {
      console.error("Error starting preparation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start preparation",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!orderId) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    setUpdatingOrder(orderId);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Order Cancelled",
          description: "The order has been cancelled successfully",
        });
        await loadData();
        setShowOrderDialog(false);
      } else {
        throw new Error(data.message || "Failed to cancel order");
      }
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleDismissWaiter = async (tableId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/table/${tableId}/dismiss-waiter`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Request Dismissed",
          description: "Waiter call has been dismissed",
        });
        loadData();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error dismissing waiter:", error);
      toast({
        title: "Error",
        description: "Failed to dismiss request",
        variant: "destructive",
      });
    }
  };


  if (!staffData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading && tables.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading tables...</p>
        </div>
      </div>
    );
  }

  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const availableCount = tables.filter((t) => t.status === "available").length;
  const readyCount = tables.filter((t) => t.orderStatus === "ready").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Waiter Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {staffData.fullName || staffData.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {staffData.restaurantName}
              </p>
            </div>
            <div className="flex items-center gap-2">
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

              <Button
                className="gap-2"
                size="sm"
                onClick={() => setShowNewOrderDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Place Order
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tables.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Occupied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {occupiedCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {availableCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ready to Serve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {readyCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tables Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Table Overview</h2>
          {tables.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tables found. Please contact your manager.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => {
                const order = table.activeOrder;
                const printedItems = order
                  ? kotPrintedItems.get(order.id) || []
                  : [];
                const currentItems = order
                  ? order.itemsDetailed.filter((item) => !item.isRemoved)
                  : [];
                const newItemsToShow = getNewItemsToShow(
                  currentItems,
                  printedItems
                );
                const hasNewItems = newItemsToShow.length > 0;
                const allItemsPrinted =
                  printedItems.length > 0 && newItemsToShow.length === 0;

                return (
                  <Card key={table._id} className="relative overflow-hidden">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {table.tableName}
                        </CardTitle>
                        <Badge
                          className={getStatusColor(table.status)}
                          variant="outline"
                        >
                          {table.status}
                        </Badge>
                      </div>
                      {table.isCallingWaiter && (
                        <div className="mt-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-2 flex items-center justify-between animate-pulse">
                          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium">
                            <Bell className="h-4 w-4" />
                            <span>Waiter Called!</span>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissWaiter(table._id);
                            }}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {table.status === "occupied" && order && (
                        <>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{table.seats} seats</span>
                          </div>
                          {table.orderStatus && (
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                              <Badge
                                className={getOrderStatusColor(
                                  table.orderStatus
                                )}
                                variant="outline"
                              >
                                {table.orderStatus}
                              </Badge>
                            </div>
                          )}
                          <div className="flex flex-col gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleViewOrder(table)}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              View Order
                            </Button>
                            {/* KOT Button */}
                            {order.status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintKOT(order)}
                                disabled={!hasNewItems}
                                className={`w-full transition-all duration-300 ${kotNeedsGlow.has(order.id)
                                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30 shadow-lg shadow-orange-200 dark:shadow-orange-950/50 animate-pulse"
                                  : allItemsPrinted
                                    ? "opacity-50 hover:opacity-75"
                                    : ""
                                  }`}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                KOT
                              </Button>
                            )}
                            {table.orderStatus === "ready" && (
                              <Button
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  handleMarkAsServed(order.id, table.tableName)
                                }
                                disabled={
                                  updatingOrder === order.id || !order.id
                                }
                              >
                                {updatingOrder === order.id ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                )}
                                Mark Served
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                      {table.status === "available" && (
                        <div className="text-center py-2 text-muted-foreground text-sm">
                          Ready for guests
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">
                    Table {selectedOrder.tableNumber}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Order #{selectedOrder.id.slice(-8)}
                  </p>
                </div>
                <Badge
                  className={getStatusColorBadge(selectedOrder.status)}
                  variant="outline"
                >
                  {selectedOrder.status.toUpperCase()}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {selectedOrder.customerName || "Guest"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedOrder.fullTime}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-2 border rounded-lg p-4">
                  {selectedOrder.itemsDetailed
                    .filter((item) => !item.isRemoved)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{item.name}</p>
                            {item.isNew && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-500/10 text-green-700 border-green-500/30"
                              >
                                NEW
                              </Badge>
                            )}
                          </div>
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.addons.map((addon, addonIdx) => (
                                <p
                                  key={addonIdx}
                                  className="text-xs text-muted-foreground pl-4"
                                >
                                  + {addon.name}
                                  {addon.price > 0 &&
                                    ` (+${formatPrice(addon.price)})`}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {item.quantity}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.price)} each
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.specialInstructions && (
                <div>
                  <h4 className="font-semibold mb-2">Special Instructions</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedOrder.specialInstructions}
                  </p>
                </div>
              )}

              {/* Order Total */}
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-xl font-bold text-primary">
                  {formatPrice(selectedOrder.total)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 flex-wrap">
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'accepted') && (
                  <>
                    {selectedOrder.status === 'pending' && (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAcceptOrder(selectedOrder)}
                        disabled={updatingOrder === selectedOrder.id}
                      >
                        {updatingOrder === selectedOrder.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Accept Order
                      </Button>
                    )}
                    {selectedOrder.status === 'accepted' && (
                      <Button
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleStartPreparing(selectedOrder)}
                        disabled={updatingOrder === selectedOrder.id}
                      >
                        {updatingOrder === selectedOrder.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-4 w-4 mr-2" />
                        )}
                        Start Preparing
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      disabled={updatingOrder === selectedOrder.id}
                    >
                      {updatingOrder === selectedOrder.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Cancel Order
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  onClick={() => handlePrintKOT(selectedOrder)}
                  disabled={
                    selectedOrder.itemsDetailed.filter((i) => !i.isRemoved)
                      .length === 0 ||
                    getNewItemsToShow(
                      selectedOrder.itemsDetailed.filter((i) => !i.isRemoved),
                      kotPrintedItems.get(selectedOrder.id) || []
                    ).length === 0
                  }
                  className={`flex-1 ${kotNeedsGlow.has(selectedOrder.id)
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    : ""
                    }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print KOT
                </Button>
                {selectedOrder.status === "ready" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleMarkAsServed(
                        selectedOrder.id,
                        selectedOrder.tableNumber
                      );
                      setShowOrderDialog(false);
                    }}
                    disabled={updatingOrder === selectedOrder.id}
                  >
                    {updatingOrder === selectedOrder.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Mark Served
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDialog(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <NewOrderDialog
        open={showNewOrderDialog}
        onOpenChange={setShowNewOrderDialog}
        onSuccess={loadData}
      />
    </div>
  );
};

export default WaiterPage;
