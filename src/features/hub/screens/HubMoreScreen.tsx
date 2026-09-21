import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../core/auth/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { UserProfileModal } from '../../../shared/components/UserProfileModal';

export const HubMoreScreen = () => {
  const { userName, role, logout } = useAuth();
  const [showProfile, setShowProfile] = React.useState(false);

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
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        
        <View style={s.profileCard}>
          <Text style={s.avatar}>👤</Text>
          <Text style={s.name}>{userName}</Text>
          <Text style={s.role}>{role === 'hub_manager' ? 'Hub Manager' : 'Hub Staff'}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>STATIONS DIRECTORY</Text>
          
          <MenuBtn label="✂ Cutting Station" onPress={() => navigation.navigate('QueueRoot', { stationId: 'cutting' })} />
          <MenuBtn label="🪡 Stitching (Monitoring)" onPress={() => navigation.navigate('QueueRoot', { stationId: 'stitching' })} />
          <MenuBtn label="🔍 QC Station" onPress={() => navigation.navigate('QueueRoot', { stationId: 'qc' })} />
          <MenuBtn label="📦 Ironing & Packing" onPress={() => navigation.navigate('QueueRoot', { stationId: 'ironing' })} />
          <MenuBtn label="🚚 Dispatch Station" onPress={() => navigation.navigate('QueueRoot', { stationId: 'dispatch' })} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <TouchableOpacity style={[s.logoutBtn, { flex: 1, backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]} onPress={() => setShowProfile(true)}>
            <Ionicons name="person-outline" size={24} color="#475569" style={s.logoutIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.logoutBtn, { flex: 1 }]} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" style={s.logoutIcon} />
          </TouchableOpacity>
        </View>

      </ScrollView>
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
    </SafeAreaView>
  );
};

const MenuBtn = ({ label, onPress }: { label: string, onPress: () => void }) => (
  <TouchableOpacity style={s.menuBtn} onPress={onPress}>
    <Text style={s.menuText}>{label}</Text>
    <Text style={s.menuArrow}>›</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { padding: 16, paddingBottom: 60 },
  
  profileCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 30 },
  avatar: { fontSize: 48, marginBottom: 12 },
  name: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  role: { color: '#3b82f6', fontSize: 12, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },

  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  
  menuBtn: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  menuText: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  menuArrow: { fontSize: 20, color: '#cbd5e1' },

  logoutBtn: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fecaca', flexDirection: 'row' },
  logoutIcon: { marginRight: 8 },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
