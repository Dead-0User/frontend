import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
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
  Bell,
  Filter
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { API_BASE_URL } from "@/config";

// Import types from container
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
  dietaryFilter: 'all' | 'veg' | 'non-veg';
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
  setDietaryFilter: (filter: 'all' | 'veg' | 'non-veg') => void;
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
    // showVegOnly, // Deprecated in this template
    dietaryFilter,
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
    // setShowVegOnly, // Deprecated in this template
    setDietaryFilter,
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

        let matchesDietary = true;
        if (dietaryFilter === 'veg') matchesDietary = item.isVeg;
        if (dietaryFilter === 'non-veg') matchesDietary = !item.isVeg;

        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = applyPriceFilter(item.price);
        return matchesCategory && matchesDietary && matchesSearch && matchesPrice;
      })
    })).filter(section => section.items.length > 0);
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setDietaryFilter("all");
    setPriceFilter("all");
    setSearchQuery("");
  };

  const activeFiltersCount = (): number => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedCategory !== "all") count++;
    if (dietaryFilter !== "all") count++;
    if (priceFilter !== "all") count++;
    if (searchQuery) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-secondary/30 flex justify-center">
        <div className="w-full max-w-[400px] h-full relative bg-background flex flex-col items-center justify-center border-x shadow-2xl">
          <div className="text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground">Loading Menu...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    if (['paid', 'cancelled'].includes(orderStatus)) {
      return (
        <div className="fixed inset-0 bg-secondary/30 flex justify-center">
          <div className="w-full max-w-[400px] h-full relative bg-background flex flex-col items-center justify-center p-4 border-x shadow-2xl">
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
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-secondary/30 flex justify-center">
        <div className="w-full max-w-[400px] h-full relative bg-background flex flex-col items-center justify-center p-4 border-x shadow-2xl">
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
      </div>
    );
  }

  const filteredMenu = getFilteredMenu();

  return (
    <div className="fixed inset-0 bg-secondary/30 flex justify-center">
      <div className="w-full max-w-[400px] h-full relative bg-background flex flex-col overflow-hidden border-x shadow-2xl">
        <div className="flex-1 overflow-y-auto pb-32">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary p-2 rounded-lg">
                    <Utensils className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>

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

            {/* Search and Filter */}
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={dietaryFilter !== 'all' ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10 flex-shrink-0"
                  >
                    <Filter className="h-4 w-4" />
                    {dietaryFilter !== 'all' && (
                      <span className="absolute top-[-4px] right-[-4px] h-3 w-3 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white border border-background">
                        1
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={dietaryFilter} onValueChange={(value) => setDietaryFilter(value as 'all' | 'veg' | 'non-veg')}>
                    <DropdownMenuRadioItem value="all">
                      All Items
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="veg">
                      Veg
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="non-veg">
                      Non-Veg
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>





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
                          allowOrdering={tableData?.allowOrdering !== false}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Floating Cart Button */}
          {cart.length > 0 && tableData?.allowOrdering !== false && (
            <div className="absolute bottom-4 left-4 right-4 z-50">
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

          {/* Cart Dialog - Custom Overlay */}
          {showCart && (
            <div className="absolute inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Your Order</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{getCartItemCount()}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

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
                            onClick={() => {
                              if (!item.committedQuantity || item.committedQuantity === 0) {
                                onRemoveFromCart(item.id);
                              }
                            }}
                            disabled={!!item.committedQuantity && item.committedQuantity > 0}
                            className="h-8 w-8 disabled:opacity-30"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                if (item.quantity > (item.committedQuantity || 0)) {
                                  onUpdateQuantity(item.id, -1);
                                }
                              }}
                              disabled={item.quantity <= (item.committedQuantity || 0)}
                              className="h-8 w-8 disabled:opacity-30"
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
                <div className="border-t px-4 py-4 space-y-3 mt-auto bg-background">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, selectedAddons: Addon[]) => void;
  formatPrice: (price: number) => string;
  allowOrdering: boolean;
}

const MenuItemCard = ({ item, onAddToCart, formatPrice, allowOrdering }: MenuItemCardProps) => {
  const [selectedAddons, setSelectedAddons] = useState<Record<number, Addon[]>>({});
  const [showAddons, setShowAddons] = useState<boolean>(false);

  const hasAddonGroups = item.addonGroups?.length > 0;

  const toggleAddon = (groupIndex: number, addon: Addon) => {
    const group = item.addonGroups[groupIndex];

    setSelectedAddons(prev => {
      const currentGroupAddons = prev[groupIndex] || [];

      if (group.multiSelect) {
        const currentQty = currentGroupAddons.filter(a => a.name === addon.name).length;
        const maxQty = addon.maxQuantity || 1;

        if (currentQty < maxQty) {
          return {
            ...prev,
            [groupIndex]: [...currentGroupAddons, addon]
          };
        } else {
          return {
            ...prev,
            [groupIndex]: currentGroupAddons.filter(a => a.name !== addon.name)
          };
        }
      } else {
        // Single select logic
        const isSelected = currentGroupAddons.some(a => a.name === addon.name);
        if (isSelected) {
          return {
            ...prev,
            [groupIndex]: []
          };
        } else {
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
          {item.image && (
            <div className="w-full h-40 relative">
              <img
                src={`${API_BASE_URL}${item.image}`}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              <div className={`absolute top-2 left-2 w-6 h-6 border-2 flex items-center justify-center ${item.isVeg ? 'bg-white border-green-600' : 'bg-white border-red-600'
                }`}>
                <div className={`w-3 h-3 ${item.isVeg ? 'bg-green-600 rounded-full' : 'bg-red-600'}`} />
              </div>
              <div className="absolute top-2 right-2 bg-primary/90 px-2 py-1 rounded-lg">
                <p className="text-sm font-bold text-primary-foreground">{formatPrice(item.price)}</p>
              </div>
            </div>
          )}

          <div className="p-3">
            <h3 className="font-bold mb-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

            {showAddons && hasAddonGroups && (
              <div className="mb-3 space-y-3">
                {item.addonGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm">{group.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {group.multiSelect ? 'Multi-select' : 'Choose one'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {group.items.map((addon, addonIndex) => (
                        <div
                          key={addonIndex}
                          className="flex items-center justify-between p-2 bg-background rounded border cursor-pointer hover:border-primary transition-colors"
                          onClick={() => toggleAddon(groupIndex, addon)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isAddonSelected(groupIndex, addon) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'
                              }`}>
                              {isAddonSelected(groupIndex, addon) && <Check className="h-3 w-3" />}
                            </div>
                            <span className="text-sm font-medium">{addon.name}</span>
                          </div>
                          {addon.price > 0 && (
                            <span className="text-xs text-muted-foreground">+{formatPrice(addon.price)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allowOrdering ? (
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    if (hasAddonGroups && !showAddons) {
                      setShowAddons(true);
                    } else {
                      handleAddToCart();
                    }
                  }}
                  className="w-full"
                  variant="default"
                >
                  {/* <Plus className="h-4 w-4 mr-2" /> */}
                  {/* User asked for + while increasing quantity. Let's keep Plus icon for base state, maybe Check for confirm? */}
                  {showAddons ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Add to Order • {formatPrice(getItemTotalWithAddons())}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add • {formatPrice(item.price)}
                    </>
                  )}
                </Button>
              </div>
            ) : hasAddonGroups ? (
              <div className="space-y-2">
                <Button
                  onClick={() => setShowAddons(!showAddons)}
                  className="w-full"
                  variant="outline"
                >
                  {showAddons ? "Hide Options" : "View Options"}
                </Button>
              </div>
            ) : null}


          </div>
        </div>
      </CardContent >
    </Card >
  );
};

export default TemplateClassic;