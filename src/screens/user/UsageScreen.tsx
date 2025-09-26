import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../../App';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';

type UsageScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Usage'>;
type UsageScreenRouteProp = RouteProp<RootStackParamList, 'Usage'>;

const INITIAL_TIME = 1800; // 30 minutes initial time (30 * 60 = 1800 seconds)
const EXTENSION_TIME = 600; // 10 minutes extension

const UsageScreen: React.FC = () => {
  const navigation = useNavigation<UsageScreenNavigationProp>();
  const route = useRoute<UsageScreenRouteProp>();
  const { restaurantId } = route.params;
  const { user } = useUser();

  const [timeRemaining, setTimeRemaining] = useState(INITIAL_TIME);
  const [isActive, setIsActive] = useState(true);
  const [showExtensionModal, setShowExtensionModal] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            setIsActive(false);
            showTimeUpAlert();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeRemaining]);

  const showTimeUpAlert = () => {
    setShowExtensionModal(true);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    Alert.alert(
      'Kết thúc sử dụng',
      'Bạn có chắc chắn muốn kết thúc sử dụng nhà vệ sinh không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xong',
          onPress: finishUsage,
        },
      ]
    );
  };

  const finishUsage = async () => {
    if (!user) return;

    try {
      await api.stopUsingRestroom(user.id);
      navigation.navigate('Review', { restaurantId });
    } catch (error) {
      console.error('Error stopping restroom usage:', error);
      Alert.alert('Error', 'Could not finish usage. Please try again.');
    }
  };

  const handleExtendTime = () => {
    setTimeRemaining(prev => prev + EXTENSION_TIME);
    setIsActive(true);
    setShowExtensionModal(false);
  };

  const handleDeclineExtension = () => {
    setShowExtensionModal(false);
    finishUsage();
  };

  const handlePaperRequest = async () => {
    if (!user) return;

    try {
      // Send message to chat
      await api.sendMessage({
        restroom_id: restaurantId,
        user_id: user.id,
        message: 'Yêu cầu bổ sung giấy vệ sinh',
        message_type: 'paper_request',
      });

      // Send notification to owner
      await api.notifyOwner(restaurantId, user.id, 'paper_request', 'Yêu cầu bổ sung giấy vệ sinh');

      Alert.alert('Thành công', 'Đã gửi yêu cầu bổ sung giấy vệ sinh tới quản lý.');
    } catch (error) {
      console.error('Error sending paper request:', error);
      Alert.alert('Error', 'Could not send paper request. Please try again.');
    }
  };

  const handleSOS = async () => {
    Alert.alert(
      'Yêu cầu khẩn cấp',
      'Bạn có chắc chắn muốn gửi yêu cầu khẩn cấp không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Gửi SOS',
          style: 'destructive',
          onPress: sendSOSRequest,
        },
      ]
    );
  };

  const sendSOSRequest = async () => {
    if (!user) return;

    try {
      // Send message to chat
      await api.sendMessage({
        restroom_id: restaurantId,
        user_id: user.id,
        message: 'YÊU CẦU KHẨN CẤP - Cần hỗ trợ ngay lập tức!',
        message_type: 'sos',
      });

      // Send urgent notification to owner
      await api.notifyOwner(restaurantId, user.id, 'sos', '🚨 YÊU CẦU KHẨN CẤP - Cần hỗ trợ ngay lập tức!');

      Alert.alert('Đã gửi', 'Yêu cầu khẩn cấp đã được gửi tới quản lý. Họ sẽ đến hỗ trợ sớm nhất có thể.');
    } catch (error) {
      console.error('Error sending SOS:', error);
      Alert.alert('Error', 'Could not send SOS request. Please try again.');
    }
  };

  const handleChat = async () => {
    if (!user) return;

    try {
      // Notify owner that user initiated chat
      await api.notifyOwner(
        restaurantId,
        user.id,
        'chat_started',
        `${user.name || 'Người dùng'} đã bắt đầu chat từ nhà vệ sinh`
      );
    } catch (error) {
      console.error('Error notifying owner about chat:', error);
    }

    navigation.navigate('Chat', { restaurantId });
  };

  const getTimerColor = () => {
    if (timeRemaining > 10 * 60) return '#4CAF50'; // Green
    if (timeRemaining > 5 * 60) return '#FF9800'; // Orange
    return '#FF4444'; // Red
  };

  return (
    <View style={styles.container}>
      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>Thời gian còn lại</Text>
        <Text style={[styles.timerText, { color: getTimerColor() }]}>
          {formatTime(timeRemaining)}
        </Text>
        <Text style={styles.timerSubtext}>
          {timeRemaining > 0 ? 'Đang đếm ngược...' : 'Hết thời gian!'}
        </Text>
      </View>

      {/* Action Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handlePaperRequest}>
          <View style={styles.menuIcon}>
            <Ionicons name="newspaper" size={24} color="#00bf63" />
          </View>
          <Text style={styles.menuText}>Yêu cầu thêm giấy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSOS}>
          <View style={[styles.menuIcon, { backgroundColor: '#FFE6E6' }]}>
            <Ionicons name="warning" size={24} color="#FF4444" />
          </View>
          <Text style={styles.menuText}>SOS - Khẩn cấp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleChat}>
          <View style={[styles.menuIcon, { backgroundColor: '#E6F3FF' }]}>
            <Ionicons name="chatbubble" size={24} color="#00bf63" />
          </View>
          <Text style={styles.menuText}>Chat với quản lý</Text>
        </TouchableOpacity>
      </View>

      {/* Finish Button */}
      <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
        <Text style={styles.finishButtonText}>Xong</Text>
      </TouchableOpacity>

      {/* Extension Modal */}
      <Modal
        visible={showExtensionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExtensionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="time" size={60} color="#FF9800" />
            <Text style={styles.modalTitle}>Hết thời gian!</Text>
            <Text style={styles.modalText}>
              Bạn có muốn thêm 10 phút sử dụng không?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.extendButton]}
                onPress={handleExtendTime}
              >
                <Text style={styles.extendButtonText}>Có</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.declineButton]}
                onPress={handleDeclineExtension}
              >
                <Text style={styles.declineButtonText}>Không</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingBottom: 30,
  },
  timerContainer: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    marginBottom: 30,
  },
  timerLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  timerSubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    paddingVertical: 10,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 'auto',
  },
  finishButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  extendButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  declineButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  extendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UsageScreen;