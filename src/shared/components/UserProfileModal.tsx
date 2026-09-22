import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiClient } from '../../infrastructure/api/ApiClient';
import { useAuth } from '../../core/auth/AuthContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const UserProfileModal = ({ visible, onClose }: Props) => {
  const { role, userName } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      Promise.all([
        ApiClient.getMe().catch(() => null),
        role === 'customer' ? ApiClient.getMeasurementProfiles().catch(() => []) : Promise.resolve([])
      ])
        .then(([userData, measData]) => {
          setProfile(userData);
          setMeasurements(measData || []);
        })
        .finally(() => setLoading(false));
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>My Profile</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <View style={s.content}>
          <View style={s.avatarContainer}>
            <Ionicons name="person-circle" size={100} color="#cbd5e1" />
            <Text style={s.name}>{userName || profile?.name}</Text>
            <Text style={s.role}>{role?.toUpperCase().replace('_', ' ')}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={s.detailsCard}>
                <View style={s.row}>
                  <Ionicons name="call-outline" size={20} color="#64748b" />
                  <Text style={s.detailText}>{profile?.phone || 'No phone number'}</Text>
                </View>
                {profile?.email && (
                  <View style={[s.row, s.borderTop]}>
                    <Ionicons name="mail-outline" size={20} color="#64748b" />
                    <Text style={s.detailText}>{profile.email}</Text>
                  </View>
                )}
              </View>

              {role === 'customer' && measurements.length > 0 && (
                <View style={s.measurementsSection}>
                  <Text style={s.sectionTitle}>My Measurements</Text>
                  {measurements.map((m: any, idx) => (
                    <View key={m.id || idx} style={s.measurementCard}>
                      <Text style={s.measurementProfileName}>{m.profileName || 'Default Profile'} {m.isDefault ? '(Default)' : ''}</Text>
                      <Text style={s.measurementFor}>For: {m.garmentType} • {m.gender}</Text>
                      
                      <View style={s.measurementGrid}>
                        {Object.entries(m.measurements?.values || {}).map(([key, val]: [string, any]) => (
                          <View key={key} style={s.measurementItem}>
                            <Text style={s.measurementKey}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                            <Text style={s.measurementVal}>{val} {m.measurements?.unit || 'in'}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  content: { flex: 1, padding: 20, paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  name: { fontSize: 24, fontWeight: '800', color: '#1e293b', marginTop: 10 },
  role: { fontSize: 14, fontWeight: '700', color: '#f59e0b', marginTop: 4, letterSpacing: 1 },
  detailsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  borderTop: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  detailText: { fontSize: 16, color: '#334155', marginLeft: 12, fontWeight: '500' },
  measurementsSection: { marginTop: 10, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  measurementCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  measurementProfileName: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 4 },
  measurementFor: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  measurementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  measurementItem: { width: '45%', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8 },
  measurementKey: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  measurementVal: { fontSize: 15, fontWeight: '700', color: '#1e293b' }
});
