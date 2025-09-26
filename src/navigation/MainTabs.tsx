import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import MainScreen from '../screens/user/MainScreen';
import HistoryScreen from '../screens/user/HistoryScreen';
import ProfileScreen from '../screens/user/ProfileScreen';

const Tab = createBottomTabNavigator();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00bf63',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Map" 
        component={MainScreen}
        options={{
          tabBarLabel: 'Bản đồ',
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Lịch sử',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Hồ sơ',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;