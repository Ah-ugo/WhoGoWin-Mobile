import { registerForPushNotificationsAsync } from "@/services/notificationService";
// import * as Notifications from "expo-notifications";
import { Notification } from "@/models/notification";
import { apiService } from "@/services/apiService";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface NotificationContextType {
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  markNotificationsRead: (ids: string[]) => Promise<void>;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>(); // Adjust type based on navigation stack

  useEffect(() => {
    // Notifications.setNotificationHandler({
    //   handleNotification: async () => ({
    //     shouldShowAlert: true,
    //     shouldPlaySound: true,
    //     shouldSetBadge: false,
    //     // Handle iOS-specific banner display
    //     ...(Platform.OS === "ios" ? { shouldShowBanner: true } : {}),
    //     // Handle foreground notifications (applies to both iOS and Android)
    //     shouldShowInForeground: true,
    //     // Handle Android-specific priority
    //     ...(Platform.OS === "android"
    //       ? { priority: Notifications.AndroidNotificationPriority.HIGH }
    //       : {}),
    //   }),
    // });

    // Register for push notifications
    registerForPushNotificationsAsync().then((result) => {
      if (typeof result !== "string") {
        setError(result.message);
        console.warn("Push notification registration failed:", result.message);
      }
    });

    // Handle notifications received while app is in foreground
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        console.log("Foreground notification received:", notification);
        if (data?.type === "draw_reminder") {
          fetchNotifications(); // Refresh notifications
        }
      });

    // Handle notification taps (foreground or background)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("Notification response:", response);
        if (data?.type === "draw_reminder" && data?.draw_id) {
          navigation.navigate("DrawDetails", { drawId: data.draw_id });
        }
      });

    // Fetch initial notifications
    fetchNotifications();

    // Cleanup subscriptions
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [navigation]);

  const fetchNotifications = async () => {
    try {
      setError(null);
      const response = await apiService.get<Notification[]>(
        "/notifications/history"
      );
      setNotifications(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch notifications";
      setError(errorMessage);
      console.error("Error fetching notifications:", err);
    }
  };

  const sendTestNotification = async () => {
    try {
      setError(null);
      await apiService.post("/notifications/send-test");
      await fetchNotifications();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send test notification";
      setError(errorMessage);
      console.error("Error sending test notification:", err);
      throw new Error(errorMessage);
    }
  };

  const markNotificationsRead = async (ids: string[]) => {
    try {
      setError(null);
      // Note: Using admin endpoint as backend lacks user-level endpoint
      await apiService.put("/notifications/update", {
        notification_ids: ids,
        read: true,
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          ids.includes(notif.id) ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to mark notifications read";
      setError(errorMessage);
      console.error("Error marking notifications read:", err);
      throw new Error(errorMessage);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        fetchNotifications,
        sendTestNotification,
        markNotificationsRead,
        error,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
