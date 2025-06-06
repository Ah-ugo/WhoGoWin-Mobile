import { apiService } from "@/services/apiService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

interface Draw {
  _id: string;
  draw_type: string;
  end_time: string;
  total_pot: number;
}

export default function BuyTicket() {
  const router = useRouter();
  const { drawId, price } = useLocalSearchParams();
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { rotateY: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    fetchDrawDetails();
  }, []);

  const fetchDrawDetails = async () => {
    try {
      const response = await apiService.get(`/draws/${drawId}`);
      setDraw(response.data);
    } catch (error) {
      console.error("Error fetching draw details:", error);
      Alert.alert("Error", "Failed to load draw details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);

    // Animate the ticket
    scale.value = withSequence(withSpring(1.1), withSpring(0.9), withSpring(1));
    rotation.value = withSequence(
      withSpring(10),
      withSpring(-10),
      withSpring(0)
    );

    try {
      await apiService.post("/tickets/buy", {
        draw_id: drawId,
        ticket_price: parseInt(price as string),
      });

      Alert.alert(
        "Success!",
        "Your ticket has been purchased successfully. Good luck!",
        [
          {
            text: "View My Tickets",
            onPress: () => router.replace("/(tabs)/tickets"),
          },
          {
            text: "Buy Another",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Purchase Failed",
        error.response?.data?.detail || "Failed to purchase ticket"
      );
    } finally {
      setPurchasing(false);
    }
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Draw ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading draw details...</Text>
      </View>
    );
  }

  if (!draw) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Draw not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Buy Ticket</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.ticketCard, animatedStyle]}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>Lottery Ticket</Text>
            <Ionicons name="ticket" size={32} color="#007AFF" />
          </View>

          <View style={styles.ticketDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Draw Type:</Text>
              <Text style={styles.detailValue}>{draw.draw_type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ticket Price:</Text>
              <Text style={styles.detailValue}>
                ₦{parseInt(price as string).toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Pot:</Text>
              <Text style={styles.detailValue}>
                ₦{draw.total_pot.toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time Remaining:</Text>
              <Text style={[styles.detailValue, styles.timeRemaining]}>
                {formatTimeRemaining(draw.end_time)}
              </Text>
            </View>
          </View>

          <View style={styles.prizeBreakdown}>
            <Text style={styles.prizeTitle}>Prize Breakdown:</Text>
            <View style={styles.prizeRow}>
              <Text style={styles.prizeLabel}>🥇 First Place (50%):</Text>
              <Text style={styles.prizeValue}>
                ₦{Math.floor(draw.total_pot * 0.5).toLocaleString()}
              </Text>
            </View>
            <View style={styles.prizeRow}>
              <Text style={styles.prizeLabel}>🎉 Consolation (10%):</Text>
              <Text style={styles.prizeValue}>
                ₦{Math.floor(draw.total_pot * 0.1).toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationTitle}>Confirm Purchase</Text>
          <Text style={styles.confirmationText}>
            You are about to purchase a {draw.draw_type.toLowerCase()} lottery
            ticket for{" "}
            <Text style={styles.confirmationPrice}>
              ₦{parseInt(price as string).toLocaleString()}
            </Text>
          </Text>
          <Text style={styles.confirmationNote}>
            This amount will be deducted from your wallet balance.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.purchaseButton,
            purchasing && styles.purchaseButtonDisabled,
          ]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="card" size={20} color="#FFFFFF" />
              <Text style={styles.purchaseButtonText}>
                Buy Ticket - ₦{parseInt(price as string).toLocaleString()}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#86868B",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1D1D1F",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1D1D1F",
  },
  ticketDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: "#86868B",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1D1F",
  },
  timeRemaining: {
    color: "#FF3B30",
  },
  prizeBreakdown: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
  },
  prizeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1D1D1F",
    marginBottom: 12,
  },
  prizeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  prizeLabel: {
    fontSize: 14,
    color: "#86868B",
  },
  prizeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#34C759",
  },
  confirmationCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1D1F",
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 16,
    color: "#86868B",
    lineHeight: 24,
    marginBottom: 8,
  },
  confirmationPrice: {
    fontWeight: "bold",
    color: "#007AFF",
  },
  confirmationNote: {
    fontSize: 14,
    color: "#FF9500",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D1D6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#86868B",
  },
  purchaseButton: {
    flex: 2,
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
