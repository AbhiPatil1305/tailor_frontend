import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { AdminFinanceScreen } from '../screens/AdminFinanceScreen';
import { useAuth } from '../../../core/auth/AuthContext';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', gap: 2 }}>
    <Text style={{ fontSize: 20 }}>{icon}</Text>
    <Text style={{ fontSize: 10, fontWeight: '700', color: focused ? '#f59e0b' : '#64748b' }}>{label}</Text>
  </View>
);

const AdminOverviewTab = () => {
  const { userName } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Finance & Admin</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 6 }}>Welcome, {(userName || 'Admin').split(' ')[0]} 🏦</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ProfileTab = () => {
  const { logout, userName } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🏦</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 }}>{userName}</Text>
          <Text style={{ color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Finance Admin</Text>
        </View>
        <TouchableOpacity onPress={logout} style={{ backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
          <Text style={{ color: '#dc2626', fontWeight: '800', fontSize: 15 }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export const AdminNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#1e293b', borderTopWidth: 0, height: 70, paddingBottom: 10 },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen name="AdminOverview" component={AdminOverviewTab}
      options={{ tabBarIcon: ({ focused }: any) => <TabIcon icon="🏠" label="Overview" focused={focused} /> }}
    />
    <Tab.Screen name="AdminPayouts" component={AdminFinanceScreen}
      options={{ tabBarIcon: ({ focused }: any) => <TabIcon icon="💸" label="Payouts" focused={focused} /> }}
    />
    <Tab.Screen name="AdminProfile" component={ProfileTab}
      options={{ tabBarIcon: ({ focused }: any) => <TabIcon icon="👤" label="Profile" focused={focused} /> }}
    />
  </Tab.Navigator>
);
