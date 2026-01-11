import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LogOut,
  DollarSign,
  CreditCard,
  Banknote,
  Search,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Smartphone as UpiIcon,
  Sun,
  Moon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "next-themes";
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
  paymentMethod?: "upi" | "card" | "cash";
  paymentCompletedAt?: string;
}

const CashierPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { theme, setTheme } = useTheme();
  const [staffData, setStaffData] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("staffData");
    const token = localStorage.getItem("staffToken");

    if (!data || !token) {
      navigate("/staff/cashier/login");
      return;
    }

    const parsedData = JSON.parse(data);
    console.log("Staff data loaded:", parsedData);
    setStaffData(parsedData);

    // Initial fetch
    fetchOrders(token);

    // Set up polling every 10 seconds
    const interval = setInterval(() => {
      fetchOrders(token, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchOrders = useCallback(
    async (token: string, silent = false) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        // Fetch served orders (ready for payment) and paid orders
        const servedResponse = await axios.get(
          `${API_BASE}/orders/restaurant?status=served&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const paidResponse = await axios.get(
          `${API_BASE}/orders/restaurant?status=paid&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const allOrders = [
          ...(servedResponse.data.success ? servedResponse.data.data : []),
          ...(paidResponse.data.success ? paidResponse.data.data : []),
        ];

        console.log("Orders fetched:", allOrders);
        setOrders(allOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        if (!silent) {
          toast({
            title: "Error",
            description: "Failed to fetch orders",
            variant: "destructive",
          });
        }

        // If unauthorized, redirect to login
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem("staffToken");
          localStorage.removeItem("staffData");
          navigate("/staff/cashier/login");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast, navigate]
  );

  const handleRefresh = () => {
    const token = localStorage.getItem("staffToken");
    if (token) {
      fetchOrders(token);
      toast({
        description: "Orders refreshed",
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
    navigate("/staff/cashier/login");
  };

  const handleOpenPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handlePayment = async (method: "upi" | "card" | "cash") => {
    if (!selectedOrder) return;

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
      setProcessingPayment(true);

      const response = await axios.patch(
        `${API_BASE}/orders/${selectedOrder._id}/payment`,
        { paymentMethod: method },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setShowPaymentModal(false);
        setSelectedOrder(null);

        toast({
          title: "Payment processed",
          description: `Payment for Table ${selectedOrder.tableId.tableName} completed via ${method}`,
        });

        // Refresh orders
        fetchOrders(token, true);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage =
        (axios.isAxiosError(error) && error.response?.data?.message) ||
        "Failed to process payment";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.tableId.tableName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingPayments = filteredOrders.filter((o) => o.status === "served");
  const completedPayments = filteredOrders.filter((o) => o.status === "paid");

  const totalRevenue = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.totalPrice, 0);
  const pendingAmount = orders
    .filter((o) => o.status === "served")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const created = new Date(dateString).getTime();
    const elapsedSeconds = Math.floor((now - created) / 1000);

    if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
    const elapsedHours = Math.floor(elapsedMinutes / 60);
    return `${elapsedHours}h ${elapsedMinutes % 60}m ago`;
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case "upi":
        return <UpiIcon className="h-3 w-3" />;
      case "card":
        return <CreditCard className="h-3 w-3" />;
      case "cash":
        return <Banknote className="h-3 w-3" />;
      default:
        return null;
    }
  };

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
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Cashier Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {staffData.fullName || staffData.username}
                </p>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Loading payments...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Cashier Dashboard</h1>
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
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(totalRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatPrice(pendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingPayments.length} tables
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedPayments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by table number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Pending Payments */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-orange-600">
            Pending Payments ({pendingPayments.length})
          </h2>
          {pendingPayments.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No pending payments
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingPayments.map((order) => (
                <Card
                  key={order._id}
                  className="border-l-4 border-l-orange-500"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Table {order.tableId.tableName}
                      </CardTitle>
                      <Badge
                        className="bg-orange-500/10 text-orange-700 border-orange-200"
                        variant="outline"
                      >
                        Pending
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.filter((item) => !item.isRemoved).length}{" "}
                      items • {getTimeAgo(order.createdAt)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <span className="text-muted-foreground">
                        Total Amount
                      </span>
                      <span className="text-2xl font-bold">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenPaymentModal(order)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Process Payment
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Payments */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-green-600">
            Completed Payments ({completedPayments.length})
          </h2>
          {completedPayments.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No completed payments yet
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedPayments.map((order) => (
                <Card key={order._id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Table {order.tableId.tableName}
                      </CardTitle>
                      <Badge
                        className="bg-green-500/10 text-green-700 border-green-200"
                        variant="outline"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Paid
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.filter((item) => !item.isRemoved).length}{" "}
                      items •{" "}
                      {getTimeAgo(order.paymentCompletedAt || order.updatedAt)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="text-xl font-bold">
                        {formatPrice(order.totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Method</span>
                      <span className="flex items-center gap-1 font-medium capitalize">
                        {getPaymentMethodIcon(order.paymentMethod)}
                        {order.paymentMethod}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="h-5 w-5" />
              Select Payment Method
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {selectedOrder && (
              <>
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        Table {selectedOrder.tableId.tableName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {
                          selectedOrder.items.filter((item) => !item.isRemoved)
                            .length
                        }{" "}
                        items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(selectedOrder.totalPrice)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-20 flex items-center justify-start gap-4 hover:bg-blue-50 hover:border-blue-500 transition-all"
                  onClick={() => handlePayment("upi")}
                  disabled={processingPayment}
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
                  onClick={() => handlePayment("card")}
                  disabled={processingPayment}
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
                  onClick={() => handlePayment("cash")}
                  disabled={processingPayment}
                >
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Banknote className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base">Cash Payment</p>
                    <p className="text-xs text-muted-foreground">
                      Pay with cash
                    </p>
                  </div>
                </Button>
              </>
            )}
          </div>

          {processingPayment && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Processing payment...
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashierPage;
