import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/apiService";

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
  }, []);

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
      await apiService.post("/wallet/topup", { amount });
      Alert.alert(
        "Success",
        `₦${amount.toLocaleString()} has been added to your wallet`
      );
      setTopUpAmount("");
      setShowTopUp(false);
      fetchWalletData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Failed to top up wallet"
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
    if (transaction.type === "credit") {
      return <Ionicons name="add-circle" size={24} color="#34C759" />;
    }
    return <Ionicons name="remove-circle" size={24} color="#FF3B30" />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Wallet</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>
          ₦{wallet.balance.toLocaleString()}
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowTopUp(!showTopUp)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Top Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => setShowWithdraw(!showWithdraw)}
          >
            <Ionicons name="remove" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showTopUp && (
        <View style={styles.transactionCard}>
          <Text style={styles.transactionTitle}>Top Up Wallet</Text>

          <View style={styles.quickAmounts}>
            {quickAmounts.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickAmountButton}
                onPress={() => setTopUpAmount(amount.toString())}
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
            value={topUpAmount}
            onChangeText={setTopUpAmount}
            keyboardType="numeric"
          />

          <View style={styles.transactionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTopUp(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleTopUp}
            >
              <Text style={styles.confirmButtonText}>Top Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showWithdraw && (
        <View style={styles.transactionCard}>
          <Text style={styles.transactionTitle}>Withdraw Funds</Text>

          <TextInput
            style={styles.amountInput}
            placeholder="Enter amount"
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
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleWithdraw}
            >
              <Text style={styles.confirmButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.transactionsSection}>
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
                  color: transaction.type === "credit" ? "#34C759" : "#FF3B30",
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
            <Ionicons name="receipt-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1D1D1F",
  },
  balanceCard: {
    backgroundColor: "#007AFF",
    margin: 20,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
  },
  withdrawButton: {
    backgroundColor: "rgba(255, 59, 48, 0.8)",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1D1F",
    marginBottom: 16,
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  quickAmountButton: {
    backgroundColor: "#F2F2F7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  quickAmountText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#D1D1D6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#F2F2F7",
  },
  withdrawNote: {
    fontSize: 12,
    color: "#86868B",
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
    borderColor: "#D1D1D6",
  },
  cancelButtonText: {
    textAlign: "center",
    color: "#86868B",
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "600",
  },
  transactionsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1D1F",
    marginBottom: 16,
  },
  transactionItem: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: "#1D1D1F",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#86868B",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#86868B",
    marginTop: 12,
  },
});
