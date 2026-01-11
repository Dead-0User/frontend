import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

export interface OrderNotification {
  id: string;
  orderId: string;
  tableNumber: string;
  customerName: string;
  items: string[];
  totalPrice: number;
  itemCount: number;
  timestamp: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: OrderNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = "restaurant_notifications";

// Get API URL from environment variable
// Get API URL from environment variable
import { API_BASE_URL } from "@/config";
const API_URL = API_BASE_URL;

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  // Load notifications from localStorage on mount
  const [notifications, setNotifications] = useState<OrderNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load notifications from localStorage:", error);
    }
    return [];
  });

  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error("Failed to save notifications to localStorage:", error);
    }
  }, [notifications]);

  // Connect to Socket.io when user is authenticated
  useEffect(() => {
    // Get restaurantId - for staff users, id is already restaurantId; for owners, use restaurantId from user object
    const restaurantId = (user as unknown as Record<string, unknown>)?.restaurantId as string | undefined
      || (user as unknown as Record<string, unknown>)?._id as string | undefined
      || user?.id;

    if (!restaurantId) {
      return;
    }

    const socketInstance = io(API_URL, {
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      socketInstance.emit("join-restaurant", restaurantId);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socketInstance.on("new-order", (data) => {
      const newNotification: OrderNotification = {
        id: `${data.orderId}-${Date.now()}`,
        orderId: data.orderId,
        tableNumber: data.tableNumber,
        customerName: data.customerName,
        items: data.items,
        totalPrice: data.totalPrice,
        itemCount: data.itemCount,
        timestamp: new Date(data.timestamp).toLocaleTimeString(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      // Play notification sound
      playNotificationSound();

      // Show browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification("New Order!", {
          body: `Table ${data.tableNumber} - ${data.customerName} (${data.itemCount} items)`,
          icon: "/qr-icon.png",
        });
      }
    });

    socketInstance.on("order-status-updated", (data) => {
      // Handle order status updates if needed
    });

    socketInstance.on("order-cancelled", (data) => {
      // Handle order cancellations if needed
    });

    socketInstance.on("disconnect", () => {
      // Handle disconnection if needed
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Request notification permission
  useEffect(() => {
    if (user && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Audio play failed silently
      });
    } catch {
      // Notification sound failed silently
    }
  };

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}