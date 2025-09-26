import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import OwnerRestroomListScreen from './owner/OwnerRestroomListScreen';
import OwnerNotificationsScreen from './owner/OwnerNotificationsScreen';
import OwnerAccountScreen from './owner/OwnerAccountScreen';

const Tab = createBottomTabNavigator();

const OwnerDashboard: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'OwnerRestroomList') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'OwnerNotifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'OwnerAccount') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00bf63',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="OwnerRestroomList"
        component={OwnerRestroomListScreen}
        options={{
          tabBarLabel: 'Nhà vệ sinh',
        }}
      />
      <Tab.Screen
        name="OwnerNotifications"
        component={OwnerNotificationsScreen}
        options={{
          tabBarLabel: 'Thông báo',
        }}
      />
      <Tab.Screen
        name="OwnerAccount"
        component={OwnerAccountScreen}
        options={{
          tabBarLabel: 'Tài khoản',
        }}
      />
    </Tab.Navigator>
  );
};

export default OwnerDashboard;