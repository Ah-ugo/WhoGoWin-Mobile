import { apiService } from "@/services/apiService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

interface Params {
  drawId: string;
  price: string;
}

type IoniconsName = "arrow-back" | "ticket-outline" | "card-outline";

export default function BuyTicket() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const drawId = typeof params.drawId === "string" ? params.drawId : "";
  const price = typeof params.price === "string" ? params.price : "";
  const [draw, setDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  useEffect(() => {
    if (!drawId || !price) {
      Alert.alert("Error", "Invalid draw or price");
      router.back();
      return;
    }
    fetchDrawDetails();
  }, [drawId, price]);

  const fetchDrawDetails = async () => {
    try {
      const response = await apiService.get(`/draws/${drawId}`);
      setDraw(response.data);
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.detail ||
            "Failed to load draw details"
          : "Failed to load draw details";
      console.error("Error fetching draw details:", message);
      Alert.alert("Error", message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);

    // Animate the ticket
    scale.value = withSequence(withSpring(1.1), withSpring(0.9), withSpring(1));
    rotate.value = withSequence(withSpring(10), withSpring(-10), withSpring(0));

    // Animate the button
    buttonScale.value = withSpring(0.95, { duration: 100 }, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      await apiService.post("/tickets/buy", {
        draw_id: drawId,
        ticket_price: parseInt(price),
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
    } catch (error: unknown) {
      const message =
        error instanceof Error && "response" in error
          ? (error as any).response?.data?.detail || "Failed to purchase ticket"
          : "Failed to purchase ticket";
      Alert.alert("Purchase Failed", message);
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
        <ActivityIndicator size="large" color="#d4af37" />
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
      <LinearGradient
        colors={["#0a0a0a", "#1a1a1a"]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#d4af37" />
        </TouchableOpacity>
        <Text style={styles.title}>Buy Ticket</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.ticketCard, animatedStyle]}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketTitle}>Lottery Ticket</Text>
            <Ionicons name="ticket-outline" size={32} color="#d4af37" />
          </View>

          <View style={styles.ticketDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Draw Type:</Text>
              <Text style={styles.detailValue}>{draw.draw_type}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ticket Price:</Text>
              <Text style={styles.detailValue}>
                ₦{parseInt(price).toLocaleString()}
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
              ₦{parseInt(price).toLocaleString()}
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

        <Animated.View style={animatedButtonStyle}>
          <TouchableOpacity
            style={[
              { paddingHorizontal: 20 },
              styles.purchaseButton,
              purchasing && styles.purchaseButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={purchasing}
          >
            <LinearGradient
              colors={["#d4af37", "#b8941f"]}
              style={styles.purchaseButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            {purchasing ? (
              <ActivityIndicator size="small" color="#0a0a0a" />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color="#0a0a0a" />
                <Text style={styles.purchaseButtonText}>
                  Buy Ticket - ₦{parseInt(price).toLocaleString()}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  errorText: {
    fontSize: 18,
    color: "#e67e22",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  ticketCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
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
    color: "rgba(255, 255, 255, 0.7)",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  timeRemaining: {
    color: "#e67e22",
  },
  prizeBreakdown: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  prizeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
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
    color: "rgba(255, 255, 255, 0.7)",
  },
  prizeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#27ae60",
  },
  confirmationCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  confirmationText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 24,
    marginBottom: 8,
  },
  confirmationPrice: {
    fontWeight: "700",
    color: "#d4af37",
  },
  confirmationNote: {
    fontSize: 14,
    color: "#c0c0c0",
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    padding: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#c0c0c0",
  },
  purchaseButton: {
    flex: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  purchaseButtonGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 16,
    borderRadius: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0a0a0a",
  },
});
