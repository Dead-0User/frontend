import { useState } from "react";
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
  templateStyle?: string;
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
    canUpdateOrder,
    isPlacingOrder,
    isUpdatingOrder,
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
    setSelectedCategory,
    setShowVegOnly,
    setSearchQuery,
    getItemTotal,
    getCartTotal,
    getCartItemCount,
    formatPrice,
  } = props;

  const [showCart, setShowCart] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  if (loading) {
    return (
      <div className="theme-clean min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading menu...</p>
        </div>
      </div>
    );
  }

  const categories = [
    { name: "all", label: "All" },
    ...menuSections.map((section) => ({
      name: section.id,
      label: section.name,
    })),
  ];

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

  const handleAddToCart = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (item.addonGroups && item.addonGroups.length > 0) {
      setSelectedItem(item);
      setSelectedAddons([]);
    } else {
      onAddToCart(item, []);
    }
  };

  const confirmAddToCart = () => {
    if (selectedItem) {
      onAddToCart(selectedItem, selectedAddons);
      setSelectedItem(null);
      setSelectedAddons([]);
    }
  };

  const toggleAddon = (addon: Addon, group: AddonGroup) => {
    if (group.multiSelect) {
      const exists = selectedAddons.find((a) => a.name === addon.name);
      if (exists) {
        setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
      } else {
        setSelectedAddons([...selectedAddons, addon]);
      }
    } else {
      const groupAddons = group.items.map((item) => item.name);
      const filteredAddons = selectedAddons.filter(
        (a) => !groupAddons.includes(a.name)
      );
      setSelectedAddons([...filteredAddons, addon]);
    }
  };

  const isAddonSelected = (addon: Addon) => {
    return selectedAddons.some((a) => a.name === addon.name);
  };

  if (orderPlaced) {
    return (
      <div className="theme-clean min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-10 text-center bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Check className="w-14 h-14 text-white" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
              Order Confirmed
            </h2>
            <p className="text-gray-500 font-medium">#{orderId?.slice(-6)}</p>
          </div>
          <div className="mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Status</p>
            <p className="text-xl font-bold text-gray-900 capitalize">
              {orderStatus}
            </p>
          </div>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Your order has been sent to the kitchen. We'll have it ready for you soon!
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 rounded-2xl transition-all duration-300 hover:shadow-lg"
          >
            Order More
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-clean min-h-screen bg-white">
      {/* Header - Glassmorphic */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center shadow-md">
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white rounded-lg"></div>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {restaurantData?.name || "Restaurant"}
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  {tableData ? `Table ${tableData.tableName} · ${tableData.seats} seats` : "Welcome"}
                </p>
              </div>
            </div>
            <button
              onClick={onCallWaiter}
              disabled={isCallingWaiter || waiterCalled}
              className={`p-3.5 rounded-xl transition-all duration-300 ${waiterCalled
                  ? "bg-gray-900 shadow-lg"
                  : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                }`}
            >
              <Bell className={`w-5 h-5 ${waiterCalled ? "text-white" : "text-gray-900"}`} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3 pb-5">
            <div className="relative flex-1 group">
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-gray-900 transition-colors" />
            </div>
            <button className="p-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl transition-all">
              <SlidersHorizontal className="w-5 h-5 text-gray-900" />
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-2.5 overflow-x-auto pb-5 scrollbar-hide -mx-4 px-4">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`px-5 py-2.5 rounded-full font-semibold whitespace-nowrap transition-all duration-300 text-sm ${selectedCategory === category.name
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Order Banner */}
      {existingOrderId && !orderPlaced && !['paid', 'cancelled'].includes(orderStatus) && (
        <div className="px-4 pt-5 pb-2">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center shadow-sm">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Active Order</p>
                    <p className="text-sm text-gray-500 font-medium">
                      #{existingOrderId?.slice(-8).toUpperCase()}
                    </p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${orderStatus === 'pending' ? 'bg-gray-900 text-white' :
                        orderStatus === 'preparing' ? 'bg-gray-700 text-white' :
                          orderStatus === 'ready' ? 'bg-gray-900 text-white' :
                            'bg-gray-100 text-gray-700'
                      }`}>
                      {orderStatus === 'pending' ? 'Order Received' :
                        orderStatus === 'preparing' ? 'Preparing' :
                          orderStatus === 'ready' ? 'Ready' :
                            orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCart(true)}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-black transition-all shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => props.setOrderPlaced(true)}
                    className="px-5 py-2.5 bg-white text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all border border-gray-200"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 pb-32 pt-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
                {selectedCategory === "all" ? "All Dishes" : categories.find(c => c.name === selectedCategory)?.label}
              </h2>
              <p className="text-gray-500 font-medium">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} available
              </p>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => handleAddToCart(item)}
                className="group bg-white rounded-3xl overflow-hidden shadow-[0_2px_8px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer transition-all duration-500 border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
                style={{
                  animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`,
                }}
              >
                {/* Image Container */}
                <div className="relative h-52 bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden">
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white shadow-md hover:shadow-lg hover:scale-110 transition-all duration-300 border border-gray-100"
                  >
                    <Heart
                      className={`w-4 h-4 transition-all duration-300 ${favorites.has(item.id)
                          ? "fill-gray-900 text-gray-900"
                          : "text-gray-400"
                        }`}
                    />
                  </button>

                  {/* Veg/Non-veg Badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border-2 ${item.isVeg ? "border-green-600" : "border-red-600"
                        } bg-white shadow-sm`}
                    >
                      <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"
                        }`}></div>
                    </div>
                  </div>

                  {/* Image or Placeholder */}
                  {item.image ? (
                    <img
                      src={`${API_BASE_URL}${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-gray-200 rounded-full opacity-30 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="absolute inset-4 bg-gray-300 rounded-full opacity-40 group-hover:scale-110 transition-transform duration-500 delay-75"></div>
                        <div className="absolute inset-8 bg-gray-400 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500 delay-150"></div>
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-gray-700 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Price & Rating Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(item.price)}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                      <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                      <span className="text-sm font-bold text-gray-900">4.8</span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item, e);
                    }}
                    className="w-full py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-md hover:shadow-lg"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-24">
              <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-gray-100">
                <Search className="w-16 h-16 text-gray-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No dishes found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-8 right-8 z-50 p-5 bg-gray-900 hover:bg-black text-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.4)] transition-all duration-300 hover:scale-105"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-white text-gray-900 text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-gray-900">
            {getCartItemCount()}
          </span>
        </button>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {selectedItem.name}
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {selectedItem.image ? (
                <div className="rounded-2xl overflow-hidden mb-6 h-64 bg-gradient-to-br from-gray-50 to-gray-100">
                  <img
                    src={`${API_BASE_URL}${selectedItem.image}`}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden mb-6 h-64 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                </div>
              )}

              <p className="text-gray-600 mb-4 leading-relaxed">{selectedItem.description}</p>
              <div className="text-3xl font-bold text-gray-900 mb-6">
                {formatPrice(selectedItem.price)}
              </div>

              {selectedItem.addonGroups.map((group, idx) => (
                <div key={idx} className="mb-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-2.5">
                    {group.items.map((addon, addonIdx) => (
                      <div
                        key={addonIdx}
                        onClick={() => toggleAddon(addon, group)}
                        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${isAddonSelected(addon)
                            ? "bg-gray-900 text-white border-gray-900 shadow-md"
                            : "bg-gray-50 text-gray-900 border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <span className="font-semibold">{addon.name}</span>
                        <span className="font-bold">
                          +{formatPrice(addon.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={confirmAddToCart}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-md hover:shadow-lg"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="sticky top-0 bg-gray-900 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Your Cart</h2>
                  <p className="text-sm text-white/80">
                    {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="overflow-y-auto max-h-[50vh] p-6">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gray-100">
                    <ShoppingCart className="w-12 h-12 text-gray-300" />
                  </div>
                  <p className="text-xl font-bold text-gray-900">Your cart is empty</p>
                  <p className="text-gray-500 mt-2">Add some delicious items!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      {/* Item Image */}
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{restaurantData?.name}</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 bg-white rounded-xl p-2 shadow-sm">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-8 h-8 bg-gray-900 hover:bg-black rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        >
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        <span className="font-bold text-gray-900 w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-8 h-8 bg-gray-900 hover:bg-black rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveFromCart(item.id)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                      >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-900" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Checkout */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                {/* Customer Info */}
                <div className="space-y-3 mb-6">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                  />
                  <textarea
                    placeholder="Special instructions (optional)"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 resize-none transition-all"
                    rows={2}
                  />
                </div>

                {/* Totals */}
                <div className="space-y-3 mb-6 p-5 bg-white rounded-2xl border border-gray-100">
                  <div className="flex justify-between text-gray-900">
                    <span className="text-base font-medium">Subtotal</span>
                    <span className="text-base font-bold">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between text-gray-900">
                    <span className="text-base font-medium">Delivery</span>
                    <span className="text-base font-bold">
                      {formatPrice(0)}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100"></div>
                  <div className="flex justify-between text-gray-900">
                    <span className="text-xl font-bold">Total</span>
                    <span className="text-xl font-bold">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={async () => {
                    await onPlaceOrder();
                    setShowCart(false);
                  }}
                  disabled={isPlacingOrder || isUpdatingOrder}
                  className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {isPlacingOrder || isUpdatingOrder
                    ? "Processing..."
                    : "Place Order"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            transform: translateY(100%);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default TemplateMinimal