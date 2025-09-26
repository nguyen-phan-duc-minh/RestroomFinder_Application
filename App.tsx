import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { UserProvider } from './src/context/UserContext';
import MainTabs from './src/navigation/MainTabs';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import OwnerRegistrationScreen from './src/screens/OwnerRegistrationScreen';
import OwnerDashboard from './src/screens/OwnerDashboard';
import RestaurantDetailScreen from './src/screens/user/RestaurantDetailScreen';
import NavigationScreen from './src/screens/user/NavigationScreen';
import UsageScreen from './src/screens/user/UsageScreen';
import ChatScreen from './src/screens/user/ChatScreen';
import ReviewScreen from './src/screens/user/ReviewScreen';
import LoginScreen from './src/screens/user/LoginScreen';
import RegisterScreen from './src/screens/user/RegisterScreen';
import PaymentScreen from './src/screens/user/PaymentScreen';
import PaymentStatusScreen from './src/screens/user/PaymentStatusScreen';
import AddRestroomScreen from './src/screens/owner/AddRestroomScreen';
import OwnerRestroomDetailScreen from './src/screens/owner/OwnerRestroomDetailScreen';

export type RootStackParamList = {
  RoleSelection: undefined;
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  OwnerRegistration: undefined;
  OwnerDashboard: undefined;
  AddRestroom: undefined;
  OwnerRestroomDetail: { restroomId: number; ownerId: number };
  RestaurantDetail: { restaurantId: number };
  Navigation: { restaurantId: number };
  Payment: { restaurantId: number; restroomName: string; price: number };
  PaymentStatus: { restaurantId: number; restroomName: string; paymentId: number };
  Usage: { restaurantId: number };
  Chat: { restaurantId: number };
  Review: { restaurantId: number };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <UserProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#00bf63',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="RoleSelection" 
            component={RoleSelectionScreen}
            options={{ 
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabs}
            options={{ 
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="OwnerRegistration" 
            component={OwnerRegistrationScreen}
            options={{ 
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="OwnerDashboard" 
            component={OwnerDashboard}
            options={{ 
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ 
              title: 'Đăng nhập',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ 
              title: 'Đăng ký',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="RestaurantDetail" 
            component={RestaurantDetailScreen}
            options={{ title: 'Chi tiết' }}
          />
          <Stack.Screen 
            name="Navigation" 
            component={NavigationScreen}
            options={{ title: 'Chỉ đường' }}
          />
          <Stack.Screen 
            name="Payment" 
            component={PaymentScreen}
            options={{ 
              title: 'Thanh toán',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="PaymentStatus" 
            component={PaymentStatusScreen}
            options={{ 
              title: 'Chờ xác nhận',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Usage" 
            component={UsageScreen}
            options={{ 
              title: 'Đang sử dụng',
              headerLeft: () => null, // Prevent going back
            }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Stack.Screen 
            name="Review" 
            component={ReviewScreen}
            options={{ 
              title: 'Đánh giá',
              headerLeft: () => null, // Prevent going back
            }}
          />
          <Stack.Screen 
            name="AddRestroom" 
            component={AddRestroomScreen}
            options={{ 
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="OwnerRestroomDetail" 
            component={OwnerRestroomDetailScreen}
            options={{ 
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
