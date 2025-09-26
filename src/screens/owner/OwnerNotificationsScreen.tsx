import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  restroom?: {
    id: number;
    name: string;
  };
}

const OwnerNotificationsScreen: React.FC = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  // Auto-refresh every 30 seconds when screen is active
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      if (user?.email) {
        const data = await api.getOwnerNotifications(user.email);
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Lỗi', 'Không thể tải thông báo. Vui lòng thử lại.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await api.markNotificationRead(notification.id);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    if (notification.restroom) {
      Alert.alert('Thông tin', `Nhà vệ sinh: ${notification.restroom.name}`);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'navigation_request':
        return 'navigate';
      case 'arrival':
        return 'location';
      case 'usage_start':
        return 'play';
      case 'usage_end':
        return 'stop';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'navigation_request':
        return '#007AFF';
      case 'arrival':
        return '#34C759';
      case 'usage_start':
        return '#FF9500';
      case 'usage_end':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )} */}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.is_read && styles.unreadCard
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={styles.notificationContent}>
                {/* <View style={styles.notificationHeader}> */}
                  {/* <View style={[
                    styles.iconContainer,
                    { backgroundColor: getNotificationColor(notification.type) + '20' }
                  ]}>
                    <Ionicons
                      name={getNotificationIcon(notification.type)}
                      size={20}
                      color={getNotificationColor(notification.type)}
                    />
                  </View> */}
                  {/* {!notification.is_read && <View style={styles.unreadDot} />}
                </View> */}

                <View style={styles.notificationFooter}>
                  {notification.restroom && (
                    <Text style={styles.restroomName}>
                      {notification.restroom.name}
                    </Text>
                  )}

                  <Text style={styles.timestamp}>
                    {formatTimestamp(notification.created_at)}
                  </Text>
                </View>

                <View style={styles.notificationBody}>
                  <Text style={[
                    styles.notificationMessage,
                    !notification.is_read && styles.unreadMessage
                  ]}>
                    {notification.message}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 28,
    backgroundColor: '#F5F5F5',
    // borderBottomWidth: 1,
    // borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  notificationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 70,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    flex: 1,
    marginBottom: 5,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  notificationBody: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  restroomName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default OwnerNotificationsScreen;