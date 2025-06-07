import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/apiService";

const { width, height } = Dimensions.get("window");

interface User {
  name: string;
  email: string;
  referral_code?: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
}

type IoniconsName =
  | "help-circle"
  | "mail"
  | "document-text"
  | "shield-checkmark"
  | "notifications"
  | "chevron-forward"
  | "pencil"
  | "share"
  | "log-out"
  | "person-outline";

export default function Profile() {
  const { user, logout } = useAuth() as AuthContextType;
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [profile, setProfile] = useState<User | null>(user);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerTranslateY: SharedValue<number> = useSharedValue(-50);
  const headerOpacity: SharedValue<number> = useSharedValue(0);
  const userCardScale: SharedValue<number> = useSharedValue(0.8);
  const userCardOpacity: SharedValue<number> = useSharedValue(0);
  const cardsTranslateY: SharedValue<number> = useSharedValue(100);
  const cardsOpacity: SharedValue<number> = useSharedValue(0);
  const spinnerScale: SharedValue<number> = useSharedValue(0.8);
  const spinnerOpacity: SharedValue<number> = useSharedValue(0);
  const floatingAnimation: SharedValue<number> = useSharedValue(0);

  const gradientColors = {
    background: ["#0a0a0a", "#1a1a1a"],
    gold: ["#d4af37", "#b8941f"],
    silver: ["#c0c0c0", "#a8a8a8"],
  };

  const fetchProfileData = async () => {
    try {
      const response = await apiService.get("/users/me");
      const fetchedProfile: User = response.data;
      setProfile(fetchedProfile);
      setNewName(fetchedProfile.name);
    } catch (error: unknown) {
      console.error("Error fetching profile data:", error);
      const message =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.detail || "Failed to fetch profile"
          : "Failed to fetch profile";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    headerTranslateY.value = withSpring(0, { damping: 25, stiffness: 120 });
    headerOpacity.value = withTiming(1, { duration: 1000 });

    userCardScale.value = withDelay(
      300,
      withSpring(1, { damping: 20, stiffness: 150 })
    );
    userCardOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

    cardsTranslateY.value = withDelay(
      600,
      withSpring(0, { damping: 25, stiffness: 120 })
    );
    cardsOpacity.value = withDelay(600, withTiming(1, { duration: 900 }));

    spinnerScale.value = withDelay(
      300,
      withSpring(1, { damping: 20, stiffness: 150 })
    );
    spinnerOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

    const repeatFloat = () => {
      floatingAnimation.value = withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(-1, { duration: 3000 }),
        withTiming(0, { duration: 0 }, () => runOnJS(repeatFloat))
      );
    };
    repeatFloat();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    try {
      await apiService.put("/users/profile", { name: newName });
      Alert.alert("Success", "Name updated successfully");
      setEditingName(false);
      fetchProfileData();
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.detail || "Failed to update name"
          : "Failed to update name";
      Alert.alert("Error", message);
    }
  };

  const handleShareReferral = async () => {
    try {
      const referralCode = profile?.referral_code || "LOTTERY123";
      const message = `Join Nigerian Lottery with my referral code: ${referralCode} and get bonus credits!`;

      await Share.share({
        message,
        title: "Join Nigerian Lottery",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const ProfileItem = ({
    icon,
    title,
    value,
    onPress,
    showArrow = true,
  }: {
    icon: IoniconsName;
    title: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.profileItemLeft}>
        <View style={styles.profileItemIconContainer}>
          <Ionicons name={icon} size={20} color="#d4af37" />
        </View>
        <Text style={styles.profileItemTitle}>{title}</Text>
      </View>
      <View style={styles.profileItemRight}>
        {value && <Text style={styles.profileItemValue}>{value}</Text>}
        {showArrow && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255, 255, 255, 0.7)"
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
      opacity: headerOpacity.value,
    };
  });

  const animatedUserCardStyle = useAnimatedStyle(() => {
    const floatingOffset = interpolate(
      floatingAnimation.value,
      [-1, 0, 1],
      [-2, 0, 2]
    );
    return {
      transform: [
        { scale: userCardScale.value },
        { translateY: floatingOffset },
      ],
      opacity: userCardOpacity.value,
    };
  });

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: cardsTranslateY.value }],
      opacity: cardsOpacity.value,
    };
  });

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    const floatingOffset = interpolate(
      floatingAnimation.value,
      [-1, 0, 1],
      [-2, 0, 2]
    );
    return {
      transform: [
        { scale: spinnerScale.value },
        { translateY: floatingOffset },
      ],
      opacity: spinnerOpacity.value,
    };
  });

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <LinearGradient
          colors={gradientColors.background}
          style={styles.linearGradient}
        >
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[styles.loadingSpinner, animatedSpinnerStyle]}
            >
              <View style={styles.loadingSpinnerInner}>
                <Ionicons name="person-outline" size={32} color="#d4af37" />
              </View>
            </Animated.View>
            <Text style={styles.loadingText}>Loading your profile</Text>
            <Text style={styles.loadingSubtext}>Preparing your details...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <LinearGradient
        colors={gradientColors.background}
        style={styles.linearGradient}
      />

      <View style={styles.decorativeElements}>
        <Animated.View
          style={[
            styles.floatingCircle,
            styles.circle1,
            { transform: [{ translateY: floatingAnimation.value }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingCircle,
            styles.circle2,
            { transform: [{ translateY: floatingAnimation.value }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floatingCircle,
            styles.circle3,
            { transform: [{ translateY: floatingAnimation.value }] },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#d4af37"
            colors={["#d4af37"]}
            progressBackgroundColor="#1a1a1a"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </Animated.View>

        <Animated.View style={[styles.userCard, animatedUserCardStyle]}>
          <LinearGradient colors={gradientColors.gold} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name.charAt(0).toUpperCase() || "U"}
            </Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            {editingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setEditingName(false);
                      setNewName(profile.name);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: "#d4af37" }]}
                    onPress={handleUpdateName}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.nameContainer}
                onPress={() => setEditingName(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.userName}>{profile.name}</Text>
                <Ionicons
                  name="pencil"
                  size={16}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </TouchableOpacity>
            )}
            <Text style={styles.userEmail}>{profile.email}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, animatedCardStyle]}>
          <Text style={styles.sectionTitle}>Referral</Text>
          <View style={styles.referralCard}>
            <View style={styles.referralInfo}>
              <Text style={styles.referralTitle}>Your Referral Code</Text>
              <Text style={styles.referralCode}>
                {profile.referral_code || "LOTTERY123"}
              </Text>
              <Text style={styles.referralDescription}>
                Share your code and earn ₦50 for each friend who joins!
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: "#d4af37" }]}
              onPress={handleShareReferral}
              activeOpacity={0.7}
            >
              <Ionicons name="share" size={16} color="#0a0a0a" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, animatedCardStyle]}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="notifications" size={20} color="#d4af37" />
                </View>
                <Text style={styles.settingTitle}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: "rgba(255, 255, 255, 0.1)",
                  true: "#d4af37",
                }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.section, animatedCardStyle]}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.supportCard}>
            <ProfileItem
              icon="help-circle"
              title="Help & FAQ"
              onPress={() => Alert.alert("Info", "Help & FAQ coming soon!")}
            />
            <ProfileItem
              icon="mail"
              title="Contact Support"
              onPress={() =>
                Alert.alert("Info", "Contact Support coming soon!")
              }
            />
            <ProfileItem
              icon="document-text"
              title="Terms & Conditions"
              onPress={() =>
                Alert.alert("Info", "Terms & Conditions coming soon!")
              }
            />
            <ProfileItem
              icon="shield-checkmark"
              title="Privacy Policy"
              onPress={() => Alert.alert("Info", "Privacy Policy coming soon!")}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.logoutButtonContainer, animatedCardStyle]}
        >
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out" size={20} color="#c0c0c0" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footer, animatedCardStyle]}>
          <Text style={styles.footerText}>WhoGoWin v1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  linearGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingSpinner: {
    marginBottom: 24,
  },
  loadingSpinnerInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  loadingSubtext: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
  },
  userCard: {
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0a0a0a",
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginRight: 8,
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  editNameContainer: {
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#d4af37",
    paddingVertical: 4,
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButtonText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    color: "#0a0a0a",
    fontWeight: "600",
  },
  section: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  referralCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  referralInfo: {
    marginBottom: 16,
  },
  referralTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: "700",
    color: "#d4af37",
    marginBottom: 8,
    letterSpacing: 2,
  },
  referralDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 20,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
  },
  shareButtonText: {
    color: "#0a0a0a",
    fontWeight: "600",
    fontSize: 14,
  },
  settingsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  supportCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  profileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  profileItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  profileItemTitle: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
  },
  profileItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileItemValue: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginRight: 8,
  },
  logoutButtonContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c0c0c0",
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
});
