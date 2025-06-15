import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
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
import { apiService } from "../../services/apiService";

const { width, height } = Dimensions.get("window");

interface Ticket {
  _id: string;
  draw_id: string;
  draw_type: string;
  ticket_price: number;
  purchase_date: string;
  status: string;
  is_winner: boolean;
  prize_amount?: number;
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "won" | "lost">(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerTranslateY = useSharedValue(-50);
  const headerOpacity = useSharedValue(0);
  const filterScale = useSharedValue(0.8);
  const filterOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(100);
  const cardsOpacity = useSharedValue(0);
  const floatingAnimation = useSharedValue(0);

  const gradientColors = {
    background: ["#0a0a0a", "#1a1a1a"],
    card: ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"],
    filter: ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"],
    filterActive: ["#d4af37", "#b8941f"],
    won: ["#10b981", "#059669"],
    active: ["#3b82f6", "#2563eb"],
    lost: ["#6b7280", "#4b5563"],
  };

  const fetchTickets = async () => {
    try {
      const response = await apiService.get("/tickets/my-tickets");
      setTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
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

    filterScale.value = withDelay(
      300,
      withSpring(1, {
        damping: 20,
        stiffness: 150,
      })
    );
    filterOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

    cardsTranslateY.value = withDelay(
      600,
      withSpring(0, {
        damping: 25,
        stiffness: 120,
      })
    );
    cardsOpacity.value = withDelay(600, withTiming(1, { duration: 900 }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const filteredTickets = tickets.filter((ticket) => {
    switch (filter) {
      case "active":
        return ticket.status === "active";
      case "won":
        return ticket.is_winner;
      case "lost":
        return ticket.status === "completed" && !ticket.is_winner;
      default:
        return true;
    }
  });

  const getStatusColor = (ticket: Ticket) => {
    if (ticket.is_winner) return gradientColors.won;
    if (ticket.status === "active") return gradientColors.active;
    return gradientColors.lost;
  };

  const getStatusText = (ticket: Ticket) => {
    if (ticket.is_winner) return "Won";
    if (ticket.status === "active") return "Active";
    return "Lost";
  };

  const getTicketIcon = (ticket: Ticket) => {
    if (ticket.is_winner) return "trophy-outline";
    if (ticket.status === "active") return "time-outline";
    return "close-circle-outline";
  };

  // Animated styles
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
      opacity: headerOpacity.value,
    };
  });

  const animatedFilterStyle = useAnimatedStyle(() => {
    const floatingOffset = interpolate(
      floatingAnimation.value,
      [-1, 0, 1],
      [-1, 0, 1]
    );
    return {
      transform: [{ scale: filterScale.value }, { translateY: floatingOffset }],
      opacity: filterOpacity.value,
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
            <Animated.View style={[styles.loadingSpinner, animatedFilterStyle]}>
              <View style={styles.loadingSpinnerInner}>
                <Ionicons name="ticket-outline" size={48} color="#d4af37" />
              </View>
            </Animated.View>
            <Text style={styles.loadingText}>Loading</Text>
            <Text style={styles.loadingSubtext}>Fetching your tickets</Text>
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
            <View style={styles.titleSection}>
              <Text style={styles.title}>My Tickets</Text>
              <Text style={styles.subtitle}>
                Track your entries and winnings
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.filterSection, animatedFilterStyle]}>
          <View style={styles.filterContainer}>
            {(["all", "active", "won", "lost"] as const).map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                style={[
                  styles.filterButton,
                  filter === filterOption && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(filterOption)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    filter === filterOption && styles.filterButtonTextActive,
                  ]}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </Text>
                {filter === filterOption && (
                  <View style={styles.filterIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.ticketsSection, animatedCardsStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {filter === "all"
                ? "All Tickets"
                : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Tickets`}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {filteredTickets.length} ticket
              {filteredTickets.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {filteredTickets.map((ticket, index) => (
            <View key={ticket._id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={styles.ticketTypeSection}>
                  <View
                    style={[
                      styles.ticketIconContainer,
                      { borderColor: `${getStatusColor(ticket)[0]}40` },
                    ]}
                  >
                    <Ionicons
                      name={getTicketIcon(ticket)}
                      size={20}
                      color={getStatusColor(ticket)[0]}
                    />
                  </View>
                  <View>
                    <Text style={styles.drawType}>{ticket.draw_type} Draw</Text>
                    <Text style={styles.purchaseDate}>
                      {new Date(ticket.purchase_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusContainer,
                    { backgroundColor: `${getStatusColor(ticket)[0]}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(ticket)[0] },
                    ]}
                  >
                    {getStatusText(ticket)}
                  </Text>
                </View>
              </View>

              <View style={styles.ticketDetails}>
                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>Ticket Price</Text>
                  <Text style={styles.ticketPrice}>
                    ₦{ticket.ticket_price.toLocaleString()}
                  </Text>
                </View>

                {ticket.is_winner && ticket.prize_amount && (
                  <View style={styles.prizeSection}>
                    <Text style={styles.prizeLabel}>Prize Won</Text>
                    <Text style={styles.prizeAmount}>
                      ₦{ticket.prize_amount.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {filteredTickets.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="ticket-outline" size={32} color="#666666" />
              </View>
              <Text style={styles.emptyStateText}>
                {filter === "all"
                  ? "No Tickets Yet"
                  : `No ${
                      filter.charAt(0).toUpperCase() + filter.slice(1)
                    } Tickets`}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {filter === "all"
                  ? "Purchase your first ticket to get started!"
                  : `You don't have any ${filter} tickets at the moment.`}
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
  titleSection: {
    flex: 1,
  },
  title: {
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
  filterSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: "#d4af37",
  },
  filterButtonText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#0a0a0a",
    fontWeight: "600",
  },
  filterIndicator: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    marginLeft: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#0a0a0a",
  },
  ticketsSection: {
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
  ticketCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ticketTypeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
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
  purchaseDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "400",
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ticketDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  priceSection: {
    flex: 1,
  },
  prizeSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  prizeLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "right",
  },
  ticketPrice: {
    fontSize: 16,
    color: "#ffffff",
    fontWeight: "600",
  },
  prizeAmount: {
    fontSize: 16,
    color: "#d4af37",
    fontWeight: "700",
    letterSpacing: -0.5,
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
    lineHeight: 20,
  },
});
