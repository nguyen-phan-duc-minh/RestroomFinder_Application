import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';

const AddRestroomScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  
  const [restroomData, setRestroomData] = useState({
    name: '',
    address: '',
    maleToilets: { standing: 0, sitting: 0 },
    femaleToilets: { sitting: 0 },
    disabledAccess: false,
    images: [] as string[],
    is_free: true,
    price: 0,
  });
  
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setRestroomData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setRestroomData(prev => ({ ...prev, [field]: value }));
    }
  };

  const pickImage = async () => {
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
      setRestroomData(prev => ({
        ...prev,
        images: [...prev.images, result.assets[0].uri]
      }));
    }
  };

  const removeImage = (index: number) => {
    setRestroomData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    if (!restroomData.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhà vệ sinh');
      return false;
    }
    if (!restroomData.address.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ');
      return false;
    }
    if (restroomData.images.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng thêm ít nhất 1 hình ảnh');
      return false;
    }
    if (!restroomData.is_free && restroomData.price <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập phí sử dụng hợp lệ (lớn hơn 0)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {

      
      // Convert images to base64 if they are local URIs
      const processedImages = [];
      for (const imageUri of restroomData.images) {
        if (imageUri.startsWith('file://')) {
          try {
            const response = await fetch(imageUri);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Data = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            processedImages.push(base64Data);

          } catch (error) {
            console.error('Error converting image to base64:', error);
            processedImages.push(imageUri); // Fallback to original URI
          }
        } else {
          processedImages.push(imageUri);
        }
      }
      
      // Call API to create restroom with full data
      const success = await api.createRestroom({
        name: restroomData.name,
        address: restroomData.address,
        admin_contact: user?.email, // Backend will find owner by email
        maleToilets: restroomData.maleToilets,
        femaleToilets: restroomData.femaleToilets,
        disabledAccess: restroomData.disabledAccess,
        images: processedImages,
        is_free: restroomData.is_free,
        price: restroomData.price,
      });



      if (success) {
        Alert.alert(
          'Thành công!',
          'Nhà vệ sinh đã được thêm thành công.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Lỗi', 'Không thể thêm nhà vệ sinh. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error adding restroom:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm nhà vệ sinh</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên quán/địa điểm *</Text>
            <TextInput
              style={styles.input}
              value={restroomData.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="VD: Café ABC, Nhà hàng XYZ..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ *</Text>
            <TextInput
              style={styles.input}
              value={restroomData.address}
              onChangeText={(text) => updateField('address', text)}
              placeholder="Nhập địa chỉ đầy đủ"
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin nhà vệ sinh</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Nam - Đứng</Text>
              <TextInput
                style={styles.input}
                value={restroomData.maleToilets.standing.toString()}
                onChangeText={(text) => updateField('maleToilets.standing', parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Nam - Ngồi</Text>
              <TextInput
                style={styles.input}
                value={restroomData.maleToilets.sitting.toString()}
                onChangeText={(text) => updateField('maleToilets.sitting', parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nữ - Ngồi</Text>
            <TextInput
              style={styles.input}
              value={restroomData.femaleToilets.sitting.toString()}
              onChangeText={(text) => updateField('femaleToilets.sitting', parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateField('disabledAccess', !restroomData.disabledAccess)}
            >
              <Ionicons
                name={restroomData.disabledAccess ? "checkbox" : "square-outline"}
                size={24}
                color="#007AFF"
              />
              <Text style={styles.checkboxLabel}>Có hỗ trợ người khuyết tật</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phí sử dụng</Text>
          
          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => {
                updateField('is_free', !restroomData.is_free);
                if (!restroomData.is_free) {
                  updateField('price', 0);
                }
              }}
            >
              <Ionicons
                name={restroomData.is_free ? "checkbox" : "square-outline"}
                size={24}
                color="#007AFF"
              />
              <Text style={styles.checkboxLabel}>Miễn phí</Text>
            </TouchableOpacity>
          </View>

          {!restroomData.is_free && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phí sử dụng (VNĐ) *</Text>
              <TextInput
                style={styles.input}
                value={restroomData.price.toString()}
                onChangeText={(text) => updateField('price', parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="Nhập số tiền, VD: 2000, 5000..."
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hình ảnh</Text>
          
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Ionicons name="camera" size={32} color="#007AFF" />
              <Text style={styles.addImageText}>Thêm hình ảnh</Text>
            </TouchableOpacity>

            <View style={styles.imageGrid}>
              {restroomData.images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Đang thêm...' : 'Thêm nhà vệ sinh'}
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  imageSection: {
    alignItems: 'center',
  },
  addImageButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  addImageText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  previewImage: {
    width: 100,
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
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfWidth: {
    width: '48%',
  },
  checkboxRow: {
    marginTop: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
});

export default AddRestroomScreen;