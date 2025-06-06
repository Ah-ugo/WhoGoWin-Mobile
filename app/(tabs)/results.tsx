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

  // Animation values
  const headerTranslateY = useSharedValue(-50);
  const headerOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(100);
  const cardsOpacity = useSharedValue(0);
  const spinnerScale = useSharedValue(0.8);
  const spinnerOpacity = useSharedValue(0);
  const floatingAnimation = useSharedValue(0);

  const gradientColors = {
    background: ["#0a0a0a", "#1a1a1a"],
    gold: ["#d4af37", "#b8941f"],
    silver: ["#c0c0c0", "#a8a8a8"],
    bronze: ["#cd7f32", "#a66a2a"],
    card: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"],
  };

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
    startAnimations();
  }, []);

  const startAnimations = () => {
    headerTranslateY.value = withSpring(0, { damping: 25, stiffness: 120 });
    headerOpacity.value = withTiming(1, { duration: 1000 });

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
    fetchResults();
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const AnimatedResultCard = ({ result }: { result: DrawResult }) => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { scale: scale.value },
          { rotateY: `${rotation.value}deg` },
          { translateY: cardsTranslateY.value },
        ],
        opacity: cardsOpacity.value,
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
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Animated.View style={[styles.resultCard, animatedStyle]}>
          <View style={styles.resultCardContent}>
            <View style={styles.resultHeader}>
              <View style={styles.drawTypeSection}>
                <View style={styles.drawIconContainer}>
                  <Ionicons
                    name={getDrawIcon(result.draw_type)}
                    size={20}
                    color="#d4af37"
                  />
                </View>
                <View>
                  <Text style={styles.drawType}>{result.draw_type} Draw</Text>
                  <Text style={styles.drawDate}>
                    {formatDate(result.end_time)}
                  </Text>
                </View>
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
                <LinearGradient
                  colors={gradientColors.gold}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.winnerCard}
                >
                  <View style={styles.winnerHeader}>
                    <View style={styles.winnerIconContainer}>
                      <Ionicons name="trophy" size={20} color="#ffffff" />
                    </View>
                    <Text style={styles.winnerTitle}>First Place Winner</Text>
                  </View>
                  <View style={styles.winnerDetails}>
                    <Text style={styles.winnerName}>
                      {result.first_place_winner.name}
                    </Text>
                    <Text style={styles.winnerPrize}>
                      ₦{result.first_place_winner.prize_amount.toLocaleString()}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {expandedCard === result._id &&
              result.consolation_winners.length > 0 && (
                <View style={styles.consolationSection}>
                  <Text style={styles.consolationTitle}>
                    Consolation Winners
                  </Text>
                  <View style={styles.consolationGrid}>
                    {result.consolation_winners.map((winner, index) => (
                      <LinearGradient
                        key={index}
                        colors={
                          index < 3
                            ? gradientColors.silver
                            : gradientColors.bronze
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.consolationCard}
                      >
                        <View style={styles.consolationPlacement}>
                          <Text style={styles.consolationPlacementText}>
                            #{index + 1}
                          </Text>
                        </View>
                        <View style={styles.consolationWinner}>
                          <Text style={styles.consolationName}>
                            {winner.name}
                          </Text>
                          <Text style={styles.consolationPrize}>
                            ₦{winner.prize_amount.toLocaleString()}
                          </Text>
                        </View>
                      </LinearGradient>
                    ))}
                  </View>
                </View>
              )}

            <View style={styles.expandIndicator}>
              <Ionicons
                name={
                  expandedCard === result._id ? "chevron-up" : "chevron-down"
                }
                size={20}
                color="rgba(255,255,255,0.7)"
              />
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: headerTranslateY.value }],
      opacity: headerOpacity.value,
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
                <Ionicons name="trophy-outline" size={48} color="#d4af37" />
              </View>
            </Animated.View>
            <Text style={styles.loadingText}>Loading Results</Text>
            <Text style={styles.loadingSubtext}>
              Fetching the latest draw winners
            </Text>
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

      <Animated.View style={[styles.header, animatedHeaderStyle]}>
        <Text style={styles.title}>Draw Results</Text>
        <Text style={styles.subtitle}>See who won the latest draws</Text>
      </Animated.View>

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
        {results.map((result) => (
          <AnimatedResultCard key={result._id} result={result} />
        ))}

        {results.length === 0 && (
          <Animated.View style={[styles.emptyState, animatedCardStyle]}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="trophy-outline" size={48} color="#666666" />
            </View>
            <Text style={styles.emptyStateText}>No Results Yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Results will appear here after draws are completed
            </Text>
          </Animated.View>
        )}
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  loadingSubtext: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
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
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
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
  resultCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  resultCardContent: {
    padding: 20,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  drawTypeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  drawIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  drawType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  drawDate: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  potContainer: {
    alignItems: "flex-end",
  },
  potLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  potAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#d4af37",
    letterSpacing: -0.5,
  },
  winnerSection: {
    marginBottom: 16,
  },
  winnerCard: {
    borderRadius: 12,
    padding: 16,
  },
  winnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  winnerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  winnerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  winnerDetails: {
    paddingLeft: 8,
  },
  winnerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  winnerPrize: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  consolationSection: {
    marginBottom: 16,
  },
  consolationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
    paddingLeft: 8,
  },
  consolationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  consolationCard: {
    width: (width - 72) / 2,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  consolationPlacement: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  consolationPlacementText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  consolationWinner: {
    flex: 1,
  },
  consolationName: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
    marginBottom: 2,
  },
  consolationPrize: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  expandIndicator: {
    alignItems: "center",
    paddingTop: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
});
