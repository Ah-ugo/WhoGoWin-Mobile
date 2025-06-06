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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { apiService } from "../../services/apiService";

interface DrawResult {
  _id: string;
  draw_type: string;
  end_time: string;
  total_pot: number;
  first_place_winner?: {
    user_id: string;
    name: string;
    prize_amount: number;
  };
  consolation_winners: Array<{
    user_id: string;
    name: string;
    prize_amount: number;
  }>;
  status: string;
}

export default function Results() {
  const [results, setResults] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      const response = await apiService.get("/draws/completed");
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults();
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const AnimatedResultCard = ({ result }: { result: DrawResult }) => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { scale: scale.value },
          { rotateY: `${rotation.value}deg` },
        ],
      };
    });

    const handlePress = () => {
      scale.value = withSequence(withSpring(0.95), withSpring(1));
      rotation.value = withSequence(
        withSpring(5),
        withSpring(-5),
        withSpring(0)
      );
      toggleCard(result._id);
    };

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={styles.resultCard}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.drawType}>{result.draw_type} Draw</Text>
              <Text style={styles.drawDate}>
                {new Date(result.end_time).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.potContainer}>
              <Text style={styles.potLabel}>Total Pot</Text>
              <Text style={styles.potAmount}>
                ₦{result.total_pot.toLocaleString()}
              </Text>
            </View>
          </View>

          {result.first_place_winner && (
            <View style={styles.winnerSection}>
              <View style={styles.winnerHeader}>
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.winnerTitle}>First Place Winner</Text>
              </View>
              <Text style={styles.winnerName}>
                {result.first_place_winner.name}
              </Text>
              <Text style={styles.winnerPrize}>
                ₦{result.first_place_winner.prize_amount.toLocaleString()}
              </Text>
            </View>
          )}

          {expandedCard === result._id &&
            result.consolation_winners.length > 0 && (
              <View style={styles.consolationSection}>
                <Text style={styles.consolationTitle}>Consolation Winners</Text>
                {result.consolation_winners.map((winner, index) => (
                  <View key={index} style={styles.consolationWinner}>
                    <Text style={styles.consolationName}>{winner.name}</Text>
                    <Text style={styles.consolationPrize}>
                      ₦{winner.prize_amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

          <View style={styles.expandIndicator}>
            <Ionicons
              name={expandedCard === result._id ? "chevron-up" : "chevron-down"}
              size={16}
              color="#86868B"
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Draw Results</Text>
        <Text style={styles.subtitle}>See who won the latest draws</Text>
      </View>

      <ScrollView
        style={styles.resultsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {results.map((result) => (
          <AnimatedResultCard key={result._id} result={result} />
        ))}

        {results.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No results yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Results will appear here after draws are completed
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#86868B",
  },
  resultsList: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  drawType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1D1F",
    marginBottom: 4,
  },
  drawDate: {
    fontSize: 14,
    color: "#86868B",
  },
  potContainer: {
    alignItems: "flex-end",
  },
  potLabel: {
    fontSize: 12,
    color: "#86868B",
    marginBottom: 2,
  },
  potAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#34C759",
  },
  winnerSection: {
    backgroundColor: "#FFF9E6",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE066",
  },
  winnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  winnerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B8860B",
    marginLeft: 6,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D1D1F",
    marginBottom: 4,
  },
  winnerPrize: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF9500",
  },
  consolationSection: {
    backgroundColor: "#F0F9FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#B3E5FC",
  },
  consolationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0277BD",
    marginBottom: 12,
  },
  consolationWinner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  consolationName: {
    fontSize: 16,
    color: "#1D1D1F",
  },
  consolationPrize: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0277BD",
  },
  expandIndicator: {
    alignItems: "center",
    paddingTop: 8,
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
