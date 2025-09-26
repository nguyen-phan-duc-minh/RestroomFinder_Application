import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../App';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');

const RoleSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { generateRandomUser } = useUser();

  const handleUserRole = () => {
    // Navigate to Login/Register for User
    (navigation as any).navigate('Login');
  };

  const handleOwnerRole = () => {
    // Navigate to Login/Register for Owner
    (navigation as any).navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      
      <View style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="business" size={60} color="white" />
          <Text style={styles.title}>RestroomFinder</Text>
          <Text style={styles.subtitle}>Chọn vai trò của bạn</Text>
        </View>

        {/* Role Cards */}
        <View style={styles.rolesContainer}>
          {/* User Card */}
          <TouchableOpacity 
            style={styles.roleCard}
            onPress={handleUserRole}
            activeOpacity={0.8}
          >
            <View style={[styles.cardGradient, styles.userCard]}>
              <View style={styles.cardIcon}>
                <Ionicons name="person" size={48} color="#4facfe" />
              </View>
              <Text style={styles.cardTitle}>Người dùng</Text>
              <Text style={styles.cardDescription}>
                Tìm kiếm và sử dụng{'\n'}
                các nhà vệ sinh gần bạn
              </Text>
              <View style={styles.cardFeatures}>
                <Text style={styles.featureText}>• Tìm kiếm nhà vệ sinh</Text>
                <Text style={styles.featureText}>• Đánh giá và nhận xét</Text>
                <Text style={styles.featureText}>• Điều hướng GPS</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Owner Card */}  
          <TouchableOpacity 
            style={styles.roleCard}
            onPress={handleOwnerRole}
            activeOpacity={0.8}
          >
            <View style={[styles.cardGradient, styles.ownerCard]}>
              <View style={styles.cardIcon}>
                <Ionicons name="storefront" size={48} color="#ff6b6b" />
              </View>
              <Text style={styles.cardTitle}>Chủ doanh nghiệp</Text>
              <Text style={styles.cardDescription}>
                Đăng ký và quản lý{'\n'}
                nhà vệ sinh của bạn
              </Text>
              <View style={styles.cardFeatures}>
                <Text style={styles.featureText}>• Đăng ký nhà vệ sinh</Text>
                <Text style={styles.featureText}>• Quản lý thông tin</Text>
                <Text style={styles.featureText}>• Nhận thông báo</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Chọn loại tài khoản phù hợp với nhu cầu của bạn
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  gradient: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  rolesContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 30,
  },
  roleCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  cardGradient: {
    padding: 30,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: '#ffffff',
  },
  ownerCard: {
    backgroundColor: '#ffffff',
  },
  cardIcon: {
    marginBottom: 20,
    padding: 15,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  cardFeatures: {
    alignItems: 'flex-start',
  },
  featureText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default RoleSelectionScreen;