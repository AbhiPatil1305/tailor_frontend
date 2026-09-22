import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import { TailorHomeScreen } from '../screens/TailorHomeScreen';
import { TailorWorkScreen } from '../screens/TailorWorkScreen';
import { TailorScanScreen } from '../screens/TailorScanScreen';
import { TailorEarningsScreen } from '../screens/TailorEarningsScreen';
import { TailorProfileScreen } from '../screens/TailorProfileScreen';

import { TailorGarmentDetailScreen } from '../screens/TailorGarmentDetailScreen';
import { TailorAvailabilityScreen } from '../screens/TailorAvailabilityScreen';
import { TailorLeaveScreen } from '../screens/TailorLeaveScreen';
import { TailorLocationScreen } from '../screens/TailorLocationScreen';
import { TailorNotificationsScreen } from '../screens/TailorNotificationsScreen';
import { TailorPayoutClaimsScreen } from '../screens/TailorPayoutClaimsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TailorTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6d28d9',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={TailorHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="home-variant" color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="TailorWork" 
        component={TailorWorkScreen}
        options={{
          tabBarLabel: 'My Work',
          tabBarIcon: ({ color, size }) => <Icon name="clipboard-list-outline" color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="TailorScan" 
        component={TailorScanScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => <Icon name="qrcode-scan" color={color} size={size + 8} />
        }}
      />
      <Tab.Screen 
        name="TailorEarnings" 
        component={TailorEarningsScreen}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, size }) => <Icon name="cash-multiple" color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="TailorProfile" 
        component={TailorProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Icon name="account-circle-outline" color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
};

export const TailorNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Bottom Tabs are the root */}
      <Stack.Screen name="TailorRootTabs" component={TailorTabs} />
      
      {/* Screens pushed on top of tabs */}
      <Stack.Screen name="TailorGarmentDetail" component={TailorGarmentDetailScreen} />
      <Stack.Screen name="TailorAvailability" component={TailorAvailabilityScreen} />
      <Stack.Screen name="TailorLeave" component={TailorLeaveScreen} />
      <Stack.Screen name="TailorLocation" component={TailorLocationScreen} />
      <Stack.Screen name="TailorNotifications" component={TailorNotificationsScreen} />
      <Stack.Screen name="TailorPayoutClaims" component={TailorPayoutClaimsScreen} />
    </Stack.Navigator>
  );
};
