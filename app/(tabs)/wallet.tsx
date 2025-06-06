import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
import { apiService } from "../../services/apiService";

const { width, height } = Dimensions.get("window");

interface Transaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  status: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
}

export default function Wallet() {
  const [wallet, setWallet] = useState<WalletData>({
    balance: 0,
    transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  // Animation values
  const headerTranslateY = useSharedValue(-50);
  const headerOpacity = useSharedValue(0);
  const balanceScale = useSharedValue(0.8);
  const balanceOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(100);
  const cardsOpacity = useSharedValue(0);
  const spinnerScale = useSharedValue(0.8);
  const spinnerOpacity = useSharedValue(0);
  const floatingAnimation = useSharedValue(0);

  const gradientColors = {
    background: ["#0a0a0a", "#1a1a1a"],
    gold: ["#d4af37", "#b8941f"],
    silver: ["#c0c0c0", "#a8a8a8"],
  };

  const fetchWalletData = async () => {
    try {
      const response = await apiService.get("/wallet/details");
      setWallet(response.data);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    headerTranslateY.value = withSpring(0, { damping: 25, stiffness: 120 });
    headerOpacity.value = withTiming(1, { duration: 1000 });

    balanceScale.value = withDelay(
      300,
      withSpring(1, { damping: 20, stiffness: 150 })
    );
    balanceOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

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
        withTiming(0, { duration: 0 }, () => runOnJS(repeatFloat)())
      );
    };
    repeatFloat();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      const response = await apiService.post("/wallet/topup", { amount });
      const { authorization_url, reference } = response.data;

      const supported = await Linking.canOpenURL(authorization_url);
      if (supported) {
        await Linking.openURL(authorization_url);
        await verifyPayment(reference);
      } else {
        Alert.alert("Error", "Unable to open payment page");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to initiate top-up"
      );
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await apiService.get(
        `/wallet/verify-payment?reference=${reference}`
      );
      const { message, amount, new_balance } = response.data;
      Alert.alert(
        "Success",
        `${message}: ₦${amount.toLocaleString()} added. New balance: ₦${new_balance.toLocaleString()}`
      );
      setTopUpAmount("");
      setShowTopUp(false);
      fetchWalletData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to verify payment"
      );
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (amount > wallet.balance) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }

    try {
      await apiService.post("/wallet/withdraw", { amount });
      Alert.alert("Success", "Withdrawal request submitted successfully");
      setWithdrawAmount("");
      setShowWithdraw(false);
      fetchWalletData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to process withdrawal"
      );
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    return (
      <View style={styles.transactionIconContainer}>
        <Ionicons
          name={transaction.type === "credit" ? "add-circle" : "remove-circle"}
          size={20}
          color={transaction.type === "credit" ? "#d4af37" : "#c0c0c0"}
        />
      </View>
    );
  };

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
      opacity: headerOpacity.value,
    };
  });

  const animatedBalanceStyle = useAnimatedStyle(() => {
    const floatingOffset = interpolate(
      floatingAnimation.value,
      [-1, 0, 1],
      [-2, 0, 2]
    );
    return {
      transform: [
        { scale: balanceScale.value },
        { translateY: floatingOffset },
      ],
      opacity: balanceOpacity.value,
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

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <LinearGradient
          colors={gradientColors.background}
          style={styles.backgroundGradient}
        >
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[styles.loadingSpinner, animatedSpinnerStyle]}
            >
              <View style={styles.loadingSpinnerInner}>
                <Ionicons name="wallet-outline" size={32} color="#d4af37" />
              </View>
            </Animated.View>
            <Text style={styles.loadingText}>Loading wallet</Text>
            <Text style={styles.loadingSubtext}>Preparing your balance</Text>
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
          <Text style={styles.title}>My Wallet</Text>
          <Text style={styles.subtitle}>Manage your funds</Text>
        </Animated.View>

        <Animated.View style={[styles.balanceCard, animatedBalanceStyle]}>
          <View style={styles.balanceContent}>
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet-outline" size={24} color="#d4af37" />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              ₦{wallet.balance.toLocaleString()}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#d4af37" }]}
                onPress={() => setShowTopUp(!showTopUp)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#0a0a0a" />
                <Text style={styles.actionButtonText}>Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#c0c0c0" }]}
                onPress={() => setShowWithdraw(!showWithdraw)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={16} color="#0a0a0a" />
                <Text style={styles.actionButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {showTopUp && (
          <Animated.View style={[styles.transactionCard, animatedCardStyle]}>
            <Text style={styles.transactionTitle}>Top Up Wallet</Text>
            <View style={styles.quickAmounts}>
              {quickAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setTopUpAmount(amount.toString())}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickAmountText}>
                    ₦{amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              keyboardType="numeric"
            />
            <View style={styles.transactionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTopUp(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: "#d4af37" }]}
                onPress={handleTopUp}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Top Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {showWithdraw && (
          <Animated.View style={[styles.transactionCard, animatedCardStyle]}>
            <Text style={styles.transactionTitle}>Withdraw Funds</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
            />
            <Text style={styles.withdrawNote}>
              Withdrawal requests are processed within 24 hours
            </Text>
            <View style={styles.transactionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowWithdraw(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: "#d4af37" }]}
                onPress={handleWithdraw}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.transactionsSection, animatedCardStyle]}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {wallet.transactions.map((transaction) => (
            <View key={transaction._id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                {getTransactionIcon(transaction)}
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color:
                      transaction.type === "credit" ? "#d4af37" : "#c0c0c0",
                  },
                ]}
              >
                {transaction.type === "credit" ? "+" : "-"}₦
                {transaction.amount.toLocaleString()}
              </Text>
            </View>
          ))}
          {wallet.transactions.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="receipt-outline" size={32} color="#666666" />
              </View>
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your transactions will appear here
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
  balanceCard: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  balanceContent: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  balanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -1,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: "#0a0a0a",
    fontWeight: "600",
    fontSize: 14,
  },
  transactionCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 20,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  quickAmountButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  quickAmountText: {
    fontSize: 14,
    color: "#d4af37",
    fontWeight: "600",
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
  },
  withdrawNote: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 16,
    textAlign: "center",
  },
  transactionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cancelButtonText: {
    textAlign: "center",
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    textAlign: "center",
    color: "#0a0a0a",
    fontWeight: "600",
  },
  transactionsSection: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  transactionItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIconContainer: {
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
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "500",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
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
