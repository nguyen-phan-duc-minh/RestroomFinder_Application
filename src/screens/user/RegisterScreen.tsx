import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../../App';
import { useUser } from '../../context/UserContext';
import { api } from '../../services/api';
import { Colors } from '../../theme';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { setUser } = useUser();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'user' | 'owner'>('user');

  const handleRegister = async () => {
    // Validation
    if (!username.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên đăng nhập');
      return;
    }

    if (username.trim().length < 3) {
      Alert.alert('Lỗi', 'Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      // Check if username exists
      const checkResponse = await api.checkUsername(username.trim());
      if (checkResponse.exists) {
        Alert.alert('Lỗi', 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
        setLoading(false);
        return;
      }

      // Register user
      const registerResponse = await api.register(username.trim(), password, selectedRole);
      if (registerResponse.success) {
        setUser(registerResponse.user);
        
        if (selectedRole === 'owner') {
          Alert.alert(
            'Đăng ký thành công!',
            'Tài khoản đã tạo. Bây giờ hãy thêm thông tin nhà vệ sinh.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('OwnerRegistration' as never),
              },
            ]
          );
        } else {
          Alert.alert(
            'Đăng ký thành công!',
            'Tài khoản của bạn đã được tạo thành công.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('MainTabs' as never),
              },
            ]
          );
        }
      } else {
        Alert.alert('Lỗi', registerResponse.error || 'Không thể tạo tài khoản');
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Lỗi', 'Không thể đăng ký. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.backgroundContainer}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Đăng ký</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tên đăng nhập (ít nhất 3 ký tự)"
                placeholderTextColor={Colors.text.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu (ít nhất 6 ký tự)"
                  placeholderTextColor={Colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={Colors.text.secondary} 
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu"
                  placeholderTextColor={Colors.text.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={Colors.text.secondary} 
                  />
                </TouchableOpacity>
              </View>

              {/* Role Selection */}
              <View style={styles.roleContainer}>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      selectedRole === 'user' && styles.roleButtonActive
                    ]}
                    onPress={() => setSelectedRole('user')}
                  >
                    <Ionicons 
                      name="person" 
                      size={20} 
                      color={selectedRole === 'user' ? Colors.green : Colors.text.secondary} 
                    />
                    <Text style={[
                      styles.roleButtonText,
                      selectedRole === 'user' && styles.roleButtonTextActive
                    ]}>
                      Người dùng
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      selectedRole === 'owner' && styles.roleButtonActive
                    ]}
                    onPress={() => setSelectedRole('owner')}
                  >
                    <Ionicons 
                      name="business" 
                      size={20} 
                      color={selectedRole === 'owner' ? Colors.green : Colors.text.secondary} 
                    />
                    <Text style={[
                      styles.roleButtonText,
                      selectedRole === 'owner' && styles.roleButtonTextActive
                    ]}>
                      Chủ sở hữu
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.disabledButton]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Back to Login */}
            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Đã có tài khoản?</Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    backgroundColor: Colors.background.primary,
    margin: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 23,
    fontWeight: 'bold',
    color: Colors.text.green,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
  },
  eyeIcon: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: Colors.button.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: Colors.button.disabled,
  },
  registerButtonText: {
    color: Colors.text.light,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginRight: 8,
  },
  loginLink: {
    fontSize: 15,
    color: Colors.lightBlue,
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
  },
  roleButtonActive: {
    borderColor: Colors.green,
    backgroundColor: Colors.background.primary,
  },
  roleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  roleButtonTextActive: {
    color: Colors.green,
  },
});

export default RegisterScreen;