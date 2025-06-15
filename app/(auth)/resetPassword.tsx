import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

type IoniconsName =
  | "gem"
  | "mail-outline"
  | "arrow-back"
  | "refresh"
  | "checkmark-circle"
  | "send";

interface ForgotPasswordRequest {
  email: string;
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const router = useRouter();

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(1);
  const loadingRotation = useSharedValue(0);
  const successScale = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(300, withSpring(0, { damping: 15 }));

    formOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    formTranslateY.value = withDelay(600, withSpring(0, { damping: 15 }));
  }, []);

  useEffect(() => {
    if (emailSent) {
      successScale.value = withSpring(1, { damping: 12 });
    }
  }, [emailSent]);

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const animatedFormStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedLoadingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotation.value}deg` }],
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const handleForgotPassword = async () => {
    if (!email) {
      // Shake animation for error
      buttonScale.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withTiming(1.02, { duration: 100 }),
        withTiming(0.98, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      buttonScale.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withTiming(1.02, { duration: 100 }),
        withTiming(0.98, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    loadingRotation.value = withTiming(360, { duration: 1000 });

    try {
      const response = await fetch(
        "https://whogowin.onrender.com/api/v1/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        // Success animation
        buttonScale.value = withSpring(1.05, { damping: 10 }, () => {
          buttonScale.value = withSpring(1);
        });
      } else {
        // Even if there's an error, we show success to prevent email enumeration
        // This matches your backend behavior
        setEmailSent(true);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      // Still show success to prevent email enumeration
      setEmailSent(true);
    } finally {
      setLoading(false);
      loadingRotation.value = 0;
    }
  };

  const handleButtonPress = () => {
    if (!emailSent) {
      buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
        buttonScale.value = withSpring(1);
      });
      handleForgotPassword();
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  const handleTryAgain = () => {
    setEmailSent(false);
    setEmail("");
    successScale.value = 0;
  };

  if (emailSent) {
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Animated Background */}
          <View style={styles.backgroundGradient}>
            <LinearGradient
              colors={["#0a0a0a", "#1a1a1a"]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          {/* Floating Elements */}
          <View style={styles.floatingElements}>
            <View style={[styles.floatingCircle, styles.circle1]} />
            <View style={[styles.floatingCircle, styles.circle2]} />
            <View style={[styles.floatingCircle, styles.circle3]} />
          </View>

          <View style={styles.content}>
            <Animated.View
              style={[styles.successContainer, animatedSuccessStyle]}
            >
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={["#d4af37", "#b8941f"]}
                  style={styles.successIconGradient}
                >
                  <Ionicons name="checkmark-circle" size={60} color="#0a0a0a" />
                </LinearGradient>
              </View>

              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successMessage}>
                If an account exists with {email}, a password reset link has
                been sent.
              </Text>
              <Text style={styles.successSubMessage}>
                Check your email and follow the instructions to reset your
                password.
              </Text>

              <View style={styles.successButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleBackToLogin}
                >
                  <LinearGradient
                    colors={["#d4af37", "#b8941f"]}
                    style={[
                      styles.buttonGradient,
                      { paddingHorizontal: 20, paddingTop: 3 },
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Back to Login</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleTryAgain}
                >
                  <Text style={styles.secondaryButtonText}>
                    Try Different Email
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Animated Background */}
        <View style={styles.backgroundGradient}>
          <LinearGradient
            colors={["#0a0a0a", "#1a1a1a"]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        {/* Floating Elements */}
        <View style={styles.floatingElements}>
          <View style={[styles.floatingCircle, styles.circle1]} />
          <View style={[styles.floatingCircle, styles.circle2]} />
          <View style={[styles.floatingCircle, styles.circle3]} />
        </View>

        <View style={styles.content}>
          {/* Header Section */}
          <Animated.View style={[styles.header, animatedTitleStyle]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Ionicons name="arrow-back" size={24} color="#d4af37" />
            </TouchableOpacity>

            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#d4af37", "#b8941f"]}
                style={styles.logoGradient}
              >
                <Ionicons name="diamond" size={40} color="#0a0a0a" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View style={[styles.formContainer, animatedFormStyle]}>
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    emailFocused && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={emailFocused ? "#d4af37" : "#c0c0c0"}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
              </View>

              {/* Send Reset Link Button */}
              <Animated.View style={animatedButtonStyle}>
                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleButtonPress}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#d4af37", "#b8941f"]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Animated.View style={animatedLoadingStyle}>
                        <Ionicons name="refresh" size={20} color="#0a0a0a" />
                      </Animated.View>
                      <Text style={styles.buttonText}>Sending...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Send Reset Link</Text>
                      <Ionicons name="send" size={20} color="#0a0a0a" />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Back to Login Link */}
          <Animated.View style={[styles.footer, animatedFormStyle]}>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleBackToLogin}
            >
              <Text style={styles.linkText}>
                Remember your password?{" "}
                <Text style={styles.linkTextBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
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
  floatingElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  floatingCircle: {
    position: "absolute",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: 1000,
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
    bottom: 200,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    top: height * 0.2,
    right: -50,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    padding: 8,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputFocused: {
    borderColor: "#d4af37",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: "#ffffff",
    fontWeight: "500",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#0a0a0a",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footer: {
    alignItems: "center",
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
  linkTextBold: {
    color: "#d4af37",
    fontWeight: "700",
  },
  // Success screen styles
  successContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  successMessage: {
    fontSize: 16,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    marginBottom: 8,
    lineHeight: 24,
  },
  successSubMessage: {
    fontSize: 14,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
    marginBottom: 32,
    lineHeight: 20,
  },
  successButtons: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#0a0a0a",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  secondaryButtonText: {
    color: "#d4af37",
    fontSize: 16,
    fontWeight: "600",
  },
});
