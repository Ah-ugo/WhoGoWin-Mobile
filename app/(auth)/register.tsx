import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { useAuth } from "../../contexts/AuthContext";

const { width, height } = Dimensions.get("window");

interface AuthContextType {
  register: (name: string, email: string, password: string) => Promise<void>;
}

type IoniconsName =
  | "person-add-outline"
  | "person-outline"
  | "mail-outline"
  | "lock-closed-outline"
  | "eye-outline"
  | "eye-off-outline"
  | "checkmark-circle-outline"
  | "refresh"
  | "rocket";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register } = useAuth() as AuthContextType;
  const router = useRouter();

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(1);
  const loadingRotation = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Entrance animations
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(200, withSpring(0, { damping: 15 }));

    formOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    formTranslateY.value = withDelay(500, withSpring(0, { damping: 15 }));
  }, []);

  useEffect(() => {
    // Calculate password strength
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;

    setPasswordStrength(strength);
    progressWidth.value = withTiming(strength, { duration: 300 });
  }, [password]);

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

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "#c0392b"; // Red for Weak
    if (passwordStrength < 50) return "#e67e22"; // Orange for Fair
    if (passwordStrength < 75) return "#27ae60"; // Green for Good
    return "#d4af37"; // Gold for Strong
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return "Weak";
    if (passwordStrength < 50) return "Fair";
    if (passwordStrength < 75) return "Good";
    return "Strong";
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      buttonScale.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withTiming(1.02, { duration: 100 }),
        withTiming(0.98, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      buttonScale.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withTiming(1.02, { duration: 100 }),
        withTiming(0.98, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      buttonScale.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withTiming(1.02, { duration: 100 }),
        withTiming(0.98, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    loadingRotation.value = withTiming(360, { duration: 1000 });

    try {
      await register(name, email, password);
      buttonScale.value = withSpring(1.05, { damping: 10 }, () => {
        buttonScale.value = withSpring(1);
      });
      router.replace("/(tabs)/home");
    } catch (error: unknown) {
      loadingRotation.value = 0;
      const message =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.detail || "Failed to create account"
          : "Failed to create account";
      Alert.alert("Registration Failed", message);
    } finally {
      setLoading(false);
      loadingRotation.value = 0;
    }
  };

  const handleButtonPress = () => {
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1);
    });
    handleRegister();
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    iconName: IoniconsName,
    secureTextEntry = false,
    showPasswordToggle = false,
    passwordVisible = false,
    onTogglePassword: (() => void) | null = null,
    keyboardType: "default" | "email-address" | "numeric" = "default",
    autoCapitalize: "none" | "words" | "sentences" = "none"
  ) => {
    const isFocused = focusedField === placeholder;

    return (
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
          <Ionicons
            name={iconName}
            size={20}
            color={isFocused ? "#d4af37" : "#c0c0c0"}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, showPasswordToggle && styles.passwordInput]}
            placeholder={placeholder}
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            onFocus={() => setFocusedField(placeholder)}
            onBlur={() => setFocusedField("")}
          />
          {showPasswordToggle && onTogglePassword && (
            <TouchableOpacity onPress={onTogglePassword} style={styles.eyeIcon}>
              <Ionicons
                name={passwordVisible ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#c0c0c0"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header Section */}
            <Animated.View style={[styles.header, animatedTitleStyle]}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={["#d4af37", "#b8941f"]}
                  style={styles.logoGradient}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={40}
                    color="#0a0a0a"
                  />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join WhoGoWin and start winning today
              </Text>
            </Animated.View>

            {/* Form Section */}
            <Animated.View style={[styles.formContainer, animatedFormStyle]}>
              <View style={styles.form}>
                {renderInput(
                  "Full Name",
                  name,
                  setName,
                  "person-outline",
                  false,
                  false,
                  false,
                  null,
                  "default",
                  "words"
                )}

                {renderInput(
                  "Email Address",
                  email,
                  setEmail,
                  "mail-outline",
                  false,
                  false,
                  false,
                  null,
                  "email-address",
                  "none"
                )}

                {renderInput(
                  "Password",
                  password,
                  setPassword,
                  "lock-closed-outline",
                  !showPassword,
                  true,
                  showPassword,
                  () => setShowPassword(!showPassword)
                )}

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.passwordStrengthBar}>
                      <Animated.View
                        style={[
                          styles.passwordStrengthProgress,
                          animatedProgressStyle,
                          { backgroundColor: getPasswordStrengthColor() },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.passwordStrengthText,
                        { color: getPasswordStrengthColor() },
                      ]}
                    >
                      {getPasswordStrengthText()}
                    </Text>
                  </View>
                )}

                {renderInput(
                  "Confirm Password",
                  confirmPassword,
                  setConfirmPassword,
                  "checkmark-circle-outline",
                  !showConfirmPassword,
                  true,
                  showConfirmPassword,
                  () => setShowConfirmPassword(!showConfirmPassword)
                )}

                {/* Register Button */}
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
                        <Text style={styles.buttonText}>
                          Creating Account...
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Create Account</Text>
                        <Ionicons name="rocket" size={20} color="#0a0a0a" />
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                {/* Terms and Privacy */}
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{" "}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
            </Animated.View>

            {/* Sign In Link */}
            <Animated.View style={[styles.footer, animatedFormStyle]}>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.linkText}>
                  Already have an account?{" "}
                  <Text style={styles.linkTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
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
    width: 180,
    height: 180,
    top: -90,
    right: -90,
  },
  circle2: {
    width: 120,
    height: 120,
    bottom: 150,
    left: -60,
  },
  circle3: {
    width: 80,
    height: 80,
    top: height * 0.25,
    right: -40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
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
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  passwordStrengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    marginRight: 12,
    overflow: "hidden",
  },
  passwordStrengthProgress: {
    height: "100%",
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: "600",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
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
  termsText: {
    fontSize: 12,
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: "#d4af37",
    fontWeight: "600",
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
});
