// NotificationProvider.tsx
import { Notification } from "@/models/notification";
import { apiService } from "@/services/apiService";
import { registerForPushNotificationsAsync } from "@/services/notificationService";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

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
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  useEffect(() => {
    const registerPushNotifications = async () => {
      if (!user) {
        console.log("No user authenticated, skipping push token registration");
        return;
      }
      let retries = 3;
      while (retries > 0) {
        try {
          const result = await registerForPushNotificationsAsync();
          if (typeof result !== "string") {
            setError(result.message);
            console.warn(
              "Push notification registration failed:",
              result.message
            );
            retries--;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
              continue;
            }
          } else {
            console.log("Push token registration successful");
          }
          break;
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Unknown error registering push token";
          setError(errorMessage);
          console.error(
            "Error in registerPushNotifications:",
            errorMessage,
            err
          );
          retries--;
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }
    };

    registerPushNotifications();
    fetchNotifications();

    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data;
        console.log("Foreground notification received:", notification);
        if (data?.type === "draw_reminder") {
          fetchNotifications();
        }
      });

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log("Notification response:", response);
        if (data?.type === "draw_reminder" && data?.draw_id) {
          navigation.navigate("DrawDetails", { drawId: data.draw_id });
        }
      });

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, [navigation, user]);

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
      await apiService.put("/notifications/mark-read", {
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
