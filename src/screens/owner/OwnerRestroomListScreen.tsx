import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../App';

type OwnerRestroomListNavigationProp = StackNavigationProp<RootStackParamList>;

interface OwnerRestroom {
  id: number;
  name: string;
  address: string;
  price: number;
  is_free: boolean;
  current_users: number;
  rating: number;
  total_reviews: number;
  admin_contact: string;
  image_url?: string;
  images?: string[];
  male_standing?: number;
  male_sitting?: number;
  female_sitting?: number;
  disabled_access?: boolean;
  status?: 'active' | 'inactive';
  // Mock fields for demo
  todayUsage?: number;
  weekUsage?: number;
}

const { width } = Dimensions.get('window');

const OwnerRestroomListScreen: React.FC = () => {
  const { user } = useUser();
  const navigation = useNavigation<OwnerRestroomListNavigationProp>();
  const [restrooms, setRestrooms] = useState<OwnerRestroom[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRestrooms();
  }, []);

  // Refresh when screen comes into focus (e.g., returning from AddRestroom)
  useFocusEffect(
    React.useCallback(() => {
      loadRestrooms();
    }, [])
  );

  const loadRestrooms = async () => {
    try {
      if (!user || !user.email) {
        console.log('No user email found');
        return;
      }

      const data = await api.getOwnerRestroomsByEmail(user.email);
      
      // Convert API data to match our interface
      const convertedRestrooms: OwnerRestroom[] = data.map(restroom => ({
        id: restroom.id,
        name: restroom.name,
        address: restroom.address,
        price: restroom.price || 0,
        is_free: restroom.is_free !== undefined ? restroom.is_free : true,
        current_users: restroom.current_users || 0,
        rating: 5.0,
        total_reviews: restroom.total_reviews || 0,
        admin_contact: restroom.admin_contact || '',
        image_url: restroom.image_url,
        images: restroom.images || (restroom.image_url ? [restroom.image_url] : []),
        male_standing: restroom.male_standing || 0,
        male_sitting: restroom.male_sitting || 0,
        female_sitting: restroom.female_sitting || 0,
        disabled_access: restroom.disabled_access || false,
        status: 'active' as const,
        // Mock data for demo
        todayUsage: Math.floor(Math.random() * 20),
        weekUsage: Math.floor(Math.random() * 100),
      }));
      
      setRestrooms(convertedRestrooms);
    } catch (error) {
      console.error('Error loading restrooms:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách nhà vệ sinh');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRestrooms();
    setRefreshing(false);
  };

  const addRestroom = () => {
    // Navigate to AddRestroom screen
    navigation.navigate('AddRestroom' as never);
  };

  const handleViewDetail = (restroomId: number) => {
    if (!user?.id) return;
    navigation.navigate('OwnerRestroomDetail', { 
      restroomId, 
      ownerId: user.id 
    });
  };

  const toggleRestroomStatus = (id: number) => {
    Alert.alert(
      'Thay đổi trạng thái',
      'Bạn có muốn thay đổi trạng thái nhà vệ sinh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            setRestrooms(restrooms.map(restroom => {
              if (restroom.id === id) {
                const newStatus = restroom.status === 'active' ? 'inactive' : 'active';
                return { ...restroom, status: newStatus };
              }
              return restroom;
            }));
          },
        },
      ]
    );
  };

  const editRestroom = (id: number) => {
    // TODO: Navigate to edit screen
    Alert.alert('Chỉnh sửa', `Chỉnh sửa nhà vệ sinh ID: ${id}`);
  };

  const deleteRestroom = (id: number) => {
    Alert.alert(
      'Xóa nhà vệ sinh',
      'Bạn có chắc chắn muốn xóa nhà vệ sinh này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setRestrooms(restrooms.filter(restroom => restroom.id !== id));
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'inactive':
        return '#FF9800';
      case 'maintenance':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Tạm dừng';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return status;
    }
  };

  const renderRestroomCard = (restroom: OwnerRestroom) => (
    <TouchableOpacity 
      key={restroom.id} 
      style={styles.card}
      onPress={() => handleViewDetail(restroom.id)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.imageContainer}>
          {restroom.images && restroom.images.length > 0 ? (
            <Image source={{ uri: restroom.images[0] }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name="business" size={32} color="#ccc" />
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(restroom.status || 'active') }]}>
            <Text style={styles.statusText}>{getStatusText(restroom.status || 'active')}</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.restroomName}>{restroom.name}</Text>
          <Text style={styles.address}>{restroom.address}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.statText}>5.0</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="chatbubble" size={16} color="#666" />
              <Text style={styles.statText}>{restroom.total_reviews}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="people" size={16} color="#00bf63" />
              <Text style={styles.statText}>{restroom.current_users}</Text>
            </View>
          </View>

          <View style={styles.toiletInfo}>
            <Text style={styles.toiletText}>
              Nam: {(restroom.male_standing || 0) + (restroom.male_sitting || 0)} • 
              Nữ: {restroom.female_sitting || 0}
              {restroom.disabled_access && ' • ♿'}
            </Text>
          </View>

          <View style={styles.priceInfo}>
            <Text style={styles.priceText}>
              {restroom.is_free ? 'Miễn phí' : `${restroom.price.toLocaleString()}₫`}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.toggleButton]}
          onPress={() => toggleRestroomStatus(restroom.id)}
        >
          <Ionicons 
            name={restroom.status === 'active' ? 'pause' : 'play'} 
            size={16} 
            color="white" 
          />
          <Text style={styles.actionButtonText}>
            {restroom.status === 'active' ? 'Tạm dừng' : 'Kích hoạt'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editRestroom(restroom.id)}
        >
          <Ionicons name="pencil" size={16} color="white" />
          <Text style={styles.actionButtonText}>Sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteRestroom(restroom.id)}
        >
          <Ionicons name="trash" size={16} color="white" />
          <Text style={styles.actionButtonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhà vệ sinh của tôi</Text>
        <TouchableOpacity style={styles.addButton} onPress={addRestroom}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {restrooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>Chưa có nhà vệ sinh nào</Text>
            <Text style={styles.emptyMessage}>
              Hãy đăng ký nhà vệ sinh đầu tiên của bạn
            </Text>
          </View>
        ) : (
          restrooms.map(renderRestroomCard)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
  },
  restroomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  toiletInfo: {
    marginTop: 4,
  },
  toiletText: {
    fontSize: 12,
    color: '#888',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceInfo: {
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#00bf63',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  toggleButton: {
    backgroundColor: '#007AFF',
  },
  editButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default OwnerRestroomListScreen;