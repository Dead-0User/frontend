import { useState } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Utensils,
  Bell,
  Check,
  Search,
  X,
  ChevronRight,
  Leaf,
  Coffee,
} from "lucide-react";
import { API_BASE_URL } from "@/config";

interface Addon {
  name: string;
  price: number;
}

interface AddonGroup {
  title: string;
  multiSelect: boolean;
  items: Addon[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  isActive: boolean;
  image?: string;
  addonGroups: AddonGroup[];
  sequence: number;
  sectionId: string;
}

interface MenuSection {
  id: string;
  name: string;
  items: MenuItem[];
  sequence: number;
}

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  addons: Addon[];
  isVeg: boolean;
}

interface RestaurantData {
  name: string;
  id: string;
}

interface TableData {
  id: string;
  tableName: string;
  seats: number;
  restaurantId: string;
}

interface TemplateProps {
  loading: boolean;
  restaurantData: RestaurantData | null;
  tableData: TableData | null;
  menuSections: MenuSection[];
  cart: CartItem[];
  customerName: string;
  specialInstructions: string;
  orderPlaced: boolean;
  orderId: string | null;
  orderStatus: string;
  existingOrderId: string | null;
  canUpdateOrder: boolean;
  isPlacingOrder: boolean;
  isUpdatingOrder: boolean;
  isCallingWaiter: boolean;
  waiterCalled: boolean;
  selectedCategory: string;
  showVegOnly: boolean;
  searchQuery: string;
  priceFilter: string;
  showFilters: boolean;
  onAddToCart: (item: MenuItem, selectedAddons: Addon[]) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  onUpdateQuantity: (cartItemId: string, change: number) => void;
  onPlaceOrder: () => Promise<void>;
  onCallWaiter: () => Promise<void>;
  setCustomerName: (name: string) => void;
  setSpecialInstructions: (instructions: string) => void;
  setOrderPlaced: (placed: boolean) => void;
  setOrderId: (id: string | null) => void;
  setOrderStatus: (status: string) => void;
  setSelectedCategory: (category: string) => void;
  setShowVegOnly: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setPriceFilter: (filter: string) => void;
  setShowFilters: (show: boolean) => void;
  getItemTotal: (item: CartItem) => number;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  formatPrice: (price: number) => string;
}

const TemplateDarkCafe = (props: TemplateProps) => {
  const {
    loading,
    restaurantData,
    tableData,
    menuSections,
    cart,
    customerName,
    specialInstructions,
    orderPlaced,
    orderId,
    orderStatus,
    existingOrderId,
    isPlacingOrder,
    isUpdatingOrder,
    isCallingWaiter,
    waiterCalled,
    selectedCategory,
    showVegOnly,
    searchQuery,
    showFilters,
    onAddToCart,
    onRemoveFromCart,
    onUpdateQuantity,
    onPlaceOrder,
    onCallWaiter,
    setCustomerName,
    setSpecialInstructions,
    setOrderPlaced,
    setOrderId,
    setOrderStatus,
    setSelectedCategory,
    setShowVegOnly,
    setSearchQuery,
    setShowFilters,
    getItemTotal,
    getCartTotal,
    getCartItemCount,
    formatPrice,
  } = props;

  const [showCart, setShowCart] = useState<boolean>(false);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-amber-600 text-white";
      case "preparing":
        return "bg-yellow-700 text-white";
      case "ready":
        return "bg-green-700 text-white";
      case "served":
        return "bg-stone-600 text-white";
      case "paid":
        return "bg-emerald-700 text-white";
      case "cancelled":
        return "bg-red-800 text-white";
      default:
        return "bg-amber-600 text-white";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "pending":
        return "Order Received";
      case "preparing":
        return "Preparing Your Order";
      case "ready":
        return "Order Ready";
      case "served":
        return "Served";
      case "paid":
        return "Payment Complete";
      case "cancelled":
        return "Cancelled";
      default:
        return "Processing";
    }
  };

  const getFilteredMenu = (): MenuSection[] => {
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const matchesCategory =
            selectedCategory === "all" ||
            section.name.toLowerCase().includes(selectedCategory.toLowerCase());
          const matchesVeg = !showVegOnly || item.isVeg;
          const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesVeg && matchesSearch;
        }),
      }))
      .filter((section) => section.items.length > 0);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setShowVegOnly(false);
    setSearchQuery("");
  };

  const activeFiltersCount = (): number => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (showVegOnly) count++;
    if (searchQuery) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-900">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-amber-100">Loading Menu...</h2>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    if (["paid", "cancelled"].includes(orderStatus)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-stone-900">
          <div className="max-w-md w-full text-center bg-stone-800 rounded-2xl p-8 border border-amber-900/20 shadow-2xl">
            <CheckCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-amber-100">
              {orderStatus === "paid" ? "Order Completed!" : "Order Cancelled"}
            </h2>
            <p className="text-stone-400 mb-6">
              {orderStatus === "paid"
                ? "Thank you for dining with us!"
                : "This order has been cancelled."}
            </p>

            <button
              onClick={() => {
                setOrderPlaced(false);
                setOrderId(null);
                setOrderStatus("pending");
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Place New Order
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-900">
        <div className="max-w-md w-full text-center bg-stone-800 rounded-2xl p-8 border border-amber-900/20 shadow-2xl">
          <CheckCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-amber-100">
            Order Confirmed!
          </h2>
          <p className="text-stone-400 mb-6">
            Your order has been sent to the kitchen.
          </p>

          <div className="bg-stone-900 rounded-xl p-4 mb-6 border border-amber-900/30">
            <p className="font-bold text-lg mb-1 text-amber-200">
              {restaurantData?.name}
            </p>
            <p className="text-sm text-stone-400 mb-3">
              {tableData?.tableName}
            </p>

            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-sm text-stone-400">Order ID:</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                {orderId?.slice(-8).toUpperCase()}
              </span>
            </div>

            <div
              className={`inline-block ${getStatusColor(
                orderStatus
              )} px-4 py-2 rounded-lg mb-3 font-semibold`}
            >
              {getStatusText(orderStatus)}
            </div>

            <p className="text-xs text-stone-500">
              Status updates automatically
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={onCallWaiter}
              disabled={isCallingWaiter || waiterCalled}
              className="w-full bg-stone-700 hover:bg-stone-600 text-amber-100 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCallingWaiter ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calling...
                </>
              ) : waiterCalled ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Waiter Notified!
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Call Waiter
                </>
              )}
            </button>

            <button
              onClick={() => setOrderPlaced(false)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Place Another Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredMenu = getFilteredMenu();

  return (
    <div className="theme-dark-cafe min-h-screen pb-32 bg-background">
      <div className="sticky top-0 z-50 bg-stone-900/95 backdrop-blur border-b border-amber-900/20 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-600 to-yellow-700 p-3 rounded-xl shadow-lg">
                <Coffee className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-amber-100">
                  {restaurantData?.name}
                </h1>
                <p className="text-sm text-stone-400">{tableData?.tableName}</p>
              </div>
            </div>
            <button
              onClick={onCallWaiter}
              disabled={isCallingWaiter || waiterCalled}
              className={`${waiterCalled
                  ? "bg-green-700 text-white"
                  : "bg-stone-800 text-amber-100 hover:bg-stone-700"
                } px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {isCallingWaiter ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : waiterCalled ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Called
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Call
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {existingOrderId &&
          !orderPlaced &&
          !["paid", "cancelled"].includes(orderStatus) && (
            <div className="mb-4 bg-stone-800 border border-amber-600/30 rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-semibold text-amber-100">Active Order</p>
                    <p className="text-sm text-stone-400">
                      #{existingOrderId?.slice(-8).toUpperCase()}
                    </p>
                    <div
                      className={`inline-block ${getStatusColor(
                        orderStatus
                      )} text-xs mt-1 px-2 py-1 rounded`}
                    >
                      {getStatusText(orderStatus)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCart(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setOrderPlaced(true)}
                    className="bg-stone-700 hover:bg-stone-600 text-amber-100 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          )}

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-600" />
            <input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-stone-800 border border-stone-700 rounded-xl text-amber-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setShowVegOnly(!showVegOnly)}
            className={`${showVegOnly
                ? "bg-green-700 text-white"
                : "bg-stone-800 text-amber-100 hover:bg-stone-700"
              } px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap flex items-center gap-2`}
          >
            <Leaf className="h-4 w-4" />
            Veg Only
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`${showFilters
                ? "bg-amber-600 text-white"
                : "bg-stone-800 text-amber-100 hover:bg-stone-700"
              } px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap`}
          >
            Filters
            {activeFiltersCount() > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount()}
              </span>
            )}
          </button>

          {activeFiltersCount() > 0 && (
            <button
              onClick={clearFilters}
              className="bg-stone-800 text-amber-100 hover:bg-stone-700 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        <div className="flex overflow-x-auto gap-2 pb-3 mb-6">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`${selectedCategory === "all"
                ? "bg-amber-600 text-white"
                : "bg-stone-800 text-amber-100 hover:bg-stone-700"
              } px-5 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap`}
          >
            All Items
          </button>
          {menuSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedCategory(section.name.toLowerCase())}
              className={`${selectedCategory === section.name.toLowerCase()
                  ? "bg-amber-600 text-white"
                  : "bg-stone-800 text-amber-100 hover:bg-stone-700"
                } px-5 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap`}
            >
              {section.name}
            </button>
          ))}
        </div>

        {filteredMenu.length === 0 ? (
          <div className="text-center py-12 bg-stone-800 rounded-xl border border-stone-700">
            <Utensils className="h-12 w-12 text-stone-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2 text-amber-100">
              No items found
            </h3>
            <p className="text-sm text-stone-400 mb-4">
              Try adjusting your filters
            </p>
            {activeFiltersCount() > 0 && (
              <button
                onClick={clearFilters}
                className="bg-stone-700 hover:bg-stone-600 text-amber-100 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredMenu.map((section) => (
              <div key={section.id}>
                <h2 className="text-2xl font-bold mb-4 text-amber-100 border-b border-amber-900/30 pb-2">
                  {section.name}
                </h2>

                <div className="space-y-4">
                  {section.items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onAddToCart={onAddToCart}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <button
            onClick={() => setShowCart(true)}
            className="w-full h-16 bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white rounded-2xl font-bold text-lg transition-all shadow-2xl flex items-center justify-between px-6"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6" />
              <span>View Cart ({getCartItemCount()})</span>
            </div>
            <span className="text-xl">{formatPrice(getCartTotal())}</span>
          </button>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end md:items-center md:justify-center">
          <div className="w-full h-full md:max-w-2xl md:h-auto bg-stone-900 md:rounded-2xl flex flex-col md:max-h-[90vh]">
            <div className="px-6 pt-6 pb-4 border-b border-stone-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6 text-amber-500" />
                  <h2 className="text-2xl font-bold text-amber-100">
                    Your Order
                  </h2>
                  <span className="bg-amber-600 text-white text-sm px-3 py-1 rounded-full font-bold">
                    {getCartItemCount()}
                  </span>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-stone-800 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-stone-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  Your cart is empty
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-stone-800 rounded-xl p-4 border border-stone-700"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-amber-100">
                            {item.name}
                          </h4>
                          <p className="text-sm text-amber-500 font-semibold">
                            {formatPrice(item.price)} each
                          </p>
                          {item.addons.length > 0 && (
                            <div className="space-y-0.5 mt-2">
                              {item.addons.map((addon, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-stone-400"
                                >
                                  + {addon.name}{" "}
                                  {addon.price > 0 &&
                                    `(+${formatPrice(addon.price)})`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => onRemoveFromCart(item.id)}
                          className="p-2 hover:bg-stone-700 rounded-lg transition-colors"
                        >
                          <X className="h-5 w-5 text-stone-400" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="w-9 h-9 bg-stone-700 hover:bg-stone-600 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-4 w-4 text-amber-100" />
                          </button>
                          <span className="w-10 text-center font-bold text-amber-100">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-9 h-9 bg-stone-700 hover:bg-stone-600 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-4 w-4 text-amber-100" />
                          </button>
                        </div>
                        <p className="font-bold text-amber-500 text-lg">
                          {formatPrice(getItemTotal(item))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-stone-700 px-6 py-4 space-y-3 bg-stone-900">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-amber-100">
                    Your Name (Optional)
                  </label>
                  <input
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-amber-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-amber-100">
                    Special Instructions
                  </label>
                  <textarea
                    placeholder="Any special requests..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-amber-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent resize-none"
                  />
                </div>

                <div className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-amber-100">Total:</span>
                    <span className="text-3xl font-bold text-amber-500">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>

                  <button
                    onClick={onPlaceOrder}
                    disabled={isPlacingOrder || isUpdatingOrder}
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isPlacingOrder || isUpdatingOrder ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        {existingOrderId &&
                          !["paid", "cancelled"].includes(orderStatus)
                          ? "Update Order"
                          : "Place Order"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, selectedAddons: Addon[]) => void;
  formatPrice: (price: number) => string;
}

const MenuItemCard = ({
  item,
  onAddToCart,
  formatPrice,
}: MenuItemCardProps) => {
  const [selectedAddons, setSelectedAddons] = useState<Record<number, Addon[]>>(
    {}
  );
  const [showAddons, setShowAddons] = useState<boolean>(false);

  const hasAddonGroups = item.addonGroups?.length > 0;

  const toggleAddon = (groupIndex: number, addon: Addon) => {
    const group = item.addonGroups[groupIndex];

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
            [groupIndex]: [...currentGroupAddons, addon],
          };
        }
      } else {
        const isSame = currentGroupAddons[0]?.name === addon.name;
        return {
          ...prev,
          [groupIndex]: isSame ? [] : [addon],
        };
      }
    });
  };

  const isAddonSelected = (groupIndex: number, addon: Addon): boolean => {
    const groupAddons = selectedAddons[groupIndex] || [];
    return groupAddons.some((a) => a.name === addon.name);
  };

  const handleAddToCart = () => {
    const allSelectedAddons = Object.values(selectedAddons).flat();
    onAddToCart(item, allSelectedAddons);
    setSelectedAddons({});
    setShowAddons(false);
  };

  const getItemTotalWithAddons = (): number => {
    const allSelectedAddons = Object.values(selectedAddons).flat();
    const addonsTotal = allSelectedAddons.reduce(
      (sum, addon) => sum + (addon.price || 0),
      0
    );
    return item.price + addonsTotal;
  };

  const getSelectedAddonsCount = (): number => {
    return Object.values(selectedAddons).flat().length;
  };

  return (
    <div className="bg-stone-800 rounded-xl overflow-hidden border border-stone-700 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex flex-col">
        <div className="w-full h-48 relative">
          {item.image ? (
            <img
              src={`${API_BASE_URL}${item.image}`}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-700">
              <Utensils className="h-12 w-12 text-stone-600" />
            </div>
          )}
          <div
            className={`absolute top-3 left-3 w-7 h-7 rounded-lg border-3 flex items-center justify-center ${item.isVeg
                ? "bg-white border-green-600"
                : "bg-white border-red-600"
              }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"
                }`}
            />
          </div>
          <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-600 to-yellow-700 px-3 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-bold text-white">
              {formatPrice(item.price)}
            </p>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 text-amber-100">{item.name}</h3>
          <p className="text-sm text-stone-400 mb-4 line-clamp-2">
            {item.description}
          </p>

          <div className="space-y-2">
            {hasAddonGroups && (
              <button
                onClick={() => setShowAddons(!showAddons)}
                className="w-full bg-stone-700 hover:bg-stone-600 text-amber-100 py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-between"
              >
                <span>{showAddons ? "Hide Options" : "Customize"}</span>
                <div className="flex items-center gap-2">
                  {getSelectedAddonsCount() > 0 && (
                    <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
                      {getSelectedAddonsCount()}
                    </span>
                  )}
                  <ChevronRight
                    className={`h-5 w-5 transition-transform ${showAddons ? "rotate-90" : ""
                      }`}
                  />
                </div>
              </button>
            )}
            <button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white py-3 px-4 rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add • {formatPrice(getItemTotalWithAddons())}
            </button>
          </div>

          {showAddons && hasAddonGroups && (
            <div className="mt-4 space-y-3">
              {item.addonGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="p-3 bg-stone-900 rounded-lg border border-stone-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-amber-100">
                      {group.title}
                    </h4>
                    <span className="text-xs bg-stone-700 text-amber-100 px-3 py-1 rounded-full">
                      {group.multiSelect ? "Multi-select" : "Choose one"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((addon, addonIndex) => (
                      <label
                        key={addonIndex}
                        className="flex items-center justify-between cursor-pointer hover:bg-stone-800 p-3 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type={group.multiSelect ? "checkbox" : "radio"}
                            name={`addon-group-${groupIndex}`}
                            checked={isAddonSelected(groupIndex, addon)}
                            onChange={() => toggleAddon(groupIndex, addon)}
                            className="w-5 h-5 accent-amber-600"
                          />
                          <span className="text-sm text-amber-100">
                            {addon.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-amber-500">
                          {addon.price > 0
                            ? `+${formatPrice(addon.price)}`
                            : "Free"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateDarkCafe;
