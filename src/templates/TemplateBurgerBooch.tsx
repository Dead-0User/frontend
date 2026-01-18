import { useState, useMemo } from "react";
import {
  Search,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Check,
  Bell,
  Heart,
  SlidersHorizontal,
  Star,
  Loader2,
  CheckCircle,
  Menu,
  ChevronUp,
  Pencil,
  Phone,
  ArrowLeft,
  ChevronRight
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

interface DayHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface RestaurantData {
  name: string;
  id: string;
  templateStyle?: string;
  phone?: string;
  openingHours?: Record<string, string>;
  operationalHours?: string | DayHours[];
}

interface TableData {
  id: string;
  tableName: string;
  seats: number;
  restaurantId: string;
  allowOrdering?: boolean;
}

interface TemplateBurgerBoochProps {
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
  dietaryFilter: 'all' | 'veg' | 'non-veg';
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
  setDietaryFilter: (filter: 'all' | 'veg' | 'non-veg') => void;
  getItemTotal: (item: CartItem) => number;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  formatPrice: (price: number) => string;
}

interface BurgerBoochMenuItemProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, selectedAddons: Addon[]) => void;
  onUpdateQuantity: (cartItemId: string, change: number) => void;
  getItemQuantity: (itemId: string) => number;
  formatPrice: (price: number) => string;
  getCartItem: CartItem | undefined;
  allowOrdering: boolean;
}

const BurgerBoochMenuItem = ({ item, onAddToCart, onUpdateQuantity, getItemQuantity, formatPrice, getCartItem, allowOrdering }: BurgerBoochMenuItemProps) => {
  const [selectedAddons, setSelectedAddons] = useState<Record<number, Addon[]>>({});
  const [showAddons, setShowAddons] = useState(false);

  const hasAddonGroups = item.addonGroups && item.addonGroups.length > 0;
  const qty = getItemQuantity(item.id);

  const toggleAddon = (groupIndex: number, addon: Addon) => {
    const group = item.addonGroups[groupIndex];
    setSelectedAddons(prev => {
      const currentGroupAddons = prev[groupIndex] || [];
      if (group.multiSelect) {
        const exists = currentGroupAddons.some(a => a.name === addon.name);
        if (exists) {
          return { ...prev, [groupIndex]: currentGroupAddons.filter(a => a.name !== addon.name) };
        } else {
          return { ...prev, [groupIndex]: [...currentGroupAddons, addon] };
        }
      } else {
        const isSelected = currentGroupAddons.some(a => a.name === addon.name);
        if (isSelected) {
          return { ...prev, [groupIndex]: [] }; // Deselect
        } else {
          return { ...prev, [groupIndex]: [addon] };
        }
      }
    });
  };

  const isAddonSelected = (groupIndex: number, addon: Addon) => {
    return selectedAddons[groupIndex]?.some(a => a.name === addon.name);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasAddonGroups && !showAddons) {
      setShowAddons(true);
    } else {
      const allSelectedAddons = Object.values(selectedAddons).flat();
      onAddToCart(item, allSelectedAddons);
      setShowAddons(false);
      setSelectedAddons({});
    }
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className="flex flex-col gap-4 group bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
    >
      <div className="flex gap-4">
        {/* Image (Left) */}
        {item.image && (
          <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden bg-gray-100 relative cursor-pointer">
            <img
              src={`${API_BASE_URL}${item.image}`}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {/* Details (Right) */}
        <div className="flex-1 flex flex-col min-w-0 relative min-h-[8rem]">
          <div className="pr-6 cursor-pointer">
            <h3 className="text-base font-bold text-gray-900/80 leading-snug mb-1 cursor-pointer">
              {item.name}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1 cursor-pointer">
              {item.description}
            </p>
          </div>

          <div className="mt-auto flex items-end justify-between">
            <span className="text-base font-bold text-gray-900/80 pb-1">
              {formatPrice(item.price)}
            </span>

            {/* ADD BUTTON / COUNTER */}
            {allowOrdering ? (
              <div onClick={(e) => e.stopPropagation()}>
                {qty === 0 || showAddons ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAddClick}
                    className={`px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors uppercase tracking-wide ${showAddons
                      ? "bg-[#3B7C7C] text-white border-[#3B7C7C]"
                      : "bg-[#3B7C7C] text-white hover:bg-[#2D6A6A]"}`}
                  >
                    {showAddons ? (hasAddonGroups ? "Add" : "Add") : "+ Add"}
                  </motion.button>
                ) : (
                  <div className="flex items-center h-9 bg-white border border-gray-300 rounded-lg shadow-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (getCartItem) onUpdateQuantity(getCartItem.id, -1);
                      }}
                      className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg active:bg-gray-200"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-[#2D7A7A] font-bold text-sm">
                      {qty}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (getCartItem) onUpdateQuantity(getCartItem.id, 1);
                      }}
                      className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg active:bg-gray-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : hasAddonGroups ? (
              <div onClick={(e) => e.stopPropagation()}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddons(!showAddons);
                  }}
                  className="px-6 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors uppercase tracking-wide border bg-white text-[#3B7C7C] border-[#3B7C7C] hover:bg-[#3B7C7C] hover:text-white"
                >
                  {showAddons ? "Hide" : "View"}
                </motion.button>
              </div>
            ) : null}
          </div>

          {/* Veg/Non-Veg Icon */}
          <div className="absolute top-0 right-0">
            <div
              className={`w-4 h-4 border flex items-center justify-center ${item.isVeg ? "border-green-600" : "border-red-600"
                }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"
                  }`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Addons Area */}
      <AnimatePresence>
        {showAddons && hasAddonGroups && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-4 mb-2 mt-2">
              {item.addonGroups.map((group, gIdx) => (
                <div key={gIdx} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-sm text-gray-800">{group.title}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full bg-white">
                      {group.multiSelect ? "Multi-select" : "Select 1"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((addon, aIdx) => {
                      const selected = isAddonSelected(gIdx, addon);
                      return (
                        <div
                          key={aIdx}
                          onClick={(e) => { e.stopPropagation(); toggleAddon(gIdx, addon); }}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all bg-white ${selected
                            ? "border-[#3B7C7C] shadow-sm"
                            : "border-gray-100 hover:border-gray-200"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selected
                              ? "bg-[#3B7C7C] border-[#3B7C7C] text-white"
                              : "border-gray-300 bg-white"
                              }`}>
                              {selected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className={`text-sm font-medium ${selected ? "text-[#3B7C7C]" : "text-gray-700"}`}>
                              {addon.name}
                            </span>
                          </div>
                          {addon.price > 0 && (
                            <span className="text-xs font-medium text-gray-500">
                              +{formatPrice(addon.price)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TemplateBurgerBooch = (props: TemplateBurgerBoochProps) => {
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
    isCallingWaiter,
    waiterCalled,
    selectedCategory,
    showVegOnly,
    searchQuery,
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
    setSearchQuery,
    getItemTotal,
    getCartTotal,
    getCartItemCount,
    formatPrice,
    priceFilter,
    showFilters,
    setPriceFilter,
    setShowFilters,
    setShowVegOnly,
    dietaryFilter,
    setDietaryFilter,
  } = props;

  const [showCart, setShowCart] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // New Features State
  const [showSidebar, setShowSidebar] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Interactivity State
  const [showSearch, setShowSearch] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending": return "bg-orange-500 text-white";
      case "preparing": return "bg-blue-500 text-white";
      case "ready": return "bg-green-500 text-white";
      case "served": return "bg-gray-500 text-white";
      case "paid": return "bg-emerald-600 text-white";
      case "cancelled": return "bg-red-500 text-white";
      default: return "bg-orange-500 text-white";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "pending": return "Order Received";
      case "preparing": return "Preparing";
      case "ready": return "Ready";
      case "served": return "Served";
      case "paid": return "Paid";
      case "cancelled": return "Cancelled";
      default: return "Processing";
    }
  };

  const scrollToSection = (sectionId: string) => {
    setSelectedCategory(sectionId);
    setShowCategoryMenu(false);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Parse Operational Hours
  const operationalHours = useMemo(() => {
    if (!restaurantData?.operationalHours) return [];

    // If it's already an array
    if (Array.isArray(restaurantData.operationalHours)) {
      return restaurantData.operationalHours;
    }

    // If it's a string, try to parse
    try {
      const parsed = JSON.parse(restaurantData.operationalHours);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }, [restaurantData?.operationalHours]);

  // Helper to format time (e.g. 09:00 -> 9:00 AM)
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const m = minutes || "00";
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${m} ${ampm}`;
  };


  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(itemId)) {
        newFavorites.delete(itemId);
      } else {
        newFavorites.add(itemId);
      }
      return newFavorites;
    });
  };

  const handleFeedbackSubmit = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurantData?.id,
          rating: feedbackRating,
          comment: feedbackComment,
          customerName: customerName || 'Anonymous',
        })
      });

      setFeedbackSuccess(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSuccess(false);
        setFeedbackRating(0);
        setFeedbackComment("");
      }, 1500);
    } catch (e) {
      console.error("Feedback error", e);
      // Fallback for demo if API fails
      setFeedbackSuccess(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSuccess(false);
        setFeedbackRating(0);
        setFeedbackComment("");
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex justify-center">
        <div className="w-full max-w-[400px] h-full relative bg-white flex flex-col items-center justify-center border-x shadow-2xl">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-[#2D7A7A] mx-auto mb-4" />
            <h2 className="text-xl font-bold">Loading Menu...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Filter items
  const filteredItems = menuSections
    .flatMap((section) =>
      section.items
        .filter((item) => item.isActive)
        .map((item) => ({ ...item, sectionId: section.id }))
    )
    .filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.sectionId === selectedCategory;

      let matchesVeg = true;
      if (dietaryFilter === 'veg') matchesVeg = item.isVeg;
      if (dietaryFilter === 'non-veg') matchesVeg = !item.isVeg;

      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesVeg && matchesSearch;
    });

  // Group items
  const sectionsWithItems = menuSections.map(section => ({
    ...section,
    items: filteredItems.filter(item => item.sectionId === section.id)
  })).filter(section => section.items.length > 0);

  // Helper to get quantity of a specific menu item in cart
  const getItemQuantity = (itemId: string) => {
    return cart
      .filter((cartItem) => cartItem.menuItemId === itemId)
      .reduce((sum, cartItem) => sum + cartItem.quantity, 0);
  };

  // Helper to handle "Add" button click in list view
  const handleListAddClick = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(item, []);
  };

  // Helper to handle "Plus" logic on counter (increase qty)
  const handleListIncreaseClick = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(item, []);
  };

  // Helper to handle "Minus" logic on counter
  const handleListDecreaseClick = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const cartItems = cart.filter((ci) => ci.menuItemId === item.id);
    if (cartItems.length > 0) {
      const lastItem = cartItems[cartItems.length - 1];
      const committedQty = lastItem.committedQuantity || 0;

      // Only allow decrease if current quantity is greater than committed quantity
      if (lastItem.quantity > committedQty) {
        if (lastItem.quantity > 1) {
          onUpdateQuantity(lastItem.id, -1);
        } else {
          // Only remove if not committed (implied by quantity > committedQty, since if committedQty was >= 1, quantity would be > 1 to enter here? No.)
          // If committedQty is 0, and quantity is 1, 1 > 0. Remove.
          // If committedQty is 1, and quantity is 2, 2 > 1. Update to 1.
          onRemoveFromCart(lastItem.id);
        }
      }
    }
  };

  const handleAddToCartFromModal = () => {
    if (selectedItem) {
      onAddToCart(selectedItem, selectedAddons);
      setSelectedItem(null);
      setSelectedAddons([]);
    }
  };

  const toggleAddon = (addon: Addon, group: AddonGroup) => {
    if (group.multiSelect) {
      const currentQty = selectedAddons.filter((a) => a.name === addon.name).length;
      const maxQty = addon.maxQuantity || 1;
      if (currentQty < maxQty) {
        setSelectedAddons([...selectedAddons, addon]);
      } else {
        setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
      }
    } else {
      const currentQty = selectedAddons.filter((a) => a.name === addon.name).length;
      const maxQty = addon.maxQuantity || 1;
      if (currentQty > 0 && currentQty < maxQty) {
        setSelectedAddons([...selectedAddons, addon]);
      } else if (currentQty >= maxQty) {
        setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
      } else {
        const groupAddonNames = group.items.map(i => i.name);
        const otherAddons = selectedAddons.filter(a => !groupAddonNames.includes(a.name));
        setSelectedAddons([...otherAddons, addon]);
      }
    }
  };

  const isAddonSelected = (addon: Addon) => {
    return selectedAddons.some((a) => a.name === addon.name);
  };

  if (orderPlaced) {
    if (['paid', 'cancelled'].includes(orderStatus)) {
      return (
        <div className="fixed inset-0 bg-gray-50 flex justify-center">
          <div className="w-full max-w-[400px] h-full relative bg-white flex flex-col items-center justify-center p-4 border-x shadow-2xl">
            <div className="max-w-md w-full text-center bg-white p-8">
              <CheckCircle className="h-16 w-16 text-[#2D7A7A] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                Order {orderStatus === 'paid' ? 'Completed' : 'Cancelled'}
              </h2>
              <p className="text-gray-500 mb-8">
                {orderStatus === 'paid' ? 'Thank you for dining with us!' : 'This order has been cancelled.'}
              </p>
              <button
                onClick={() => {
                  setOrderPlaced(false);
                  setOrderId(null);
                  setOrderStatus("pending");
                }}
                className="w-full bg-[#2D7A7A] text-white py-4 rounded-xl font-bold text-lg"
              >
                Start New Order
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-gray-50 flex justify-center">
        <div className="w-full max-w-[400px] h-full relative bg-white flex flex-col items-center justify-center p-4 border-x shadow-2xl">
          <div className="max-w-md w-full text-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <CheckCircle className="h-16 w-16 text-[#2D7A7A] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
            <p className="text-gray-500 mb-6">Your order has been sent to the kitchen.</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
              <p className="font-bold text-lg mb-1">{restaurantData?.name}</p>
              <p className="text-sm text-gray-500 mb-3">{tableData?.tableName}</p>

              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-sm text-gray-500">Order ID:</span>
                <span className="text-sm font-mono font-bold text-[#2D7A7A]">
                  {orderId?.slice(-8).toUpperCase()}
                </span>
              </div>

              <div
                className={`inline-block px-4 py-2 rounded-lg mb-3 font-semibold ${orderStatus === 'served' || orderStatus === 'paid'
                  ? "bg-green-100 text-green-800"
                  : "bg-[#2D7A7A] text-white"
                  }`}
              >
                {getStatusText(orderStatus)}
              </div>

              <p className="text-xs text-gray-400">
                Status updates automatically
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={onCallWaiter}
                disabled={isCallingWaiter || waiterCalled}
                className={`w-full py-3 rounded-xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-2 ${waiterCalled
                  ? "bg-green-50 border-green-500 text-[#2D7A7A]"
                  : "border-[#2D7A7A] text-[#2D7A7A] hover:bg-gray-50"
                  }`}
              >
                {isCallingWaiter ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : waiterCalled ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Waiter Notified
                  </>
                ) : (
                  <>
                    <Bell className="h-5 w-5" />
                    Call Waiter
                  </>
                )}
              </button>

              <button
                onClick={() => setOrderPlaced(false)}
                className="w-full bg-[#2D7A7A] text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-[#256666] transition-colors"
              >
                Place Another Order
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex justify-center">
      <div className="w-full max-w-[400px] h-full relative bg-white flex flex-col overflow-hidden font-sans">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shrink-0">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <button className="p-2 -ml-2 hover:bg-gray-50 rounded-lg transition-colors" onClick={() => setShowSidebar(true)}>
                <Menu className="w-6 h-6 text-gray-700" />
              </button>

              <button
                onClick={() => setShowFeedback(true)}
                className="p-2 -mr-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Pencil className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Search Bar & Filter */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-gray-50 rounded-lg text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-gray-100 transition-colors"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowFilters(true)}
                className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center border transition-colors ${dietaryFilter !== 'all'
                  ? "bg-[#2D7A7A] text-white border-[#2D7A7A]"
                  : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                  }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Category Tabs */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedCategory("all");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all ${selectedCategory === "all"
                    ? "bg-[#3B7C7C] text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  All
                </motion.button>
                {menuSections.map((section) => (
                  <motion.button
                    key={section.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => scrollToSection(section.id)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all ${selectedCategory === section.id
                      ? "bg-[#3B7C7C] text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    {section.name}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="pb-32">
            {/* Active Order Status Bar */}
            {existingOrderId && !orderPlaced && !['paid', 'cancelled'].includes(orderStatus) && (
              <div className="mx-4 mt-4 mb-4 bg-white border-2 border-gray-900 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-gray-900" />
                    <div>
                      <p className="font-semibold text-gray-900">Active Order</p>
                      <p className="text-sm text-gray-600">
                        #{existingOrderId?.slice(-8).toUpperCase()}
                      </p>
                      <div className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold mt-1 ${getStatusColor(orderStatus)}`}>
                        {getStatusText(orderStatus)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setOrderPlaced(true)}
                    className="px-4 py-2 bg-[#3B7C7C] text-white rounded-lg text-sm font-medium hover:bg-[#2D6A6A] transition-colors"
                  >
                    View
                  </button>
                </div>
              </div>
            )}

            {/* Sections */}
            {sectionsWithItems.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {sectionsWithItems.map((section) => (
                  <div key={section.id} id={`section-${section.id}`} className="pt-6 pb-4 border-b border-gray-50 last:border-0">
                    <div
                      className="px-5 mb-6 flex items-start justify-between cursor-pointer"
                      onClick={() => toggleSection(section.id)}
                    >
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{section.name}</h2>
                      <ChevronUp className={`w-6 h-6 text-gray-900 mt-1 transition-transform duration-300 ${collapsedSections.has(section.id) ? 'rotate-180' : ''}`} />
                    </div>

                    {!collapsedSections.has(section.id) && (
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.05
                            }
                          }
                        }}
                        className="space-y-6 px-5"
                      >
                        {section.items.map((item) => (
                          <BurgerBoochMenuItem
                            key={item.id}
                            item={item}
                            onAddToCart={(item, addons) => {
                              onAddToCart(item, addons);
                              setSelectedItem(null);
                            }}
                            onUpdateQuantity={onUpdateQuantity}
                            getItemQuantity={getItemQuantity}
                            formatPrice={formatPrice}
                            getCartItem={cart.find(c => c.menuItemId === item.id)}
                            allowOrdering={tableData?.allowOrdering !== false}
                          />
                        ))}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-24 px-4 text-center">
                <p className="text-gray-500">No dishes found.</p>
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
              className="absolute inset-0 z-[60] bg-[#2D7A7A]/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
              onClick={() => setShowCategoryMenu(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Menu</h2>
                  <button onClick={() => setShowCategoryMenu(false)} className="bg-gray-100 p-2 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCategory("all");
                      setShowCategoryMenu(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${selectedCategory === "all" ? "bg-[#2D7A7A] text-white" : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    All Items
                  </motion.button>
                  {menuSections.map((section) => (
                    <motion.button
                      key={section.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${selectedCategory === section.id ? "bg-[#2D7A7A] text-white" : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                        }`}
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
              className="absolute inset-0 z-[60] bg-[#2D7A7A]/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
              onClick={() => setShowFilters(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-4 flex items-center justify-center">
                  <h2 className="text-xl font-bold">Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="bg-gray-100 p-2 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Dietary Filter (Classic Style) */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Dietary Preference</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'all', label: 'All Items' },
                        { value: 'veg', label: 'Veg Only' },
                        { value: 'non-veg', label: 'Non-Veg Only' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setDietaryFilter(option.value as any)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${dietaryFilter === option.value
                            ? "border-[#3B7C7C] bg-gray-50 shadow-sm"
                            : "border-gray-100 hover:border-gray-200"
                            }`}
                        >
                          <span className={`font-medium ${dietaryFilter === option.value ? "text-[#3B7C7C]" : "text-gray-600"}`}>
                            {option.label}
                          </span>
                          {dietaryFilter === option.value && (
                            <div className="w-5 h-5 rounded-full bg-[#3B7C7C] flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setDietaryFilter("all");
                      }}
                      className="flex-1 py-3 text-gray-500 font-bold hover:text-[#2D7A7A] transition-colors"
                    >
                      Clear All
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowFilters(false)}
                      className="flex-[2] bg-[#2D7A7A] text-white rounded-xl font-bold py-3 shadow-lg"
                    >
                      Apply Filters
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Cart Bar */}
        <AnimatePresence>
          {cart.length > 0 && tableData?.allowOrdering !== false && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-6 left-5 right-5 z-50"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCart(true)}
                className="bg-[#2D7A7A] text-white w-full rounded-2xl p-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer hover:bg-[#256666] transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-sm uppercase tracking-wide opacity-80">
                    {getCartItemCount()} Items
                  </span>
                  <span className="font-bold text-lg">{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-sm">
                  View Cart <ShoppingCart className="w-4 h-4" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar (Hamburger Menu) */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] flex"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full h-full bg-white flex flex-col p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              >
                <div className="flex items-center gap-4 mb-10">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowSidebar(false)}>
                    <ArrowLeft className="w-7 h-7 text-[#2D7A7A]" />
                  </motion.button>
                  <h2 className="text-2xl font-bold text-[#2D7A7A]">{restaurantData?.name}</h2>
                </div>

                <div className="mb-10">
                  <a
                    href={`tel:${restaurantData?.phone || ""}`}
                    className="inline-flex items-center gap-2 text-lg font-bold border-b-2 border-[#2D7A7A] pb-1"
                  >
                    <Phone className="w-5 h-5" />
                    {restaurantData?.phone || "Call us"}
                  </a>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-6">Opening hours</h3>
                  <div className="space-y-4 text-gray-600">
                    {/* Render parsed operational Hours */}
                    {operationalHours.length > 0 ? (
                      operationalHours.map((dayHour) => (
                        <div key={dayHour.day} className="flex justify-between text-sm">
                          <span
                            className={`capitalize w-24 ${!dayHour.isOpen ? "text-gray-400" : "text-gray-900 font-medium"
                              }`}
                          >
                            {dayHour.day}
                          </span>
                          <span className={!dayHour.isOpen ? "text-gray-400" : ""}>
                            {dayHour.isOpen
                              ? `${formatTime(dayHour.openTime)} - ${formatTime(dayHour.closeTime)}`
                              : "Closed"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 italic">Operating hours not available</p>
                    )}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSidebar(false)}
                  className="w-full border border-[#2D7A7A] text-[#2D7A7A] py-3 rounded-full font-bold mt-4"
                >
                  Dine-In Menu
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Modal */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-[#2D7A7A]/50 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Leave Feedback</h2>
                  <button onClick={() => setShowFeedback(false)} className="bg-gray-100 p-2 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {feedbackSuccess ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold">Thank You!</h3>
                    <p className="text-gray-500">Your feedback has been sent.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          whileTap={{ scale: 1.2 }}
                          onClick={() => setFeedbackRating(star)}
                          className="p-1"
                        >
                          <Star
                            className={`w-8 h-8 ${star <= feedbackRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              }`}
                          />
                        </motion.button>
                      ))}
                    </div>

                    <textarea
                      placeholder="Tell us about your experience..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#2D7A7A] min-h-[120px]"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    ></textarea>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFeedbackSubmit}
                      disabled={feedbackRating === 0}
                      className="w-full bg-[#2D7A7A] text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Feedback
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Item Details Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-end justify-center bg-[#2D7A7A]/50 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header/Image */}
                <div className="relative">
                  {selectedItem.image ? (
                    <div className="w-full h-56 relative">
                      <img
                        src={`${API_BASE_URL}${selectedItem.image}`}
                        alt={selectedItem.name}
                        className="w-full h-full object-cover"
                      />
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedItem(null)}
                        className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md z-10"
                      >
                        <X className="w-5 h-5 text-[#2D7A7A]" />
                      </motion.button>
                    </div>
                  ) : (
                    <div className="w-full p-4 flex justify-end">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedItem(null)}
                        className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
                      >
                        <X className="w-5 h-5 text-[#2D7A7A]" />
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div
                        className={`mb-2 w-5 h-5 border flex items-center justify-center ${selectedItem.isVeg ? "border-green-600" : "border-red-600"
                          }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${selectedItem.isVeg ? "bg-green-600" : "bg-red-600"
                            }`}
                        ></div>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{selectedItem.name}</h2>
                      <p className="text-xl font-bold text-gray-900 mb-4">{formatPrice(selectedItem.price)}</p>
                    </div>
                  </div>
                  <p className="text-gray-500 mb-6 leading-relaxed">{selectedItem.description}</p>

                  {/* Addon Groups */}
                  {selectedItem.addonGroups?.map((group, idx) => (
                    <div key={idx} className="mb-6">
                      <h3 className="font-bold text-gray-900 mb-3">{group.title}</h3>
                      <div className="space-y-3">
                        {group.items.map((addon, aIdx) => (
                          <motion.div
                            key={aIdx}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center justify-between"
                            onClick={() => toggleAddon(addon, group)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center ${isAddonSelected(addon)
                                  ? "bg-[#2D7A7A] border-[#2D7A7A] text-white"
                                  : "border-gray-300"
                                  }`}
                              >
                                {isAddonSelected(addon) && <Check className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-gray-700 font-medium">{addon.name}</span>
                            </div>
                            <span className="text-gray-500 text-sm">+{formatPrice(addon.price)}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal Footer Action */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddToCartFromModal}
                    className="w-full bg-[#2D7A7A] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:opacity-90"
                  >
                    Add Item{" "}
                    {formatPrice(
                      getItemTotal({
                        ...selectedItem,
                        quantity: 1,
                        addons: selectedAddons,
                        menuItemId: selectedItem.id,
                      } as CartItem) || selectedItem.price
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Modal */}
        <AnimatePresence>
          {showCart && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#2D7A7A]/50 backdrop-blur-sm z-50 flex items-end justify-center"
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-white w-full max-h-[90vh] rounded-t-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col"
              >
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
                  <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {cart.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">Your cart is empty.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {cart.map((item) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={item.id}
                          className="flex gap-4"
                        >
                          {(() => {
                            const originalItem = menuSections
                              .flatMap((s) => s.items)
                              .find((i) => i.id === item.menuItemId);
                            return originalItem?.image ? (
                              <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={`${API_BASE_URL}${originalItem.image}`}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : null;
                          })()}

                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-bold text-sm text-gray-900">{item.name}</h3>
                              <span className="font-bold text-sm">
                                {formatPrice(getItemTotal(item))}
                              </span>
                            </div>
                            {item.addons.length > 0 && (
                              <div className="space-y-0.5 mt-1">
                                {item.addons.map((addon, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-gray-500"
                                  >
                                    + {addon.name}{" "}
                                    {addon.price > 0 &&
                                      `(+${formatPrice(addon.price)})`}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex items-center border border-gray-200 rounded-lg h-8">
                                <button
                                  onClick={() => {
                                    if (item.quantity > (item.committedQuantity || 0)) {
                                      onUpdateQuantity(item.id, -1);
                                    }
                                  }}
                                  disabled={item.quantity <= (item.committedQuantity || 0)}
                                  className="w-8 h-full flex items-center justify-center hover:bg-gray-50 text-gray-700 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(item.id, 1)}
                                  className="w-8 h-full flex items-center justify-center hover:bg-gray-50 text-[#2D7A7A] font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-500 font-medium">Total Amount</span>
                      <span className="text-2xl font-bold text-gray-900">{formatPrice(getCartTotal())}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-[#2D7A7A]"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onPlaceOrder}
                      className="w-full bg-[#2D7A7A] text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:opacity-90"
                    >
                      Place Order
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TemplateBurgerBooch;
