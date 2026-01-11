import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, ChefHat, Clock, CheckCircle2, RefreshCw, Sparkles, CheckSquare, Square, Sun, Moon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

import { API_BASE_URL } from "@/config";
const API_BASE = `${API_BASE_URL}/api`;

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
  isNew?: boolean;
  isRemoved?: boolean;
  status?: "pending" | "preparing" | "ready" | "served" | "cancelled";
  _id?: string;
  addons?: any[];
}

interface UpdateHistoryEntry {
  timestamp: string;
  changeType: string;
  itemName: string;
  oldQuantity?: number;
  newQuantity?: number;
  changedBy?: string;
  details?: string;
}

interface Order {
  _id: string;
  tableId: {
    _id: string;
    tableName: string;
    seats?: number;
  };
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled";
  createdAt: string;
  updatedAt: string;
  totalPrice: number;
  customerName?: string;
  orderType: "qr" | "staff";
  isUpdated?: boolean;
  hasUnseenChanges?: boolean;
  updateHistory?: UpdateHistoryEntry[];
  originalItems?: OrderItem[];
  batchStatus?: Record<string, string>;
  rawOrder?: Record<string, unknown>;
}

interface ChefOrderCard {
  id: string;
  orderId: string;
  tableId: {
    _id: string;
    tableName: string;
    seats?: number;
  };
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "served" | "paid" | "cancelled";
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  orderType: "qr" | "staff";
  hasNewItems?: boolean;
  onBulkUpdate?: (orderId: string, itemIds: string[], newStatus: string) => void;
}

const ChefPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [staffData, setStaffData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    const token = localStorage.getItem("staffToken");

    if (!data || !token) {
      navigate("/staff/chef/login");
      return;
    }

    const parsedData = JSON.parse(data);
    setStaffData(parsedData);

    fetchOrders(token);

    const interval = setInterval(() => {
      fetchOrders(token, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchOrders = async (token: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      // FIX: Fetch ALL active orders (pending, preparing, ready) in one request
      // This ensures we get orders even when individual item statuses change
      // but the overall order status hasn't changed yet
      const response = await axios.get(
        `${API_BASE}/orders/restaurant?status=pending,preparing,ready&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const allOrders = response.data.success ? response.data.data : [];

      console.log('📦 Fetched orders:', allOrders.length);
      console.log('Orders data:', allOrders);
      console.log('📊 Order items by status:', allOrders.map(o => ({
        orderId: o._id,
        table: o.tableId?.tableName,
        items: o.items.map(i => ({ name: i.name, status: i.status || 'pending', _id: i._id }))
      })));

      setOrders(allOrders);

      console.log('✅ Orders state updated');
    } catch (error) {
      console.error("Error fetching orders:", error);

      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to fetch orders. Please login again.",
          variant: "destructive",
        });

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem("staffToken");
          localStorage.removeItem("staffData");
          navigate("/staff/chef/login");
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    const token = localStorage.getItem("staffToken");
    if (token) {
      fetchOrders(token);
      toast({
        title: "Refreshed",
        description: "Orders list updated",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffData");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/staff/chef/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-500/10 text-orange-700 border-orange-200";
      case "preparing":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "ready":
        return "bg-green-500/10 text-green-700 border-green-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const now = new Date().getTime();
    const created = new Date(createdAt).getTime();
    const elapsedSeconds = Math.floor((now - created) / 1000);

    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    return `${elapsedHours}h ${elapsedMinutes % 60}m ago`;
  };

  // FIX: Update item status - handle items without _id by using bulk update with all matching items
  const handleUpdateItemStatus = async (
    orderId: string,
    item: OrderItem,
    newStatus: string
  ) => {
    const token = localStorage.getItem("staffToken");
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the full order to get all items
      const order = orders.find(o => o._id === orderId);
      if (!order) return;

      // Helper to normalize addons for comparison
      const normalizeAddons = (addons: any[] | undefined) =>
        JSON.stringify(addons || []);

      const normalizeStatus = (status: string | undefined) =>
        status || "pending";

      console.log('=== UPDATE ITEM STATUS DEBUG ===');
      console.log('Item to update:', item);
      console.log('Order items:', order.items);

      // Find all items with the same name, addons, and status (grouped items)
      const matchingItems = order.items.filter(i =>
        i.name === item.name &&
        normalizeAddons(i.addons) === normalizeAddons(item.addons) &&
        normalizeStatus(i.status) === normalizeStatus(item.status) &&
        !i.isRemoved
      );

      console.log('Matching items found:', matchingItems.length);
      console.log('Matching items:', matchingItems);

      // Get all IDs that exist
      const itemIds = matchingItems
        .filter(i => i._id)
        .map(i => i._id!);

      console.log('Item IDs to update:', itemIds);

      // VALIDATION: Check if we have any valid IDs
      if (itemIds.length === 0) {
        console.error('⚠️ No item IDs found! Items may not be synced yet.');
        console.log('Matching items without IDs:', matchingItems.filter(i => !i._id));

        toast({
          title: "Items not ready",
          description: "Please wait a moment for the order to sync, then try again",
          variant: "default",
        });

        // Trigger a refresh to get the latest data
        await fetchOrders(token, true);
        return;
      }

      // VALIDATION: Check if all matching items have IDs
      if (itemIds.length < matchingItems.length) {
        console.warn(`⚠️ Only ${itemIds.length} of ${matchingItems.length} matching items have IDs`);
        console.log('Items without IDs:', matchingItems.filter(i => !i._id));

        toast({
          title: "Partial update",
          description: `Updating ${itemIds.length} of ${matchingItems.length} items (some still syncing)`,
          variant: "default",
        });
      }

      console.log(`Updating ${itemIds.length} item(s) to status: ${newStatus}`);

      // Use bulk update for all matching items
      const response = await axios.patch(
        `${API_BASE}/orders/${orderId}/items/bulk-status`,
        { itemIds, status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        console.log('✓ Update successful:', response.data);

        // Check if backend reported any issues
        if (response.data.debug?.notFoundCount > 0) {
          console.warn('⚠️ Backend could not find some items:', response.data.debug.notFoundIds);
          toast({
            title: "Partial update",
            description: response.data.message,
            variant: "default",
          });
        } else {
          toast({
            title: "Item updated",
            description: `${matchingItems.length > 1 ? matchingItems.length + ' items' : 'Item'} marked as ${newStatus}`,
          });
        }

        // Refresh orders to get updated state
        console.log('🔄 Scheduling order refresh in 300ms...');
        setTimeout(async () => {
          console.log('🔄 Fetching updated orders NOW...');
          await fetchOrders(token, false);
          console.log('✅ Orders refreshed, new state should be visible');
        }, 300);
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      const errorMessage =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        "Failed to update item status";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const splitOrdersByStatus = (ordersList: Order[]): ChefOrderCard[] => {
    console.log('\n🔀 SPLITTING ORDERS BY STATUS');
    console.log('📋 Total orders to split:', ordersList.length);

    const chefCards: ChefOrderCard[] = [];

    ordersList.forEach((order) => {
      console.log(`\n📦 Processing order ${order._id} (Table ${order.tableId?.tableName})`);
      console.log('  Items:', order.items.map(i => ({ name: i.name, status: i.status || 'pending', isRemoved: i.isRemoved })));

      const pendingItems = order.items.filter(
        (i) => !i.isRemoved && (!i.status || i.status === "pending")
      );
      const preparingItems = order.items.filter(
        (i) => !i.isRemoved && i.status === "preparing"
      );
      const readyItems = order.items.filter(
        (i) => !i.isRemoved && i.status === "ready"
      );

      console.log(`  ✅ Split result: ${pendingItems.length} pending, ${preparingItems.length} preparing, ${readyItems.length} ready`);

      const createCard = (
        items: OrderItem[],
        status: ChefOrderCard["status"]
      ) => {
        if (items.length === 0) return;

        // Check if any items are marked as new
        const hasNewItems = items.some(item => item.isNew);

        chefCards.push({
          id: `${order._id}-${status}`,
          orderId: order._id,
          tableId: order.tableId,
          items: items,
          status: status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          customerName: order.customerName,
          orderType: order.orderType,
          hasNewItems,
        });
      };

      createCard(pendingItems, "pending");
      createCard(preparingItems, "preparing");
      createCard(readyItems, "ready");
    });

    return chefCards;
  };

  const chefOrderCards = splitOrdersByStatus(orders);

  const pendingOrders = chefOrderCards.filter((o) => o.status === "pending");
  const preparingOrders = chefOrderCards.filter(
    (o) => o.status === "preparing"
  );
  const readyOrders = chefOrderCards.filter((o) => o.status === "ready");

  if (!staffData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  // Sub-component for individual Order Card to handle selection state
  const ChefOrderCardItem = ({
    orderCard,
    onUpdateStatus,
  }: {
    orderCard: ChefOrderCard;
    onUpdateStatus: (orderId: string, item: OrderItem, newStatus: string) => void;
    // We can add a bulk update prop here if we want to bubble up, or handle it locally if we pass the updater
    // But wait, the updater `handleUpdateItemStatus` takes a single item.
    // We need a bulk updater that takes a list of IDs.
    // For now, let's pass a bulk updater prop or modify the parent to expose one.
    // Let's modify the parent to expose a generic updater.
  }) => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const { toast } = useToast();

    const allItemIds = orderCard.items
      .filter(i => i._id && !i.isRemoved) // ensuring we only select valid actionable items
      .map(i => i._id!);

    const isAllSelected = allItemIds.length > 0 && selectedItems.length === allItemIds.length;
    const isSomeSelected = selectedItems.length > 0 && selectedItems.length < allItemIds.length;

    const toggleSelectAll = () => {
      if (isAllSelected) {
        setSelectedItems([]);
      } else {
        setSelectedItems(allItemIds);
      }
    };

    const toggleItem = (itemId: string) => {
      if (selectedItems.includes(itemId)) {
        setSelectedItems(prev => prev.filter(id => id !== itemId));
      } else {
        setSelectedItems(prev => [...prev, itemId]);
      }
    };

    // Determine next status based on current column
    const nextStatus =
      orderCard.status === "pending"
        ? "preparing"
        : orderCard.status === "preparing"
          ? "ready"
          : null;



    return (
      <Card
        className={`border-l-4 ${orderCard.status === "pending"
          ? orderCard.hasNewItems
            ? "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
            : "border-l-orange-500"
          : orderCard.status === "preparing"
            ? "border-l-blue-500"
            : "border-l-green-500"
          }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="flex items-center gap-2">
                {nextStatus && (
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    className="mr-1"
                  />
                )}
                Table {orderCard.tableId.tableName}
              </div>
              {orderCard.hasNewItems && (
                <Badge className="bg-amber-500 text-white text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Updated
                </Badge>
              )}
              {orderCard.status !== "pending" && (
                <Badge
                  variant="outline"
                  className={
                    orderCard.status === "preparing"
                      ? "bg-blue-500/10 text-blue-700 border-blue-200"
                      : "bg-green-500/10 text-green-700 border-green-200"
                  }
                >
                  {orderCard.status}
                </Badge>
              )}
            </CardTitle>

            {selectedItems.length > 0 && nextStatus && (
              <Button
                size="sm"
                className={
                  nextStatus === "preparing"
                    ? "bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs"
                    : "bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                }
                onClick={() => {
                  if (orderCard.onBulkUpdate) {
                    orderCard.onBulkUpdate(orderCard.orderId, selectedItems, nextStatus);
                    setSelectedItems([]);
                  }
                }}
              >
                {nextStatus === "preparing" ? "Start Selected" : "Mark Ready"} ({selectedItems.length})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-7">
            <Clock className="h-3 w-3" />
            {/* Note: getTimeElapsed is defined in formatted component, we might need to pass it or duplicate it. 
              Ideally pass it as utility or defined outside.
              For now, I'll assume `getTimeElapsed` is available in scope if I defined this inside `ChefPage`.
              If I define it outside, I need to pass it.
              I will define this component INSIDE `ChefPage` function or pass the helper. 
              Actually, I should define it OUTSIDE and pass helper or duplicate. 
              Let's define it separate and duplicate the simple time helper or move it out.
          */}
            <span>{new Date(orderCard.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            {orderCard.orderType === "qr" && (
              <Badge variant="outline" className="text-xs">
                QR
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {orderCard.items.map((item, idx) => (
              <div
                key={idx}
                className={`text-sm flex items-start justify-between gap-2 p-2 rounded ${item.isNew
                  ? "bg-green-100 dark:bg-green-950/30 border-l-2 border-green-500"
                  : ""
                  }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  {nextStatus && item._id && (
                    <Checkbox
                      checked={selectedItems.includes(item._id)}
                      onCheckedChange={() => toggleItem(item._id!)}
                      className="mt-1"
                    />
                  )}
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <span className={orderCard.status === "pending" ? "text-orange-600" : ""}>
                        {item.quantity}x {item.name}
                      </span>

                      {item.isNew && (
                        <Badge className="bg-green-500 text-white text-xs px-1.5 py-0">
                          NEW
                        </Badge>
                      )}
                    </div>
                    {item.specialInstructions && (
                      <div className="text-muted-foreground italic text-xs mt-1">
                        Note: {item.specialInstructions}
                      </div>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 space-y-1">
                        {Object.entries(
                          item.addons.reduce<Record<string, string[]>>((acc, addon: any) => {
                            const group = (typeof addon === 'object' && addon.group) ? addon.group : 'Add-ons';
                            const name = (typeof addon === 'object' && addon.name) ? addon.name : String(addon);

                            if (!acc[group]) acc[group] = [];
                            acc[group].push(name);
                            return acc;
                          }, {})
                        ).map(([group, names]) => (
                          <div key={group} className="mt-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block mb-0.5">
                              {group}:
                            </span>
                            <div className="pl-2 border-l-2 border-muted-foreground/20 space-y-0.5">
                              {(names as string[]).map((name, idx) => (
                                <span key={idx} className="block text-sm text-foreground">
                                  {name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {nextStatus && (
                  <Button
                    size="sm"
                    variant="outline"
                    className={`h-7 text-xs flex-shrink-0 ${nextStatus === "preparing"
                      ? "border-orange-200 hover:bg-orange-50 text-orange-700"
                      : "border-green-200 hover:bg-green-50 text-green-700"
                      }`}
                    onClick={() => onUpdateStatus(orderCard.orderId, item, nextStatus)}
                  >
                    {nextStatus === "preparing" ? "Prepare" : "Ready"}
                  </Button>
                )}
              </div>
            ))}
          </div>
          {orderCard.status === 'ready' && (
            <div className="text-sm text-green-600 font-medium text-center py-2">
              Waiting for pickup
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ... inside ChefPage ...

  // New Bulk Update Handler
  const handleBulkUpdate = async (orderId: string, itemIds: string[], newStatus: string) => {
    const token = localStorage.getItem("staffToken");
    if (!token) return;

    try {
      const response = await axios.patch(
        `${API_BASE}/orders/${orderId}/items/bulk-status`,
        { itemIds, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast({
          title: "Updated",
          description: `${itemIds.length} items updated to ${newStatus}`,
        });
        // Fast refresh
        setTimeout(() => fetchOrders(token, false), 300);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update items",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ChefHat className="h-6 w-6" />
                Kitchen Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {staffData.fullName || staffData.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {staffData.restaurantName}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
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

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingOrders.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Preparing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {preparingOrders.length}
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
              <div className="text-2xl font-bold text-green-600">
                {readyOrders.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-orange-600">
              Pending ({pendingOrders.length})
            </h2>
            {pendingOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No pending orders
              </Card>
            ) : (
              pendingOrders.map((orderCard) => (
                <ChefOrderCardItem
                  key={orderCard.id}
                  orderCard={{ ...orderCard, onBulkUpdate: handleBulkUpdate }}
                  onUpdateStatus={handleUpdateItemStatus}
                />
              ))
            )}
          </div>

          {/* Preparing Orders */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-blue-600">
              Preparing ({preparingOrders.length})
            </h2>
            {preparingOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No orders being prepared
              </Card>
            ) : (
              preparingOrders.map((orderCard) => (
                <ChefOrderCardItem
                  key={orderCard.id}
                  orderCard={{ ...orderCard, onBulkUpdate: handleBulkUpdate }}
                  onUpdateStatus={handleUpdateItemStatus}
                />
              ))
            )}
          </div>

          {/* Ready Orders */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-green-600">
              Ready to Serve ({readyOrders.length})
            </h2>
            {readyOrders.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No orders ready
              </Card>
            ) : (
              readyOrders.map((orderCard) => (
                <ChefOrderCardItem
                  key={orderCard.id}
                  orderCard={orderCard}
                  onUpdateStatus={handleUpdateItemStatus}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChefPage;