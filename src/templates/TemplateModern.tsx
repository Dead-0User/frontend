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
  SlidersHorizontal,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/config";

interface Addon {
  name: string;
  price: number;
  maxQuantity?: number;
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
  committedQuantity?: number;
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
  allowOrdering?: boolean;
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
  dietaryFilter: 'all' | 'veg' | 'non-veg';
  setDietaryFilter: (filter: 'all' | 'veg' | 'non-veg') => void;
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
    // setShowVegOnly, // Deprecated
    dietaryFilter,
    setDietaryFilter,
    setSearchQuery,
    setShowFilters,
    getItemTotal,
    getCartTotal,
    getCartItemCount,
    formatPrice,
    priceFilter,
    setPriceFilter,
  } = props;

  const [showCart, setShowCart] = useState<boolean>(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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

          let matchesVeg = true;
          if (dietaryFilter === 'veg') matchesVeg = item.isVeg;
          if (dietaryFilter === 'non-veg') matchesVeg = !item.isVeg;

          const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase());

          let matchesPrice = true;
          // if (priceFilter === "low") matchesPrice = item.price <= 250;
          // if (priceFilter === "medium") matchesPrice = item.price > 250 && item.price <= 500;
          // if (priceFilter === "high") matchesPrice = item.price > 500;

          return matchesCategory && matchesVeg && matchesSearch && matchesPrice;
        }),
      }))
      .filter((section) => section.items.length > 0);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setDietaryFilter("all"); // Reset to all
    setSearchQuery("");
  };

  const activeFiltersCount = (): number => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (dietaryFilter !== "all") count++;
    if (searchQuery) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-stone-950 flex justify-center">
        <div className="w-full max-w-[400px] h-full relative bg-stone-900 shadow-2xl flex flex-col items-center justify-center border-x border-stone-800">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-100">Loading Menu...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    if (["paid", "cancelled"].includes(orderStatus)) {
      return (
        <div className="fixed inset-0 bg-stone-950 flex justify-center">
          <div className="w-full max-w-[400px] h-full relative bg-stone-900 shadow-2xl flex flex-col items-center justify-center p-4 border-x border-stone-800">
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
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-stone-950 flex justify-center">
        <div className="w-full max-w-[400px] h-full relative bg-stone-900 shadow-2xl flex flex-col items-center justify-center p-4 border-x border-stone-800">
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
      </div>
    );
  }

  const filteredMenu = getFilteredMenu();

  return (
    <div className="fixed inset-0 bg-stone-950 flex justify-center">
      <div className="w-full max-w-[400px] h-full relative bg-stone-950 flex flex-col overflow-hidden border-x border-stone-800">
        <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
          <div className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur border-b border-amber-900/20 shadow-lg">
            <div className="px-4 py-4">
              {/* Top Bar: Brand & Table */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-600 p-2 rounded-lg">
                    <Utensils className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">{tableData?.tableName}</p>
                  </div>
                </div>

                <button
                  onClick={onCallWaiter}
                  disabled={isCallingWaiter || waiterCalled}
                  className={`${waiterCalled
                    ? "bg-green-700 text-white"
                    : "bg-stone-800 text-amber-100 hover:bg-stone-700"
                    } px-3 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
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
                      Call Waiter
                    </>
                  )}
                </button>
              </div>

              {/* Controls Row: Search & Filters */}
              {showSearch ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search dishes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-amber-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-600"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="p-2 text-stone-400 hover:text-amber-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <div className="flex items-center justify-between">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full border border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700 flex items-center justify-center cursor-pointer transition-colors"
                    onClick={() => setShowCategoryMenu(true)}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.button>

                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${searchQuery
                        ? "border-amber-600 bg-amber-600 text-white"
                        : "border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700"
                        }`}
                      onClick={() => setShowSearch(true)}
                    >
                      <Search className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${dietaryFilter !== "all" || priceFilter !== "all"
                        ? "border-amber-600 bg-amber-600 text-white"
                        : "border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700"
                        }`}
                      onClick={() => setShowFilters(true)}
                    >
                      <SlidersHorizontal className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              )}
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

            {/* Removed Messy Filters and Category Lists */}

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
                          allowOrdering={tableData?.allowOrdering !== false}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && tableData?.allowOrdering !== false && (
            <div className="absolute bottom-4 left-4 right-4 z-50">
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
            <div className="absolute inset-0 bg-black/80 z-50 flex items-end md:items-center md:justify-center">
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
                              onClick={() => {
                                if (!item.committedQuantity || item.committedQuantity === 0) {
                                  onRemoveFromCart(item.id);
                                }
                              }}
                              disabled={!!item.committedQuantity && item.committedQuantity > 0}
                              className="p-2 hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <X className="h-5 w-5 text-stone-400" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (item.quantity > (item.committedQuantity || 0)) {
                                    onUpdateQuantity(item.id, -1);
                                  }
                                }}
                                disabled={item.quantity <= (item.committedQuantity || 0)}
                                className="w-9 h-9 bg-stone-700 hover:bg-stone-600 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
      </div>

      {/* Category Menu Modal */}
      <AnimatePresence>
        {showCategoryMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 md:p-0"
            onClick={() => setShowCategoryMenu(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-stone-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stone-800 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-amber-100">Menu</h2>
                <button onClick={() => setShowCategoryMenu(false)} className="bg-stone-800 p-2 rounded-full text-stone-400 hover:text-amber-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedCategory("all");
                    setShowCategoryMenu(false);
                    // Scroll to top
                    const listContainer = document.querySelector('.overflow-y-auto');
                    if (listContainer) listContainer.scrollTop = 0;
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${selectedCategory === "all" ? "bg-amber-600 text-white" : "bg-stone-800 text-amber-100 hover:bg-stone-700"}`}
                >
                  All Items
                </motion.button>
                {menuSections.map((section) => (
                  <motion.button
                    key={section.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCategory(section.name.toLowerCase());
                      setShowCategoryMenu(false);
                      // Scroll to top
                      const listContainer = document.querySelector('.overflow-y-auto');
                      if (listContainer) listContainer.scrollTop = 0;
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${selectedCategory === section.name.toLowerCase() ? "bg-amber-600 text-white" : "bg-stone-800 text-amber-100 hover:bg-stone-700"}`}
                  >
                    {section.name}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 md:p-0"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-stone-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-stone-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-amber-100">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="bg-stone-800 p-2 rounded-full text-stone-400 hover:text-amber-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Dietary Filter */}
                <div className="bg-stone-800 rounded-xl p-4 border border-stone-700">
                  <h3 className="font-bold text-amber-100 mb-3">Dietary Preference</h3>
                  <div className="flex bg-stone-900 rounded-lg p-1 border border-stone-800">
                    {(['all', 'veg', 'non-veg'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setDietaryFilter(type)}
                        className={`flex-1 py-2 rounded-md text-sm font-bold capitalize transition-all ${dietaryFilter === type
                          ? "bg-amber-600 text-white shadow-lg"
                          : "text-stone-400 hover:text-amber-100"
                          }`}
                      >
                        {type === 'all' ? 'All' : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}


                <div className="flex gap-3 pt-4 border-t border-stone-800">
                  <button
                    onClick={() => {
                      setDietaryFilter("all");
                      setPriceFilter("all");
                    }}
                    className="flex-1 py-3 text-stone-500 font-bold hover:text-amber-100 transition-colors"
                  >
                    Clear All
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFilters(false)}
                    className="flex-[2] bg-amber-600 text-white rounded-xl font-bold py-3 shadow-lg hover:bg-amber-700"
                  >
                    Apply Filters
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, selectedAddons: Addon[]) => void;
  formatPrice: (price: number) => string;
  allowOrdering: boolean;
}

const MenuItemCard = ({
  item,
  onAddToCart,
  formatPrice,
  allowOrdering,
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
        const currentQty = currentGroupAddons.filter(a => a.name === addon.name).length;
        const maxQty = addon.maxQuantity || 1;

        if (currentQty < maxQty) {
          return {
            ...prev,
            [groupIndex]: [...currentGroupAddons, addon],
          };
        } else {
          return {
            ...prev,
            [groupIndex]: currentGroupAddons.filter(
              (a) => a.name !== addon.name
            ),
          };
        }
      } else {
        // Single select logic
        const currentQty = currentGroupAddons.filter(a => a.name === addon.name).length;
        const maxQty = addon.maxQuantity || 1;

        if (currentQty > 0 && currentQty < maxQty) {
          // Increment
          return {
            ...prev,
            [groupIndex]: [...currentGroupAddons, addon]
          };
        } else if (currentQty >= maxQty) {
          // Toggle off if at max
          return {
            ...prev,
            [groupIndex]: []
          };
        } else {
          // Replace with new selection
          return {
            ...prev,
            [groupIndex]: [addon]
          };
        }
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
        {item.image && (
          <div className="w-full h-48 relative">
            <img
              src={`${API_BASE_URL}${item.image}`}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div
              className={`absolute top-3 left-3 w-6 h-6 rounded-sm border-2 flex items-center justify-center ${item.isVeg
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
        )}

        <div className="p-4">
          <div className="flex justify-between items-start mb-1 gap-2">
            <h3 className="font-bold text-lg text-amber-100">{item.name}</h3>
            {!item.image && (
              <div
                className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 mt-1 ${item.isVeg ? "border-green-600" : "border-red-600"
                  }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"
                    }`}
                />
              </div>
            )}
          </div>
          <p className="text-sm text-stone-400 mb-4 line-clamp-2">
            {item.description}
          </p>

          {showAddons && hasAddonGroups && (
            <div className="mb-4 space-y-3">
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
                            {(selectedAddons[groupIndex]?.filter(a => a.name === addon.name).length || 0) > 1 && (
                              <span className="ml-2 bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                x{selectedAddons[groupIndex].filter(a => a.name === addon.name).length}
                              </span>
                            )}
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

          <div className="space-y-2">
            {allowOrdering ? (
              <button
                onClick={() => {
                  if (hasAddonGroups && !showAddons) {
                    setShowAddons(true);
                  } else {
                    handleAddToCart();
                  }
                }}
                className="w-full bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 text-white py-3 px-4 rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {showAddons ? (
                  <>
                    <Check className="h-5 w-5" />
                    Add to Order • {formatPrice(getItemTotalWithAddons())}
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Add • {formatPrice(item.price)}
                  </>
                )}
              </button>
            ) : hasAddonGroups ? (
              <button
                onClick={() => setShowAddons(!showAddons)}
                className="w-full bg-stone-800 hover:bg-stone-700 text-amber-500 hover:text-amber-400 py-3 px-4 rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2 border border-stone-600"
              >
                {showAddons ? "Hide Options" : "View Options"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDarkCafe;
