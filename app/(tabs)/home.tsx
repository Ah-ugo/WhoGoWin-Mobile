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
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  interpolate,
  runOnJS,
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

interface Draw {
  id: string;
  draw_type: string;
  end_time: string;
  total_pot: number;
  status: string;
}

interface WalletData {
  balance: number;
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeDraws, setActiveDraws] = useState<Draw[]>([]);
  const [wallet, setWallet] = useState<WalletData>({ balance: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerTranslateY = useSharedValue(-50);
  const headerOpacity = useSharedValue(0);
  const walletScale = useSharedValue(0.8);
  const walletOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(100);
  const cardsOpacity = useSharedValue(0);
  const floatingAnimation = useSharedValue(0);

  const ticketPrices = [100, 200, 500, 1000];

  const gradientColors = {
    primary: ["#1a1a2e", "#16213e"],
    accent: ["#0f0f23", "#1a1a2e"],
    gold: ["#d4af37", "#b8941f"],
    silver: ["#c0c0c0", "#a8a8a8"],
    background: ["#0a0a0a", "#1a1a1a"],
    card: ["#ffffff", "#fafafa"],
    overlay: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"],
  };

  useEffect(() => {
    fetchData();
    startAnimations();
    startFloatingAnimation();
  }, []);

  const startFloatingAnimation = () => {
    const repeatFloat = () => {
      floatingAnimation.value = withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(-1, { duration: 3000 }),
        withTiming(0, { duration: 0 }, () => runOnJS(repeatFloat)())
      );
    };
    repeatFloat();
  };

  const startAnimations = () => {
    headerTranslateY.value = withSpring(0, {
      damping: 25,
      stiffness: 120,
    });
    headerOpacity.value = withTiming(1, { duration: 1000 });

    walletScale.value = withDelay(
      300,
      withSpring(1, {
        damping: 20,
        stiffness: 150,
      })
    );
    walletOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

    cardsTranslateY.value = withDelay(
      600,
      withSpring(0, {
        damping: 25,
        stiffness: 120,
      })
    );
    cardsOpacity.value = withDelay(600, withTiming(1, { duration: 900 }));
  };

  const fetchData = async () => {
    try {
      const [drawsResponse, walletResponse] = await Promise.all([
        apiService.get("/draws/active"),
        apiService.get("/wallet/balance"),
      ]);
      setActiveDraws(drawsResponse.data);
      setWallet(walletResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleBuyTicket = (drawId: string, price: number) => {
    if (wallet.balance < price) {
      Alert.alert(
        "Insufficient Balance",
        "You need more funds to purchase this ticket. Would you like to add funds to your wallet?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Funds",
            onPress: () => router.push("/(tabs)/wallet"),
            style: "default",
          },
        ],
        { cancelable: true }
      );
      return;
    }

    router.push({
      pathname: "/buy-ticket",
      params: { drawId, price: price.toString() },
    });
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Draw Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getDrawIcon = (drawType: string) => {
    switch (drawType) {
      case "Daily":
        return "sunny-outline";
      case "Weekly":
        return "calendar-outline";
      case "Monthly":
        return "trophy-outline";
      default:
        return "diamond-outline";
    }
  };

  // Animated styles
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
      opacity: headerOpacity.value,
    };
  });

  const animatedWalletStyle = useAnimatedStyle(() => {
    const floatingOffset = interpolate(
      floatingAnimation.value,
      [-1, 0, 1],
      [-2, 0, 2]
    );
    return {
      transform: [{ scale: walletScale.value }, { translateY: floatingOffset }],
      opacity: walletOpacity.value,
    };
  });

  const animatedCardsStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: cardsTranslateY.value }],
      opacity: cardsOpacity.value,
    };
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <LinearGradient
          colors={gradientColors.background}
          style={styles.backgroundGradient}
        >
          <View style={styles.loadingContainer}>
            <Animated.View style={[styles.loadingSpinner, animatedWalletStyle]}>
              <View style={styles.loadingSpinnerInner}>
                <Ionicons name="diamond-outline" size={48} color="#d4af37" />
              </View>
            </Animated.View>
            <Text style={styles.loadingText}>Loading</Text>
            <Text style={styles.loadingSubtext}>Preparing your dashboard</Text>
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
        style={styles.backgroundGradient}
      />

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
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>
                Welcome back, {user?.name || "Guest"}
              </Text>
              <Text style={styles.subtitle}>Ready to play?</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <View style={styles.profileButtonInner}>
                <Ionicons name="person-outline" size={20} color="#d4af37" />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.walletSection, animatedWalletStyle]}>
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View style={styles.walletIconContainer}>
                <Ionicons name="wallet-outline" size={24} color="#d4af37" />
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Balance</Text>
                <Text style={styles.walletBalance}>
                  ₦{wallet.balance.toLocaleString()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.addFundsButton}
              onPress={() => router.push("/(tabs)/wallet")}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color="#0a0a0a" />
              <Text style={styles.addFundsText}>Add Funds</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.drawsSection, animatedCardsStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Draws</Text>
            <Text style={styles.sectionSubtitle}>
              {activeDraws.length} available
            </Text>
          </View>

          {activeDraws.map((draw, index) => (
            <View key={draw.id} style={styles.drawCard}>
              <View style={styles.drawHeader}>
                <View style={styles.drawTypeSection}>
                  <View style={styles.drawIconContainer}>
                    <Ionicons
                      name={getDrawIcon(draw.draw_type)}
                      size={20}
                      color="#d4af37"
                    />
                  </View>
                  <View>
                    <Text style={styles.drawType}>{draw.draw_type} Draw</Text>
                    <Text style={styles.drawStatus}>Active</Text>
                  </View>
                </View>

                <View style={styles.timeContainer}>
                  <Text style={styles.timeRemaining}>
                    {formatTimeRemaining(draw.end_time)}
                  </Text>
                </View>
              </View>

              <View style={styles.prizeSection}>
                <Text style={styles.prizeLabel}>Prize Pool</Text>
                <Text style={styles.prizeAmount}>
                  ₦{draw.total_pot.toLocaleString()}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.ticketSection}>
                <Text style={styles.ticketSectionTitle}>Select Ticket</Text>
                <View style={styles.ticketPrices}>
                  {ticketPrices.map((price) => (
                    <TouchableOpacity
                      key={price}
                      style={[
                        styles.ticketButton,
                        wallet.balance < price && styles.ticketButtonDisabled,
                      ]}
                      onPress={() => handleBuyTicket(draw.id, price)}
                      activeOpacity={0.7}
                      disabled={wallet.balance < price}
                    >
                      <Text
                        style={[
                          styles.ticketButtonText,
                          wallet.balance < price &&
                            styles.ticketButtonTextDisabled,
                        ]}
                      >
                        ₦{price}
                      </Text>
                      {wallet.balance < price && (
                        <Ionicons
                          name="lock-closed"
                          size={12}
                          color="#666666"
                          style={styles.lockIcon}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}

          {activeDraws.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="calendar-outline" size={32} color="#666666" />
              </View>
              <Text style={styles.emptyStateText}>No Active Draws</Text>
              <Text style={styles.emptyStateSubtext}>
                New draws will be available soon
              </Text>
            </View>
          )}
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
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
  },
  profileButton: {
    padding: 4,
  },
  profileButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  walletSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  walletCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -1,
  },
  addFundsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d4af37",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  addFundsText: {
    color: "#0a0a0a",
    fontWeight: "600",
    fontSize: 14,
  },
  drawsSection: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "400",
  },
  drawCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  drawHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  drawTypeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  drawIconContainer: {
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
  drawType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  drawStatus: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  timeRemaining: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  prizeSection: {
    marginBottom: 16,
  },
  prizeLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  prizeAmount: {
    fontSize: 20,
    color: "#d4af37",
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  ticketSection: {},
  ticketSectionTitle: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    marginBottom: 12,
  },
  ticketPrices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ticketButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    minWidth: (width - 80) / 4,
    justifyContent: "center",
    gap: 4,
  },
  ticketButtonDisabled: {
    opacity: 0.4,
  },
  ticketButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 13,
  },
  ticketButtonTextDisabled: {
    color: "#666666",
  },
  lockIcon: {
    marginLeft: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
});
