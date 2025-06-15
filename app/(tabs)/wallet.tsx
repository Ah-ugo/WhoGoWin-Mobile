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
  account_name?: string;
  bank_name?: string;
  account_number?: string;
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
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
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
    if (!accountName.trim()) {
      Alert.alert("Error", "Please enter the account name");
      return;
    }
    if (!bankName.trim()) {
      Alert.alert("Error", "Please enter the bank name");
      return;
    }
    if (!accountNumber.trim() || !/^\d{10}$/.test(accountNumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit account number");
      return;
    }
    if (amount > wallet.balance) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }

    try {
      await apiService.post("/wallet/withdraw", {
        amount,
        account_name: accountName,
        bank_name: bankName,
        account_number: accountNumber,
      });
      Alert.alert("Success", "Withdrawal request submitted successfully");
      setWithdrawAmount("");
      setAccountName("");
      setBankName("");
      setAccountNumber("");
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
          color={transaction.type === "credit" ? "#d4af37" : "#ef4444"}
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
              style={[styles.loadingSpinner, animatedBalanceStyle]}
            >
              <View style={styles.loadingSpinnerInner}>
                <Ionicons name="wallet-outline" size={48} color="#d4af37" />
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
              <Text style={styles.title}>My Wallet</Text>
              <Text style={styles.subtitle}>Manage your funds</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.walletSection, animatedBalanceStyle]}>
          <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
              <View style={styles.walletIconContainer}>
                <Ionicons name="wallet-outline" size={24} color="#d4af37" />
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Available Balance</Text>
                <Text style={styles.walletBalance}>
                  ₦{wallet.balance.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.topUpButton]}
                onPress={() => setShowTopUp(!showTopUp)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color="#0a0a0a" />
                <Text style={styles.actionButtonText}>Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.withdrawButton]}
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
            <View style={styles.transactionHeader}>
              <View style={styles.transactionIconBg}>
                <Ionicons name="add-circle" size={20} color="#d4af37" />
              </View>
              <Text style={styles.transactionTitle}>Top Up Wallet</Text>
            </View>

            <View style={styles.quickAmountsSection}>
              <Text style={styles.quickAmountsLabel}>Quick amounts</Text>
              <View style={styles.quickAmounts}>
                {quickAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.quickAmountButton,
                      topUpAmount === amount.toString() &&
                        styles.quickAmountButtonActive,
                    ]}
                    onPress={() => setTopUpAmount(amount.toString())}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        topUpAmount === amount.toString() &&
                          styles.quickAmountTextActive,
                      ]}
                    >
                      ₦{amount.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Custom amount</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.transactionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTopUp(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
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
            <View style={styles.transactionHeader}>
              <View style={styles.transactionIconBg}>
                <Ionicons name="remove-circle" size={20} color="#ef4444" />
              </View>
              <Text style={styles.transactionTitle}>Withdraw Funds</Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Withdrawal amount</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter amount"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Account Name</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter account name"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={accountName}
                onChangeText={setAccountName}
                keyboardType="default"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter bank name"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={bankName}
                onChangeText={setBankName}
                keyboardType="default"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="Enter 10-digit account number"
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.withdrawNotice}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="rgba(255, 255, 255, 0.6)"
              />
              <Text style={styles.withdrawNote}>
                Withdrawal requests are processed within 24 hours
              </Text>
            </View>

            <View style={styles.transactionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setWithdrawAmount("");
                  setAccountName("");
                  setBankName("");
                  setAccountNumber("");
                  setShowWithdraw(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.withdrawConfirmButton]}
                onPress={handleWithdraw}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <Animated.View style={[styles.transactionsSection, animatedCardStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Text style={styles.sectionSubtitle}>
              {wallet.transactions.length} transaction
              {wallet.transactions.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.transactionsList}>
            {wallet.transactions.map((transaction) => (
              <View key={transaction._id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  {getTransactionIcon(transaction)}
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    {transaction.account_name &&
                      transaction.bank_name &&
                      transaction.account_number && (
                        <Text style={styles.transactionSubtext}>
                          {transaction.account_name} ({transaction.bank_name},{" "}
                          {transaction.account_number})
                        </Text>
                      )}
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          transaction.type === "credit" ? "#10b981" : "#ef4444",
                      },
                    ]}
                  >
                    {transaction.type === "credit" ? "+" : "-"}₦
                    {transaction.amount.toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          transaction.status === "completed"
                            ? "rgba(16, 185, 129, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            transaction.status === "completed"
                              ? "#10b981"
                              : "#ef4444",
                        },
                      ]}
                    >
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

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
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingSection: {
    flex: 1,
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
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  topUpButton: {
    backgroundColor: "#d4af37",
  },
  withdrawButton: {
    backgroundColor: "#ef4444",
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
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  transactionIconBg: {
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
  transactionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  quickAmountsSection: {
    marginBottom: 20,
  },
  quickAmountsLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickAmountButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  quickAmountButtonActive: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  quickAmountText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  quickAmountTextActive: {
    color: "#d4af37",
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    color: "#ffffff",
    fontWeight: "500",
  },
  withdrawNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  withdrawNote: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    flex: 1,
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
    backgroundColor: "#d4af37",
  },
  withdrawConfirmButton: {
    backgroundColor: "#ef4444",
  },
  confirmButtonText: {
    textAlign: "center",
    color: "#0a0a0a",
    fontWeight: "600",
  },
  transactionsSection: {
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
  transactionsList: {
    gap: 8,
  },
  transactionItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
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
  transactionSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "400",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  transactionRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
