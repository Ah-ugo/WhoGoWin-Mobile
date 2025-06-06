import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiService } from "../../services/apiService";

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
  }, []);

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
    if (ticket.is_winner) return "#34C759";
    if (ticket.status === "active") return "#007AFF";
    return "#8E8E93";
  };

  const getStatusText = (ticket: Ticket) => {
    if (ticket.is_winner) return "Won";
    if (ticket.status === "active") return "Active";
    return "Lost";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading tickets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
      </View>

      <View style={styles.filterContainer}>
        {(["all", "active", "won", "lost"] as const).map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterButton,
              filter === filterOption && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === filterOption && styles.filterButtonTextActive,
              ]}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.ticketsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTickets.map((ticket) => (
          <View key={ticket._id} style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <View>
                <Text style={styles.drawType}>{ticket.draw_type} Draw</Text>
                <Text style={styles.ticketPrice}>₦{ticket.ticket_price}</Text>
              </View>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(ticket) },
                  ]}
                >
                  <Text style={styles.statusText}>{getStatusText(ticket)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.ticketDetails}>
              <Text style={styles.purchaseDate}>
                Purchased: {new Date(ticket.purchase_date).toLocaleDateString()}
              </Text>
              {ticket.is_winner && ticket.prize_amount && (
                <Text style={styles.prizeAmount}>
                  Prize: ₦{ticket.prize_amount.toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        ))}

        {filteredTickets.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>
              {filter === "all" ? "No tickets yet" : `No ${filter} tickets`}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Buy your first ticket to get started!
            </Text>
          </View>
        )}
      </ScrollView>
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
  filterContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  ticketsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ticketCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  drawType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1D1D1F",
    marginBottom: 4,
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ticketDetails: {
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    paddingTop: 12,
  },
  purchaseDate: {
    fontSize: 14,
    color: "#86868B",
    marginBottom: 4,
  },
  prizeAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34C759",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#86868B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#C7C7CC",
    textAlign: "center",
  },
});
