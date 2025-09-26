import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';

interface UsageHistoryItem {
  id: number;
  type: 'usage';
  restroom_name: string;
  restroom_address: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  created_at: string;
}

interface ReviewHistoryItem {
  id: number;
  type: 'review';
  restroom_name: string;
  restroom_address: string;
  rating: number;
  comment?: string;
  image_path?: string;
  created_at: string;
}

type HistoryItem = UsageHistoryItem | ReviewHistoryItem;

const HistoryScreen: React.FC = () => {
  const { user } = useUser();
  const [usageHistory, setUsageHistory] = useState<UsageHistoryItem[]>([]);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'usage' | 'reviews'>('usage');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user || user.is_random_user) {
      setLoading(false);
      return;
    }

    try {
      const historyData = await api.getUserHistory(user.id);
      if (historyData) {
        setUsageHistory(historyData.usage_history);
        setReviewHistory(historyData.reviews);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes?: number): string => {
    if (!minutes) return 'Không xác định';
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color="#FFD700"
          />
        ))}
      </View>
    );
  };

  const renderUsageItem = ({ item }: { item: UsageHistoryItem }) => (
    <View style={styles.historyItem}>
      <Text style={styles.restroomName}>{item.restroom_name}</Text>
      <Text style={styles.restroomAddress}>{item.restroom_address}</Text>

      <View style={styles.timeInfo}>
        <Text style={styles.timeLabel}>- Thời gian bắt đầu:</Text>
        <Text style={styles.timeValue}>{formatDate(item.start_time)}</Text>
      </View>

      {item.end_time && (
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>- Thời gian kết thúc:</Text>
          <Text style={styles.timeValue}>{formatDate(item.end_time)}</Text>
        </View>
      )}

      <View style={styles.timeInfo}>
        <Text style={styles.timeLabel}>- Thời lượng:</Text>
        <Text style={styles.durationValue}>{formatDuration(item.duration_minutes)}</Text>
      </View>
    </View>
  );

  const renderReviewItem = ({ item }: { item: ReviewHistoryItem }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemHeader}>
        <Ionicons name="star" size={20} color="#FFD700" />
        <Text style={styles.itemTitle}>Đánh giá</Text>
      </View>

      <Text style={styles.restroomName}>{item.restroom_name}</Text>
      <Text style={styles.restroomAddress}>{item.restroom_address}</Text>

      <View style={styles.ratingContainer}>
        {renderStars(5)}
        <Text style={styles.ratingText}>(5.0/5)</Text>
      </View>

      {item.comment && (
        <Text style={styles.comment}>{item.comment}</Text>
      )}

      {item.image_path && (
        <Image source={{ uri: item.image_path }} style={styles.reviewImage} />
      )}

      <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
    </View>
  );

  const renderContent = () => {
    if (!user) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="person" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Vui lòng đăng nhập để xem lịch sử</Text>
        </View>
      );
    }

    if (user.is_random_user) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Tính năng lịch sử chỉ dành cho tài khoản đã đăng ký</Text>
          <Text style={styles.emptySubtext}>Vui lòng đăng ký hoặc đăng nhập để sử dụng</Text>
        </View>
      );
    }

    const currentData = activeTab === 'usage' ? usageHistory : reviewHistory;

    if (currentData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={activeTab === 'usage' ? 'time' : 'star'} 
            size={64} 
            color="#ccc" 
          />
          <Text style={styles.emptyText}>
            {activeTab === 'usage' ? 'Chưa có lịch sử sử dụng' : 'Chưa có đánh giá nào'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={currentData as any[]}
        renderItem={({ item }) => 
          activeTab === 'usage' 
            ? renderUsageItem({ item: item as UsageHistoryItem })
            : renderReviewItem({ item: item as ReviewHistoryItem })
        }
        keyExtractor={(item) => `${activeTab}-${item.id}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải lịch sử...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>Lịch sử</Text> */}
      </View>

      {/* Tabs */}
      {user && !user.is_random_user && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'usage' && styles.activeTab]}
            onPress={() => setActiveTab('usage')}
          >
            <Ionicons 
              name="time" 
              size={20} 
              color={activeTab === 'usage' ? '#00bf63' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'usage' && styles.activeTabText]}>
              Sử dụng ({usageHistory.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Ionicons 
              name="star" 
              size={20} 
              color={activeTab === 'reviews' ? '#00bf63' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Đánh giá ({reviewHistory.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00bf63',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#00bf63',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  restroomName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  restroomAddress: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  durationValue: {
    fontSize: 14,
    color: '#00bf63',
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  comment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default HistoryScreen;