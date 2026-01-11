import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  Minus,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Utensils,
  User,
  MessageSquare,
  Check,
  Search,
  X,
  ChevronRight,
  Leaf,
  DollarSign,
  SlidersHorizontal,
  Bell
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { API_BASE_URL } from "@/config";

// Import types from container
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

const TemplateClassic = (props: TemplateProps) => {
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
    priceFilter,
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
    setPriceFilter,
    setShowFilters,
    getItemTotal,
    getCartTotal,
    getCartItemCount,
    formatPrice,
  } = props;
  const { currency } = useCurrency();

  const [showCart, setShowCart] = useState<boolean>(false);

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
      case "preparing": return "Preparing Your Order";
      case "ready": return "Order Ready";
      case "served": return "Served";
      case "paid": return "Payment Complete";
      case "cancelled": return "Cancelled";
      default: return "Processing";
    }
  };

  const applyPriceFilter = (price: number): boolean => {
    if (priceFilter === "all") return true;
    if (priceFilter === "under10") return price < 10;
    if (priceFilter === "10to20") return price >= 10 && price <= 20;
    if (priceFilter === "over20") return price > 20;
    return true;
  };

  const getFilteredMenu = (): MenuSection[] => {
    return menuSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        const matchesCategory = selectedCategory === "all" || section.name.toLowerCase().includes(selectedCategory.toLowerCase());
        const matchesVeg = !showVegOnly || item.isVeg;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = applyPriceFilter(item.price);
        return matchesCategory && matchesVeg && matchesSearch && matchesPrice;
      })
    })).filter(section => section.items.length > 0);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setShowVegOnly(false);
    setPriceFilter("all");
    setSearchQuery("");
  };

  const activeFiltersCount = (): number => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (showVegOnly) count++;
    if (priceFilter !== "all") count++;
    if (searchQuery) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Loading Menu...</h2>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    if (['paid', 'cancelled'].includes(orderStatus)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="p-8">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {orderStatus === 'paid' ? 'Order Completed!' : 'Order Cancelled'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {orderStatus === 'paid'
                  ? 'Thank you for dining with us!'
                  : 'This order has been cancelled.'}
              </p>

              <Button
                onClick={() => {
                  setOrderPlaced(false);
                  setOrderId(null);
                  setOrderStatus("pending");
                }}
                className="w-full"
              >
                Place New Order
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
            <p className="text-muted-foreground mb-6">Your order has been sent to the kitchen.</p>

            <div className="bg-secondary rounded-lg p-4 mb-6">
              <p className="font-bold text-lg mb-1">{restaurantData?.name}</p>
              <p className="text-sm text-muted-foreground mb-3">{tableData?.tableName}</p>

              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-sm">Order ID:</span>
                <span className="text-sm font-mono font-bold">
                  {orderId?.slice(-8).toUpperCase()}
                </span>
              </div>

              <Badge className={`${getStatusColor(orderStatus)} mb-3`}>
                {getStatusText(orderStatus)}
              </Badge>

              <p className="text-xs text-muted-foreground">Status updates automatically</p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={onCallWaiter}
                disabled={isCallingWaiter || waiterCalled}
                variant="outline"
                className="w-full"
              >
                {isCallingWaiter ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calling...
                  </>
                ) : waiterCalled ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Waiter Notified!
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Call Waiter
                  </>
                )}
              </Button>

              <Button
                onClick={() => setOrderPlaced(false)}
                className="w-full"
              >
                Place Another Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredMenu = getFilteredMenu();

  return (
    <div className="min-h-screen pb-32 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Utensils className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{restaurantData?.name}</h1>
                <p className="text-sm text-muted-foreground">{tableData?.tableName}</p>
              </div>
            </div>
            <Button
              onClick={onCallWaiter}
              disabled={isCallingWaiter || waiterCalled}
              variant={waiterCalled ? "success" : "outline"}
              size="sm"
            >
              {isCallingWaiter ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : waiterCalled ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Called
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-1" />
                  Call Waiter
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Existing Order Banner */}
        {existingOrderId && !orderPlaced && !['paid', 'cancelled'].includes(orderStatus) && (
          <Card className="mb-4 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Active Order</p>
                    <p className="text-sm text-muted-foreground">
                      #{existingOrderId?.slice(-8).toUpperCase()}
                    </p>
                    <Badge className={`${getStatusColor(orderStatus)} text-xs mt-1`}>
                      {getStatusText(orderStatus)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCart(true)} size="sm">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button onClick={() => setOrderPlaced(true)} variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          <Button
            onClick={() => setShowVegOnly(!showVegOnly)}
            variant={showVegOnly ? "success" : "outline"}
            size="sm"
          >
            <Leaf className="h-4 w-4 mr-1" />
            Veg Only
          </Button>

          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "default" : "outline"}
            size="sm"
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            Filters
            {activeFiltersCount() > 0 && (
              <Badge className="ml-1 h-4 w-4 p-0 text-xs">
                {activeFiltersCount()}
              </Badge>
            )}
          </Button>

          {activeFiltersCount() > 0 && (
            <Button onClick={clearFilters} variant="ghost" size="sm">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <label className="text-sm font-semibold mb-2 block">Price Range</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={priceFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriceFilter("all")}
                >
                  All Prices
                </Button>
                <Button
                  variant={priceFilter === "under10" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriceFilter("under10")}
                >
                  Under {currency.symbol}10
                </Button>
                <Button
                  variant={priceFilter === "10to20" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriceFilter("10to20")}
                >
                  {currency.symbol}10 - {currency.symbol}20
                </Button>
                <Button
                  variant={priceFilter === "over20" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriceFilter("over20")}
                >
                  Over {currency.symbol}20
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-3 mb-6">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className="whitespace-nowrap"
          >
            All Items
          </Button>
          {menuSections.map((section) => (
            <Button
              key={section.id}
              variant={selectedCategory === section.name.toLowerCase() ? "default" : "outline"}
              onClick={() => setSelectedCategory(section.name.toLowerCase())}
              className="whitespace-nowrap"
            >
              {section.name}
            </Button>
          ))}
        </div>

        {/* Menu Items */}
        {filteredMenu.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">No items found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters</p>
              {activeFiltersCount() > 0 && (
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {filteredMenu.map((section) => (
              <div key={section.id}>
                <h2 className="text-xl font-bold mb-4">{section.name}</h2>

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

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Button
            onClick={() => setShowCart(true)}
            size="lg"
            className="w-full h-14"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Cart ({getCartItemCount()})
            <span className="ml-auto">{formatPrice(getCartTotal())}</span>
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="w-full h-full max-w-full max-h-full m-0 rounded-none p-0 flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Your Order</span>
              </div>
              <Badge>{getCartItemCount()}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Your cart is empty
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{item.name}</h4>
                        <p className="text-xs text-primary font-semibold">{formatPrice(item.price)} each</p>
                        {item.addons.length > 0 && (
                          <div className="space-y-0.5 mt-1">
                            {item.addons.map((addon, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground">
                                + {addon.name} {addon.price > 0 && `(+${formatPrice(addon.price)})`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onRemoveFromCart(item.id)}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="h-8 w-8"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="h-8 w-8"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-bold">{formatPrice(getItemTotal(item))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t px-4 py-4 space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Your Name (Optional)</label>
                <Input
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Special Instructions</label>
                <Textarea
                  placeholder="Any special requests..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="bg-secondary rounded-lg p-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>

                <Button
                  onClick={onPlaceOrder}
                  disabled={isPlacingOrder || isUpdatingOrder}
                  className="w-full"
                >
                  {isPlacingOrder || isUpdatingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {existingOrderId && !['paid', 'cancelled'].includes(orderStatus) ? 'Update Order' : 'Place Order'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, selectedAddons: Addon[]) => void;
  formatPrice: (price: number) => string;
}

const MenuItemCard = ({ item, onAddToCart, formatPrice }: MenuItemCardProps) => {
  const [selectedAddons, setSelectedAddons] = useState<Record<number, Addon[]>>({});
  const [showAddons, setShowAddons] = useState<boolean>(false);

  const hasAddonGroups = item.addonGroups?.length > 0;

  const toggleAddon = (groupIndex: number, addon: Addon) => {
    const group = item.addonGroups[groupIndex];

    setSelectedAddons(prev => {
      const currentGroupAddons = prev[groupIndex] || [];

      if (group.multiSelect) {
        const exists = currentGroupAddons.find(a => a.name === addon.name);
        if (exists) {
          return {
            ...prev,
            [groupIndex]: currentGroupAddons.filter(a => a.name !== addon.name)
          };
        } else {
          return {
            ...prev,
            [groupIndex]: [...currentGroupAddons, addon]
          };
        }
      } else {
        const isSame = currentGroupAddons[0]?.name === addon.name;
        return {
          ...prev,
          [groupIndex]: isSame ? [] : [addon]
        };
      }
    });
  };

  const isAddonSelected = (groupIndex: number, addon: Addon): boolean => {
    const groupAddons = selectedAddons[groupIndex] || [];
    return groupAddons.some(a => a.name === addon.name);
  };

  const handleAddToCart = () => {
    const allSelectedAddons = Object.values(selectedAddons).flat();
    onAddToCart(item, allSelectedAddons);
    setSelectedAddons({});
    setShowAddons(false);
  };

  const getItemTotalWithAddons = (): number => {
    const allSelectedAddons = Object.values(selectedAddons).flat();
    const addonsTotal = allSelectedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0);
    return item.price + addonsTotal;
  };

  const getSelectedAddonsCount = (): number => {
    return Object.values(selectedAddons).flat().length;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col">
          <div className="w-full h-40 relative">
            {item.image ? (
              <img
                src={`${API_BASE_URL}${item.image}`}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <Utensils className="h-10 w-10 text-muted-foreground/50" />
              </div>
            )}
            <div className={`absolute top-2 left-2 w-6 h-6 rounded-lg border-3 flex items-center justify-center ${item.isVeg ? 'bg-white border-green-600' : 'bg-white border-red-600'
              }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'
                }`} />
            </div>
            <div className="absolute top-2 right-2 bg-primary/90 px-2 py-1 rounded-lg">
              <p className="text-sm font-bold text-primary-foreground">{formatPrice(item.price)}</p>
            </div>
          </div>

          <div className="p-3">
            <h3 className="font-bold mb-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

            <div className="space-y-2">
              {hasAddonGroups && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddons(!showAddons)}
                  className="w-full"
                >
                  {showAddons ? 'Hide Options' : 'Customize'}
                  {getSelectedAddonsCount() > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0">
                      {getSelectedAddonsCount()}
                    </Badge>
                  )}
                  <ChevronRight className={`h-4 w-4 ml-1 ${showAddons ? 'rotate-90' : ''}`} />
                </Button>
              )}
              <Button
                onClick={handleAddToCart}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add • {formatPrice(getItemTotalWithAddons())}
              </Button>
            </div>

            {showAddons && hasAddonGroups && (
              <div className="mt-3 space-y-3">
                {item.addonGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm">{group.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {group.multiSelect ? 'Multi-select' : 'Choose one'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {group.items.map((addon, addonIndex) => (
                        <label
                          key={addonIndex}
                          className="flex items-center justify-between cursor-pointer hover:bg-card p-2 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type={group.multiSelect ? "checkbox" : "radio"}
                              name={`addon-group-${groupIndex}`}
                              checked={isAddonSelected(groupIndex, addon)}
                              onChange={() => toggleAddon(groupIndex, addon)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{addon.name}</span>
                          </div>
                          <span className="text-sm font-bold text-primary">
                            {addon.price > 0 ? `+${formatPrice(addon.price)}` : 'Free'}
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
      </CardContent>
    </Card>
  );
};

export default TemplateClassic;