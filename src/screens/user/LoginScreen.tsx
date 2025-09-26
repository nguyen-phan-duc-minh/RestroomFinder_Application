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
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../../../App';
import { useUser } from '../../context/UserContext';
import { Colors } from '../../theme';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useUser();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    if (!username.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên đăng nhập');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return;
    }

    setLoading(true);

    try {
      const result = await login(username.trim(), password);
      if (result.success) {
        // Navigate based on role returned from API
        if (result.role === 'owner') {
          navigation.navigate('OwnerDashboard' as never);
        } else {
          navigation.navigate('MainTabs' as never);
        }
      } else {
        Alert.alert('Đăng nhập thất bại', 'Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Lỗi', 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register' as never);
  };

  const handleSkip = () => {
    navigation.navigate('MainTabs' as never);
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
                <Text style={styles.title}>Đăng nhập</Text>
              </View>

              {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tên đăng nhập"
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
                placeholder="Mật khẩu" 
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

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Skip Button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Sử dụng với tư cách là khách</Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Chưa có tài khoản?</Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
    marginBottom: 20,
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
    borderColor: Colors.border.medium,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: Colors.button.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: Colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: Colors.button.disabled,
  },
  loginButtonText: {
    color: Colors.text.light,
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: Colors.text.secondary,
    marginRight: 8,
  },
  registerLink: {
    fontSize: 15,
    color: Colors.lightBlue,
    fontWeight: '400',
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  skipButton: {
    paddingVertical: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: Colors.text.lightBlue,
    fontSize: 15,
    fontWeight: '400',
  },

});

export default LoginScreen;