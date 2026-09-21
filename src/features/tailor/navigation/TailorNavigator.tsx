import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TailorDashboardScreen } from '../screens/TailorDashboardScreen';
import { useAuth } from '../../../core/auth/AuthContext';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', gap: 2 }}>
    <Text style={{ fontSize: 20 }}>{icon}</Text>
    <Text style={{ fontSize: 10, fontWeight: '700', color: focused ? '#f59e0b' : '#64748b' }}>{label}</Text>
  </View>
);

const TailorHomeTab = () => {
  const { userName } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 24, marginBottom: 16 }}>
          <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Tailor Partner</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 8 }}>Good morning,{`\n`}{(userName || 'Tailor').split(' ')[0]} 🧵</Text>
          <Text style={{ color: '#94a3b8', lineHeight: 22 }}>Your work queue, earnings, and leave are in the tabs below.</Text>
        </View>

        {/* TAILOR24 Value cards */}
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 12 }}>Why TAILOR24?</Text>
        {[
          { icon: '💰', title: 'Fair Payouts', desc: 'Per-garment earnings tracked. Claim anytime. Two-step approval.' },
          { icon: '✂️', title: 'Flexible Work', desc: 'Work from home. Set your capacity. Apply leave instantly.' },
          { icon: '⏱', title: 'SLA Support', desc: 'Know which garments need priority. Never miss a deadline.' },
          { icon: '📱', title: 'BYOD', desc: 'Use your own phone. App works on any Android or iOS.' },
        ].map(card => (
          <View key={card.title} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 10, flexDirection: 'row', gap: 14 }}>
            <Text style={{ fontSize: 28 }}>{card.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 }}>{card.title}</Text>
              <Text style={{ fontSize: 13, color: '#64748b', lineHeight: 20 }}>{card.desc}</Text>
            </View>
          </View>
        ))}
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
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🧵</Text>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 }}>{userName}</Text>
          <Text style={{ color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Tailor Partner</Text>
        </View>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>BYOD Application Status</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' }} />
            <Text style={{ color: '#10b981', fontWeight: '700' }}>APPROVED</Text>
          </View>
          <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 20 }}>Your tailor application has been approved. You are active in the TAILOR24 network.</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginTop: 14, alignItems: 'center' }}
            onPress={() => Alert.alert('PDF Download', 'Generating your BYOD application PDF...\n\n(Mocked in demo mode)')}
          >
            <Text style={{ color: '#475569', fontWeight: '700' }}>📄 Download Application PDF</Text>
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: '#fef3c7', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 6 }}>📍 Location Sharing</Text>
          <Text style={{ color: '#78350f', fontSize: 13, lineHeight: 20, marginBottom: 12 }}>Your location helps the hub route nearby work to you efficiently.</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#f59e0b', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
            onPress={() => Alert.alert('Location Shared ✓', 'Your current location has been shared with the Hub Manager.\n\nThis helps route nearby garments to you.')}
          >
            <Text style={{ color: '#1e293b', fontWeight: '800' }}>📍 Share My Location</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={confirmLogout} style={{ backgroundColor: '#fee2e2', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
          <Ionicons name="log-out-outline" size={24} color="#dc2626" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export const TailorNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#1e293b', borderTopWidth: 0, height: 70, paddingBottom: 10 },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen name="TailorHome" component={TailorHomeTab}
      options={{ tabBarIcon: ({ focused }: any) => <TabIcon icon="🏠" label="Home" focused={focused} /> }}
    />
    <Tab.Screen name="TailorWork" component={TailorDashboardScreen}
      options={{ tabBarIcon: ({ focused }: any) => <TabIcon icon="✂️" label="Work" focused={focused} /> }}
    />
    <Tab.Screen name="TailorProfile" component={ProfileTab}
      options={{ tabBarIcon: ({ focused }: any) => <TabIcon icon="👤" label="Profile" focused={focused} /> }}
    />
  </Tab.Navigator>
);
