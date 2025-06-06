import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const onboardingData = [
  {
    id: 1,
    title: "Welcome to Nigerian Lottery",
    description:
      "Your chance to win big with daily, weekly, and monthly draws!",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 2,
    title: "Buy Tickets Easily",
    description:
      "Choose from ₦100, ₦200, ₦500, or ₦1000 tickets and join the draw!",
    image: "/placeholder.svg?height=300&width=300",
  },
  {
    id: 3,
    title: "Win Amazing Prizes",
    description:
      "First place wins 50% of the pot, plus consolation prizes for more winners!",
    image: "/placeholder.svg?height=300&width=300",
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      translateX.value = withSpring(-(currentIndex + 1) * width);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem("hasOnboarded", "true");
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.slideContainer, animatedStyle]}>
        {onboardingData.map((item, index) => (
          <View key={item.id} style={styles.slide}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </Animated.View>

      <View style={styles.pagination}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? "#007AFF" : "#C7C7CC",
              },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  slideContainer: {
    flexDirection: "row",
    width: width * onboardingData.length,
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1D1D1F",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#86868B",
    lineHeight: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    marginHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 40,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
