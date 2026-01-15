import { useState, useEffect, useCallback, useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import TemplateClassic from "@/templates/TemplateClassic";
import TemplateModern from "@/templates/TemplateModern";
import TemplateMinimal from "@/templates/TemplateMinimal";
import TemplateBurgerBooch from "@/templates/TemplateBurgerBooch";

// Use the same API base URL strategy as the dashboard/staff pages
// so this works both locally and in deployed environments.
import { API_BASE_URL as BASE_URL } from "@/config";

// Use the same API base URL strategy as the dashboard/staff pages
const API_BASE_URL = `${BASE_URL}/api`;

// TypeScript interfaces
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
  templateStyle?: string;
  phone?: string;
  openingHours?: Record<string, string>;
  operationalHours?: string | DayHours[];
}

interface DayHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
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

const CustomerPageContainer = () => {
  const { formatPrice } = useCurrency();

  const getTableIdFromUrl = () => {
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    const tableId = pathSegments[pathSegments.length - 1];

    if (!tableId || tableId === "order" || tableId === "customer") {
      console.error("Invalid tableId extracted from URL");
      return null;
    }

    return tableId;
  };

  const [tableId] = useState<string | null>(getTableIdFromUrl());
  const [loading, setLoading] = useState<boolean>(true);
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(
    null
  );
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [existingOrderId, setExistingOrderId] = useState<string | null>(null);
  const [canUpdateOrder, setCanUpdateOrder] = useState<boolean>(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<boolean>(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState<boolean>(false);
  const [waiterCalled, setWaiterCalled] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showVegOnly, setShowVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    const loadMenuData = async () => {
      try {
        setLoading(true);

        if (!tableId) {
          console.error("❌ No valid tableId found in URL, skipping menu load");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/menu/table/${tableId}`);
        const data = await response.json();

        if (data.success) {
          console.log("📦 API Response - Restaurant Data:", data.data.restaurant);
          console.log("🕒 Operational Hours Raw:", data.data.restaurant.operationalHours);
          console.log("🎨 Template Style from API:", data.data.restaurant?.templateStyle);

          const sectionsWithAddons: MenuSection[] = (data.data.menu || []).map(
            (section: any) => {
              const normalizedItems: MenuItem[] = (section.items || []).map(
                (item: any) => ({
                  // Prefer explicit fields from API but fall back when missing
                  id: item.id || item._id,
                  name: item.name,
                  description: item.description || "",
                  price: item.price,
                  isVeg: item.isVeg ?? false,
                  // If isActive is missing, treat item as active so it shows up
                  isActive: item.isActive ?? true,
                  image: item.image,
                  addonGroups: Array.isArray(item.addonGroups)
                    ? item.addonGroups
                    : [],
                  sequence: item.sequence ?? 0,
                  sectionId:
                    typeof item.sectionId === "object"
                      ? item.sectionId._id || item.sectionId.id
                      : item.sectionId,
                })
              );

              return {
                id: section.id || section._id,
                name:
                  section.name ||
                  section.sectionName ||
                  section.title ||
                  "Menu",
                items: normalizedItems,
                sequence: section.sequence ?? 0,
              };
            }
          );

          setRestaurantData(data.data.restaurant);
          setTableData(data.data.table);
          setMenuSections(sectionsWithAddons);
        } else {
          console.error("❌ API Error:", data.message);
        }
      } catch (error) {
        console.error("❌ Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMenuData();
  }, [tableId]);

  const checkExistingOrder = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/table/${tableId}/active`
      );
      const data = await response.json();

      if (data.success && data.data) {
        const orderData = data.data;
        setExistingOrderId(orderData._id);
        setOrderId(orderData._id);
        setOrderStatus(orderData.status);
        setCanUpdateOrder(["pending", "preparing"].includes(orderData.status));

        if (["paid", "cancelled"].includes(orderData.status)) {
          setExistingOrderId(null);
          setOrderId(null);
        } else {
          interface OrderItem {
            menuItemId?: string;
            _id?: string;
            name: string;
            price: number;
            quantity: number;
            addons?: Array<string | { name: string; price: number }>;
            isVeg?: boolean;
            isRemoved?: boolean;
          }

          const existingCartItems: CartItem[] = (
            (orderData.items || []) as OrderItem[]
          )
            .filter((item) => !item.isRemoved)
            .map((item) => ({
              id: `${item.menuItemId || item._id
                }-${Date.now()}-${Math.random()}`,
              menuItemId: (item.menuItemId || item._id) as string,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              addons: (item.addons || []).map((addon) =>
                typeof addon === "string" ? { name: addon, price: 0 } : addon
              ),
              isVeg: item.isVeg,
              committedQuantity: item.quantity,
            }));

          if (cart.length === 0) {
            setCart(existingCartItems);
          }
        }
      }
    } catch (error) {
      console.error("Error checking existing order:", error);
    }
  }, [tableId, cart.length]);

  useEffect(() => {
    checkExistingOrder();
  }, [checkExistingOrder]);

  useEffect(() => {
    if (!orderId) return;

    const pollOrderStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/orders/customer/${orderId}/status`
        );
        const data = await response.json();

        if (data.success) {
          const newStatus = data.data.status;
          setOrderStatus(newStatus);
          setCanUpdateOrder(["pending", "preparing"].includes(newStatus));

          if (["paid", "cancelled"].includes(newStatus)) {
            setExistingOrderId(null);

            if (orderPlaced) {
              setTimeout(() => {
                setOrderId(null);
                setOrderPlaced(false);
              }, 5000);
            } else {
              setOrderId(null);
            }
          }
        }
      } catch (error) {
        console.error("Error polling order status:", error);
      }
    };

    const interval = setInterval(pollOrderStatus, 3000);
    pollOrderStatus();

    return () => clearInterval(interval);
  }, [orderId, orderPlaced]);

  const addToCart = (item: MenuItem, selectedAddons: Addon[] = []) => {
    const addonKey = JSON.stringify(selectedAddons.map((a) => a.name).sort());
    const existingItemIndex = cart.findIndex(
      (cartItem) =>
        cartItem.menuItemId === item.id &&
        JSON.stringify(cartItem.addons.map((a) => a.name).sort()) === addonKey
    );

    if (existingItemIndex !== -1) {
      setCart((prev) =>
        prev.map((cartItem, idx) =>
          idx === existingItemIndex
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      const cartItem: CartItem = {
        id: `${item.id}-${Date.now()}-${Math.random()}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        addons: selectedAddons,
        isVeg: item.isVeg,
      };
      setCart((prev) => [...prev, cartItem]);
    }
  };

  const updateQuantity = (cartItemId: string, change: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQuantity = Math.max(0, item.quantity + change);
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const getItemTotal = (item: CartItem) => {
    const basePrice = item.price;
    const addonsPrice = item.addons.reduce(
      (sum, addon) => sum + (addon.price || 0),
      0
    );
    return (basePrice + addonsPrice) * item.quantity;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + getItemTotal(item), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const callWaiter = async () => {
    try {
      setIsCallingWaiter(true);

      const response = await fetch(
        `${API_BASE_URL}/orders/table/${tableId}/call-waiter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: customerName || "Guest",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setWaiterCalled(true);
        setTimeout(() => setWaiterCalled(false), 5000);
      } else {
        alert(data.message || "Failed to call waiter. Please try again.");
      }
    } catch (error) {
      console.error("Error calling waiter:", error);
      alert("Failed to call waiter. Please try again.");
    } finally {
      setIsCallingWaiter(false);
    }
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Please add items to your cart before placing an order.");
      return;
    }

    try {
      const shouldUpdateExisting =
        existingOrderId && !["paid", "cancelled"].includes(orderStatus);

      if (shouldUpdateExisting) {
        setIsUpdatingOrder(true);
      } else {
        setIsPlacingOrder(true);
      }

      const orderItems = cart.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        addons: item.addons.map((addon) => ({
          name: addon.name,
          price: addon.price
        })),
      }));

      let endpoint: string;
      let method: string;

      if (shouldUpdateExisting) {
        endpoint = `${API_BASE_URL}/orders/${existingOrderId}/update`;
        method = "PATCH";
      } else {
        endpoint = `${API_BASE_URL}/orders/table/${tableId}/order`;
        method = "POST";
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: orderItems,
          customerName: customerName || "Guest",
          specialInstructions: specialInstructions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderId(data.data._id);
        setOrderStatus(data.data.status);
        setOrderPlaced(true);
        setExistingOrderId(data.data._id);
        setCart([]);
      } else {
        alert(data.message || "Failed to process order. Please try again.");
      }
    } catch (error) {
      console.error("Error processing order:", error);
      alert("Failed to process order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
      setIsUpdatingOrder(false);
    }
  };

  // Select template based on restaurant settings
  // Use useMemo to ensure template selection is stable and only recomputes when needed
  const { Template, templateStyle } = useMemo(() => {
    const templates = {
      classic: TemplateClassic,
      modern: TemplateModern,
      minimal: TemplateMinimal,
      TemplateBurgerBooch: TemplateBurgerBooch,
    };

    const style = restaurantData?.templateStyle || "classic";

    // Debug logging to help identify template selection issues
    if (restaurantData?.templateStyle) {
      console.log("🔍 Template Style from restaurant data:", style);
      const templateExists = style in templates;
      console.log("✅ Template exists in mapping:", templateExists);
      if (!templateExists) {
        console.warn(`⚠️ Template "${style}" not found in templates mapping. Available templates:`, Object.keys(templates));
      }
    }

    const SelectedTemplate = templates[style as keyof typeof templates] || TemplateClassic;

    if (restaurantData) {
      console.log("🎨 Selected Template:", style, "Component:", SelectedTemplate.name || "Unknown");
    }

    return { Template: SelectedTemplate, templateStyle: style };
  }, [restaurantData?.templateStyle]);

  const templateProps: TemplateProps = {
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
    priceFilter,
    showFilters,
    onAddToCart: addToCart,
    onRemoveFromCart: removeFromCart,
    onUpdateQuantity: updateQuantity,
    onPlaceOrder: placeOrder,
    onCallWaiter: callWaiter,
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
  };

  // Fallback generic confirmation view in case a template has issues rendering.
  // This ensures customers always see something after placing an order.
  if (!loading && orderPlaced && orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Order placed successfully
          </h2>
          <p className="text-sm text-slate-600">
            Your order has been sent to the kitchen. You can stay on this page
            and we&apos;ll keep updating the status automatically.
          </p>
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-left text-sm space-y-1">
            {restaurantData?.name && (
              <p className="font-semibold text-slate-800">
                {restaurantData.name}
              </p>
            )}
            {tableData?.tableName && (
              <p className="text-slate-600">
                Table: <span className="font-medium">{tableData.tableName}</span>
              </p>
            )}
            <p className="text-slate-600">
              Order ID:{" "}
              <span className="font-mono font-semibold">
                {orderId.slice(-8).toUpperCase()}
              </span>
            </p>
            <p className="text-slate-600">
              Status: <span className="font-semibold">{orderStatus}</span>
            </p>
          </div>
          <button
            onClick={() => setOrderPlaced(false)}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 transition-colors"
          >
            Back to menu
          </button>
        </div>
      </div>
    );
  }

  return <Template {...templateProps} />;
};

export default CustomerPageContainer;