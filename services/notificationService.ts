// notificationService.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiService } from "./apiService";

export interface NotificationError {
  message: string;
}

export async function registerForPushNotificationsAsync(): Promise<
  string | NotificationError
> {
  let token: string | undefined;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (!Device.isDevice) {
      return { message: "Must use a physical device for push notifications" };
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return { message: "Permission for push notifications not granted" };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      return { message: "Project ID not found" };
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    // Verify auth token exists
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      return { message: "User not authenticated" };
    }

    // Ensure Authorization header is set
    apiService.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

    // Send token to backend
    await apiService.post("/notifications/register-token", { token });
    console.log("Push token registered successfully:", token);
    return token;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error registering push token:", errorMessage, error);
    return { message: `Failed to register push token: ${errorMessage}` };
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
      },
      trigger,
    });
  } catch (error) {
    console.error("Error scheduling local notification:", error);
    throw new Error("Failed to schedule local notification");
  }
}
