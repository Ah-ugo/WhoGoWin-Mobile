import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

interface OnboardingItem {
  id: number;
  title: string;
  description: string;
  image: any; // Replace with proper type if using TypeScript module resolution for assets
}

const onboardingData: OnboardingItem[] = [
  {
    id: 1,
    title: "Welcome to WhoGoWin",
    description:
      "Your chance to win big with daily, weekly, and monthly draws!",
    image: require("../assets/images/whogowin.png"),
  },
  {
    id: 2,
    title: "Buy Tickets Easily",
    description:
      "Choose from ₦100, ₦200, ₦500, or ₦1000 tickets and join the draw!",
    image: require("../assets/images/onboarding2.png"),
  },
  {
    id: 3,
    title: "Win Amazing Prizes",
    description:
      "First place wins 50% of the pot, plus consolation prizes for more winners!",
    image: require("../assets/images/onboarding3.png"),
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const translateX = useSharedValue(0);
  const backgroundOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);
  const titleOpacity = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Entrance animation
    contentScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    titleOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  const animatedSlideStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: contentScale.value }],
      opacity: titleOpacity.value,
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleNext = () => {
    // Button press animation
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1);
    });

    if (currentIndex < onboardingData.length - 1) {
      // Slide transition with fade
      backgroundOpacity.value = withTiming(0.7, { duration: 200 });
      contentScale.value = withTiming(0.9, { duration: 200 });

      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        translateX.value = withSpring(-(currentIndex + 1) * width, {
          damping: 20,
          stiffness: 90,
        });

        backgroundOpacity.value = withTiming(1, { duration: 300 });
        contentScale.value = withSpring(1, { damping: 15 });
      }, 150);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    // Exit animation
    backgroundOpacity.value = withTiming(0, { duration: 500 });
    contentScale.value = withTiming(0.8, { duration: 500 });

    setTimeout(async () => {
      await AsyncStorage.setItem("hasOnboarded", "true");
      router.replace("/(auth)/login");
    }, 300);
  };

  // Animated dots
  const renderDot = (index: number) => {
    const animatedDotStyle = useAnimatedStyle(() => {
      const isActive = index === currentIndex;
      const scale = withSpring(isActive ? 1.2 : 1);
      const opacity = withTiming(isActive ? 1 : 0.4, { duration: 300 });

      return {
        transform: [{ scale }],
        opacity,
      };
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          {
            backgroundColor: index === currentIndex ? "#d4af37" : "#c0c0c0",
          },
          animatedDotStyle,
        ]}
      />
    );
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.container}>
        {/* Dynamic Background Gradient */}
        <Animated.View
          style={[styles.backgroundGradient, animatedBackgroundStyle]}
        >
          <LinearGradient
            colors={["#0a0a0a", "#1a1a1a"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Floating Decorative Elements */}
        <View style={styles.decorativeElements}>
          <View style={[styles.floatingCircle, styles.circle1]} />
          <View style={[styles.floatingCircle, styles.circle2]} />
          <View style={[styles.floatingCircle, styles.circle3]} />
        </View>

        {/* Content Container */}
        <View style={styles.contentBackground}>
          <Animated.View
            style={[styles.contentContainer, animatedContentStyle]}
          >
            <Animated.View style={[styles.slideContainer, animatedSlideStyle]}>
              {onboardingData.map((item, index) => (
                <View key={item.id} style={styles.slide}>
                  {/* Image Container with Glow Effect */}
                  <View style={styles.imageContainer}>
                    <View style={styles.imageGlow} />
                    <Image source={item.image} style={styles.image} />
                  </View>

                  {/* Text Content */}
                  <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          </Animated.View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Pagination */}
          <View style={styles.pagination}>
            {onboardingData.map((_, index) => renderDot(index))}
          </View>

          {/* CTA Button */}
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#d4af37", "#b8941f"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.buttonText}>
                {currentIndex === onboardingData.length - 1
                  ? "Get Started"
                  : "Next"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  floatingCircle: {
    position: "absolute",
    borderRadius: 1000,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  circle1: {
    width: 200,
    height: 200,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    right: -50,
  },
  contentBackground: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginHorizontal: 24,
    marginVertical: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  contentContainer: {
    flex: 1,
    paddingTop: 60,
  },
  slideContainer: {
    flexDirection: "row",
    width: width * onboardingData.length,
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 32,
  },
  imageGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -10,
    left: -10,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
    color: "#ffffff",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
  },
  bottomSection: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#0a0a0a",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
    paddingVertical: 16,
  },
});
