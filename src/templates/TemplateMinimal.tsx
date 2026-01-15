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
}

interface TemplateMinimalProps {
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

const TemplateMinimal = (props: TemplateMinimalProps) => {
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
            <Loader2 className="h-16 w-16 animate-spin text-black mx-auto mb-4" />
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
      const matchesVeg = !showVegOnly || item.isVeg;
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
              <CheckCircle className="h-16 w-16 text-black mx-auto mb-4" />
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
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg"
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
          <div className="max-w-md w-full text-center bg-white p-8">
            <CheckCircle className="h-16 w-16 text-black mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Order Confirmed</h2>
            <p className="text-gray-500 mb-8">Your order has been sent to the kitchen.</p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-xl">{restaurantData?.name}</p>
                  <p className="text-gray-500">{tableData?.tableName}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${orderStatus === 'served' || orderStatus === 'paid'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
                  }`}>
                  {orderStatus.toUpperCase()}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-mono bg-white p-2 rounded-lg border border-gray-100">
                <span>Order ID:</span>
                <span className="font-bold text-black">{orderId?.slice(-8).toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onCallWaiter}
                disabled={isCallingWaiter || waiterCalled}
                className={`w-full py-4 rounded-xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-2 ${waiterCalled
                  ? "bg-green-50 border-green-500 text-green-700"
                  : "border-black text-black hover:bg-gray-50"
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
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-900 transition-colors"
              >
                Order More Items
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex justify-center">
      <div className="w-full max-w-[400px] h-full relative bg-white flex flex-col border-x shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden font-sans">

        {/* Header Section */}
        <div className="px-5 pt-6 pb-2 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-50/50">
          <div className="flex items-center justify-between mb-4">
            <button className="p-1" onClick={() => setShowSidebar(true)}>
              <Menu className="w-7 h-7 text-black" />
            </button>
            <button
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-sm font-medium hover:opacity-90"
            >
              <span>Feedback</span>
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          {showSearch ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black"
                />
              </div>
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="p-2 text-gray-500 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <div className="flex items-center justify-between">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCategoryMenu(true)}
                className="bg-black text-white px-6 py-2 rounded-full text-base font-medium shadow-md transition-transform"
              >
                Menu
              </motion.button>
              <div className="flex items-center gap-3">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${searchQuery
                    ? "border-black bg-black text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  onClick={() => setShowSearch(true)}
                >
                  <Search className="w-5 h-5" />
                </motion.div>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${showVegOnly || priceFilter !== "all"
                    ? "border-black bg-black text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  onClick={() => setShowFilters(true)}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="pb-32">

            {/* Sections */}
            {sectionsWithItems.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {sectionsWithItems.map((section) => (
                  <div key={section.id} id={`section-${section.id}`} className="pt-6 pb-4 border-b border-gray-50 last:border-0">
                    <div
                      className="px-5 mb-6 flex items-start justify-between cursor-pointer"
                      onClick={() => toggleSection(section.id)}
                    >
                      <h2 className="text-2xl font-bold text-black tracking-tight">{section.name}</h2>
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
                        {section.items.map((item) => {
                          const qty = getItemQuantity(item.id);
                          return (
                            <motion.div
                              variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                              }}
                              key={item.id}
                              whileTap={{ scale: 0.98 }}
                              className="flex gap-4 group"
                              onClick={() => {
                                setSelectedItem(item);
                                setSelectedAddons([]);
                              }}
                            >
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
                              <div className="flex-1 flex flex-col min-w-0 relative h-32">
                                <div className="pr-6 cursor-pointer">
                                  <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1 cursor-pointer">
                                    {item.name}
                                  </h3>
                                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1 cursor-pointer">
                                    {item.description}
                                  </p>
                                </div>

                                <div className="mt-auto flex items-end justify-between">
                                  <span className="text-lg font-bold text-gray-900 pb-1">
                                    {formatPrice(item.price)}
                                  </span>

                                  {/* ADD BUTTON / COUNTER */}
                                  <div onClick={(e) => e.stopPropagation()}>
                                    {qty === 0 ? (
                                      <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => handleListAddClick(item, e)}
                                        className="px-6 py-2 rounded-lg border border-gray-300 text-green-600 font-bold text-sm bg-white shadow-sm hover:bg-green-50 transition-colors uppercase tracking-wide"
                                      >
                                        + Add
                                      </motion.button>
                                    ) : (
                                      <div className="flex items-center h-9 bg-white border border-gray-300 rounded-lg shadow-sm">
                                        <button
                                          onClick={(e) => handleListDecreaseClick(item, e)}
                                          className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg active:bg-gray-200"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-8 text-center text-green-700 font-bold text-sm">
                                          {qty}
                                        </span>
                                        <button
                                          onClick={(e) => handleListIncreaseClick(item, e)}
                                          className="w-8 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg active:bg-gray-200"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
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
                            </motion.div>
                          );
                        })}
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
              className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
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
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${selectedCategory === "all" ? "bg-black text-white" : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    All Items
                  </motion.button>
                  {menuSections.map((section) => (
                    <motion.button
                      key={section.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${selectedCategory === section.id ? "bg-black text-white" : "bg-gray-50 text-gray-900 hover:bg-gray-100"
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
              className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="bg-gray-100 p-2 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Veg Only Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                      </div>
                      <span className="font-bold text-gray-900">Veg Only</span>
                    </div>
                    <button
                      onClick={() => setShowVegOnly(!showVegOnly)}
                      className={`w-12 h-7 rounded-full transition-colors relative ${showVegOnly ? "bg-green-600" : "bg-gray-300"
                        }`}
                    >
                      <motion.div
                        className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white"
                        animate={{ x: showVegOnly ? 20 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Price Filter */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3">Price Range</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {["all", "low", "medium", "high"].map((filter) => (
                        <motion.button
                          key={filter}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPriceFilter(filter)}
                          className={`py-2 rounded-lg text-sm font-bold capitalize transition-colors ${priceFilter === filter
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          style={{ gridColumn: filter === "all" ? "1 / -1" : "auto" }}
                        >
                          {filter === "all" ? "Any Price" : filter}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowVegOnly(false);
                        setPriceFilter("all");
                      }}
                      className="flex-1 py-3 text-gray-500 font-bold hover:text-black transition-colors"
                    >
                      Clear All
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowFilters(false)}
                      className="flex-[2] bg-black text-white rounded-xl font-bold py-3 shadow-lg"
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
          {cart.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-6 left-5 right-5 z-50"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCart(true)}
                className="bg-black text-white w-full rounded-2xl p-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer hover:bg-gray-900 transition-colors"
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
                    <ArrowLeft className="w-7 h-7 text-black" />
                  </motion.button>
                  <h2 className="text-2xl font-bold text-black">{restaurantData?.name}</h2>
                </div>

                <div className="mb-10">
                  <a
                    href={`tel:${restaurantData?.phone || ""}`}
                    className="inline-flex items-center gap-2 text-lg font-bold border-b-2 border-black pb-1"
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
                  className="w-full border border-black text-black py-3 rounded-full font-bold mt-4"
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
              className="absolute inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-black min-h-[120px]"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    ></textarea>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFeedbackSubmit}
                      disabled={feedbackRating === 0}
                      className="w-full bg-black text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
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
                        <X className="w-5 h-5 text-black" />
                      </motion.button>
                    </div>
                  ) : (
                    <div className="w-full p-4 flex justify-end">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedItem(null)}
                        className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center"
                      >
                        <X className="w-5 h-5 text-black" />
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
                                  ? "bg-black border-black text-white"
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
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:opacity-90"
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
              className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
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
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
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
                                  className="w-8 h-full flex items-center justify-center hover:bg-gray-50 text-green-600 font-bold"
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
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm focus:outline-none focus:border-black"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={onPlaceOrder}
                      className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:opacity-90"
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

export default TemplateMinimal;