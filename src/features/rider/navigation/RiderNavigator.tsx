import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RiderDeliveryScreen } from '../screens/RiderDeliveryScreen';
import { useAuth } from '../../../core/auth/AuthContext';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', gap: 2 }}>
    <Text style={{ fontSize: 20 }}>{icon}</Text>
    <Text style={{ fontSize: 10, fontWeight: '700', color: focused ? '#f59e0b' : '#64748b' }}>{label}</Text>
  </View>
);

const RiderHomeTab = () => {
  const { userName } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 24, marginBottom: 20 }}>
          <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Logistics Rider</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 6 }}>Good morning, {(userName || 'Rider').split(' ')[0]} 🛵</Text>
          <Text style={{ color: '#94a3b8', lineHeight: 22 }}>Check your Deliveries tab for active pickups and OTP confirmations.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const ProfileTab = () => {
  const { logout, userName } = useAuth();

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) logout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]);
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🛵</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 }}>{userName}</Text>
          <Text style={{ color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Logistics Rider</Text>
        </View>
        <TouchableOpacity onPress={confirmLogout} style={{ backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
          <Ionicons name="log-out-outline" size={24} color="#dc2626" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export const RiderNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#1e293b', borderTopWidth: 0, height: 70, paddingBottom: 10 },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen name="RiderHome" component={RiderHomeTab}
      options={{ tabBarIcon: ({ focused }: any) => <TabIcon icon="🏠" label="Home" focused={focused} /> }}
    />
    <Tab.Screen name="RiderDeliveries" component={RiderDeliveryScreen}
      options={{ tabBarIcon: ({ focused }: any) => <TabIcon icon="🛵" label="Deliveries" focused={focused} /> }}
    />
    <Tab.Screen name="RiderProfile" component={ProfileTab}
      options={{ tabBarIcon: ({ focused }: any) => <TabIcon icon="👤" label="Profile" focused={focused} /> }}
    />
  </Tab.Navigator>
);
