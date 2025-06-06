import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/apiService";

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

  const ticketPrices = [100, 200, 500, 1000];

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

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleBuyTicket = (drawId: string, price: number) => {
    if (wallet.balance < price) {
      Alert.alert(
        "Insufficient Balance",
        "Please top up your wallet to buy this ticket.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Top Up", onPress: () => router.push("/(tabs)/wallet") },
        ]
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

    if (diff <= 0) return "Draw ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
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
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.subtitle}>Ready to win big today?</Text>
      </View>

      <View style={styles.walletCard}>
        <View style={styles.walletHeader}>
          <Ionicons name="wallet" size={24} color="#007AFF" />
          <Text style={styles.walletTitle}>Wallet Balance</Text>
        </View>
        <Text style={styles.walletBalance}>
          ₦{wallet.balance.toLocaleString()}
        </Text>
        <TouchableOpacity
          style={styles.topUpButton}
          onPress={() => router.push("/(tabs)/wallet")}
        >
          <Text style={styles.topUpButtonText}>Top Up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Draws</Text>
        {activeDraws.map((draw) => (
          <View key={draw.id} style={styles.drawCard}>
            <View style={styles.drawHeader}>
              <Text style={styles.drawType}>{draw.draw_type} Draw</Text>
              <Text style={styles.timeRemaining}>
                {formatTimeRemaining(draw.end_time)}
              </Text>
            </View>
            <Text style={styles.potAmount}>
              Total Pot: ₦{draw.total_pot.toLocaleString()}
            </Text>

            <View style={styles.ticketPrices}>
              <Text style={styles.ticketPricesTitle}>Choose your ticket:</Text>
              <View style={styles.priceButtons}>
                {ticketPrices.map((price) => (
                  <TouchableOpacity
                    key={price}
                    style={styles.priceButton}
                    onPress={() => handleBuyTicket(draw.id, price)}
                  >
                    <Text style={styles.priceButtonText}>₦{price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        {activeDraws.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar" size={48} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>
              No active draws at the moment
            </Text>
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
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1D1D1F",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#86868B",
  },
  walletCard: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#1D1D1F",
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 16,
  },
  topUpButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  topUpButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1D1D1F",
    marginBottom: 16,
  },
  drawCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  drawHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  drawType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1D1F",
  },
  timeRemaining: {
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: "600",
  },
  potAmount: {
    fontSize: 16,
    color: "#34C759",
    fontWeight: "600",
    marginBottom: 16,
  },
  ticketPrices: {
    marginTop: 8,
  },
  ticketPricesTitle: {
    fontSize: 14,
    color: "#86868B",
    marginBottom: 12,
  },
  priceButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priceButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 70,
  },
  priceButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
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
