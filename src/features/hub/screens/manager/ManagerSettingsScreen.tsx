import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert,
} from 'react-native';
import { useAuth } from '../../../../core/auth/AuthContext';

const SettingRow = ({
  icon, label, value, onPress, destructive = false,
}: {
  icon: string; label: string; value?: string; onPress?: () => void; destructive?: boolean;
}) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
    <Text style={styles.settingIcon}>{icon}</Text>
    <View style={styles.settingInfo}>
      <Text style={[styles.settingLabel, destructive && styles.settingLabelDestructive]}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
    </View>
    {onPress && <Text style={styles.settingChevron}>›</Text>}
  </TouchableOpacity>
);

export const ManagerSettingsScreen = () => {
  const { userName, hubId, userId, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the Hub Manager Portal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName?.charAt(0) ?? 'M'}</Text>
          </View>
          <View>
            <Text style={styles.name}>{userName ?? 'Hub Manager'}</Text>
            <Text style={styles.role}>HUB MANAGER</Text>
            <Text style={styles.phone}>ID: {userId ?? '—'}</Text>
          </View>
        </View>

        {/* Hub Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HUB INFORMATION</Text>
          <SettingRow icon="🏭" label="Assigned Hub ID" value={hubId ?? '—'} />
          <SettingRow icon="🔐" label="Role" value="Hub Manager" />
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPLICATION</Text>
          <SettingRow icon="📱" label="App Version" value="1.0.0" />
          <SettingRow icon="🌐" label="Environment" value="Production" />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <SettingRow
            icon="🚪"
            label="Sign Out"
            onPress={handleLogout}
            destructive
          />
        </View>

        <Text style={styles.footer}>TAILOR24 Hub Manager Portal · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b', marginBottom: 24 },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 20, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 14, elevation: 5 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#7c3aed' },
  name: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 3 },
  role: { fontSize: 11, color: '#7c3aed', fontWeight: '700', letterSpacing: 1, marginBottom: 3 },
  phone: { fontSize: 13, color: '#64748b' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 14, borderTopWidth: 1, borderTopColor: '#f8fafc' },
  settingIcon: { fontSize: 20, width: 28 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  settingLabelDestructive: { color: '#dc2626' },
  settingValue: { fontSize: 13, color: '#64748b', marginTop: 2 },
  settingChevron: { fontSize: 20, color: '#cbd5e1' },
  footer: { textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16 },
});
