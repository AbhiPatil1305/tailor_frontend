import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, TextInput } from 'react-native';
import { useAuth } from '../../../core/auth/AuthContext';
import { ApiClient as MockApi } from '../../../infrastructure/api/ApiClient';

// ── Demo accounts (Priority 5) ──────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    section: 'Customer',
    roles: [
      { title: 'Customer App', email: 'customer@tailor24.demo', role: 'customer' as const, id: 'c1', name: 'Ravi Kumar', icon: '📱', color: '#ec4899' },
    ],
  },
  {
    section: 'Tailor Workforce',
    roles: [
      { title: 'Tailor (Lata — Ladies)', email: 'lata@tailor24.demo', role: 'tailor' as const, id: 't1', name: 'Lata Sharma', icon: '🧵', color: '#f59e0b' },
      { title: 'Tailor (Santosh — Gents)', email: 'santosh@tailor24.demo', role: 'tailor' as const, id: 't2', name: 'Santosh Kumar', icon: '🧵', color: '#f59e0b' },
    ],
  },
  {
    section: 'Hub Operations',
    roles: [
      { title: 'Hub Staff (Intake / Scan)', email: 'staff@tailor24.demo', role: 'hub_staff' as const, id: 's1', name: 'Hub Staff', icon: '📦', color: '#10b981' },
      { title: 'Hub Manager',              email: 'manager@tailor24.demo', role: 'hub_manager' as const, id: 'm1', name: 'Hub Manager', icon: '📊', color: '#8b5cf6' },
    ],
  },
  {
    section: 'Logistics & Admin',
    roles: [
      { title: 'Delivery Rider', email: 'rider@tailor24.demo', role: 'rider' as const, id: 'r1', name: 'Rider', icon: '🛵', color: '#f97316' },
      { title: 'Admin & Finance', email: 'admin@tailor24.demo', role: 'admin' as const, id: 'a1', name: 'Finance Admin', icon: '🏦', color: '#64748b' },
    ],
  },
];

export const LoginScreen = () => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRealSubmit = async () => {
    if (!phone) return;
    setLoading(true);
    
    // The backend strictly expects 10-15 digits with no spaces or dashes
    const cleanPhone = phone.replace(/\D/g, '');

    try {
      if (isSignup) {
        if (!name || name.length < 2) {
          Alert.alert('Error', 'Name must be at least 2 characters');
          setLoading(false);
          return;
        }
        if (cleanPhone.length < 10) {
          Alert.alert('Error', 'Phone must be at least 10 digits');
          setLoading(false);
          return;
        }
        if (email && !email.includes('@')) {
          Alert.alert('Error', 'Please enter a valid email address');
          setLoading(false);
          return;
        }
        await MockApi.register(name, cleanPhone, password || 'test1234', email || undefined);
      }
      await login(cleanPhone, password || 'test1234');
    } catch (e: any) {
      Alert.alert(isSignup ? 'Sign Up Failed' : 'Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>✂️</Text>
          </View>
          <Text style={styles.title}>TAILOR<Text style={styles.titleAccent}>24</Text></Text>
          <Text style={styles.subtitle}>On-Demand Tailoring Platform</Text>
          <Text style={styles.tagline}>Book it. Tag it. Stitch it. Pay it.</Text>
        </View>

        {/* Real Login/Signup Form */}
        <View style={styles.loginForm}>
          <Text style={styles.sectionTitle}>{isSignup ? 'Sign Up' : 'Login'}</Text>
          {isSignup && (
            <View>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Ravi Kumar"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Text style={styles.inputLabel}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="ravi@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}
          <View>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9000000001"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={handleRealSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toggleBtn} 
            onPress={() => setIsSignup(!isSignup)}
          >
            <Text style={styles.toggleBtnText}>
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo Roles - Legacy mapping */}
        <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
          {DEMO_ACCOUNTS.map(section => (
            <View key={section.section} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.section} (Demo)</Text>
              {section.roles.map(r => (
                <TouchableOpacity
                  key={r.id + r.role}
                  style={[styles.roleCard, { borderLeftColor: r.color }]}
                  onPress={() => {
                    // Try to map demo emails to some default phone for now
                    let demoPhone = '9000000001';
                    if (r.role === 'hub_manager') demoPhone = '9000000002';
                    else if (r.role === 'tailor') demoPhone = '9000000003';
                    login(demoPhone, 'test').catch(e => Alert.alert('Login Failed', e.message));
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconBox, { backgroundColor: r.color + '20' }]}>
                    <Text style={styles.iconText}>{r.icon}</Text>
                  </View>
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>{r.title}</Text>
                    <Text style={styles.roleEmail}>{r.email}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Refresh warning */}
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              This is an in-memory demo. Refreshing the browser will clear live session actions.
              Use <Text style={{ fontWeight: '700' }}>Reset Demo Data</Text> before each presentation.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, paddingTop: 24, paddingHorizontal: 24, alignItems: 'center' },
  scrollContent: { paddingBottom: 60, alignItems: 'center' },

  header: { alignItems: 'center', marginTop: 40, marginBottom: 28 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  logoIcon: { fontSize: 36 },
  title: { fontSize: 32, fontWeight: '900', color: '#1e293b', letterSpacing: 1 },
  titleAccent: { color: '#f59e0b' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 8, fontWeight: '500' },
  tagline: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' },

  section: { width: '100%', maxWidth: 500, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },
  loginForm: { width: '100%', maxWidth: 500, marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6, marginLeft: 4, textTransform: 'uppercase' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
  passwordContainer: { flexDirection: 'row', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  passwordInput: { flex: 1, padding: 14, fontSize: 16 },
  eyeBtn: { padding: 14 },
  eyeIcon: { fontSize: 18 },
  primaryBtn: { backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggleBtn: { paddingVertical: 8, alignItems: 'center' },
  toggleBtnText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' },

  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  iconBox: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  iconText: { fontSize: 22 },
  roleTextContainer: { flex: 1 },
  roleTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  roleEmail: { fontSize: 12, color: '#94a3b8', fontFamily: 'Courier' },
  chevron: { fontSize: 24, color: '#cbd5e1' },

  warningBox: { flexDirection: 'row', backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 14, width: '100%', maxWidth: 500, gap: 10, marginTop: 8 },
  warningIcon: { fontSize: 16 },
  warningText: { flex: 1, fontSize: 12, color: '#78350f', lineHeight: 18 },
});
