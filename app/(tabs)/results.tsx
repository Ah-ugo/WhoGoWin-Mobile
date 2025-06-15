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
    accent: ["#1a1a2e", "#16213e"],
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

  const AnimatedResultCard = ({
    result,
    index,
  }: {
    result: DrawResult;
    index: number;
  }) => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const cardDelay = index * 100;

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
      scale.value = withSequence(withSpring(0.96), withSpring(1));
      rotation.value = withSequence(
        withSpring(2),
        withSpring(-2),
        withSpring(0)
      );
      toggleCard(result._id);
    };

    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={[styles.resultCard, animatedStyle]}>
          <View style={styles.resultCardContent}>
            {/* Header Section */}
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
                <Text style={styles.potLabel}>Prize Pool</Text>
                <Text style={styles.potAmount}>
                  ₦{result.total_pot.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* First Place Winner */}
            {result.first_place_winner && (
              <View style={styles.winnerSection}>
                <View style={styles.winnerCard}>
                  <LinearGradient
                    colors={gradientColors.gold}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.winnerGradient}
                  >
                    <View style={styles.winnerHeader}>
                      <View style={styles.winnerIconContainer}>
                        <Ionicons name="trophy" size={18} color="#ffffff" />
                      </View>
                      <Text style={styles.winnerTitle}>Champion</Text>
                    </View>
                    <View style={styles.winnerDetails}>
                      <Text style={styles.winnerName}>
                        {result.first_place_winner.name}
                      </Text>
                      <Text style={styles.winnerPrize}>
                        ₦
                        {result.first_place_winner.prize_amount.toLocaleString()}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* Consolation Winners - Expanded */}
            {expandedCard === result._id &&
              result.consolation_winners.length > 0 && (
                <View style={styles.consolationSection}>
                  <View style={styles.consolationHeader}>
                    <Text style={styles.consolationTitle}>Other Winners</Text>
                    <Text style={styles.consolationCount}>
                      {result.consolation_winners.length}
                    </Text>
                  </View>
                  <View style={styles.consolationGrid}>
                    {result.consolation_winners.map((winner, index) => (
                      <View key={index} style={styles.consolationWrapper}>
                        <LinearGradient
                          colors={
                            index < 2
                              ? gradientColors.silver
                              : gradientColors.bronze
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.consolationCard}
                        >
                          <View style={styles.consolationRank}>
                            <Text style={styles.consolationRankText}>
                              #{index + 2}
                            </Text>
                          </View>
                          <View style={styles.consolationInfo}>
                            <Text
                              style={styles.consolationName}
                              numberOfLines={1}
                            >
                              {winner.name}
                            </Text>
                            <Text style={styles.consolationPrize}>
                              ₦{winner.prize_amount.toLocaleString()}
                            </Text>
                          </View>
                        </LinearGradient>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {/* Expand/Collapse Indicator */}
            <View style={styles.expandSection}>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={handlePress}
                activeOpacity={0.7}
              >
                <Text style={styles.expandText}>
                  {expandedCard === result._id
                    ? "Show Less"
                    : "Show All Winners"}
                </Text>
                <Ionicons
                  name={
                    expandedCard === result._id ? "chevron-up" : "chevron-down"
                  }
                  size={16}
                  color="rgba(255,255,255,0.7)"
                />
              </TouchableOpacity>
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

  const animatedSpinnerStyle = useAnimatedStyle(() => {
    const floatingOffset = interpolate(
      floatingAnimation.value,
      [-1, 0, 1],
      [-3, 0, 3]
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
                <Ionicons name="trophy-outline" size={40} color="#d4af37" />
              </View>
            </Animated.View>
            <Text style={styles.loadingText}>Loading Results</Text>
            <Text style={styles.loadingSubtext}>
              Fetching the latest winners
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
              <Text style={styles.title}>Draw Results</Text>
              <Text style={styles.subtitle}>Latest winners and prizes</Text>
            </View>
            <View style={styles.headerIcon}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="trophy-outline" size={20} color="#d4af37" />
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={styles.resultsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Draws</Text>
            <Text style={styles.sectionSubtitle}>
              {results.length} completed
            </Text>
          </View>

          {results.map((result, index) => (
            <AnimatedResultCard
              key={result._id}
              result={result}
              index={index}
            />
          ))}

          {results.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="trophy-outline" size={32} color="#666666" />
              </View>
              <Text style={styles.emptyStateText}>No Results Yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Results will appear here after draws are completed
              </Text>
            </View>
          )}
        </View>
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
  titleSection: {
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
  headerIcon: {
    padding: 4,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultsSection: {
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
  resultCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginBottom: 16,
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
    alignItems: "center",
    marginBottom: 16,
  },
  drawTypeSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  drawIconContainer: {
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
  drawType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  drawDate: {
    fontSize: 12,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#d4af37",
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 16,
  },
  winnerSection: {
    marginBottom: 16,
  },
  winnerCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  winnerGradient: {
    padding: 16,
  },
  winnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  winnerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  winnerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  winnerDetails: {
    paddingLeft: 8,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  winnerPrize: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  consolationSection: {
    marginBottom: 16,
  },
  consolationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 8,
  },
  consolationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  consolationCount: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  consolationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  consolationWrapper: {
    width: (width - 72) / 2,
  },
  consolationCard: {
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  consolationRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  consolationRankText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  consolationInfo: {
    flex: 1,
  },
  consolationName: {
    fontSize: 13,
    color: "#ffffff",
    fontWeight: "500",
    marginBottom: 2,
  },
  consolationPrize: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
  expandSection: {
    alignItems: "center",
    paddingTop: 8,
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 6,
  },
  expandText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
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
