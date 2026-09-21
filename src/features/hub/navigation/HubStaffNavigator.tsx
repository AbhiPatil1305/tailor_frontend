import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';

import { HubStaffDashboardScreen } from '../screens/HubStaffDashboardScreen';
import { LiveQueueScreen } from '../screens/LiveQueueScreen';
import { GlobalScanScreen } from '../screens/GlobalScanScreen';
import { EventHistoryScreen } from '../screens/EventHistoryScreen';
import { HubMoreScreen } from '../screens/HubMoreScreen';
import { GarmentActionScreen } from '../screens/GarmentActionScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => (
  <View style={s.iconWrapper}>
    <Text style={[s.iconText, focused && s.iconActive]}>{icon}</Text>
    <Text style={[s.labelText, focused && s.labelActive]}>{label}</Text>
  </View>
);

const HubStaffTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: s.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen name="DashRoot" component={HubStaffDashboardScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }}
    />
    <Tab.Screen name="QueueRoot" component={LiveQueueScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Queue" focused={focused} /> }}
    />
    <Tab.Screen name="ScanRoot" component={GlobalScanScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📷" label="Scan" focused={focused} /> }}
    />
    <Tab.Screen name="HistoryRoot" component={EventHistoryScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🕰️" label="History" focused={focused} /> }}
    />
    <Tab.Screen name="MoreRoot" component={HubMoreScreen}
      options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" label="More" focused={focused} /> }}
    />
  </Tab.Navigator>
);

export const HubStaffNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HubTabs" component={HubStaffTabs} />
    <Stack.Screen name="GarmentAction" component={GarmentActionScreen} />
  </Stack.Navigator>
);

const s = StyleSheet.create({
  tabBar: { backgroundColor: '#1e293b', borderTopWidth: 0, height: 75, paddingBottom: 15, paddingTop: 10 },
  iconWrapper: { alignItems: 'center', gap: 4 },
  iconText: { fontSize: 22, opacity: 0.5 },
  iconActive: { opacity: 1 },
  labelText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  labelActive: { color: '#f59e0b' },
});
