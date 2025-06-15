import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
// import logo from "../assets/images"

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!loading) {
        const hasOnboarded = await AsyncStorage.getItem("hasOnboarded");

        if (!hasOnboarded) {
          router.replace("/onboarding");
        } else if (user) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/(auth)/login");
        }
      }
    };

    checkOnboarding();
  }, [user, loading]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
