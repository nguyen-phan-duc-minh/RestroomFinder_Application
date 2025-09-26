import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../../App';
import { useUser } from '../../context/UserContext';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout, generateRandomUser } = useUser();

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          onPress: () => {
            logout();
            navigation.navigate('Login' as never);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleGenerateNewName = () => {
    Alert.alert(
      'Tạo tên mới',
      'Bạn có muốn tạo một tên ngẫu nhiên mới không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Tạo mới',
          onPress: generateRandomUser,
        },
      ]
    );
  };

  const renderUserInfo = () => {
    if (!user) {
      return (
        <View style={styles.userInfoContainer}>
          <Ionicons name="person-circle" size={80} color="#ccc" />
          <Text style={styles.noUserText}>Không có thông tin người dùng</Text>
        </View>
      );
    }

    return (
      <View style={styles.userInfoContainer}>
        <View style={styles.avatarContainer}>
          <Ionicons 
            name="person-circle" 
            size={80} 
            color={user.is_random_user ? "#FF9500" : "#00bf63"} 
          />
          {user.is_random_user && (
            <View style={styles.randomBadge}>
              <Ionicons name="shuffle" size={16} color="white" />
            </View>
          )}
        </View>

        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.userType}>
          {user.is_random_user ? 'Tên ngẫu nhiên' : 'Tài khoản đã đăng ký'}
        </Text>
      </View>
    );
  };

  const renderAuthButtons = () => {
    if (!user || user.is_random_user) {
      return (
        <View style={styles.authSection}>
          {/* <Text style={styles.sectionTitle}>Tài khoản</Text> */}
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Ionicons name="log-in" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleRegister}>
            <Ionicons name="person-add" size={20} color="#00bf63" />
            <Text style={styles.secondaryButtonText}>Đăng ký</Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity style={styles.tertiaryButton} onPress={handleGenerateNewName}>
              <Ionicons name="shuffle" size={20} color="#666" />
              <Text style={styles.tertiaryButtonText}>Tạo tên ngẫu nhiên mới</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.authSection}>
        {/* <Text style={styles.sectionTitle}>Tài khoản</Text> */}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#FF4444" />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFeatures = () => {
    return (
      <View style={styles.featuresSection}>
        {/* <Text style={styles.sectionTitle}>Tính năng</Text>

        {(!user || user.is_random_user) && (
          <View style={styles.featureItem}>
            <Ionicons name="information-circle" size={20} color="#00bf63" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Lợi ích của việc đăng ký</Text>
              <Text style={styles.featureDescription}>
                • Lưu lịch sử sử dụng{'\n'}
                • Theo dõi đánh giá đã cho{'\n'}
                • Đồng bộ dữ liệu trên nhiều thiết bị{'\n'}
                • Nhận thông báo cá nhân hóa
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.featureItem} disabled>
          <Ionicons name="map" size={20} color="#666" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Tìm nhà vệ sinh</Text>
            <Text style={styles.featureDescription}>
              Tìm và điều hướng đến nhà vệ sinh gần nhất
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureItem} disabled>
          <Ionicons name="timer" size={20} color="#666" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Quản lý thời gian</Text>
            <Text style={styles.featureDescription}>
              Bộ đếm thời gian 30 phút với tính năng gia hạn
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureItem} disabled>
          <Ionicons name="chatbubbles" size={20} color="#666" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Chat & SOS</Text>
            <Text style={styles.featureDescription}>
              Liên hệ với quản lý và gửi cảnh báo khẩn cấp
            </Text>
          </View>
        </TouchableOpacity> */}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>Hồ sơ</Text> */}
      </View>

      <View style={styles.content}>
        {renderUserInfo()}

        {renderAuthButtons()}

        {/* Features */}
        {/* {renderFeatures()} */}

        {/* App Info */}
        {/* <View style={styles.appInfoSection}>
          <Text style={styles.sectionTitle}>Thông tin</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Phiên bản ứng dụng</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Nhà phát triển</Text>
            <Text style={styles.infoValue}>RestroomFinder Team</Text>
          </View>
        </View> */}
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
  content: {
    padding: 20,
  },
  userInfoContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  randomBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF9500',
    borderRadius: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  userType: {
    fontSize: 14,
    color: '#666',
  },
  noUserText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  authSection: {
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 0,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#00bf63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#f0f8ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00bf63',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#00bf63',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tertiaryButton: {
    backgroundColor: '#f8f9fa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tertiaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#fff5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  logoutButtonText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  featuresSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureContent: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  appInfoSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default ProfileScreen;