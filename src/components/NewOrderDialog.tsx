
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Minus,
    X,
    ShoppingCart,
    Search,
    Utensils,
    Check,
    Lock,
    User,
    Loader2,
    Edit
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL } from "@/config";

// --- Types (Copied from OrdersPage) ---

interface AddonItem {
    name: string;
    price: number;
    group?: string;
}

interface AddonGroup {
    _id?: string;
    title: string;
    multiSelect: boolean;
    items: AddonItem[];
}

interface MenuItem {
    _id: string;
    name: string;
    description?: string;
    price: number;
    sectionId: string | { _id: string };
    isActive: boolean;
    isVeg?: boolean;
    addonGroups?: AddonGroup[];
}

interface MenuSection {
    _id: string;
    name: string;
    items: MenuItem[];
}

interface Table {
    _id: string;
    tableName: string;
    seats: number;
    hasActiveOrder?: boolean;
}

interface CartItem {
    id: string;
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    addons: AddonItem[];
    isVeg?: boolean;
}

interface NewOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialTableId?: string; // Optional: if opened from a specific table context
}

export function NewOrderDialog({ open, onOpenChange, onSuccess, initialTableId }: NewOrderDialogProps) {
    const { formatPrice } = useCurrency();
    const { toast } = useToast();

    // State
    const [tables, setTables] = useState<Table[]>([]);
    const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState("");
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [editingOrder, setEditingOrder] = useState<any | null>(null);

    // Addon Modal State
    const [showAddonModal, setShowAddonModal] = useState(false);
    const [selectedItemForAddons, setSelectedItemForAddons] = useState<MenuItem | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<Record<number, AddonItem[]>>({});

    // Auth Helper
    const getAuthHeader = () => {
        const staffToken = localStorage.getItem("staffToken");
        if (staffToken) return { Authorization: `Bearer ${staffToken}` };
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Fetch Data on Open
    useEffect(() => {
        if (open) {
            fetchTables();
            fetchMenu();
            // Reset state
            setCart([]);
            setCustomerName("");
            setSpecialInstructions("");
            setSearchQuery("");
            setSelectedCategory("all");
            setSelectedTable(null);
            setEditingOrder(null);
        }
    }, [open]);

    // Handle Initial Table Selection
    useEffect(() => {
        if (initialTableId && tables.length > 0) {
            const table = tables.find(t => t._id === initialTableId);
            if (table && !table.hasActiveOrder) {
                setSelectedTable(table);
            }
        }
    }, [initialTableId, tables]);

    const fetchTables = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tables`, {
                headers: { ...getAuthHeader(), "Content-Type": "application/json" },
            });
            const data = await response.json();
            if (data.success) {
                // Fetch active orders for each table to correctly identify status
                const tablesWithStatus = await Promise.all(data.data.map(async (table: Table) => {
                    try {
                        const ordersResponse = await fetch(`${API_BASE_URL}/api/orders/table/${table._id}?excludeStatus=paid,cancelled`, {
                            headers: { ...getAuthHeader(), "Content-Type": "application/json" }
                        });
                        const ordersData = await ordersResponse.json();
                        return {
                            ...table,
                            hasActiveOrder: ordersData.success && ordersData.data && ordersData.data.length > 0
                        };
                    } catch (e) {
                        return table;
                    }
                }));
                setTables(tablesWithStatus);
            }
        } catch (error) {
            console.error("Error fetching tables:", error);
        }
    };

    const handleTableSelect = async (table: Table) => {
        setSelectedTable(table);
        setCart([]); // Clear current cart/customer info when switching tables
        setCustomerName("");
        setSpecialInstructions("");
        setEditingOrder(null);

        if (table.hasActiveOrder) {
            // Fetch the active order
            try {
                const response = await fetch(`${API_BASE_URL}/api/orders/table/${table._id}?excludeStatus=paid,cancelled`, {
                    headers: { ...getAuthHeader(), "Content-Type": "application/json" }
                });
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    const order = data.data[0];
                    setEditingOrder(order);
                    setCustomerName(order.customerName || "");
                    setSpecialInstructions(order.specialInstructions || "");

                    // Populate Cart
                    const cartItems = order.items.map((item: any) => {
                        let addons: AddonItem[] = [];
                        if (item.addons && Array.isArray(item.addons)) {
                            addons = item.addons.map((a: any) => ({
                                name: typeof a === 'string' ? a : a.name,
                                price: typeof a === 'object' ? a.price : 0,
                                group: typeof a === 'object' ? a.group : undefined
                            }));
                        }

                        // Handle populated vs string menuItemId
                        const menuItemId = typeof item.menuItemId === 'object' ? item.menuItemId._id : item.menuItemId;
                        const name = typeof item.menuItemId === 'object' ? item.menuItemId.name : item.name;

                        return {
                            id: `${menuItemId}-${Date.now()}-${Math.random()}`,
                            menuItemId: menuItemId,
                            name: name || "Unknown Item",
                            price: item.price,
                            quantity: item.quantity,
                            addons: addons,
                            isVeg: false // We might not have this info easily without looking up menu, distinct from isVeg
                        };
                    });
                    setCart(cartItems);
                    toast({ description: "Loaded existing order for update." });
                }
            } catch (err) {
                console.error("Error fetching active order:", err);
                toast({ variant: "destructive", description: "Failed to load existing order." });
            }
        }
    };

    const fetchMenu = async () => {
        try {
            // Fetch sections
            const sectionsResponse = await fetch(`${API_BASE_URL}/api/sections`, {
                headers: { ...getAuthHeader(), "Content-Type": "application/json" },
            });
            const sectionsData = await sectionsResponse.json();

            if (sectionsData.success) {
                // Fetch menu items
                const itemsResponse = await fetch(`${API_BASE_URL}/api/menuitems`, {
                    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
                });
                const itemsData = await itemsResponse.json();

                if (itemsData.success) {
                    // Combine sections with their items
                    const sectionsWithItems = sectionsData.data.map(
                        (section: MenuSection) => {
                            const sectionItems = (itemsData.data || []).filter(
                                (item: MenuItem) => {
                                    // Handle populated vs string sectionId
                                    const itemSectionId =
                                        typeof item.sectionId === "object"
                                            ? (item.sectionId as any)._id
                                            : item.sectionId;
                                    return itemSectionId === section._id.toString();
                                }
                            );

                            return {
                                ...section,
                                items: sectionItems,
                            };
                        }
                    );
                    setMenuSections(sectionsWithItems);
                } else {
                    // Fallback to just sections if items fetch fails (though unlikely to show much)
                    setMenuSections(sectionsData.data);
                }
            }
        } catch (error) {
            console.error("Error fetching menu:", error);
        }
    };

    // Cart Logic
    const addToCart = (item: MenuItem, addons: AddonItem[] = []) => {
        const addonKey = JSON.stringify(addons.map((a) => a.name).sort());
        const existingItemIndex = cart.findIndex(
            (cartItem) =>
                cartItem.menuItemId === item._id &&
                JSON.stringify((cartItem.addons || []).map((a) => a.name).sort()) === addonKey
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
                id: `${item._id}-${Date.now()}-${Math.random()}`,
                menuItemId: item._id,
                name: item.name,
                price: item.price,
                quantity: 1,
                addons: addons,
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

    const getCartItemTotal = (item: CartItem) => {
        const basePrice = item.price;
        const addonsPrice = item.addons.reduce((sum, addon) => sum + (addon.price || 0), 0);
        return (basePrice + addonsPrice) * item.quantity;
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + getCartItemTotal(item), 0);
    };

    // Search Logic
    const filteredMenu = menuSections
        .map((section) => ({
            ...section,
            items: (section.items || []).filter((item) => {
                const matchesCategory = selectedCategory === "all" || section._id === selectedCategory;
                const matchesSearch =
                    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.description?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesCategory && matchesSearch && item.isActive;
            }),
        }))
        .filter((section) => section.items.length > 0);

    // Addon Modal Logic
    const openAddonModalHandler = (item: MenuItem) => {
        setSelectedItemForAddons(item);
        setSelectedAddons({});
        setShowAddonModal(true);
    };

    const closeAddonModal = () => {
        setShowAddonModal(false);
        setSelectedItemForAddons(null);
        setSelectedAddons({});
    };

    const toggleAddon = (groupIndex: number, addon: AddonItem) => {
        if (!selectedItemForAddons) return;
        const group = selectedItemForAddons.addonGroups![groupIndex];
        const addonWithGroup = { ...addon, group: group.title };

        setSelectedAddons((prev) => {
            const currentGroupAddons = prev[groupIndex] || [];
            if (group.multiSelect) {
                const exists = currentGroupAddons.find((a) => a.name === addon.name);
                return exists
                    ? { ...prev, [groupIndex]: currentGroupAddons.filter((a) => a.name !== addon.name) }
                    : { ...prev, [groupIndex]: [...currentGroupAddons, addonWithGroup] };
            } else {
                const isSame = currentGroupAddons[0]?.name === addon.name;
                return { ...prev, [groupIndex]: isSame ? [] : [addonWithGroup] };
            }
        });
    };

    const isAddonSelected = (groupIndex: number, addon: AddonItem) => {
        return (selectedAddons[groupIndex] || []).some((a) => a.name === addon.name);
    };

    const handleAddToCartWithAddons = () => {
        if (!selectedItemForAddons) return;
        const allSelectedAddons = Object.values(selectedAddons).flat();
        addToCart(selectedItemForAddons, allSelectedAddons);
        closeAddonModal();
    };

    const getItemTotalWithAddons = (basePrice: number) => {
        const addonsTotal = Object.values(selectedAddons)
            .flat()
            .reduce((sum, addon) => sum + (addon.price || 0), 0);
        return basePrice + addonsTotal;
    };

    const getSelectedAddonsCount = () => Object.values(selectedAddons).flat().length;


    // Submit Logic
    const handleCreateOrder = async () => {
        if (!selectedTable) {
            toast({ variant: "destructive", description: "Please select a table" });
            return;
        }
        if (cart.length === 0) {
            toast({ variant: "destructive", description: "Please add items to cart" });
            return;
        }

        try {
            setIsCreatingOrder(true);
            const validCartItems = cart.filter((item) => item.quantity > 0);
            const orderItems = validCartItems.map((item) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                addons: item.addons.map((addon) => ({
                    name: addon.name,
                    price: addon.price,
                    group: addon.group
                })),
            }));

            let response;
            if (editingOrder) {
                // UPDATE existing order
                response = await fetch(`${API_BASE_URL}/api/orders/${editingOrder._id}/update`, {
                    method: "PATCH",
                    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: orderItems,
                        customerName: customerName || "Guest",
                        specialInstructions: specialInstructions,
                    }),
                });
            } else {
                // CREATE new order
                response = await fetch(`${API_BASE_URL}/api/orders/table/${selectedTable._id}/order`, {
                    method: "POST",
                    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: orderItems,
                        customerName: customerName || "Guest",
                        specialInstructions: specialInstructions,
                    }),
                });
            }

            const data = await response.json();

            if (data.success) {
                toast({ description: editingOrder ? "Order updated successfully!" : "Order created successfully!" });
                onSuccess();
                onOpenChange(false);
            } else {
                toast({ variant: "destructive", description: data.message || "Failed to create order" });
            }
        } catch (err) {
            console.error("Error creating order:", err);
            toast({ variant: "destructive", description: "Failed to create order" });
        } finally {
            setIsCreatingOrder(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            Create New Order
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-6">
                            {/* Table Selection */}
                            <div>
                                <Label className="text-base font-semibold mb-3 block">Select Table</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {tables.map((table) => (
                                        <Button
                                            key={table._id}
                                            variant={selectedTable?._id === table._id ? "default" : "outline"}
                                            onClick={() => handleTableSelect(table)}
                                            className={`h-16 flex flex-col gap-1 relative ${selectedTable?._id !== table._id && table.hasActiveOrder
                                                    ? "bg-green-100 border-green-500 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300"
                                                    : ""
                                                }`}
                                        >
                                            <span className="font-bold">{table.tableName.replace(/^Table\s*/i, "")}</span>
                                            <span className="text-xs opacity-70">{table.seats} seats</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="customerName" className="flex items-center gap-2 mb-2">
                                        <User className="h-4 w-4" />
                                        Customer Name (Optional)
                                    </Label>
                                    <Input
                                        id="customerName"
                                        placeholder="Enter customer name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="specialInstructions" className="mb-2 block">
                                        Special Instructions (Optional)
                                    </Label>
                                    <Input
                                        id="specialInstructions"
                                        placeholder="Any special requests..."
                                        value={specialInstructions}
                                        onChange={(e) => setSpecialInstructions(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div>
                                <Label className="text-base font-semibold mb-3 block">Add Items</Label>

                                {/* Search and Filter */}
                                <div className="space-y-3 mb-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search menu items..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        <Button
                                            variant={selectedCategory === "all" ? "default" : "outline"}
                                            onClick={() => setSelectedCategory("all")}
                                            size="sm"
                                        >
                                            All Items
                                        </Button>
                                        {menuSections.map((section) => (
                                            <Button
                                                key={section._id}
                                                variant={selectedCategory === section._id ? "default" : "outline"}
                                                onClick={() => setSelectedCategory(section._id)}
                                                size="sm"
                                            >
                                                {section.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Menu Grid */}
                                <div className="max-h-[300px] overflow-y-auto border rounded-lg p-4 space-y-4">
                                    {filteredMenu.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>No items found</p>
                                        </div>
                                    ) : (
                                        filteredMenu.map((section) => (
                                            <div key={section._id}>
                                                <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                                                    {section.name}
                                                </h4>
                                                <div className="grid sm:grid-cols-2 gap-2">
                                                    {section.items.map((item) => {
                                                        const hasAddonGroups = item.addonGroups && item.addonGroups.length > 0;
                                                        return (
                                                            <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                                <div className="flex-1 min-w-0 mr-3">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                                                        {item.isVeg !== undefined && (
                                                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.isVeg ? "bg-white border-green-600" : "bg-white border-red-600"}`}>
                                                                                <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                                                                    <p className="text-sm font-semibold text-primary mt-1">{formatPrice(item.price)}</p>
                                                                    {hasAddonGroups && <p className="text-xs text-blue-600 mt-1">✨ Customizable</p>}
                                                                </div>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => hasAddonGroups ? openAddonModalHandler(item) : addToCart(item)}
                                                                    className="flex-shrink-0"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Cart */}
                            {cart.length > 0 && (
                                <div>
                                    <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                                        <ShoppingCart className="h-5 w-5" />
                                        Order Items ({cart.length})
                                    </Label>
                                    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                                        {cart.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                                                <div className="flex-1 min-w-0 mr-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-sm">{item.name}</p>
                                                        {item.isVeg !== undefined && (
                                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.isVeg ? "bg-white border-green-600" : "bg-white border-red-600"}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
                                                    {item.addons && item.addons.length > 0 && (
                                                        <div className="mt-1 space-y-0.5">
                                                            {item.addons.map((addon, idx) => (
                                                                <div key={idx} className="text-xs text-blue-600 flex items-center gap-1">
                                                                    <Plus className="h-2.5 w-2.5" />
                                                                    <span>{addon.name} {addon.price > 0 && `(+${formatPrice(addon.price)})`}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                                        <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.id, -1)} className="h-7 w-7"><Minus className="h-3 w-3" /></Button>
                                                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                                        <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.id, 1)} className="h-7 w-7"><Plus className="h-3 w-3" /></Button>
                                                    </div>
                                                    <span className="font-bold text-sm w-16 text-right">{formatPrice(getCartItemTotal(item))}</span>
                                                    <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)} className="h-8 w-8 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between pt-3 border-t">
                                            <span className="font-semibold">Total:</span>
                                            <span className="text-2xl font-bold text-primary">{formatPrice(getCartTotal())}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreateOrder}
                            disabled={!selectedTable || cart.length === 0 || isCreatingOrder}
                            className="gap-2"
                        >
                            {isCreatingOrder ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" /> {editingOrder ? "Update Order" : "Create Order"}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Addon Modal */}
            <Dialog open={showAddonModal} onOpenChange={closeAddonModal}>
                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Utensils className="h-5 w-5" /> Customize Your Order
                        </DialogTitle>
                    </DialogHeader>

                    {selectedItemForAddons && (
                        <div className="flex-1 overflow-y-auto">
                            <div className="space-y-4 py-4">
                                {/* Item Info */}
                                <div className="bg-muted/50 rounded-lg p-4 border">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">{selectedItemForAddons.name}</h3>
                                            <p className="text-sm text-muted-foreground">{selectedItemForAddons.description}</p>
                                        </div>
                                        <p className="text-lg font-bold text-primary">{formatPrice(selectedItemForAddons.price)}</p>
                                    </div>
                                </div>

                                {/* Addons */}
                                {selectedItemForAddons.addonGroups && selectedItemForAddons.addonGroups.map((group, groupIndex) => (
                                    <div key={groupIndex} className="border rounded-lg p-4 bg-card">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-bold text-base flex items-center gap-2">
                                                <Plus className="h-4 w-4 text-primary" /> {group.title || "Add-ons"}
                                            </h4>
                                            <Badge variant="outline" className="text-xs">{group.multiSelect ? "Multi-select" : "Choose one"}</Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {group.items && group.items.map((addon, addonIndex) => (
                                                <label key={addonIndex} className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors border border-transparent hover:border-border">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <input
                                                            type={group.multiSelect ? "checkbox" : "radio"}
                                                            name={`addon-group-${groupIndex}`}
                                                            checked={isAddonSelected(groupIndex, addon)}
                                                            onChange={() => toggleAddon(groupIndex, addon)}
                                                            className="w-4 h-4 rounded border-2 border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0"
                                                        />
                                                        <span className="text-sm font-medium">{addon.name}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-primary ml-2">{addon.price > 0 ? `+${formatPrice(addon.price)}` : "Free"}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Addon Summary */}
                                {getSelectedAddonsCount() > 0 && (
                                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-semibold">Selected Add-ons ({getSelectedAddonsCount()})</span>
                                        </div>
                                        <div className="space-y-1 mb-3">
                                            {Object.values(selectedAddons).flat().map((addon, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{addon.name}</span>
                                                    <span className="font-semibold">{addon.price > 0 ? `+${formatPrice(addon.price)}` : "Free"}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <span className="font-bold">Total:</span>
                                            <span className="text-xl font-bold text-primary">{formatPrice(getItemTotalWithAddons(selectedItemForAddons.price))}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-4 flex gap-2">
                        <Button variant="outline" onClick={closeAddonModal} className="flex-1">Cancel</Button>
                        <Button onClick={handleAddToCartWithAddons} className="flex-1 gap-2"><ShoppingCart className="h-4 w-4" /> Add to Cart</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
