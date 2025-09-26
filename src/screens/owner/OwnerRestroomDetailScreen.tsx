import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

import { RootStackParamList } from '../../../App';
import { api } from '../../services/api';
import { RestroomDetail } from '../../types';

type OwnerRestroomDetailNavigationProp = StackNavigationProp<RootStackParamList, 'OwnerRestroomDetail'>;
type OwnerRestroomDetailRouteProp = RouteProp<RootStackParamList, 'OwnerRestroomDetail'>;

interface Payment {
  id: number;
  user_name: string;
  restroom_name: string;
  method: 'cash' | 'transfer';
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  transfer_image_path?: string;
  note?: string;
  created_at: string;
  confirmed_at?: string;
}

const OwnerRestroomDetailScreen: React.FC = () => {
  const navigation = useNavigation<OwnerRestroomDetailNavigationProp>();
  const route = useRoute<OwnerRestroomDetailRouteProp>();
  const { restroomId, ownerId } = route.params;

  const [restroom, setRestroom] = useState<RestroomDetail | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Load restroom details
      const restroomData = await api.getRestroomDetail(restroomId);
      setRestroom(restroomData);

      // Load payments for this restroom (filter by restroom_id)
      const allPayments = await api.getOwnerPayments(ownerId);
      const restroomPayments = allPayments.filter(p => p.restroom_name === restroomData?.name);
      setPayments(restroomPayments);
    } catch (error) {
      console.error('Error loading restroom detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin nhà vệ sinh');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [restroomId, ownerId])
  );

  const handleConfirmPayment = async (paymentId: number, action: 'confirm' | 'reject') => {
    try {
      const success = await api.confirmPayment(paymentId, action);
      if (success) {
        Alert.alert(
          'Thành công',
          action === 'confirm' ? 'Đã xác nhận thanh toán' : 'Đã từ chối thanh toán'
        );
        loadData(); // Refresh data
      } else {
        Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thanh toán');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
    }
  };

  const onRefresh = () => {
    loadData(true);
  };

  const renderRestroomInfo = () => {
    if (!restroom) return null;

    return (
      <View style={styles.restroomCard}>
        <View style={styles.restroomHeader}>
          <Text style={styles.restroomName}>{restroom.name}</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: restroom.current_users > 0 ? '#FF9500' : '#00bf63' }
            ]}>
              <Text style={styles.statusText}>
                {restroom.current_users > 0 ? `${restroom.current_users} khách đang đến` : 'Trống'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.restroomAddress}>{restroom.address}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.statText}>5.0</Text>
            <Text style={styles.statLabel}>({restroom.total_reviews})</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="cash" size={16} color="#00bf63" />
            <Text style={styles.statText}>
              {restroom.is_free ? 'Miễn phí' : `${restroom.price.toLocaleString()}₫`}
            </Text>
          </View>
        </View>

        <View style={styles.facilitiesContainer}>
          <Text style={styles.facilitiesTitle}>Tiện nghi:</Text>
          <View style={styles.facilitiesRow}>
            {(restroom.male_standing || 0) > 0 && (
              <Text style={styles.facilityText}>Nam đứng: {restroom.male_standing}</Text>
            )}
            {(restroom.male_sitting || 0) > 0 && (
              <Text style={styles.facilityText}>Nam ngồi: {restroom.male_sitting}</Text>
            )}
            {(restroom.female_sitting || 0) > 0 && (
              <Text style={styles.facilityText}>Nữ: {restroom.female_sitting}</Text>
            )}
            {restroom.disabled_access && (
              <Text style={styles.facilityText}>Người khuyết tật ✓</Text>
            )}
          </View>
        </View>

        {/* Images section */}
        {restroom.images && restroom.images.length > 0 && (
          <View style={styles.imagesContainer}>
            <Text style={styles.facilitiesTitle}>Hình ảnh:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScrollView}
            >
              {restroom.images.map((imageUrl, index) => (
                <TouchableOpacity key={index} style={styles.imageItem}>
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.restroomImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderPayments = () => {
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const otherPayments = payments.filter(p => p.status !== 'pending');

    return (
      <View style={styles.paymentsContainer}>
        <Text style={styles.sectionTitle}>Thanh toán</Text>
        
        {pendingPayments.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Chờ xác nhận ({pendingPayments.length})</Text>
            {pendingPayments.map((payment) => (
              <View key={payment.id} style={[styles.paymentCard, styles.pendingPayment]}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentUser}>{payment.user_name}</Text>
                  <Text style={styles.paymentAmount}>{payment.amount.toLocaleString()}₫</Text>
                </View>
                
                <Text style={styles.paymentMethod}>
                  {payment.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                </Text>
                
                {payment.note && (
                  <Text style={styles.paymentNote}>Ghi chú: {payment.note}</Text>
                )}
                
                {payment.transfer_image_path && (
                  <TouchableOpacity style={styles.imageContainer}>
                    <Text style={styles.imageLabel}>Ảnh chuyển khoản:</Text>
                    <Image 
                      source={{ uri: payment.transfer_image_path }} 
                      style={styles.transferImage}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                )}
                
                <View style={styles.paymentActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleConfirmPayment(payment.id, 'reject')}
                  >
                    <Ionicons name="close" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Từ chối</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={() => handleConfirmPayment(payment.id, 'confirm')}
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {otherPayments.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Lịch sử</Text>
            {otherPayments.slice(0, 5).map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentUser}>{payment.user_name}</Text>
                  <Text style={styles.paymentAmount}>{payment.amount.toLocaleString()}₫</Text>
                </View>
                
                <View style={styles.paymentMeta}>
                  <Text style={styles.paymentMethod}>
                    {payment.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: payment.status === 'confirmed' ? '#00bf63' : '#FF4444' }
                  ]}>
                    <Text style={styles.statusText}>
                      {payment.status === 'confirmed' ? 'Đã xác nhận' : 'Đã từ chối'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.paymentDate}>
                  {new Date(payment.created_at).toLocaleString('vi-VN')}
                </Text>
              </View>
            ))}
          </>
        )}

        {payments.length === 0 && (
          <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết nhà vệ sinh</Text>
        <TouchableOpacity onPress={() => loadData()}>
          <Ionicons name="refresh" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderRestroomInfo()}
        {renderPayments()}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  restroomCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  restroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  restroomName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  restroomAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  facilitiesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  facilitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  facilityText: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
    marginBottom: 4,
  },
  paymentsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  paymentCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pendingPayment: {
    borderColor: '#FF9500',
    backgroundColor: '#fff8f0',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00bf63',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  paymentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentDate: {
    fontSize: 12,
    color: '#999',
  },
  imageContainer: {
    marginBottom: 12,
  },
  imageLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  transferImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  paymentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#00bf63',
  },
  rejectButton: {
    backgroundColor: '#FF4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  imagesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
    marginTop: 16,
  },
  imagesScrollView: {
    marginTop: 8,
  },
  imageItem: {
    marginRight: 12,
  },
  restroomImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
});

export default OwnerRestroomDetailScreen;
