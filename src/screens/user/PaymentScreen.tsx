import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { useUser } from '../../context/UserContext';
import { RootStackParamList } from '../../../App';

type PaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;
type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'Payment'>;

interface PaymentScreenParams {
  restaurantId: number;
  restroomName: string;
  price: number;
}

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const route = useRoute<PaymentScreenRouteProp>();
  const { user } = useUser();
  const { restaurantId, restroomName, price } = route.params;
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [transferImage, setTransferImage] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const pickTransferImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTransferImage(result.assets[0].uri);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'transfer' && !transferImage) {
      Alert.alert('Lỗi', 'Vui lòng chụp ảnh chứng từ chuyển khoản');
      return;
    }

    if (!user?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
      return;
    }

    setLoading(true);
    try {
      let imageData = transferImage;
      
      // Convert local image to base64 if it's a local URI
      if (transferImage && transferImage.startsWith('file://')) {
        try {
          const response = await fetch(transferImage);
          const blob = await response.blob();
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          imageData = base64Data;
          console.log('Converted image to base64, size:', base64Data.length);
        } catch (error) {
          console.error('Error converting image to base64:', error);
          // Keep original URI as fallback
        }
      }

      console.log('Creating payment with data:', {
        user_id: user.id,
        restroom_id: restaurantId,
        method: paymentMethod,
        amount: price,
        transfer_image_path: imageData,
        note,
      });

      // Create payment record
      const paymentResult = await api.createPayment({
        user_id: user.id,
        restroom_id: restaurantId,
        method: paymentMethod,
        amount: price,
        transfer_image_path: imageData || undefined,
        note,
      });
      
      if (paymentResult.success) {
        if (paymentMethod === 'cash') {
          // Cash payment - immediate confirmation, try to start using
          console.log('Cash payment confirmed, starting restroom usage...');
          const startResult = await api.startUsingRestroom(user.id, restaurantId);
          if (startResult.success) {
            navigation.navigate('Usage', { restaurantId });
          } else {
            Alert.alert('Lỗi', startResult.error || 'Không thể bắt đầu sử dụng. Vui lòng thử lại.');
          }
        } else {
          // Transfer payment - navigate to status screen to wait for confirmation
          console.log('Transfer payment created, navigating to status screen...');
          navigation.navigate('PaymentStatus', {
            restaurantId,
            restroomName,
            paymentId: paymentResult.payment_id || 0,
          });
        }
      } else {
        Alert.alert('Lỗi', paymentResult.error || 'Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Restroom Info */}
        <View style={styles.restroomInfo}>
          <Text style={styles.restroomName}>{restroomName}</Text>
          <Text style={styles.price}>{price.toLocaleString()} VNĐ</Text>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash' && styles.selectedOption,
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Ionicons
              name="cash"
              size={24}
              color={paymentMethod === 'cash' ? '#00bf63' : '#666'}
            />
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionTitle,
                paymentMethod === 'cash' && styles.selectedText,
              ]}>
                Tiền mặt
              </Text>
              <Text style={styles.optionDescription}>
                Thanh toán trực tiếp tại quầy
              </Text>
            </View>
            <Ionicons
              name={paymentMethod === 'cash' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'cash' ? '#00bf63' : '#666'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'transfer' && styles.selectedOption,
            ]}
            onPress={() => setPaymentMethod('transfer')}
          >
            <Ionicons
              name="card"
              size={24}
              color={paymentMethod === 'transfer' ? '#00bf63' : '#666'}
            />
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionTitle,
                paymentMethod === 'transfer' && styles.selectedText,
              ]}>
                Chuyển khoản
              </Text>
              <Text style={styles.optionDescription}>
                Chuyển khoản ngân hàng (cần xác nhận)
              </Text>
            </View>
            <Ionicons
              name={paymentMethod === 'transfer' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'transfer' ? '#00bf63' : '#666'}
            />
          </TouchableOpacity>
        </View>

        {/* Transfer Image Upload */}
        {paymentMethod === 'transfer' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chứng từ chuyển khoản</Text>
            
            {transferImage ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: transferImage }} style={styles.transferImage} />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={pickTransferImage}
                >
                  <Text style={styles.changeImageText}>Đổi ảnh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadButton} onPress={pickTransferImage}>
                <Ionicons name="camera" size={32} color="#00bf63" />
                <Text style={styles.uploadText}>Chụp ảnh chứng từ</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú (tùy chọn)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Thêm ghi chú cho chủ nhà vệ sinh..."
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Payment Button */}
        <TouchableOpacity
          style={[styles.payButton, loading && styles.disabledButton]}
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.payButtonText}>
            {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    padding: 20,
  },
  restroomInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  restroomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00bf63',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#00bf63',
    backgroundColor: '#f0f8ff',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedText: {
    color: '#00bf63',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  imageContainer: {
    alignItems: 'center',
  },
  transferImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeImageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#00bf63',
    borderRadius: 6,
  },
  changeImageText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#00bf63',
    borderStyle: 'dashed',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 16,
    color: '#00bf63',
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  payButton: {
    backgroundColor: '#00bf63',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;
