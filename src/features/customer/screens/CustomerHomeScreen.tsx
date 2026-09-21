import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../core/auth/AuthContext';
import { UserProfileModal } from '../../../shared/components/UserProfileModal';

interface Props {
  onBookPress: () => void;
  onTrackPress: () => void;
}

export const CustomerHomeScreen = ({ onBookPress, onTrackPress }: Props) => {
  const { userName, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

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
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>TAILOR<Text style={s.brandAccent}>24</Text></Text>
            <Text style={s.greeting}>Hi, {userName?.split(' ')[0]} 👋</Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity style={[s.logoutBtn, { marginRight: 8 }]} onPress={() => setShowProfile(true)}>
              <Ionicons name="person-outline" size={24} color="#475569" />
            </TouchableOpacity>
            <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout}>
              <Ionicons name="log-out-outline" size={24} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroEmoji}>✂️</Text>
          <Text style={s.heroTitle}>Your perfect fit,{`\n`}delivered in 24 hours.</Text>
          <Text style={s.heroSub}>Book stitching. Track every garment.{`\n`}Delivered to your door.</Text>
        </View>

        {/* Primary actions */}
        <TouchableOpacity style={s.primaryBtn} onPress={onBookPress}>
          <Text style={s.primaryBtnText}>✂️  Book a Stitching Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={onTrackPress}>
          <Text style={s.secondaryBtnText}>📍  Track My Order</Text>
        </TouchableOpacity>

        {/* Trust indicators */}
        <View style={s.trustRow}>
          {[
            { icon: '⏱', label: '24h Delivery' },
            { icon: '📍', label: 'Live Tracking' },
            { icon: '✂️', label: 'Expert Tailors' },
          ].map(t => (
            <View key={t.label} style={s.trustItem}>
              <Text style={s.trustIcon}>{t.icon}</Text>
              <Text style={s.trustLabel}>{t.label}</Text>
            </View>
          ))}
        </View>

        {/* How it works */}
        <Text style={s.sectionTitle}>How it works</Text>
        <View style={s.stepsCard}>
          {[
            { step: '1', title: 'Book', desc: 'Select garments and pickup slot' },
            { step: '2', title: 'We Stitch', desc: 'Expert tailor works on your garment' },
            { step: '3', title: 'Quality Check', desc: 'Every garment inspected before delivery' },
            { step: '4', title: 'Delivered', desc: 'At your door within 24 hours' },
          ].map((item, idx) => (
            <View key={item.step} style={[s.stepRow, idx > 0 && s.stepRowBorder]}>
              <View style={s.stepNum}><Text style={s.stepNumText}>{item.step}</Text></View>
              <View style={s.stepText}>
                <Text style={s.stepTitle}>{item.title}</Text>
                <Text style={s.stepDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>
        <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  brand: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  brandAccent: { color: '#f59e0b' },
  greeting: { fontSize: 14, color: '#64748b', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  logoutBtn: { padding: 4 },
  hero: { backgroundColor: '#1e293b', borderRadius: 20, padding: 28, marginBottom: 16, alignItems: 'flex-start' },
  heroEmoji: { fontSize: 36, marginBottom: 12 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#fff', lineHeight: 32, marginBottom: 10 },
  heroSub: { fontSize: 14, color: '#94a3b8', lineHeight: 22 },
  primaryBtn: { backgroundColor: '#f59e0b', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#1e293b', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 24, borderWidth: 1.5, borderColor: '#e2e8f0' },
  secondaryBtnText: { color: '#1e293b', fontSize: 15, fontWeight: '700' },
  trustRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 28 },
  trustItem: { alignItems: 'center', gap: 6 },
  trustIcon: { fontSize: 22 },
  trustLabel: { fontSize: 12, fontWeight: '700', color: '#475569', textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  stepsCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  stepRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  stepRowBorder: { borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  stepNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  stepNumText: { color: '#f59e0b', fontWeight: '900', fontSize: 14 },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  stepDesc: { fontSize: 13, color: '#64748b', lineHeight: 18 },
});
