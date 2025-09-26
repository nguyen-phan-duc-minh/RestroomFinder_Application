import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../../App';
import { api } from '../../services/api';
import { useUser } from '../../context/UserContext';

type PaymentStatusScreenRouteProp = RouteProp<RootStackParamList, 'PaymentStatus'>;
type PaymentStatusScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentStatus'>;

const PaymentStatusScreen: React.FC = () => {
  const navigation = useNavigation<PaymentStatusScreenNavigationProp>();
  const route = useRoute<PaymentStatusScreenRouteProp>();
  const { user } = useUser();
  
  const { restaurantId, restroomName, paymentId } = route.params;
  const [checking, setChecking] = useState(true);
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkPaymentStatus = async () => {
      if (!user?.id) return;
      
      try {
        const statusResult = await api.checkPaymentStatus(user.id, restaurantId);
        
        if (statusResult?.payment_confirmed) {
          setChecking(false);
          
          // Try to start using restroom
          const startResult = await api.startUsingRestroom(user.id, restaurantId);
          if (startResult.success) {
            navigation.replace('Usage', { restaurantId });
          } else {
            Alert.alert('Lỗi', startResult.error || 'Không thể bắt đầu sử dụng. Vui lòng thử lại.');
            navigation.goBack();
          }
          return;
        }
        
        setCheckCount(prev => {
          const newCount = prev + 1;
          // Stop checking after 2 minutes (12 checks * 10 seconds)
          if (newCount >= 12) {
            setChecking(false);
            Alert.alert(
              'Hết thời gian chờ',
              'Chưa nhận được xác nhận thanh toán từ chủ sở hữu sau 2 phút. Vui lòng liên hệ trực tiếp hoặc thử lại sau.',
              [
                { text: 'Đóng', onPress: () => navigation.goBack() }
              ]
            );
          }
          return newCount;
        });
        
      } catch (error) {
        // Silent error handling to reduce log spam
      }
    };

    if (checking) {
      // Check immediately
      checkPaymentStatus();
      
      // Then check every 10 seconds
      interval = setInterval(checkPaymentStatus, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checking, user?.id, restaurantId, navigation]);

  const handleCancel = () => {
    Alert.alert(
      'Hủy chờ xác nhận',
      'Bạn có chắc chắn muốn hủy chờ xác nhận thanh toán không?',
      [
        { text: 'Không', style: 'cancel' },
        { 
          text: 'Hủy', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chờ xác nhận</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.waitingContainer}>
          <ActivityIndicator size="large" color="#00bf63" style={styles.spinner} />
          
          <Text style={styles.title}>Đang chờ xác nhận thanh toán</Text>
          <Text style={styles.subtitle}>{restroomName}</Text>
          
          <View style={styles.statusContainer}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.statusText}>
              Đã kiểm tra {checkCount} lần
            </Text>
          </View>
          
          <Text style={styles.description}>
            Chúng tôi đã gửi thông tin thanh toán đến chủ sở hữu. 
            Vui lòng chờ xác nhận hoặc liên hệ trực tiếp nếu cần thiết.
          </Text>
          
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>Lưu ý:</Text>
            <Text style={styles.instructionText}>
              • Thời gian chờ tối đa: 2 phút{'\n'}
              • Hệ thống sẽ tự động kiểm tra mỗi 10 giây{'\n'}
              • Bạn sẽ được chuyển đến trang sử dụng ngay khi được xác nhận
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Hủy và quay lại</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  spinner: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#00bf63',
    textAlign: 'center',
    marginBottom: 30,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  instructionContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#00bf63',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentStatusScreen;
