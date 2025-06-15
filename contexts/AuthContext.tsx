// AuthProvider.tsx
import { apiService } from "@/services/apiService";
import { registerForPushNotificationsAsync } from "@/services/notificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  referral_code: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        apiService.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await apiService.get("/users/me");
        setUser(response.data);
        // Register push token after confirming user
        const result = await registerForPushNotificationsAsync();
        if (typeof result !== "string") {
          console.warn(
            "Push notification registration failed:",
            result.message
          );
        } else {
          console.log("Push token registered during auth check");
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await AsyncStorage.removeItem("authToken");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(
        "https://whogowin.onrender.com/api/v1/auth/login",
        {
          email,
          password,
        }
      );
      const { access_token, user: userData } = response.data;

      await AsyncStorage.setItem("authToken", access_token);
      apiService.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${access_token}`;
      setUser(userData);

      // Register push token with retry
      // let retries = 3;
      // while (retries > 0) {
      //   const result = await registerForPushNotificationsAsync();
      //   if (typeof result === "string") {
      //     console.log("Push token registered after login");
      //     break;
      //   }
      //   console.warn("Push notification registration failed:", result.message);
      //   retries--;
      //   if (retries > 0)
      //     await new Promise((resolve) => setTimeout(resolve, 2000));
      // }
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.response?.data?.detail || "Login failed");
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await axios.post(
        "https://whogowin.onrender.com/auth/register",
        {
          name,
          email,
          password,
        }
      );
      const { access_token, user: userData } = response.data;

      await AsyncStorage.setItem("authToken", access_token);
      apiService.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${access_token}`;
      setUser(userData);

      // Register push token with retry
      // let retries = 3;
      // while (retries > 0) {
      //   const result = await registerForPushNotificationsAsync();
      //   if (typeof result === "string") {
      //     console.log("Push token registered after registration");
      //     break;
      //   }
      //   console.warn("Push notification registration failed:", result.message);
      //   retries--;
      //   if (retries > 0)
      //     await new Promise((resolve) => setTimeout(resolve, 2000));
      // }
    } catch (error: any) {
      console.error("Registration error:", error);
      throw new Error(error.response?.data?.detail || "Registration failed");
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      delete apiService.defaults.headers.common["Authorization"];
      setUser(null);
      router.push("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
