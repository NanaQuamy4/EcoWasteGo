import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

interface RatingStats {
  total_ratings: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  recent_ratings: Array<{
    rating: number;
    comment: string;
    date: string;
    customer_id: string;
  }>;
}

export default function RecyclerRatingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ===== DATA FETCHING =====
  const fetchRatingStats = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      if (!currentUser) {
        console.log('No current user, skipping rating stats load');
        return;
      }

      // Fetch rating statistics
      const { data, error } = await supabase
        .rpc('get_recycler_rating_stats', { p_recycler_id: currentUser.id });

      if (error) {
        console.error('Error fetching rating stats:', error);
        throw error;
      }

      setRatingStats(data?.[0] || null);
      console.log('Rating stats loaded successfully:', data?.[0]);
      
    } catch (error) {
      console.error('Error loading rating stats:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ===== USER AUTHENTICATION =====
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting current user:', error);
          return;
        }
        if (user) {
          setCurrentUser(user);
          console.log('Current user loaded:', user.id);
        }
      } catch (error) {
        console.error('Error in getCurrentUser:', error);
      }
    };

    getCurrentUser();
  }, []);

  // ===== INITIALIZATION =====
  useEffect(() => {
    if (currentUser) {
      fetchRatingStats();
    }
  }, [currentUser, fetchRatingStats]);

  // ===== REFRESH HANDLER =====
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRatingStats(false);
    setRefreshing(false);
  }, [fetchRatingStats]);

  // ===== RENDER FUNCTIONS =====
  const renderStars = (rating: number, size: number = 20) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialIcons
            key={star}
            name={star <= rating ? 'star' : 'star-border'}
            size={size}
            color={star <= rating ? '#FFD700' : '#CCCCCC'}
          />
        ))}
      </View>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#4CAF50';
    if (rating >= 3.5) return '#FF9800';
    if (rating >= 2.5) return '#FF5722';
    return '#F44336';
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Average';
    if (rating >= 1.5) return 'Below Average';
    return 'Poor';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading rating statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>My Ratings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {ratingStats && ratingStats.total_ratings > 0 ? (
          <>
            {/* Overall Rating Card */}
            <View style={styles.overallCard}>
              <Text style={styles.cardTitle}>Overall Rating</Text>
              <View style={styles.overallRating}>
                <Text style={[styles.ratingNumber, { color: getRatingColor(ratingStats.average_rating) }]}>
                  {ratingStats.average_rating.toFixed(1)}
                </Text>
                <View style={styles.ratingDetails}>
                  {renderStars(Math.round(ratingStats.average_rating), 24)}
                  <Text style={[styles.ratingText, { color: getRatingColor(ratingStats.average_rating) }]}>
                    {getRatingText(ratingStats.average_rating)}
                  </Text>
                  <Text style={styles.ratingCount}>
                    Based on {ratingStats.total_ratings} rating{ratingStats.total_ratings !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </View>

            {/* Rating Breakdown */}
            <View style={styles.breakdownCard}>
              <Text style={styles.cardTitle}>Rating Breakdown</Text>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingStats[`${stars}_star_count` as keyof RatingStats] as number;
                const percentage = ratingStats.total_ratings > 0 ? (count / ratingStats.total_ratings) * 100 : 0;
                
                return (
                  <View key={stars} style={styles.breakdownRow}>
                    <View style={styles.starLabel}>
                      <Text style={styles.starText}>{stars}</Text>
                      <MaterialIcons name="star" size={16} color="#FFD700" />
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${percentage}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.countText}>{count}</Text>
                  </View>
                );
              })}
            </View>

            {/* Recent Ratings */}
            <View style={styles.recentCard}>
              <Text style={styles.cardTitle}>Recent Ratings</Text>
              {ratingStats.recent_ratings.slice(0, 5).map((rating, index) => (
                <View key={index} style={styles.ratingItem}>
                  <View style={styles.ratingHeader}>
                    {renderStars(rating.rating, 16)}
                    <Text style={styles.ratingDate}>
                      {new Date(rating.date).toLocaleDateString()}
                    </Text>
                  </View>
                  {rating.comment && (
                    <Text style={styles.ratingComment}>&quot;{rating.comment}&quot;</Text>
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="star-border" size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Ratings Yet</Text>
            <Text style={styles.emptyText}>
              Complete more pickups to start receiving ratings from customers.
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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  overallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 16,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: 20,
  },
  ratingDetails: {
    flex: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: COLORS.gray,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  starText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    marginRight: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGreen,
    width: 30,
    textAlign: 'right',
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ratingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  ratingComment: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});
