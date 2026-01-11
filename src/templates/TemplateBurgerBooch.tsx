import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Clock,
  Star,
  ChevronLeft,
  ShoppingCart,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";

// TypeScript interfaces
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

import { API_BASE_URL } from "@/config";

const MenuTemplate = (props: TemplateProps) => {
  const {
    loading,
    restaurantData,
    tableData,
    menuSections,
    cart,
    orderPlaced,
    orderId,
    orderStatus,
    existingOrderId,
    isPlacingOrder,
    isUpdatingOrder,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    onAddToCart,
    onRemoveFromCart,
    onUpdateQuantity,
    onPlaceOrder,
    setOrderPlaced,
    setOrderId,
    setOrderStatus,
    getItemTotal,
    getCartTotal,
    getCartItemCount,
    formatPrice,
  } = props;

  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, Addon[]>>({});
  const [itemQuantity, setItemQuantity] = useState<Record<string, number>>({});
  const [showCart, setShowCart] = useState(false);
  const [isDraggingCart, setIsDraggingCart] = useState(false);
  const [cartPosition, setCartPosition] = useState({ x: 16, y: 16 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [recentlyViewed, setRecentlyViewed] = useState<MenuItem[]>([]);

  // Handle back button for modals
  const isBackClosing = useRef(false);

  useEffect(() => {
    if (!selectedItem && !showCart) return;

    // Push state when a modal opens
    window.history.pushState({ modalOpen: true }, "", window.location.href);
    isBackClosing.current = false;

    const handlePopState = () => {
      isBackClosing.current = true;
      if (selectedItem) setSelectedItem(null);
      if (showCart) setShowCart(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // If we're closing not due to back button (e.g. X clicked), remove the history state
      if (!isBackClosing.current) {
        window.history.back();
      }
      isBackClosing.current = false;
    };
  }, [selectedItem, showCart]); // Re-run when modal state changes to ensure history stack is correct

  // Build categories from menu sections
  const categories = useMemo(() => {
    const cats = [{ id: "all", name: "All" }];
    menuSections.forEach((section) => {
      cats.push({ id: section.id, name: section.name });
    });
    return cats;
  }, [menuSections]);

  // Flatten all items from menu sections
  const allItems = useMemo(() => {
    return menuSections.flatMap((section) =>
      section.items
        .filter((item) => item.isActive)
        .map((item) => ({
          ...item,
          categoryId: section.id,
          sectionName: section.name,
        }))
    );
  }, [menuSections]);

  // Filter items based on category and search, grouped by section
  const filteredItemsBySection = useMemo(() => {
    const filtered = allItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.categoryId === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Group by section
    const grouped: Record<string, typeof filtered> = {};
    filtered.forEach((item) => {
      const sectionId = item.categoryId;
      if (!grouped[sectionId]) {
        grouped[sectionId] = [];
      }
      grouped[sectionId].push(item);
    });

    return grouped;
  }, [activeCategory, searchQuery, allItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.categoryId === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, allItems]);

  // Sync activeCategory with selectedCategory prop
  useEffect(() => {
    if (selectedCategory === "all") {
      setActiveCategory("all");
    } else {
      const matchingSection = menuSections.find(
        (s) => s.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      if (matchingSection) {
        setActiveCategory(matchingSection.id);
      }
    }
  }, [selectedCategory, menuSections]);

  const handleAddToCart = (item: MenuItem, addons: Addon[] = []) => {
    const itemAddons = selectedAddons[item.id] || addons;
    onAddToCart(item, itemAddons);
    // Update quantity for this item
    setItemQuantity((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (item: MenuItem) => {
    const currentQty = itemQuantity[item.id] || 0;
    if (currentQty > 1) {
      const newQty = currentQty - 1;
      setItemQuantity((prev) => ({
        ...prev,
        [item.id]: newQty,
      }));
      // Find cart item and decrease quantity
      const cartItem = cart.find((ci) => ci.menuItemId === item.id);
      if (cartItem) {
        onUpdateQuantity(cartItem.id, -1);
      }
    } else if (currentQty === 1) {
      // Remove from cart
      const cartItem = cart.find((ci) => ci.menuItemId === item.id);
      if (cartItem) {
        onRemoveFromCart(cartItem.id);
      }
      setItemQuantity((prev) => {
        const newQty = { ...prev };
        delete newQty[item.id];
        return newQty;
      });
      setSelectedAddons((prev) => {
        const newAddons = { ...prev };
        delete newAddons[item.id];
        return newAddons;
      });
    }
  };

  const toggleAddon = (itemId: string, groupIndex: number, addon: Addon) => {
    setSelectedAddons((prev) => {
      const current = prev[itemId] || [];
      const item = selectedItem;
      if (!item) return prev;

      const group = item.addonGroups[groupIndex];
      if (!group) return prev;

      if (group.multiSelect) {
        // Toggle addon
        const exists = current.some(
          (a) => a.name === addon.name && a.price === addon.price
        );
        if (exists) {
          return {
            ...prev,
            [itemId]: current.filter(
              (a) => !(a.name === addon.name && a.price === addon.price)
            ),
          };
        } else {
          return {
            ...prev,
            [itemId]: [...current, addon],
          };
        }
      } else {
        // Single select
        const isAlreadySelected = current.some(
          (a) => a.name === addon.name && a.price === addon.price
        );

        // Filter out any addons belonging to this group (to prepare for replacement or removal)
        // We do this by keeping only addons that belong to OTHER groups
        const otherGroups = item.addonGroups
          .map((g, idx) => (idx !== groupIndex ? g : null))
          .filter(Boolean) as AddonGroup[];

        const otherAddons = current.filter((a) =>
          otherGroups.some((g) =>
            g.items.some((ai) => ai.name === a.name && ai.price === a.price)
          )
        );

        if (isAlreadySelected) {
          // If clicking the same item, just remove it (deselect)
          return {
            ...prev,
            [itemId]: otherAddons,
          };
        }

        // Otherwise replace with new selection
        return {
          ...prev,
          [itemId]: [...otherAddons, addon],
        };
      }
    });
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    // Initialize quantity and addons from cart if item already exists
    const cartItem = cart.find((ci) => ci.menuItemId === item.id);
    if (cartItem) {
      setItemQuantity((prev) => ({
        ...prev,
        [item.id]: cartItem.quantity,
      }));
      setSelectedAddons((prev) => ({
        ...prev,
        [item.id]: cartItem.addons,
      }));
    } else {
      setItemQuantity((prev) => ({
        ...prev,
        [item.id]: 0,
      }));
      setSelectedAddons((prev) => ({
        ...prev,
        [item.id]: [],
      }));
    }
    // Add to recently viewed
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      return [item, ...filtered].slice(0, 3);
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-orange-500 text-white";
      case "preparing":
        return "bg-blue-500 text-white";
      case "ready":
        return "bg-green-500 text-white";
      case "served":
        return "bg-gray-500 text-white";
      case "paid":
        return "bg-emerald-600 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-orange-500 text-white";
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#B8D4D4]">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-[#2D7A7A] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#333333]">Loading Menu...</h2>
        </div>
      </div>
    );
  }

  // Order placed state
  if (orderPlaced) {
    if (["paid", "cancelled"].includes(orderStatus)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#B8D4D4]">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-[#333333]">
              {orderStatus === "paid" ? "Order Completed!" : "Order Cancelled"}
            </h2>
            <p className="text-[#666666] mb-6">
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
              className="w-full h-14 bg-[#2D7A7A] text-white rounded-lg font-semibold text-base shadow-md hover:shadow-lg transition-all duration-150 active:scale-95"
            >
              Place New Order
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#B8D4D4]">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-[#333333]">
            Order Confirmed!
          </h2>
          <p className="text-[#666666] mb-6">
            Your order has been sent to the kitchen.
          </p>

          <div className="bg-[#F5F5F5] rounded-lg p-4 mb-6">
            <p className="font-bold text-lg mb-1 text-[#333333]">
              {restaurantData?.name}
            </p>
            <p className="text-sm text-[#666666] mb-3">{tableData?.tableName}</p>

            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-sm text-[#666666]">Order ID:</span>
              <span className="text-sm font-mono font-bold text-[#333333]">
                {orderId?.slice(-8).toUpperCase()}
              </span>
            </div>

            <div
              className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold mb-3 ${getStatusColor(
                orderStatus
              )}`}
            >
              {getStatusText(orderStatus)}
            </div>

            <p className="text-xs text-[#666666]">
              Status updates automatically
            </p>
          </div>

          <button
            onClick={() => setOrderPlaced(false)}
            className="w-full h-14 bg-[#2D7A7A] text-white rounded-lg font-semibold text-base shadow-md hover:shadow-lg transition-all duration-150 active:scale-95"
          >
            Place Another Order
          </button>
        </div>
      </div>
    );
  }

  const cartCount = getCartItemCount();

  // Setup draggable cart handlers
  useEffect(() => {
    // Position cart near bottom-right on mount
    try {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setCartPosition({
        x: vw - 96,
        y: vh - 160,
      });
    } catch {
      // window not available (SSR) - ignore
    }
  }, []);

  useEffect(() => {
    if (!isDraggingCart) return;

    const handleMove = (event: MouseEvent) => {
      setCartPosition((prev) => {
        const x = event.clientX - dragOffset.x;
        const y = event.clientY - dragOffset.y;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const clampedX = Math.min(Math.max(8, x), vw - 88);
        const clampedY = Math.min(Math.max(80, y), vh - 88);

        return { x: clampedX, y: clampedY };
      });
    };

    const handleUp = () => {
      setIsDraggingCart(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingCart, dragOffset.x, dragOffset.y]);

  const handleCartDragStart = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;

    setIsDraggingCart(true);
    setDragOffset({
      x: clientX - cartPosition.x,
      y: clientY - cartPosition.y,
    });
  };

  const handleCartTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingCart) return;
    const touch = event.touches[0];
    setCartPosition((prev) => {
      const x = touch.clientX - dragOffset.x;
      const y = touch.clientY - dragOffset.y;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const clampedX = Math.min(Math.max(8, x), vw - 88);
      const clampedY = Math.min(Math.max(80, y), vh - 88);

      return { x: clampedX, y: clampedY };
    });
  };

  return (
    <div className="min-h-screen bg-[#B8D4D4]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-center">
          <h1 className="text-[28px] font-bold text-[#333333] text-center">
            {restaurantData?.name || "Menu"}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-12 pr-4 bg-[#F5F5F5] rounded-lg text-sm text-[#333333] placeholder-[#666666] focus:outline-none focus:ring-2 focus:ring-[#2D7A7A] transition-all"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="overflow-x-auto scrollbar-hide border-b border-[#F5F5F5]">
          <div className="flex px-4 gap-2 pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  if (category.id === "all") {
                    setSelectedCategory("all");
                  } else {
                    const section = menuSections.find(
                      (s) => s.id === category.id
                    );
                    if (section) {
                      setSelectedCategory(section.name.toLowerCase());
                    }
                  }
                }}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-lg transition-all duration-250 ${activeCategory === category.id
                  ? "bg-[#2D7A7A] text-white shadow-md"
                  : "bg-white text-[#666666] hover:bg-[#F5F5F5]"
                  }`}
                style={{ minHeight: "44px" }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Items Grid */}
      <main className="px-4 py-6 pb-24">
        {/* Active order status bar */}
        {existingOrderId &&
          !orderPlaced &&
          !["paid", "cancelled"].includes(orderStatus) && (
            <div className="mb-4 rounded-2xl bg-white/90 border border-[#2D7A7A]/10 shadow-sm px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#666666]">
                  Active Order
                </p>
                <p className="text-sm font-mono font-bold text-[#333333]">
                  #{existingOrderId.slice(-8).toUpperCase()}
                </p>
                <div className="mt-1 inline-flex items-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusColor(
                      orderStatus
                    )}`}
                  >
                    {getStatusText(orderStatus)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setOrderPlaced(true)}
                className="h-9 px-3 rounded-full bg-[#2D7A7A] text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-150 active:scale-95 whitespace-nowrap"
              >
                View Status
              </button>
            </div>
          )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#666666] text-base">No items found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredItemsBySection).map(([sectionId, items]) => {
              const section = menuSections.find((s) => s.id === sectionId);
              return (
                <div key={sectionId}>
                  {section && (
                    <h2 className="text-xl font-bold text-[#333333] mb-3 px-1">
                      {section.name}
                    </h2>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-250 cursor-pointer"
                        style={{
                          animation: `fadeIn 250ms ease-out ${index * 50}ms both`,
                        }}
                      >
                        <div className="relative w-full aspect-[4/3] overflow-hidden">
                          {item.image ? (
                            <img
                              src={`${API_BASE_URL}${item.image}`}
                              alt={item.name}
                              className="w-full h-full object-cover transition-transform duration-350 hover:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://via.placeholder.com/400x300?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center">
                              <span className="text-[#666666] text-sm">No Image</span>
                            </div>
                          )}
                        </div>

                        <div className="p-3 space-y-1">
                          <h3 className="text-base font-semibold text-[#333333] line-clamp-1">
                            {item.name}
                          </h3>

                          <div className="flex items-center gap-3 text-xs text-[#666666]">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>15-20 min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-[#FF6B35] text-[#FF6B35]" />
                              <span>4.5</span>
                            </div>
                          </div>

                          <p className="text-lg font-bold text-[#2D7A7A] pt-1">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => {
            if (selectedItem && itemQuantity[selectedItem.id] === 0) {
              setSelectedAddons((prev) => {
                const newAddons = { ...prev };
                delete newAddons[selectedItem.id];
                return newAddons;
              });
            }
            setSelectedItem(null);
          }}
          style={{ animation: "fadeIn 250ms ease-out" }}
        >
          <div
            className="bg-white w-full sm:max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 350ms ease-out" }}
          >
            {/* Hero Image */}
            <div className="relative w-full h-64 sm:h-80 overflow-hidden">
              {selectedItem.image ? (
                <img
                  src={`${API_BASE_URL}${selectedItem.image}`}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/800x600?text=No+Image";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center">
                  <span className="text-[#666666]">No Image</span>
                </div>
              )}
              <button
                onClick={() => {
                  if (selectedItem && itemQuantity[selectedItem.id] === 0) {
                    setSelectedAddons((prev) => {
                      const newAddons = { ...prev };
                      delete newAddons[selectedItem.id];
                      return newAddons;
                    });
                  }
                  setSelectedItem(null);
                }}
                className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md hover:bg-white transition-all"
              >
                <ChevronLeft className="w-6 h-6 text-[#333333]" />
              </button>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="text-2xl font-bold text-[#333333] flex-1">
                    {selectedItem.name}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-[#666666] shrink-0">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>15-20 min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-[#FF6B35] text-[#FF6B35]" />
                      <span>4.5</span>
                    </div>
                  </div>
                </div>

                <p className="text-2xl font-bold text-[#2D7A7A]">
                  {formatPrice(selectedItem.price)}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#666666] leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>

              {/* Addon Groups */}
              {selectedItem.addonGroups && selectedItem.addonGroups.length > 0 && (
                <div className="space-y-4">
                  {selectedItem.addonGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <h3 className="text-base font-semibold text-[#333333] mb-2">
                        {group.title}
                        {!group.multiSelect && (
                          <span className="text-xs text-[#666666] font-normal ml-2">
                            (Select one)
                          </span>
                        )}
                      </h3>
                      <div className="space-y-2">
                        {group.items.map((addon, addonIndex) => {
                          const isSelected = (selectedAddons[selectedItem.id] || []).some(
                            (a) => a.name === addon.name && a.price === addon.price
                          );
                          return (
                            <button
                              key={addonIndex}
                              onClick={() => toggleAddon(selectedItem.id, groupIndex, addon)}
                              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${isSelected
                                ? "border-[#2D7A7A] bg-[#2D7A7A]/10"
                                : "border-[#F5F5F5] bg-white hover:border-[#2D7A7A]/30"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                                      ? "border-[#2D7A7A] bg-[#2D7A7A]"
                                      : "border-[#666666]"
                                      }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                  </div>
                                  <span className="text-sm font-medium text-[#333333]">
                                    {addon.name}
                                  </span>
                                </div>
                                {addon.price > 0 && (
                                  <span className="text-sm font-semibold text-[#2D7A7A]">
                                    +{formatPrice(addon.price)}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recently Viewed */}
              {recentlyViewed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-[#333333] mb-3">
                    Recently Viewed
                  </h3>
                  <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                    {recentlyViewed.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="shrink-0 w-32 h-32 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        {item.image ? (
                          <img
                            src={`${API_BASE_URL}${item.image}`}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/140x140?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center">
                            <span className="text-[#666666] text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-[#F5F5F5] bg-white">
              {itemQuantity[selectedItem.id] > 0 ? (
                <div className="flex items-center justify-between bg-[#F5F5F5] rounded-lg p-2">
                  <button
                    onClick={() => handleRemoveFromCart(selectedItem)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-all active:scale-95"
                  >
                    <span className="text-xl font-bold text-[#333333]">−</span>
                  </button>
                  <span className="text-lg font-bold text-[#333333] px-4">
                    {itemQuantity[selectedItem.id]}
                  </span>
                  <button
                    onClick={() => handleAddToCart(selectedItem)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white transition-all active:scale-95"
                  >
                    <span className="text-xl font-bold text-[#333333]">+</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleAddToCart(selectedItem)}
                  className="w-full h-14 bg-[#2D7A7A] text-white rounded-lg font-semibold text-base shadow-md hover:shadow-lg transition-all duration-150 active:scale-95"
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Dialog */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowCart(false)}
          style={{ animation: "fadeIn 250ms ease-out" }}
        >
          <div
            className="bg-white w-full sm:max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 350ms ease-out" }}
          >
            <div className="px-6 py-4 border-b border-[#F5F5F5] flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#333333]">Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] transition-all"
              >
                <X className="w-6 h-6 text-[#333333]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {existingOrderId && (
                <p className="text-xs text-[#666666] mb-3">
                  You already have an active order. You can add more items, but
                  you{" "}
                  <span className="font-semibold">
                    can&apos;t reduce or remove existing items.
                  </span>
                </p>
              )}
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[#666666]">
                  Your cart is empty
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#F5F5F5] rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-[#333333]">
                            {item.name}
                          </h4>
                          <p className="text-xs text-[#2D7A7A] font-semibold">
                            {formatPrice(item.price)} each
                          </p>
                          {item.addons.length > 0 && (
                            <div className="space-y-0.5 mt-1">
                              {item.addons.map((addon, idx) => (
                                <div
                                  key={idx}
                                  className="text-xs text-[#666666]"
                                >
                                  + {addon.name}
                                  {addon.price > 0 &&
                                    ` (+${formatPrice(addon.price)})`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            !existingOrderId && onRemoveFromCart(item.id)
                          }
                          disabled={!!existingOrderId}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4 text-[#333333]" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              !existingOrderId &&
                              onUpdateQuantity(item.id, -1)
                            }
                            disabled={!!existingOrderId}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#666666] hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <span className="text-[#333333]">−</span>
                          </button>
                          <span className="w-8 text-center font-bold text-[#333333]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#666666] hover:bg-white transition-all"
                          >
                            <span className="text-[#333333]">+</span>
                          </button>
                        </div>
                        <p className="font-bold text-[#333333]">
                          {formatPrice(getItemTotal(item))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[#F5F5F5] px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#333333]">Total:</span>
                  <span className="text-2xl font-bold text-[#2D7A7A]">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>

                <button
                  onClick={async () => {
                    await onPlaceOrder();
                    setShowCart(false);
                  }}
                  disabled={isPlacingOrder || isUpdatingOrder}
                  className="w-full h-14 bg-[#2D7A7A] text-white rounded-lg font-semibold text-base shadow-md hover:shadow-lg transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPlacingOrder || isUpdatingOrder ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <div
          className="fixed z-40 md:z-50"
          style={{
            bottom: "20px",
            right: "20px",
            top: "auto",
            left: "auto",
          }}
          onMouseDown={handleCartDragStart}
          onTouchStart={handleCartDragStart}
          onTouchMove={handleCartTouchMove}
        >
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center justify-center w-16 h-16 md:w-14 md:h-14 rounded-full bg-[#2D7A7A] text-white shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-150"
            aria-label="View cart"
          >
            <ShoppingCart className="w-7 h-7 md:w-6 md:h-6" />
            <span className="absolute -top-1 -right-1 bg-[#FF6B35] text-white text-xs font-semibold rounded-full w-6 h-6 md:w-5 md:h-5 flex items-center justify-center">
              {cartCount}
            </span>
          </button>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        button {
          min-width: 44px;
          min-height: 44px;
        }
      `}</style>
    </div>
  );
};

export default MenuTemplate;