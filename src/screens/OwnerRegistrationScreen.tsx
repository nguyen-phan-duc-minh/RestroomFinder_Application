import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useUser } from '../context/UserContext';
import { api } from '../services/api';

interface RestroomData {
  id: number;
  name: string;
  address: string;
  maleToilets: {
    standing: number;
    sitting: number;
  };
  femaleToilets: {
    sitting: number;
  };
  disabledAccess: boolean;
  images: string[];
}

interface OwnerData {
  name: string;
  email: string;
  phone: string;
}

const { width } = Dimensions.get('window');

const OwnerRegistrationScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'OwnerRegistration'>>();
  const { setUser } = useUser();

  const [ownerData, setOwnerData] = useState<OwnerData>({
    name: '',
    email: '',
    phone: '',
  });

  const [restrooms, setRestrooms] = useState<RestroomData[]>([
    {
      id: Date.now(),
      name: '',
      address: '',
      maleToilets: { standing: 0, sitting: 0 },
      femaleToilets: { sitting: 0 },
      disabledAccess: false,
      images: [],
    }
  ]);

  const [loading, setLoading] = useState(false);

  const addRestroom = () => {
    setRestrooms([...restrooms, {
      id: Date.now() + Math.random(),
      name: '',
      address: '',
      maleToilets: { standing: 0, sitting: 0 },
      femaleToilets: { sitting: 0 },
      disabledAccess: false,
      images: [],
    }]);
  };

  const removeRestroom = (id: number) => {
    if (restrooms.length > 1) {
      setRestrooms(restrooms.filter(r => r.id !== id));
    }
  };

  const updateRestroom = (id: number, field: string, value: any) => {
    setRestrooms(restrooms.map(restroom => {
      if (restroom.id === id) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          const parentData = restroom[parent as keyof RestroomData];
          if (typeof parentData === 'object' && parentData !== null) {
            return {
              ...restroom,
              [parent]: {
                ...parentData,
                [child]: value
              }
            };
          }
        }
        return { ...restroom, [field]: value };
      }
      return restroom;
    }));
  };

  const pickImage = async (restroomId: number) => {
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
      updateRestroom(restroomId, 'images', [
        ...restrooms.find(r => r.id === restroomId)?.images || [],
        result.assets[0].uri
      ]);
    }
  };

  const removeImage = (restroomId: number, imageIndex: number) => {
    const restroom = restrooms.find(r => r.id === restroomId);
    if (restroom) {
      updateRestroom(restroomId, 'images', 
        restroom.images.filter((_, index) => index !== imageIndex)
      );
    }
  };

  const validateForm = (): boolean => {
    // Validate owner info
    if (!ownerData.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên chủ sở hữu');
      return false;
    }
    if (!ownerData.email.trim() || !ownerData.email.includes('@')) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ');
      return false;
    }
    if (!ownerData.phone.trim() || ownerData.phone.length < 10) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại hợp lệ');
      return false;
    }

    // Validate restrooms
    for (const restroom of restrooms) {
      if (!restroom.name.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên quán cho tất cả nhà vệ sinh');
        return false;
      }
      if (!restroom.address.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ cho tất cả nhà vệ sinh');
        return false;
      }
      if (restroom.images.length === 0) {
        Alert.alert('Lỗi', 'Vui lòng thêm ít nhất 1 hình ảnh cho mỗi nhà vệ sinh');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Call API to register owner and restrooms
      const registrationData = {
        owner: ownerData,
        restrooms: restrooms
      };
      
      const success = await api.registerOwner(registrationData);
      
      if (!success) {
        Alert.alert('Lỗi', 'Không thể đăng ký. Vui lòng kiểm tra thông tin và thử lại.');
        return;
      }
      
      // Owner will need to login after registration
      
      Alert.alert(
        'Đăng ký thành công!',
        'Tài khoản chủ sở hữu đã được tạo thành công. Vui lòng đăng nhập để tiếp tục.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login' as never),
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Lỗi', 'Không thể đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const renderRestroomForm = (restroom: RestroomData, index: number) => (
    <View key={restroom.id} style={styles.restroomCard}>
      <View style={styles.restroomHeader}>
        <Text style={styles.restroomTitle}>Nhà vệ sinh #{index + 1}</Text>
        {restrooms.length > 1 && (
          <TouchableOpacity
            onPress={() => removeRestroom(restroom.id)}
            style={styles.removeButton}
          >
            <Ionicons name="trash" size={20} color="#FF4444" />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Tên quán *"
        value={restroom.name}
        onChangeText={(text) => updateRestroom(restroom.id, 'name', text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Địa chỉ *"
        value={restroom.address}
        onChangeText={(text) => updateRestroom(restroom.id, 'address', text)}
        multiline
      />

      {/* Male Toilets */}
      <Text style={styles.sectionTitle}>Nhà vệ sinh Nam</Text>
      <View style={styles.toiletRow}>
        <View style={styles.toiletInput}>
          <Text style={styles.label}>Bồn đứng</Text>
          <TextInput
            style={styles.numberInput}
            value={restroom.maleToilets.standing.toString()}
            onChangeText={(text) => updateRestroom(restroom.id, 'maleToilets.standing', parseInt(text) || 0)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.toiletInput}>
          <Text style={styles.label}>Bồn cầu</Text>
          <TextInput
            style={styles.numberInput}
            value={restroom.maleToilets.sitting.toString()}
            onChangeText={(text) => updateRestroom(restroom.id, 'maleToilets.sitting', parseInt(text) || 0)}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Female Toilets */}
      <Text style={styles.sectionTitle}>Nhà vệ sinh Nữ</Text>
      <View style={styles.toiletRow}>
        <View style={styles.toiletInput}>
          <Text style={styles.label}>Bồn cầu</Text>
          <TextInput
            style={styles.numberInput}
            value={restroom.femaleToilets.sitting.toString()}
            onChangeText={(text) => updateRestroom(restroom.id, 'femaleToilets.sitting', parseInt(text) || 0)}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Disabled Access */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Hỗ trợ người khuyết tật</Text>
        <Switch
          value={restroom.disabledAccess}
          onValueChange={(value) => updateRestroom(restroom.id, 'disabledAccess', value)}
        />
      </View>

      {/* Images */}
      <Text style={styles.sectionTitle}>Hình ảnh *</Text>
      <ScrollView horizontal style={styles.imagesContainer}>
        {restroom.images.map((image, imgIndex) => (
          <View key={imgIndex} style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={() => removeImage(restroom.id, imgIndex)}
            >
              <Ionicons name="close-circle" size={24} color="#FF4444" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={() => pickImage(restroom.id)}
        >
          <Ionicons name="camera" size={32} color="#666" />
          <Text style={styles.addImageText}>Thêm ảnh</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng ký chủ sở hữu</Text>
      </View>

      <View style={styles.content}>
        {/* Owner Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chủ sở hữu</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Họ và tên *"
            value={ownerData.name}
            onChangeText={(text) => setOwnerData({...ownerData, name: text})}
          />

          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={ownerData.email}
            onChangeText={(text) => setOwnerData({...ownerData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Số điện thoại *"
            value={ownerData.phone}
            onChangeText={(text) => setOwnerData({...ownerData, phone: text})}
            keyboardType="phone-pad"
          />
        </View>

        {/* Restrooms */}
        <View style={styles.section}>
          <View style={styles.restroomsHeader}>
            <Text style={styles.sectionTitle}>Danh sách nhà vệ sinh</Text>
            <TouchableOpacity onPress={addRestroom} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.addButtonText}>Thêm</Text>
            </TouchableOpacity>
          </View>

          {restrooms.map((restroom, index) => renderRestroomForm(restroom, index))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    marginLeft: 20,
    color: '#333',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  restroomsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  restroomCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  restroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  restroomTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  toiletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toiletInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  numberInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagesContainer: {
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  addImageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OwnerRegistrationScreen;