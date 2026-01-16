import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  User,
  Calendar,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Search,
  Utensils,
  Check,
  Smartphone,
  UserCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone as UpiIcon,
  Download,
  Printer,
  FileText,
} from "lucide-react";
import { Lock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/components/ui/use-toast";
import OrderChangeSummary from "@/components/src/OrderChangeSummary";
import UpdateHistoryPanel from "@/components/src/UpdateHistoryPanel";
import OrderUpdateLegend from "@/components/src/OrderUpdateLegend";

import { API_BASE_URL as BASE_URL } from "@/config";

const API_BASE_URL = `${BASE_URL}/api`;

// Type definitions
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
  status?: "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled";
  ids?: string[]; // Aggregated IDs for grouped items
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
  kots?: any[];
}

interface OrderUpdateHistoryItem {
  itemName: string;
  changeType:
  | "item_added"
  | "item_removed"
  | "quantity_increased"
  | "quantity_decreased"
  | string;
  oldQuantity?: number;
  newQuantity?: number;
  details?: string;
  changedBy?: string;
  timestamp?: string;
  [key: string]: unknown;
}



interface Table {
  _id: string;
  tableName: string;
  seats: number;
  hasActiveOrder?: boolean;
}

interface AddonItem {
  name: string;
  price: number;
  group?: string;
}

interface AddonGroup {
  _id?: string;
  title: string;
  multiSelect: boolean;
  items: AddonItem[];
}

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  sectionId: string | { _id: string };
  isActive: boolean;
  isVeg?: boolean;
  addonGroups?: AddonGroup[];
}

interface MenuSection {
  _id: string;
  name: string;
  items: MenuItem[];
}

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  addons: AddonItem[];
  isVeg?: boolean;
}



const OrdersPage = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrders, setUpdatingOrders] = useState(new Set<string>());
  const [expandedOrders, setExpandedOrders] = useState(new Set<string>());
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [expandedHistory, setExpandedHistory] = useState(new Set<string>());

  // New KOT History State
  const [kotHistoryOrder, setKotHistoryOrder] = useState<Order | null>(null);

  const [itemSelections, setItemSelections] = useState<
    Record<string, string[]>
  >({});
  const [customDate, setCustomDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const previousOrderCountRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [recentlyUpdatedFilter, setRecentlyUpdatedFilter] = useState(false);





  const handleToggleItemSelection = (orderId: string, itemId: string) => {
    // Find the item to get all its aggregated IDs
    const order = orders.find(o => o.id === orderId);
    const item = order?.itemsDetailed.find(i => i._id === itemId);
    const idsToToggle = item?.ids || [itemId];

    setItemSelections((prev) => {
      const current = prev[orderId] || [];
      const newSelection = new Set(current);

      const allToggled = idsToToggle.every(id => newSelection.has(id));

      if (allToggled) {
        idsToToggle.forEach(id => newSelection.delete(id));
      } else {
        idsToToggle.forEach(id => newSelection.add(id));
      }

      return { ...prev, [orderId]: Array.from(newSelection) };
    });
  };



  const handleBulkUpdateStatus = async (orderId: string, status: string, overrideItems?: string[]) => {
    const selectedItems = overrideItems || itemSelections[orderId] || [];
    if (selectedItems.length === 0) return;

    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId));
      const { token } = getAuthData();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items/bulk-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemIds: selectedItems, status })
      });

      const data = await response.json();
      if (data.success) {
        toast({ description: `${selectedItems.length} items updated to ${status}` });
        setItemSelections(prev => ({ ...prev, [orderId]: [] })); // Clear selection
        fetchOrders(true);
      } else {
        toast({ variant: "destructive", description: data.message || "Failed to update" });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", description: "Failed to update items" });
    } finally {
      setUpdatingOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  // Handle updating individual item status
  const handleUpdateItemStatus = async (orderId: string, itemId: string, status: string) => {
    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId));
      const { token } = getAuthData();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/items/${itemId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        toast({ description: `Item status updated to ${status}` });
        fetchOrders(true);
      } else {
        toast({ variant: "destructive", description: data.message || "Failed to update item status" });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", description: "Failed to update item status" });
    } finally {
      setUpdatingOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      return;
    }

    try {
      setUpdatingOrders(prev => new Set(prev).add(orderId));
      const { token } = getAuthData();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: "DELETE", // This triggers the cancel endpoint
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast({ description: "Order cancelled successfully" });
        fetchOrders(true);
      } else {
        toast({ variant: "destructive", description: data.message || "Failed to cancel order" });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", description: "Failed to cancel order" });
    } finally {
      setUpdatingOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };





  // Add/Edit Order Modal States
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [originalCart, setOriginalCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Addon selection states
  const [selectedItemForAddons, setSelectedItemForAddons] =
    useState<MenuItem | null>(null);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<
    Record<number, AddonItem[]>
  >({});

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] =
    useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Receipt Modal States
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // KOT States - Track printed items and glow state for each order
  // kotPrintedItems: Map<orderId, ItemDetailed[]> - stores items that were already printed
  const STORAGE_KEY_KOT = "kot_printed_items";

  // Load KOT printed items from localStorage on mount
  const [kotPrintedItems, setKotPrintedItems] = useState<
    Map<string, ItemDetailed[]>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_KOT);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert array format back to Map
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
      // Convert Map to object for JSON storage
      const obj: Record<string, ItemDetailed[]> = {};
      kotPrintedItems.forEach((items, orderId) => {
        obj[orderId] = items;
      });
      localStorage.setItem(STORAGE_KEY_KOT, JSON.stringify(obj));
    } catch (error) {
      console.error("Failed to save KOT printed items to localStorage:", error);
    }
  }, [kotPrintedItems]);

  // Restaurant Settings State
  const [restaurantSettings, setRestaurantSettings] = useState({
    restaurantName: "",
    address: "",
    fssai: "",
    gstNo: "",
    receiptFooter: "",
    taxes: [] as { name: string; rate: number }[],
  });

  const fetchRestaurantSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/restaurant/current`, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success && data.restaurant) {

        // Handle legacy or array taxes
        let taxes = data.restaurant.taxes || [];
        if (taxes.length === 0 && data.restaurant.taxName && data.restaurant.taxRate) {
          taxes = [{ name: data.restaurant.taxName, rate: Number(data.restaurant.taxRate) }];
        }

        setRestaurantSettings({
          restaurantName: data.restaurant.restaurantName || "My Restaurant",
          address: data.restaurant.address || "",
          fssai: data.restaurant.fssai || "",
          gstNo: data.restaurant.gstNo || "",
          receiptFooter: data.restaurant.receiptFooter || "Thank You Visit Again",
          taxes: taxes,
        });
      }
    } catch (error) {
      console.error("Error fetching restaurant settings:", error);
    }
  };

  useEffect(() => {
    fetchRestaurantSettings();
  }, []);

  const toggleOrderExpanded = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleOrderHistory = (orderId: string) => {
    setExpandedHistory((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Get appropriate token from localStorage (owner token or staff token)
  const getAuthHeader = () => {
    // Check for staff token first (manager access)
    const staffToken = localStorage.getItem("staffToken");
    if (staffToken) {
      return { Authorization: `Bearer ${staffToken}` };
    }
    // Fallback to owner token
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found in localStorage");
      return { Authorization: "" };
    }
    return { Authorization: `Bearer ${token}` };
  };

  const getAuthData = () => {
    // Try staff token first
    const staffToken = localStorage.getItem("staffToken");
    const staffData = localStorage.getItem("staffData");

    if (staffToken && staffData) {
      try {
        const parsed = JSON.parse(staffData);
        // For staff, return user object with id set to restaurantId for compatibility
        // Note: The backend will handle converting Restaurant ID to User ID
        return {
          token: staffToken,
          userId: parsed.restaurantId,
          userObj: parsed,
          user: { ...parsed, id: parsed.restaurantId }, // Add user object for compatibility
        };
      } catch (e) {
        console.error("Error parsing staff data:", e);
      }
    }

    // Fallback to owner token
    const token = localStorage.getItem("token");
    let userObj = null;

    try {
      const userStr = localStorage.getItem("user");
      if (userStr && userStr !== "null") {
        userObj = JSON.parse(userStr);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }

    let userId = null;
    if (userObj && typeof userObj === "object") {
      userId =
        (userObj as Record<string, unknown>)._id ||
        (userObj as Record<string, unknown>).id;
    }

    if (!userId && token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.id || payload.userId || payload._id;
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }

    return {
      token,
      user: { ...(userObj || {}), id: userId },
    };
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { time: "Just now", date: "Today", fullTime: "" };

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = Number(now) - Number(date);
    const diffMins = Math.floor(diffMs / 60000);

    let timeAgo = "";
    if (diffMins < 1) timeAgo = "Just now";
    else if (diffMins < 60)
      timeAgo = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24)
        timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      else {
        const diffDays = Math.floor(diffHours / 24);
        timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      }
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    const orderDate = new Date(date);
    orderDate.setHours(0, 0, 0, 0);

    let dateLabel = "";
    if (orderDate.getTime() === today.getTime()) {
      dateLabel = "Today";
    } else if (orderDate.getTime() === yesterday.getTime()) {
      dateLabel = "Yesterday";
    } else {
      dateLabel = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }

    const timeLabel = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return { time: timeAgo, date: dateLabel, fullTime: timeLabel };
  };

  const filterOrdersByDate = useCallback(
    (ordersArray: Order[]) => {
      if (dateFilter === "all") {
        return ordersArray;
      } else if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return ordersArray.filter((order) => {
          const orderDate = new Date(order.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === today.getTime();
        });
      } else if (dateFilter === "custom") {
        const targetDate = new Date(
          customDate.year,
          customDate.month - 1,
          customDate.day
        );
        targetDate.setHours(0, 0, 0, 0);
        return ordersArray.filter((order) => {
          const orderDate = new Date(order.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === targetDate.getTime();
        });
      }
      return ordersArray;
    },
    [dateFilter, customDate]
  );

  const filterOrdersByType = useCallback(
    (ordersArray: Order[]) => {
      if (orderTypeFilter === "all") {
        return ordersArray;
      }
      return ordersArray.filter((order) => order.orderType === orderTypeFilter);
    },
    [orderTypeFilter]
  );

  const getOrderTypeInfo = (orderType: string) => {
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

  const getItemUpdateInfo = (
    orderId: string,
    item: ItemDetailed,
    orderUpdateHistory: OrderUpdateHistoryItem[],
    hasUnseenChanges: boolean
  ) => {
    // If order has been marked as seen, don't show any inline tags
    if (!hasUnseenChanges) {
      return null;
    }

    // Hide tags for items that are already served, paid, or cancelled - they are done.
    if (item.status === 'served' || item.status === 'paid' || item.status === 'cancelled') {
      return null;
    }

    if (!orderUpdateHistory || orderUpdateHistory.length === 0) return null;

    // Get last seen timestamp for this order
    let lastSeenTimestamp = 0;
    try {
      const lastSeenMap = JSON.parse(localStorage.getItem("orders_last_seen") || "{}");
      lastSeenTimestamp = lastSeenMap[orderId] || 0;
    } catch (e) {
      console.error("Error reading last seen timestamp:", e);
    }

    // Get all updates for this item
    const itemUpdates = orderUpdateHistory
      .filter((historyItem) => {
        // Filter by item name
        if (historyItem.itemName !== item.name) return false;

        // Filter out updates that happened before or at the last seen time
        const updateTime = new Date(historyItem.timestamp ?? 0).getTime();
        return updateTime > lastSeenTimestamp;
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp ?? 0).getTime() -
          new Date(a.timestamp ?? 0).getTime()
      );

    if (itemUpdates.length === 0) return null;

    // Return the LATEST update for this item (most recent change)
    const latestUpdate = itemUpdates[0];

    // Format the change description properly
    let changeText = "";
    switch (latestUpdate.changeType) {
      case "item_added":
        changeText = `Added ${latestUpdate.newQuantity}× ${item.name}`;
        break;
      case "item_removed":
        changeText = `Removed ${latestUpdate.oldQuantity}× ${item.name}`;
        break;
      case "quantity_increased":
        changeText = `Increased from ${latestUpdate.oldQuantity} to ${latestUpdate.newQuantity}`;
        break;
      case "quantity_decreased":
        changeText = `Decreased from ${latestUpdate.oldQuantity} to ${latestUpdate.newQuantity}`;
        break;
      default:
        changeText = latestUpdate.details;
    }

    return {
      changeType: latestUpdate.changeType,
      changedBy: latestUpdate.changedBy,
      changeText,
      timestamp: latestUpdate.timestamp,
    };
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const fetchOrders = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);

        const { token, user } = getAuthData();

        if (!token || !user.id) {
          setError("Authentication required. Please log in.");
          if (!silent) setLoading(false);
          return;
        }

        const statusParam = statusFilter === "all" ? "" : statusFilter;
        const filterParam = recentlyUpdatedFilter
          ? "&filter=recentlyUpdated"
          : "";
        const response = await fetch(
          `${API_BASE_URL}/orders/restaurant?status=${statusParam}${filterParam}&limit=100`,
          {
            method: "GET",
            headers: {
              ...getAuthHeader(),
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to fetch orders: ${response.status}`
          );
        }

        const data = await response.json();

        if (data.success) {
          const ordersArray = Array.isArray(data.data) ? data.data : [];

          const transformedOrders = ordersArray.map(
            (order: Record<string, unknown>) => {
              const { time, date, fullTime } = formatDateTime(
                order.createdAt as string
              );
              const tableName =
                ((order.tableId as Record<string, unknown>)
                  ?.tableName as string) || "Unknown";

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
                        price:
                          typeof addonObj.price === "number"
                            ? addonObj.price
                            : 0,
                      } as Addon;
                    }
                    return { name: String(addon), group: "Add-ons", price: 0 };
                  });
                }

                // Extract menuItemId if it's an object (populated)
                let menuItemIdString = (item.menuItemId as any);
                if (typeof menuItemIdString === 'object' && menuItemIdString && menuItemIdString._id) {
                  menuItemIdString = menuItemIdString._id;
                }

                return {
                  ...(item as Record<string, unknown>),
                  menuItemId: menuItemIdString,
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
                // Group by name, addons AND status to prevent stuck items
                const key = `${item.name}-${addonKey}-${item.status || "pending"}`;

                if (groupedItems[key]) {
                  groupedItems[key].quantity += item.quantity;
                  if (item.isNew) groupedItems[key].isNew = true;
                  if (item.isRemoved) groupedItems[key].isRemoved = true;
                  // Aggregate IDs
                  if (item._id) {
                    const existingIds = groupedItems[key].ids || (groupedItems[key]._id ? [groupedItems[key]._id!] : []);
                    groupedItems[key].ids = [...existingIds, item._id];
                  }
                } else {
                  groupedItems[key] = {
                    ...item,
                    ids: item._id ? [item._id] : []
                  };
                }
              });

              const consolidatedItems = Object.values(groupedItems);

              const itemNames = consolidatedItems.map((item) => {
                const addonText =
                  item.addons && item.addons.length > 0
                    ? ` (+${item.addons.length} addon${item.addons.length > 1 ? "s" : ""
                    })`
                    : "";
                return `${item.name} x${item.quantity}${addonText}`;
              });

              return {
                id: order._id as string,
                tableNumber: tableName,
                tableId: ((order.tableId as Record<string, unknown>)?._id ||
                  order.tableId) as string,
                items: itemNames,
                itemsDetailed: consolidatedItems,
                total: (order.totalPrice as number) || 0,
                subtotal: (order.totalPrice as number) || 0,
                tax: 0,
                status: (order.status as string) || "pending",
                orderType: (order.orderType as string) || "staff",
                timestamp: time,
                dateLabel: date,
                fullTime: fullTime,
                customerName: (order.customerName as string) || "Guest",
                customerPhone: "",
                specialInstructions:
                  (order.specialInstructions as string) || "",
                createdAt: order.createdAt as string,
                updatedAt: order.updatedAt as string,
                isUpdated: (order.isUpdated as boolean) || false,
                updateCount: (order.updateCount as number) || 0,
                paymentMethod: (order.paymentMethod as string) || undefined,
                paymentCompletedAt:
                  (order.paymentCompletedAt as string) || undefined,

                rawOrder: order,
                kots: (order.kots as any[]) || [],
              } as Order;
            }
          );

          // Update KOT states: set glow for updated orders (keep printed items for comparison)
          const newKotNeedsGlow = new Map(kotNeedsGlow);
          const currentOrderIds = new Set(
            transformedOrders.map((order) => order.id)
          );

          // Clean up KOT printed items for orders that no longer exist
          setKotPrintedItems((prev) => {
            const newMap = new Map(prev);
            // Remove entries for orders that don't exist anymore
            prev.forEach((_, orderId) => {
              if (!currentOrderIds.has(orderId)) {
                newMap.delete(orderId);
              }
            });
            return newMap;
          });

          transformedOrders.forEach((order) => {
            const orderId = order.id;
            const isUpdated =
              order.isUpdated || order.rawOrder?.hasUnseenChanges;

            // If order is updated or has unseen changes, set glow to indicate new items
            if (isUpdated) {
              newKotNeedsGlow.set(orderId, true);
            }
          });

          setKotNeedsGlow(newKotNeedsGlow);

          let filteredOrders = filterOrdersByDate(transformedOrders);
          filteredOrders = filterOrdersByType(filteredOrders);

          filteredOrders.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
          });



          previousOrderCountRef.current = filteredOrders.length;
          setOrders(filteredOrders);

          if (error && filteredOrders.length > 0) {
            setError(null);
          }
        } else {
          throw new Error(data.message || "Failed to fetch orders");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError((err as Error).message);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [
      error,
      statusFilter,
      recentlyUpdatedFilter,
      filterOrdersByDate,
      filterOrdersByType,
    ]
  );

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        // Fetch active orders for each table (matching TablesPage logic)
        const tablesWithActiveOrders = await Promise.all(
          data.data.map(async (table: Table) => {
            try {
              const ordersResponse = await fetch(
                `${API_BASE_URL}/orders/table/${table._id}?excludeStatus=paid,cancelled`,
                {
                  headers: {
                    ...getAuthHeader(),
                    "Content-Type": "application/json",
                  },
                }
              );
              const ordersData = await ordersResponse.json();

              // Table has active orders if there are any orders returned (excluding paid/cancelled)
              const hasActiveOrder =
                ordersData.success &&
                ordersData.data &&
                ordersData.data.length > 0;

              return {
                ...table,
                hasActiveOrder,
              };
            } catch (error) {
              console.error(
                `Error fetching orders for table ${table._id}:`,
                error
              );
              return { ...table, hasActiveOrder: false };
            }
          })
        );

        setTables(tablesWithActiveOrders);
        return tablesWithActiveOrders;
      }
      return [];
    } catch (err) {
      console.error("Error fetching tables:", err);
      return [];
    }
  };

  const fetchMenu = async () => {
    try {
      const sectionsResponse = await fetch(`${API_BASE_URL}/sections`, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      const sectionsData = await sectionsResponse.json();

      if (sectionsData.success) {
        const itemsResponse = await fetch(`${API_BASE_URL}/menuitems`, {
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
        });
        const itemsData = await itemsResponse.json();

        if (itemsData.success) {
          const sectionsWithItems = sectionsData.data.map(
            (section: MenuSection) => {
              const sectionItems = (itemsData.data || []).filter(
                (item: MenuItem) => {
                  const itemSectionId =
                    typeof item.sectionId === "object"
                      ? item.sectionId._id
                      : item.sectionId;
                  return itemSectionId === section._id.toString();
                }
              );

              return {
                ...section,
                items: sectionItems,
              };
            }
          );

          setMenuSections(sectionsWithItems);
        } else {
          setMenuSections(sectionsData.data);
        }
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
    }
  };



  const handleOpenPaymentModal = (order: Order) => {
    setSelectedOrderForPayment(order);
    setSelectedPaymentMethod(null);
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = async (method: string) => {
    if (!selectedOrderForPayment) return;

    try {
      setIsProcessingPayment(true);

      const response = await fetch(
        `${API_BASE_URL}/orders/${selectedOrderForPayment.id}/payment`,
        {
          method: "PATCH",
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentMethod: method }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process payment");
      }

      const data = await response.json();

      if (data.success) {
        setShowPaymentModal(false);
        await fetchOrders(false);

        // Show receipt modal
        const updatedOrder = {
          ...selectedOrderForPayment,
          status: "paid",
          paymentMethod: method,
        };
        setReceiptOrder(updatedOrder);
        setShowReceiptModal(true);
      } else {
        throw new Error(data.message || "Failed to process payment");
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      toast({
        variant: "destructive",
        description:
          (err as Error).message ||
          "Failed to process payment. Please try again.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const generateReceiptText = (order: Order) => {
    const { restaurantName, address, fssai, gstNo, receiptFooter, taxes } = restaurantSettings;
    const date = new Date(order.paymentCompletedAt || order.createdAt);

    let receipt = "";
    receipt += `                ${restaurantName}\n`;
    if (address) {
      receipt += `${address}\n`;
    }
    receipt += `-------------------------------\n`;
    receipt += `TAX INVOICE\n`;
    receipt += `Date: ${date.toLocaleDateString()}   Bill No.: ${order.id.slice(
      -6
    )}\n`;
    receipt += `P Boy: COUNTER\n`;
    receipt += `-------------------------------\n`;
    receipt += `Particulars       Qty Rate Amount\n`;

    // ITEMS
    let subtotal = 0;
    order.itemsDetailed
      .filter((item) => !item.isRemoved)
      .forEach((item) => {
        const amount = item.price * item.quantity;
        subtotal += amount;

        receipt += `${item.name.padEnd(15)} ${String(item.quantity).padEnd(
          3
        )} ${String(item.price).padEnd(4)} ${amount}\n`;

        if (item.addons?.length > 0) {
          item.addons.forEach((addon) => {
            receipt += `  + ${addon.name}\n`;
          });
        }
      });

    receipt += `-------------------------------\n`;
    receipt += `Sub Total              ${subtotal.toFixed(2)}\n`;

    // Dynamic Taxes (Multi-tax)
    let totalTaxAmount = 0;

    if (taxes && taxes.length > 0) {
      taxes.forEach(tax => {
        const taxAmount = subtotal * (tax.rate / 100);
        totalTaxAmount += taxAmount;
        receipt += `${tax.name.padEnd(20)} @${tax.rate}% ${taxAmount.toFixed(2)}\n`;
      });
    }

    const grandTotal = subtotal + totalTaxAmount;

    receipt += `-------------------------------\n`;
    receipt += `Total                 ${grandTotal.toFixed(2)}\n`;
    receipt += `-------------------------------\n`;
    if (fssai) receipt += `FSSAI NO : ${fssai}\n`;
    if (gstNo) receipt += `GST NO   : ${gstNo}\n`;
    receipt += `Time: ${date.toLocaleTimeString()}\n`;
    receipt += `E.&O.E.  Thank You  Visit Again\n\n`;

    receipt += `PLEASE CHECK THE BILL BEFORE MAKING\n`;
    receipt += `THE PAYMENT. NO COMPLAINTS WILL BE\n`;
    receipt += `ENTERTAIN THEREAFTER.\n\n`;

    receipt += `${receiptFooter}\n`;

    return receipt;
  };

  const handleDownloadReceipt = () => {
    if (!receiptOrder) return;

    const receiptText = generateReceiptText(receiptOrder);
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${receiptOrder.id.slice(-8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    if (!receiptOrder) return;

    const receiptText = generateReceiptText(receiptOrder);
    const printWindow = window.open("", "", "width=400,height=600");
    if (printWindow) {
      printWindow.document.write("<html><head><title>Receipt</title>");
      printWindow.document.write(
        "<style>body { font-family: monospace; white-space: pre; }</style>"
      );
      printWindow.document.write("</head><body>");
      printWindow.document.write(receiptText);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Helper function to create a unique key for an item (for comparison, without quantity)
  const getItemKey = (item: ItemDetailed): string => {
    const addonKey = item.addons
      ? item.addons
        .map((a) => `${a.name}-${a.price}`)
        .sort()
        .join("|")
      : "";
    return `${item.name}-${addonKey}`;
  };

  // Helper function to find matching printed item (same name and addons)
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

  // Helper function to get new items to show (handles quantity changes)
  const getNewItemsToShow = (
    currentItems: ItemDetailed[],
    printedItems: ItemDetailed[]
  ): ItemDetailed[] => {
    if (printedItems.length === 0) {
      // No items printed yet, show all items
      return currentItems;
    }

    const newItems: ItemDetailed[] = [];

    currentItems.forEach((item) => {
      const matchingPrinted = findMatchingPrintedItem(item, printedItems);

      if (!matchingPrinted) {
        // Item doesn't exist in printed items, it's completely new
        newItems.push(item);
      } else {
        // Item exists, check if quantity increased
        const printedQuantity = matchingPrinted.quantity || 0;
        const currentQuantity = item.quantity || 0;

        if (currentQuantity > printedQuantity) {
          // Quantity increased, show only the difference
          newItems.push({
            ...item,
            quantity: currentQuantity - printedQuantity,
          });
        }
        // If quantity is same or decreased, don't show it (already printed)
      }
    });

    return newItems;
  };

  // KOT (Kitchen Order Ticket) Functions
  const generateKOTText = (order: Order) => {
    const { restaurantName } = restaurantSettings;
    const date = new Date(order.updatedAt || order.createdAt);
    const printedItems = kotPrintedItems.get(order.id) || [];

    // Get current items (filter out removed items)
    const currentItems = order.itemsDetailed.filter((item) => !item.isRemoved);

    // Get items to show (all items if nothing printed, or only new items)
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

    // Show items (either all items or only new items)
    if (itemsToShow.length === 0) {
      kot += `No new items to print\n`;
    } else {
      itemsToShow.forEach((item) => {
        kot += `${item.name.padEnd(20)} ${item.quantity}\n`;

        // Show addons if any
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

  // Helper to format date for KOT
  const formatKOTDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      day: 'numeric',
      month: 'short'
    });
  };

  const handlePrintKOT = async (order: Order) => {
    try {
      const { token } = getAuthData();
      if (!token) return;

      setUpdatingOrders(prev => new Set(prev).add(order.id));

      const response = await fetch(`${API_BASE_URL}/orders/${order.id}/print-kot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!data.success) {
        if (data.noNewItems) {
          toast({ description: "No new items. Opening KOT History." });
          setKotHistoryOrder(order);
        } else {
          toast({ variant: "destructive", description: data.message || "Failed to generate KOT" });
        }
        return;
      }

      const kot = data.kot; // The new KOT object from backend

      // Generate HTML for KOT
      // Use the items returned in the KOT object
      let kotText = "";
      kotText += `<div style="text-align:center; font-weight:bold; font-size: 1.2em; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
        KOT #${kot.kotNumber}<br>
        Date: ${formatKOTDate(kot.printedAt)}
      </div>`;

      kotText += `<div>
        <b>Table:</b> ${order.tableNumber || 'Unknown'}<br>
        <b>Order:</b> #${order.id.slice(-6).toUpperCase()}<br>
        <b>Staff:</b> ${kot.printedBy || 'Staff'}
      </div>`;

      kotText += `<div style="margin-top: 15px; border-bottom: 1px solid #000;"></div>`;

      kotText += `<table style="width:100%; text-align:left; border-collapse: collapse; margin-top: 10px;">
        <thead>
            <tr style="border-bottom: 1px solid #ccc;">
                <th style="padding: 5px 0;">Item</th>
                <th style="padding: 5px 0; text-align:right;">Qty</th>
            </tr>
        </thead>
        <tbody>`;

      kot.items.forEach((item: any) => {
        kotText += `<tr>
            <td style="padding: 5px 0; vertical-align: top;">
                <div style="font-weight:bold;">${item.name}</div>
                ${item.addons && item.addons.length > 0 ?
            `<div style="font-size: 0.85em; color: #555;">+ ${item.addons.map((a: any) => a.name || a).join(', ')}</div>`
            : ''}
                ${item.specialInstructions ?
            `<div style="font-size: 0.85em; font-style: italic;">Note: ${item.specialInstructions}</div>`
            : ''}
            </td>
            <td style="padding: 5px 0; text-align:right; font-weight:bold; vertical-align: top;">${item.quantity}</td>
          </tr>`;
      });

      kotText += `</tbody></table>`;
      kotText += `<div style="margin-top: 15px; border-top: 2px dashed #000; padding-top: 10px; text-align:center; font-size: 0.9em;">
        *** KITCHEN COPY ***
      </div>`;


      const printWindow = window.open("", "", "width=400,height=600");
      if (printWindow) {
        printWindow.document.write("<html><head><title>KOT #" + kot.kotNumber + "</title>");
        printWindow.document.write(
          "<style>body { font-family: monospace; font-size: 14px; padding: 20px; max-width: 350px; margin: 0 auto; } table { width: 100%; }</style>"
        );
        printWindow.document.write("</head><body>");
        printWindow.document.write(kotText);
        printWindow.document.write("</body></html>");
        printWindow.document.close();

        // Wait for styles/content to load then print
        setTimeout(() => {
          printWindow.print();
          // printWindow.close(); // Optional: close after print
        }, 500);
      }

      // Refresh orders to update UI (maybe show KOT history if implemented)
      fetchOrders(false);
      toast({ description: `KOT #${kot.kotNumber} printed successfully` });

    } catch (error) {
      console.error("Print KOT error:", error);
      toast({ variant: "destructive", description: "Error printing KOT" });
    } finally {
      setUpdatingOrders(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  const handleReprintKOT = (order: Order, kot: any) => {
    // Logic similar to handlePrintKOT but taking a specific KOT object
    try {
      let kotText = "";
      kotText += `<div style="text-align:center; font-weight:bold; font-size: 1.2em; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
            KOT #${kot.kotNumber}<br>
            Date: ${formatKOTDate(kot.printedAt)}<br>
            (REPRINT)
          </div>`;

      kotText += `<div>
            <b>Table:</b> ${order.tableNumber || 'Unknown'}<br>
            <b>Order:</b> #${order.id.slice(-6).toUpperCase()}<br>
            <b>Staff:</b> ${kot.printedBy || 'Staff'}
          </div>`;

      kotText += `<div style="margin-top: 15px; border-bottom: 1px solid #000;"></div>`;

      kotText += `<table style="width:100%; text-align:left; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="border-bottom: 1px solid #ccc;">
                    <th style="padding: 5px 0;">Item</th>
                    <th style="padding: 5px 0; text-align:right;">Qty</th>
                </tr>
            </thead>
            <tbody>`;

      kot.items.forEach((item: any) => {
        kotText += `<tr>
                <td style="padding: 5px 0; vertical-align: top;">
                    <div style="font-weight:bold;">${item.name}</div>
                    ${item.addons && item.addons.length > 0 ?
            `<div style="font-size: 0.85em; color: #555;">+ ${item.addons.map((a: any) => a.name || a).join(', ')}</div>`
            : ''}
                    ${item.specialInstructions ?
            `<div style="font-size: 0.85em; font-style: italic;">Note: ${item.specialInstructions}</div>`
            : ''}
                </td>
                <td style="padding: 5px 0; text-align:right; font-weight:bold; vertical-align: top;">${item.quantity}</td>
              </tr>`;
      });

      kotText += `</tbody></table>`;
      kotText += `<div style="margin-top: 15px; border-top: 2px dashed #000; padding-top: 10px; text-align:center; font-size: 0.9em;">
            *** KITCHEN COPY (Reprint) ***
          </div>`;

      const printWindow = window.open("", "", "width=400,height=600");
      if (printWindow) {
        printWindow.document.write("<html><head><title>KOT #" + kot.kotNumber + " (Reprint)</title>");
        printWindow.document.write(
          "<style>body { font-family: monospace; font-size: 14px; padding: 20px; max-width: 350px; margin: 0 auto; } table { width: 100%; }</style>"
        );
        printWindow.document.write("</head><body>");
        printWindow.document.write(kotText);
        printWindow.document.write("</body></html>");
        printWindow.document.close();

        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (e) {
      console.error("Reprint error", e);
      toast({ variant: "destructive", description: "Failed to reprint KOT" });
    }
  };

  const handleRefresh = () => {
    fetchOrders(false);
  };

  const markOrderAsSeen = async (orderId: string) => {
    try {
      const { token } = getAuthData();

      // Store the current timestamp as "last seen" for this order
      // This allows us to filter out old updates in the frontend
      try {
        const lastSeenMap = JSON.parse(localStorage.getItem("orders_last_seen") || "{}");
        lastSeenMap[orderId] = Date.now();
        localStorage.setItem("orders_last_seen", JSON.stringify(lastSeenMap));
      } catch (e) {
        console.error("Error saving last seen timestamp:", e);
      }

      const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/mark-seen`,
        {
          method: "PATCH",
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark order as seen");
      }

      const data = await response.json();

      // Update local state immediately - this is crucial
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
              ...order,
              itemsDetailed: order.itemsDetailed.map((item) => ({
                ...item,
                isNew: false,
                // Keep isRemoved so items stay struck through
              })),
              rawOrder: {
                ...order.rawOrder,
                hasUnseenChanges: false, // This MUST be set to false
              },
            }
            : order
        )
      );

      // Also refresh orders from backend to ensure sync
      await fetchOrders(true);
    } catch (err) {
      console.error("Error marking order as seen:", err);
    }
  };

  const handleCustomDateApply = () => {
    setDateFilter("custom");
    setShowDatePicker(false);
    fetchOrders(false);
  };

  const getDateFilterLabel = () => {
    if (dateFilter === "all") return "All Time";
    if (dateFilter === "today") return "Today";
    if (dateFilter === "custom") {
      const date = new Date(
        customDate.year,
        customDate.month - 1,
        customDate.day
      );
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return "Select Date";
  };

  const openAddOrderModal = async () => {
    setEditingOrder(null);
    setShowAddOrder(true);
    await fetchTables();
    await fetchMenu();
  };

  const openEditOrderModal = async (order: Order) => {
    setEditingOrder(order);
    setCustomerName(order.customerName);
    setSpecialInstructions(order.specialInstructions);

    // Create cart items from order - FILTER OUT REMOVED ITEMS
    const cartItems = order.itemsDetailed
      .filter((item) => !item.isRemoved) // Don't include already removed items
      .map((item) => ({
        id: `${item.menuItemId || item._id}-${Date.now()}-${Math.random()}`, // Added Math.random() for uniqueness
        menuItemId: (item.menuItemId || item._id) as string,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        addons: item.addons || [],
        isVeg: item.isVeg,
      }));

    setCart(cartItems);

    setOriginalCart(
      JSON.parse(
        JSON.stringify({
          items: cartItems,
          customerName: order.customerName,
          specialInstructions: order.specialInstructions,
        })
      )
    ); // Deep clone for comparison

    // Fetch tables and menu first, before opening modal
    await Promise.all([fetchTables(), fetchMenu()]);

    // Set the selected table after tables are fetched
    // We need to fetch tables fresh and then find the matching one
    try {
      const response = await fetch(`${API_BASE_URL}/tables`, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        const foundTable = data.data.find(
          (t: Table) => t._id === order.tableId
        );
        setSelectedTable(foundTable || null);
      }
    } catch (err) {
      console.error("Error fetching table for edit:", err);
    }

    // Open modal after everything is set up
    setShowAddOrder(true);
  };

  const closeAddOrderModal = () => {
    setShowAddOrder(false);
    setEditingOrder(null);
    setSelectedTable(null);
    setCart([]);
    setOriginalCart([]);
    setCustomerName("");
    setSpecialInstructions("");
    setSearchQuery("");
    setSelectedCategory("all");
  };

  const addToCart = (item: MenuItem, selectedAddons: AddonItem[] = []) => {
    // Check if item with same menuItemId and addons already exists
    const addonKey = JSON.stringify(selectedAddons.map((a) => a.name).sort());
    const existingItemIndex = cart.findIndex(
      (cartItem) =>
        cartItem.menuItemId === item._id &&
        JSON.stringify((cartItem.addons || []).map((a) => a.name).sort()) ===
        addonKey
    );

    if (existingItemIndex !== -1) {
      // Item exists, increase quantity
      setCart((prev) =>
        prev.map((cartItem, idx) =>
          idx === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      // Add new item
      const cartItem: CartItem = {
        id: `${item._id}-${Date.now()}-${Math.random()}`,
        menuItemId: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        addons: selectedAddons,
        isVeg: item.isVeg,
      };
      setCart((prev) => [...prev, cartItem]);
    }
  };

  const openAddonModal = (item: MenuItem) => {
    setSelectedItemForAddons(item);
    setSelectedAddons({});
    setShowAddonModal(true);
  };

  const closeAddonModal = () => {
    setShowAddonModal(false);
    setSelectedItemForAddons(null);
    setSelectedAddons({});
  };

  const toggleAddon = (groupIndex: number, addon: AddonItem) => {
    if (!selectedItemForAddons) return;

    const group = selectedItemForAddons.addonGroups![groupIndex];
    const addonWithGroup = { ...addon, group: group.title };

    setSelectedAddons((prev) => {
      const currentGroupAddons = prev[groupIndex] || [];

      if (group.multiSelect) {
        const exists = currentGroupAddons.find((a) => a.name === addon.name);
        if (exists) {
          return {
            ...prev,
            [groupIndex]: currentGroupAddons.filter(
              (a) => a.name !== addon.name
            ),
          };
        } else {
          return {
            ...prev,
            [groupIndex]: [...currentGroupAddons, addonWithGroup],
          };
        }
      } else {
        const isSame = currentGroupAddons[0]?.name === addon.name;
        return {
          ...prev,
          [groupIndex]: isSame ? [] : [addonWithGroup],
        };
      }
    });
  };

  const isAddonSelected = (
    groupIndex: number,
    addon: AddonItem | Addon
  ): boolean => {
    const groupAddons = selectedAddons[groupIndex] || [];
    return groupAddons.some((a) => a.name === addon.name);
  };

  const handleAddToCartWithAddons = () => {
    if (!selectedItemForAddons) return;

    const allSelectedAddons = Object.values(selectedAddons).flat();
    addToCart(selectedItemForAddons, allSelectedAddons);
    closeAddonModal();
  };

  const getItemTotalWithAddons = (basePrice: number): number => {
    const allSelectedAddons = Object.values(selectedAddons).flat();
    const addonsTotal = allSelectedAddons.reduce(
      (sum, addon) => sum + (addon.price || 0),
      0
    );
    return basePrice + addonsTotal;
  };

  const getSelectedAddonsCount = (): number => {
    return Object.values(selectedAddons).flat().length;
  };

  const getCartItemTotal = (item: CartItem) => {
    const basePrice = item.price;
    const addonsPrice = item.addons.reduce(
      (sum, addon) => sum + (addon.price || 0),
      0
    );
    return (basePrice + addonsPrice) * item.quantity;
  };

  const updateQuantity = (cartItemId: string, change: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQuantity = Math.max(0, item.quantity + change);
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + getCartItemTotal(item), 0);
  };

  const getFilteredMenu = () => {
    return menuSections
      .map((section) => ({
        ...section,
        items: (section.items || []).filter((item) => {
          const matchesCategory =
            selectedCategory === "all" || section._id === selectedCategory;
          const matchesSearch =
            item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch && item.isActive;
        }),
      }))
      .filter((section) => section.items.length > 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedTable) {
      toast({
        variant: "destructive",
        description: "Please select a table",
      });
      return;
    }

    // Allow empty cart only when editing (to remove all items)
    if (cart.length === 0 && !editingOrder) {
      toast({
        variant: "destructive",
        description: "Please add items to cart",
      });
      return;
    }

    try {
      setIsCreatingOrder(true);
      const { token } = getAuthData();

      // Filter out any items with quantity 0 or less - THIS IS THE KEY FIX
      const validCartItems = cart.filter((item) => item.quantity > 0);

      const orderItems = validCartItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        addons: item.addons.map((addon) => ({
          name: addon.name,
          price: addon.price,
          group: addon.group
        })),
      }));

      if (editingOrder) {
        // For updates, we send the complete new items list
        const response = await fetch(
          `${API_BASE_URL}/orders/${editingOrder.id}/update`,
          {
            method: "PATCH",
            headers: {
              ...getAuthHeader(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: orderItems, // Send only valid items (quantity > 0)
              customerName: customerName || "Guest",
              specialInstructions: specialInstructions,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          closeAddOrderModal();
          fetchOrders(false);
          toast({
            description: "Order updated successfully!",
          });
        } else {
          toast({
            variant: "destructive",
            description: data.message || "Failed to update order",
          });
        }
      } else {
        const response = await fetch(
          `${API_BASE_URL}/orders/table/${selectedTable._id}/order`,
          {
            method: "POST",
            headers: {
              ...getAuthHeader(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: orderItems,
              customerName: customerName || "Guest",
              specialInstructions: specialInstructions,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          closeAddOrderModal();
          fetchOrders(false);
          toast({
            description: "Order created successfully!",
          });
        } else {
          toast({
            variant: "destructive",
            description: data.message || "Failed to create order",
          });
        }
      }
    } catch (err) {
      console.error("Error with order:", err);
      toast({
        variant: "destructive",
        description: editingOrder
          ? "Failed to update order"
          : "Failed to create order",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  useEffect(() => {
    const { token, user } = getAuthData();

    if (token && user.id) {
      fetchOrders(false);

      pollingIntervalRef.current = setInterval(() => {
        fetchOrders(true);
      }, 5000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      setLoading(false);
      setError("Please log in to view orders");
    }
  }, [fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "preparing":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "ready":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "served":
        return "bg-gray-500/10 text-gray-600 border-gray-500/30";
      case "paid":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "preparing":
        return <AlertCircle className="h-4 w-4" />;
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      case "served":
        return <CheckCircle className="h-4 w-4" />;
      case "paid":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case "upi":
        return <UpiIcon className="h-4 w-4" />;
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "cash":
        return <Banknote className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredMenu = getFilteredMenu();

  if (loading) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            Live Orders
          </h2>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Loading orders...
            </span>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="border shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-muted rounded-xl"></div>
                    <div className="space-y-2.5 flex-1">
                      <div className="h-5 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !orders.length) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            Live Orders
          </h2>
          <Button onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
        <Card className="border-destructive/50 bg-destructive/5 shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Failed to Load Orders
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {error}
            </p>
            <Button onClick={handleRefresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
          Live Orders
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            onClick={openAddOrderModal}
            className="gap-2 shadow-sm hover:shadow transition-all duration-200"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add Order
          </Button>

          {/* Recently Updated Filter Toggle */}
          <Button
            variant={recentlyUpdatedFilter ? "default" : "outline"}
            onClick={() => {
              setRecentlyUpdatedFilter(!recentlyUpdatedFilter);
              fetchOrders(false);
            }}
            className="gap-2 shadow-sm hover:shadow transition-all duration-200"
            size="sm"
          >
            <Sparkles className="h-4 w-4" />
            Recently Updated
            {recentlyUpdatedFilter &&
              orders.filter((o) => o.rawOrder?.hasUnseenChanges).length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                  {orders.filter((o) => o.rawOrder?.hasUnseenChanges).length}
                </Badge>
              )}
          </Button>

          <div className="relative flex-1 sm:flex-none min-w-[140px]">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-full rounded-full bg-gradient-to-b from-background to-muted/40 border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70 shadow-lg">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="served">Served</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative flex-1 sm:flex-none min-w-[140px]">
            <Select
              value={orderTypeFilter}
              onValueChange={(value) => setOrderTypeFilter(value)}
            >
              <SelectTrigger className="w-full rounded-full bg-gradient-to-b from-background to-muted/40 border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70 shadow-lg">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="qr">QR Orders</SelectItem>
                <SelectItem value="staff">Staff Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 sm:gap-2 shadow-sm hover:shadow transition-all duration-200 text-xs sm:text-sm flex-1 sm:flex-none px-2 sm:px-3"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="truncate">{getDateFilterLabel()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-1.5rem)] sm:w-80 p-0"
              align="end"
            >
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Select Date</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={dateFilter === "today" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setDateFilter("today");
                        setShowDatePicker(false);
                      }}
                      className="transition-all duration-200"
                    >
                      Today
                    </Button>
                    <Button
                      variant={dateFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setDateFilter("all");
                        setShowDatePicker(false);
                      }}
                      className="transition-all duration-200"
                    >
                      All Time
                    </Button>
                    <Button
                      variant={dateFilter === "custom" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDateFilter("custom")}
                      className="transition-all duration-200"
                    >
                      Custom
                    </Button>
                  </div>
                </div>

                {dateFilter === "custom" && (
                  <div className="space-y-3 pt-3 border-t">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Year
                        </label>
                        <input
                          type="number"
                          min="2020"
                          max="2030"
                          value={customDate.year}
                          onChange={(e) =>
                            setCustomDate((prev) => ({
                              ...prev,
                              year: parseInt(e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Month
                        </label>
                        <select
                          value={customDate.month}
                          onChange={(e) =>
                            setCustomDate((prev) => ({
                              ...prev,
                              month: parseInt(e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(2000, i, 1).toLocaleString("en", {
                                month: "short",
                              })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Day
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={customDate.day}
                          onChange={(e) =>
                            setCustomDate((prev) => ({
                              ...prev,
                              day: parseInt(e.target.value),
                            }))
                          }
                          className="w-full px-2.5 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleCustomDateApply}
                      size="sm"
                      className="w-full transition-all duration-200"
                    >
                      Apply Date Filter
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Badge
            variant="secondary"
            className="px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm text-xs sm:text-sm whitespace-nowrap"
          >
            {orders.length} {orders.length === 1 ? "Order" : "Orders"}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="shadow-sm hover:shadow transition-all duration-200 shrink-0 px-2 sm:px-3"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive font-medium">
                {error}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && (
        <div className="mb-4">
          <OrderUpdateLegend />
        </div>
      )}

      {orders.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-6 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted mb-4">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              No Orders Found
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
              {dateFilter === "today"
                ? "No orders have been placed today yet."
                : dateFilter === "all"
                  ? "No orders have been placed yet."
                  : `No orders found for ${getDateFilterLabel()}.`}
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={openAddOrderModal}
                className="gap-2 shadow-sm hover:shadow transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Add Order
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="gap-2 shadow-sm hover:shadow transition-all duration-200 text-xs sm:text-sm"
              >
                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {orders.map((order) => {
            const orderTypeInfo = getOrderTypeInfo(order.orderType);
            const isExpanded = expandedOrders.has(order.id);
            const hasAddons = order.itemsDetailed.some(
              (item) => item.addons && item.addons.length > 0
            );
            return (

              <Card
                key={order.id}
                className={`shadow-sm hover:shadow-md transition-all duration-300 border animate-in fade-in slide-in-from-bottom-2 ${
                  // Priority: Paid > Unseen Changes > Is Updated > Default Status based styling
                  order.status === "paid"
                    ? "border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                    : order.rawOrder?.hasUnseenChanges
                      ? "border-2 border-amber-500 bg-gradient-to-r from-amber-50 via-amber-50/50 to-background dark:from-amber-950/40 dark:via-amber-950/20 dark:to-background shadow-lg shadow-amber-100 dark:shadow-amber-950/50"
                      : order.isUpdated
                        ? "border-l-4 border-l-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10"
                        : "border-l-4 border-l-transparent" // Default alignment
                  }`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4">
                    {/* NEW: Unseen Changes Alert Banner - Shows at the very top */}
                    {order.rawOrder?.hasUnseenChanges &&
                      order.status !== "paid" &&
                      !order.itemsDetailed.every(item => item.status === "served" || item.isRemoved) && (
                        <div className="bg-red-500 text-white px-4 py-3 rounded-lg flex items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                              <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">
                                New Changes Detected!
                              </p>
                              <p className="text-xs opacity-90">
                                This order has been updated by the customer
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => markOrderAsSeen(order.id)}
                            className="gap-1.5 font-semibold bg-white hover:bg-gray-100 text-red-600 border-0 shadow-sm hover:shadow transition-all px-4 py-2 flex-shrink-0"
                          >
                            <Check className="h-4 w-4" />
                            Mark as Seen
                          </Button>
                        </div>
                      )}

                    {/* Header with badges on right */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-lg sm:text-xl">
                            {order.tableNumber}
                          </h4>
                          <Badge
                            className={`${getStatusColor(
                              order.status
                            )} text-xs border shadow-sm pointer-events-none`}
                          >
                            {getStatusIcon(order.status)}
                            <span className="ml-1 sm:ml-1.5 capitalize font-medium">
                              {order.status}
                            </span>
                          </Badge>
                          {order.status === "paid" && order.paymentMethod && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs shadow-sm pointer-events-none flex items-center gap-1">
                              {getPaymentMethodIcon(order.paymentMethod)}
                              <span className="capitalize">
                                {order.paymentMethod}
                              </span>
                            </Badge>
                          )}
                          {order.customerName &&
                            order.customerName !== "Guest" && (
                              <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-1.5 sm:px-2 py-0.5 rounded-md">
                                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span>{order.customerName}</span>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Badges positioned at top right */}
                      <div className="flex flex-col gap-1.5 items-end shrink-0">
                        <div className="flex items-center gap-2 mb-1 animate-in fade-in slide-in-from-right-4 duration-300">
                          {itemSelections[order.id]?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {itemSelections[order.id].length} selected
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => setItemSelections(prev => ({ ...prev, [order.id]: [] }))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {order.isUpdated &&
                          !order.rawOrder?.hasUnseenChanges && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs shadow-sm flex items-center gap-1 pointer-events-none">
                              <Sparkles className="h-3 w-3" />
                              <span className="font-medium">
                                Updated {order.updateCount}x
                              </span>
                            </Badge>
                          )}
                        <Badge
                          className={`${orderTypeInfo.className} text-xs border shadow-sm flex items-center gap-1 pointer-events-none`}
                        >
                          {orderTypeInfo.icon}
                          <span className="font-medium">
                            {orderTypeInfo.label}
                          </span>
                        </Badge>
                      </div>
                    </div>

                    {/* Rest of the card content remains the same... */}

                    {/* Order items */}
                    <div className="text-xs sm:text-sm space-y-2">
                      {!isExpanded ? (
                        <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                          {order.itemsDetailed.map((item, idx) => {
                            const itemBasePrice = (item.price || 0) * item.quantity;
                            const itemAddonPrice = (item.addons || []).reduce((sum, addon) => sum + (addon.price || 0) * item.quantity, 0);
                            const itemTotalPrice = itemBasePrice + itemAddonPrice;

                            // Get update info for this item in collapsed view too
                            const updateInfo = getItemUpdateInfo(
                              order.id,
                              item,
                              (order.rawOrder?.updateHistory as OrderUpdateHistoryItem[]) || [],
                              (order.rawOrder?.hasUnseenChanges as boolean) || false
                            );

                            return (
                              <div
                                key={idx}
                                className={`flex items-center justify-between p-2.5 rounded-lg ${item.isNew && item.status !== 'served' && item.status !== 'paid' && item.status !== 'cancelled'
                                  ? "bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500"
                                  : item.isRemoved
                                    ? "bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 opacity-60 line-through"
                                    : updateInfo?.changeType === "quantity_increased"
                                      ? "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500"
                                      : updateInfo?.changeType === "quantity_decreased"
                                        ? "bg-orange-50 dark:bg-orange-950/20 border-l-4 border-orange-500"
                                        : "bg-background"
                                  }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {item._id && order.status !== "paid" && order.status !== "cancelled" && (
                                    <Checkbox
                                      checked={itemSelections[order.id]?.includes(item._id) || false}
                                      onCheckedChange={() => handleToggleItemSelection(order.id, item._id!)}
                                    />
                                  )}
                                  <span className="font-semibold">{item.name} ×{item.quantity}</span>

                                  {/* Show inline update info if order has unseen changes */}
                                  {updateInfo && (
                                    <span
                                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${updateInfo.changeType ===
                                        "item_added"
                                        ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                        : updateInfo.changeType ===
                                          "item_removed"
                                          ? "bg-red-500/20 text-red-700 dark:text-red-400"
                                          : updateInfo.changeType ===
                                            "quantity_increased"
                                            ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                            : "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                                        }`}
                                    >
                                      {updateInfo.changeText}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(item.status || "pending")}>
                                    {item.status || "pending"}
                                  </Badge>
                                  <span className="font-bold">{formatPrice(itemTotalPrice)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                          {order.itemsDetailed.map((item, idx) => {
                            const itemBasePrice =
                              (item.price || 0) * item.quantity;
                            const itemAddonPrice = (item.addons || []).reduce(
                              (sum, addon) =>
                                sum + (addon.price || 0) * item.quantity,
                              0
                            );
                            const itemTotalPrice =
                              itemBasePrice + itemAddonPrice;

                            // Get update info for this item
                            const updateInfo = getItemUpdateInfo(
                              order.id,
                              item,
                              (order.rawOrder
                                ?.updateHistory as OrderUpdateHistoryItem[]) ||
                              [],
                              (order.rawOrder?.hasUnseenChanges as boolean) ||
                              false
                            );

                            return (
                              <div
                                key={idx}
                                className={`pb-2 border-b border-border last:border-0 last:pb-0 ${item.isNew && item.status !== 'served' && item.status !== 'paid' && item.status !== 'cancelled'
                                  ? "bg-green-50 dark:bg-green-950/20 -m-1 p-2 rounded-lg border-l-4 border-green-500"
                                  : item.isRemoved
                                    ? "bg-red-50 dark:bg-red-950/20 -m-1 p-2 rounded-lg border-l-4 border-red-500 opacity-60 line-through"
                                    : updateInfo?.changeType === "quantity_increased"
                                      ? "bg-blue-50 dark:bg-blue-950/20 -m-1 p-2 rounded-lg border-l-4 border-blue-500"
                                      : updateInfo?.changeType === "quantity_decreased"
                                        ? "bg-orange-50 dark:bg-orange-950/20 -m-1 p-2 rounded-lg border-l-4 border-orange-500"
                                        : ""
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-1">
                                    {/* Item name and badges */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-semibold text-foreground">
                                        {item.name}{" "}
                                        <span className="text-muted-foreground">
                                          x{item.quantity}
                                        </span>
                                      </p>

                                      {/* ONLY show inline update info if order has unseen changes */}
                                      {updateInfo && (
                                        <span
                                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${updateInfo.changeType ===
                                            "item_added"
                                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                            : updateInfo.changeType ===
                                              "item_removed"
                                              ? "bg-red-500/20 text-red-700 dark:text-red-400"
                                              : updateInfo.changeType ===
                                                "quantity_increased"
                                                ? "bg-blue-500/20 text-blue-700 dark:text-blue-400"
                                                : "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                                            }`}
                                        >
                                          {updateInfo.changeText}
                                        </span>
                                      )}

                                      {item.isNew && (
                                        <Badge className="bg-green-500 text-white text-xs px-1.5 py-0 pointer-events-none">
                                          NEW
                                        </Badge>
                                      )}
                                      {item.isRemoved && (
                                        <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 pointer-events-none">
                                          REMOVED
                                        </Badge>
                                      )}
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                      {formatPrice(item.price)} each
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Item Selection Checkbox */}
                                    {item._id && !item.isRemoved && order.status !== "paid" && order.status !== "cancelled" && (
                                      <Checkbox
                                        id={`item-expanded-${order.id}-${item._id}`}
                                        className="h-4 w-4"
                                        checked={itemSelections[order.id]?.includes(item._id) || false}
                                        onCheckedChange={() => handleToggleItemSelection(order.id, item._id!)}
                                      />
                                    )}
                                    {/* Read-only status badge */}
                                    {item._id && (
                                      <Badge className={`${getStatusColor(item.status || "pending")} text-[9px] px-1.5 py-0 capitalize`}>
                                        {item.status || "pending"}
                                      </Badge>
                                    )}
                                    <p className="font-bold text-primary">
                                      {formatPrice(itemTotalPrice)}
                                    </p>
                                  </div>
                                </div>

                                {/* Show addons grouped by their group name with prices */}
                                {item.addons && item.addons.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {(() => {
                                      const groupedAddons = item.addons.reduce(
                                        (
                                          acc: Record<string, Addon[]>,
                                          addon
                                        ) => {
                                          const groupName =
                                            addon.group || "Add-ons";
                                          if (!acc[groupName]) {
                                            acc[groupName] = [];
                                          }
                                          acc[groupName].push(addon);
                                          return acc;
                                        },
                                        {}
                                      );

                                      return Object.entries(groupedAddons).map(
                                        ([groupName, addons], groupIdx) => (
                                          <div
                                            key={groupIdx}
                                            className="pl-3 border-l-2 border-primary/30"
                                          >
                                            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                                              {groupName}:
                                            </p>
                                            <div className="space-y-0.5">
                                              {addons.map((addon, addonIdx) => (
                                                <div
                                                  key={addonIdx}
                                                  className="flex items-center justify-between text-xs"
                                                >
                                                  <div className="flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                                                    <span className="text-foreground/80">
                                                      {addon.name}
                                                    </span>
                                                  </div>
                                                  {addon.price > 0 && (
                                                    <span className="text-primary font-semibold">
                                                      +
                                                      {formatPrice(
                                                        addon.price *
                                                        item.quantity
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {order.specialInstructions && (
                        <p className="text-amber-600 dark:text-amber-500 italic bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-md text-xs break-words">
                          Note: {order.specialInstructions}
                        </p>
                      )}

                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="bg-muted/50 px-2 py-1 rounded whitespace-nowrap">
                            {order.dateLabel}
                          </span>
                          <span className="bg-muted/50 px-2 py-1 rounded whitespace-nowrap">
                            {order.fullTime}
                          </span>
                          <span className="bg-muted/50 px-2 py-1 rounded whitespace-nowrap">
                            {order.timestamp}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-lg sm:text-xl">
                            {formatPrice(order.total)}
                          </span>
                          {restaurantSettings.taxes.length > 0 && (
                            <span className="text-sm font-medium text-muted-foreground">
                              {/* Calculate total with tax: Total + (Total * TaxRate%) */}
                              {(() => {
                                const totalTaxRate = restaurantSettings.taxes.reduce((sum, tax) => sum + tax.rate, 0);
                                const totalWithTax = order.total * (1 + totalTaxRate / 100);
                                return `Total (inc. taxes): ${formatPrice(totalWithTax)}`;
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Update History - Only shown when history button is clicked */}


                    {/* Action buttons */}
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                      {(hasAddons ||
                        order.itemsDetailed.some(
                          (item) => item.isNew || item.isRemoved
                        )) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleOrderExpanded(order.id)}
                            className="gap-1 sm:gap-2 text-xs sm:text-sm"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                                View Addons
                              </>
                            )}
                          </Button>
                        )}

                      {/* NEW: Separate Update History Button */}
                      {order.rawOrder?.updateHistory &&
                        Array.isArray(order.rawOrder.updateHistory) &&
                        order.rawOrder.updateHistory.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleOrderHistory(order.id)}
                            className="gap-1 sm:gap-2 text-xs sm:text-sm border-amber-500/50 hover:bg-amber-50 hover:border-amber-500"
                          >
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            {expandedHistory.has(order.id)
                              ? "Hide"
                              : "View"}{" "}
                            History
                          </Button>
                        )}



                      {/* KOT Button - Visible for all orders except cancelled */}
                      {/* KOT Button - Visible for all orders except cancelled */}
                      {order.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintKOT(order)}
                          className={`gap-1 sm:gap-2 text-xs sm:text-sm transition-all duration-300 ${
                            // Check backend "noNewItems" flag if we had it, but API handles validation.
                            // For UI, we could fetch KOT history to disable, but simple button is fine.
                            // Maybe add a history count badge?
                            ""
                            }`}
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                          KOT
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditOrderModal(order)}
                        disabled={
                          order.status === "paid" ||
                          order.status === "cancelled"
                        }
                        className="gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        Update Order
                      </Button>
                      {/* Accept Order: Show if order is pending */}
                      {order.status === 'pending' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow transition-all duration-200 gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            disabled={updatingOrders.has(order.id)}
                            onClick={() => {
                              const pendingItems = order.itemsDetailed
                                .filter(i => !i.isRemoved && i.status === 'pending')
                                .flatMap(i => i.ids || [i._id!]);

                              if (pendingItems.length > 0) {
                                handleBulkUpdateStatus(order.id, "accepted", pendingItems);
                              }
                            }}
                          >
                            {updatingOrders.has(order.id) ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                            Accept Order
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="shadow-sm hover:shadow transition-all duration-200 gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                            disabled={updatingOrders.has(order.id)}
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            {updatingOrders.has(order.id) ? (
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                            ) : (
                              <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            )}
                            Cancel Order
                          </Button>
                        </div>
                      )}

                      {/* Prepare: Show if order has accepted items */}
                      {order.itemsDetailed.some(i => !i.isRemoved && i.status === 'accepted') && order.status !== 'served' && order.status !== 'paid' && (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all duration-200 gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                          disabled={updatingOrders.has(order.id)}
                          onClick={() => {
                            const selected = itemSelections[order.id] || [];
                            let itemsToUse = selected;
                            if (selected.length === 0) {
                              itemsToUse = order.itemsDetailed
                                .filter(i => !i.isRemoved && i.status === 'accepted' && (i.ids?.length || i._id))
                                .flatMap(i => i.ids || [i._id!]);
                              setItemSelections(prev => ({ ...prev, [order.id]: itemsToUse }));
                            }
                            if (itemsToUse.length > 0) {
                              handleBulkUpdateStatus(order.id, "preparing", itemsToUse);
                            }
                          }}
                        >
                          {updatingOrders.has(order.id) ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : itemSelections[order.id]?.length > 0 ? (
                            `Prepare ${itemSelections[order.id].length} Items`
                          ) : (
                            <>
                              <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
                              Prepare
                            </>
                          )}
                        </Button>
                      )}

                      {/* Start Preparing: Show if order has pending items AND we are NOT in pending state (already accepted but new items added) */}
                      {order.itemsDetailed.some(i => !i.isRemoved && i.status === 'pending') && order.status !== 'pending' && order.status !== 'served' && order.status !== 'paid' && (
                        <Button
                          size="sm"
                          disabled={updatingOrders.has(order.id)}
                          onClick={() => {
                            const selected = itemSelections[order.id] || [];
                            let itemsToUse = selected;
                            if (selected.length === 0) {
                              itemsToUse = order.itemsDetailed
                                .filter(i => !i.isRemoved && i.status === 'pending' && (i.ids?.length || i._id))
                                .flatMap(i => i.ids || [i._id!]);
                              setItemSelections(prev => ({ ...prev, [order.id]: itemsToUse }));
                            }
                            if (itemsToUse.length > 0) {
                              handleBulkUpdateStatus(order.id, "preparing", itemsToUse);
                            }
                          }}
                          className="shadow-sm hover:shadow transition-all duration-200 gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          {updatingOrders.has(order.id) ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : itemSelections[order.id]?.length > 0 ? (
                            `Prepare ${itemSelections[order.id].length} Items`
                          ) : (
                            "Start Preparing (New Items)"
                          )}
                        </Button>
                      )}
                      {/* Mark Ready: Show if order has preparing items AND order is not served/paid */}
                      {order.itemsDetailed.some(i => !i.isRemoved && i.status === 'preparing') && order.status !== 'served' && order.status !== 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingOrders.has(order.id)}
                          onClick={() => {
                            const selected = itemSelections[order.id] || [];
                            let itemsToUse = selected;
                            if (selected.length === 0) {
                              itemsToUse = order.itemsDetailed
                                .filter(i => !i.isRemoved && i.status === 'preparing' && (i.ids?.length || i._id))
                                .flatMap(i => i.ids || [i._id!]);
                              setItemSelections(prev => ({ ...prev, [order.id]: itemsToUse }));
                            }
                            if (itemsToUse.length > 0) {
                              handleBulkUpdateStatus(order.id, "ready", itemsToUse);
                            }
                          }}
                          className="shadow-sm hover:shadow transition-all duration-200 gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          {updatingOrders.has(order.id) ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : itemSelections[order.id]?.length > 0 ? (
                            `Ready ${itemSelections[order.id].length} Items`
                          ) : (
                            "Mark Ready (All)"
                          )}
                        </Button>
                      )}
                      {/* Mark Served: Show if order has ready items AND order is not served/paid */}
                      {order.itemsDetailed.some(i => !i.isRemoved && i.status === 'ready') && order.status !== 'served' && order.status !== 'paid' && (
                        <Button
                          size="sm"
                          disabled={updatingOrders.has(order.id)}
                          onClick={() => {
                            const selected = itemSelections[order.id] || [];
                            let itemsToUse = selected;
                            if (selected.length === 0) {
                              itemsToUse = order.itemsDetailed
                                .filter(i => !i.isRemoved && i.status === 'ready' && (i.ids?.length || i._id))
                                .flatMap(i => i.ids || [i._id!]);
                              setItemSelections(prev => ({ ...prev, [order.id]: itemsToUse }));
                            }
                            if (itemsToUse.length > 0) {
                              handleBulkUpdateStatus(order.id, "served", itemsToUse);
                            }
                          }}
                          className="shadow-sm hover:shadow transition-all duration-200 gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          {updatingOrders.has(order.id) ? (
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          ) : itemSelections[order.id]?.length > 0 ? (
                            `Serve ${itemSelections[order.id].length} Items`
                          ) : (
                            "Mark Served (All)"
                          )}
                        </Button>
                      )}
                      {/* Mark Paid: Show if served */}
                      {order.status === "served" && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenPaymentModal(order)}
                          className="shadow-sm hover:shadow transition-all duration-200 gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                          Mark as Paid
                        </Button>
                      )}
                      {/* View Receipt: Show if paid OR served */}
                      {(order.status === "paid" || order.status === "served") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReceiptOrder(order);
                            setShowReceiptModal(true);
                          }}
                          className="shadow-sm hover:shadow transition-all duration-200 gap-1 sm:gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                          View Receipt
                        </Button>
                      )}
                    </div>
                    {expandedHistory.has(order.id) && (
                      <div className="mt-4 border-t pt-4">
                        <UpdateHistoryPanel
                          orderId={order.id}
                          history={
                            (order.rawOrder?.updateHistory as OrderUpdateHistoryItem[]) || []
                          }
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Order Modal */}
      <Dialog open={showAddOrder} onOpenChange={closeAddOrderModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="bg-primary/10 p-2 rounded-lg">
                {editingOrder ? (
                  <Edit className="h-5 w-5 text-primary" />
                ) : (
                  <Plus className="h-5 w-5 text-primary" />
                )}
              </div>
              {editingOrder ? "Update Order" : "Create New Order"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Table Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Select Table
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {tables.map((table) => (
                    <Button
                      key={table._id}
                      variant={
                        selectedTable?._id === table._id ? "default" : "outline"
                      }
                      onClick={() => setSelectedTable(table)}
                      className="h-16 flex flex-col gap-1"
                      disabled={editingOrder !== null || table.hasActiveOrder} // DISABLE IF HAS ACTIVE ORDER
                    >
                      <span className="font-bold">{table.tableName}</span>
                      <span className="text-xs opacity-70">
                        {table.seats} seats
                      </span>
                      {table.hasActiveOrder && (
                        <Lock className="h-3 w-3 absolute top-1 right-1" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="customerName"
                    className="flex items-center gap-2 mb-2"
                  >
                    <User className="h-4 w-4" />
                    Customer Name (Optional)
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="specialInstructions" className="mb-2 block">
                    Special Instructions (Optional)
                  </Label>
                  <Input
                    id="specialInstructions"
                    placeholder="Any special requests..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </div>
              </div>

              {/* Menu Items */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Add Items
                </Label>

                {/* Search and Filter */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={
                        selectedCategory === "all" ? "default" : "outline"
                      }
                      onClick={() => setSelectedCategory("all")}
                      size="sm"
                    >
                      All Items
                    </Button>
                    {menuSections.map((section) => (
                      <Button
                        key={section._id}
                        variant={
                          selectedCategory === section._id
                            ? "default"
                            : "outline"
                        }
                        onClick={() => setSelectedCategory(section._id)}
                        size="sm"
                      >
                        {section.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Menu Grid */}
                <div className="max-h-[300px] overflow-y-auto border rounded-lg p-4 space-y-4">
                  {filteredMenu.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No items found</p>
                    </div>
                  ) : (
                    filteredMenu.map((section) => (
                      <div key={section._id}>
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                          {section.name}
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {section.items.map((item) => {
                            const hasAddonGroups =
                              item.addonGroups &&
                              Array.isArray(item.addonGroups) &&
                              item.addonGroups.length > 0;

                            return (
                              <div
                                key={item._id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0 mr-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-sm truncate">
                                      {item.name}
                                    </p>
                                    {item.isVeg !== undefined && (
                                      <div
                                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.isVeg
                                          ? "bg-white border-green-600"
                                          : "bg-white border-red-600"
                                          }`}
                                      >
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full ${item.isVeg
                                            ? "bg-green-600"
                                            : "bg-red-600"
                                            }`}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item.description}
                                  </p>
                                  <p className="text-sm font-semibold text-primary mt-1">
                                    {formatPrice(item.price)}
                                  </p>
                                  {hasAddonGroups && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      ✨ Customizable
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    hasAddonGroups
                                      ? openAddonModal(item)
                                      : addToCart(item)
                                  }
                                  className="flex-shrink-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Order Items ({cart.length})
                  </Label>
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-background rounded-lg"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            {item.isVeg !== undefined && (
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.isVeg
                                  ? "bg-white border-green-600"
                                  : "bg-white border-red-600"
                                  }`}
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"
                                    }`}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.price)} each
                          </p>
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {item.addons.map((addon, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-blue-600 flex items-center gap-1"
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                  <span>
                                    {addon.name}{" "}
                                    {addon.price > 0 &&
                                      `(+${formatPrice(addon.price)})`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="h-7 w-7"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-bold text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="h-7 w-7"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-bold text-sm w-16 text-right">
                            {formatPrice(getCartItemTotal(item))}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(getCartTotal())}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-2">
            <Button variant="outline" onClick={closeAddOrderModal}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={!selectedTable || cart.length === 0 || isCreatingOrder}
              className="gap-2"
            >
              {isCreatingOrder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {editingOrder ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {editingOrder ? "Update Order" : "Create Order"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Selection Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="h-5 w-5" />
              Select Payment Method
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Order Total:{" "}
              <span className="font-bold text-foreground text-lg">
                {formatPrice(selectedOrderForPayment?.total || 0)}
              </span>
            </p>

            <Button
              variant="outline"
              className="w-full h-20 flex items-center justify-start gap-4 hover:bg-blue-50 hover:border-blue-500 transition-all"
              onClick={() => handlePaymentMethodSelect("upi")}
              disabled={isProcessingPayment}
            >
              <div className="bg-blue-100 p-3 rounded-lg">
                <UpiIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-base">UPI Payment</p>
                <p className="text-xs text-muted-foreground">
                  PhonePe, Google Pay, Paytm
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-20 flex items-center justify-start gap-4 hover:bg-purple-50 hover:border-purple-500 transition-all"
              onClick={() => handlePaymentMethodSelect("card")}
              disabled={isProcessingPayment}
            >
              <div className="bg-purple-100 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-base">Card Payment</p>
                <p className="text-xs text-muted-foreground">
                  Credit / Debit Card
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-20 flex items-center justify-start gap-4 hover:bg-green-50 hover:border-green-500 transition-all"
              onClick={() => handlePaymentMethodSelect("cash")}
              disabled={isProcessingPayment}
            >
              <div className="bg-green-100 p-3 rounded-lg">
                <Banknote className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-base">Cash Payment</p>
                <p className="text-xs text-muted-foreground">Pay with cash</p>
              </div>
            </Button>
          </div>

          {isProcessingPayment && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Processing payment...
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Check className="h-5 w-5 text-green-600" />
              Payment Successful
            </DialogTitle>
          </DialogHeader>

          {receiptOrder && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-lg">Order Completed</p>
                <p className="text-sm text-muted-foreground">
                  Payment received successfully
                </p>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-mono font-semibold">
                    {receiptOrder.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Table:</span>
                  <span className="font-semibold">
                    {receiptOrder.tableNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold">
                    {receiptOrder.customerName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-semibold capitalize flex items-center gap-1">
                    {getPaymentMethodIcon(receiptOrder.paymentMethod)}
                    {receiptOrder.paymentMethod}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(receiptOrder.total)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleDownloadReceipt}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handlePrintReceipt}
                >
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Addon Selection Modal */}
      <Dialog open={showAddonModal} onOpenChange={closeAddonModal}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Customize Your Order
            </DialogTitle>
          </DialogHeader>

          {selectedItemForAddons && (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4 py-4">
                {/* Item Info */}
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">
                          {selectedItemForAddons.name}
                        </h3>
                        {selectedItemForAddons.isVeg !== undefined && (
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedItemForAddons.isVeg
                              ? "bg-white border-green-600"
                              : "bg-white border-red-600"
                              }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${selectedItemForAddons.isVeg
                                ? "bg-green-600"
                                : "bg-red-600"
                                }`}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedItemForAddons.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        {formatPrice(selectedItemForAddons.price)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Addon Groups */}
                {selectedItemForAddons.addonGroups &&
                  selectedItemForAddons.addonGroups.map((group, groupIndex) => (
                    <div
                      key={groupIndex}
                      className="border rounded-lg p-4 bg-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-base flex items-center gap-2">
                          <Plus className="h-4 w-4 text-primary" />
                          {group.title || "Add-ons"}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {group.multiSelect ? "Multi-select" : "Choose one"}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {group.items &&
                          Array.isArray(group.items) &&
                          group.items.map((addon, addonIndex) => (
                            <label
                              key={addonIndex}
                              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors border border-transparent hover:border-border"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <input
                                  type={
                                    group.multiSelect ? "checkbox" : "radio"
                                  }
                                  name={`addon-group-${groupIndex}`}
                                  checked={isAddonSelected(groupIndex, addon)}
                                  onChange={() =>
                                    toggleAddon(groupIndex, addon)
                                  }
                                  className="w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                                />
                                <span className="text-sm font-medium">
                                  {addon.name}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-primary ml-2">
                                {addon.price > 0
                                  ? `+${formatPrice(addon.price)}`
                                  : "Free"}
                              </span>
                            </label>
                          ))}
                      </div>
                    </div>
                  ))}

                {/* Selected Addons Summary */}
                {getSelectedAddonsCount() > 0 && (
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold">
                        Selected Add-ons ({getSelectedAddonsCount()})
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {Object.values(selectedAddons)
                        .flat()
                        .map((addon, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {addon.name}
                            </span>
                            <span className="font-semibold">
                              {addon.price > 0
                                ? `+${formatPrice(addon.price)}`
                                : "Free"}
                            </span>
                          </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-bold">Total:</span>
                      <span className="text-xl font-bold text-primary">
                        {formatPrice(
                          getItemTotalWithAddons(selectedItemForAddons.price)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t pt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={closeAddonModal}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddToCartWithAddons}
              className="flex-1 gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* KOT History Modal */}
      <Dialog open={!!kotHistoryOrder} onOpenChange={(open) => !open && setKotHistoryOrder(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KOT History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!kotHistoryOrder?.kots || kotHistoryOrder.kots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No KOTs generated yet.
              </div>
            ) : (
              kotHistoryOrder.kots.slice().reverse().map((kot: any) => (
                <div key={kot._id || kot.kotNumber} className="border rounded-lg p-4 flex justify-between items-center bg-card shadow-sm">
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      KOT #{kot.kotNumber}
                      <Badge variant="outline" className="text-xs font-normal">
                        {formatKOTDate(kot.printedAt)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {kot.items.length} Items: {kot.items.slice(0, 2).map((i: any) => i.name).join(", ")}
                      {kot.items.length > 2 && ` +${kot.items.length - 2} more`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleReprintKOT(kotHistoryOrder, kot)}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;