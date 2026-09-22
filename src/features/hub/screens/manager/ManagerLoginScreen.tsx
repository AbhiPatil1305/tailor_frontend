import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { useAuth } from '../../../../core/auth/AuthContext';

export const ManagerLoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Error', 'Enter a valid 10-digit mobile number');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Enter your password');
      return;
    }
    try {
      setLoading(true);
      await login(cleanPhone, password);
      // RootNavigator automatically transitions to HubManagerNavigator on hub_manager role
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials or you do not have Hub Manager access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.card}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoIcon}>📊</Text>
            </View>
            <Text style={styles.brand}>TAILOR<Text style={styles.brandAccent}>24</Text></Text>
            <Text style={styles.subtitle}>HUB MANAGER PORTAL</Text>
            <View style={styles.divider} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>MOBILE NUMBER</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 9000000002"
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.pwdWrap}>
                <TextInput
                  style={styles.pwdInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPwd(!showPwd)}>
                  <Text style={styles.eyeIcon}>{showPwd ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>SIGN IN TO HUB PORTAL</Text>
              }
            </TouchableOpacity>
          </View>

          {/* No back link needed — RootNavigator handles routing */}
        </View>

        <Text style={styles.foot}>Only authorized Hub Managers may access this portal.</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1e0a3c' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 40,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#ede9fe',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoIcon: { fontSize: 34 },
  brand: { fontSize: 28, fontWeight: '900', color: '#1e293b', letterSpacing: 2 },
  brandAccent: { color: '#7c3aed' },
  subtitle: { fontSize: 13, color: '#7c3aed', fontWeight: '800', letterSpacing: 3, marginTop: 4 },
  divider: { width: 40, height: 3, backgroundColor: '#7c3aed', borderRadius: 2, marginTop: 16 },

  form: { gap: 20 },
  fieldGroup: { gap: 8 },
  label: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 1, textTransform: 'uppercase' },
  input: {
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 16, color: '#1e293b', backgroundColor: '#f8fafc',
  },
  pwdWrap: {
    flexDirection: 'row', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center',
  },
  pwdInput: { flex: 1, padding: 14, fontSize: 16, color: '#1e293b' },
  eyeBtn: { padding: 14 },
  eyeIcon: { fontSize: 18 },

  loginBtn: {
    backgroundColor: '#7c3aed', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },

  backLink: { alignItems: 'center', marginTop: 24 },
  backText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
  foot: { color: '#a78bfa', fontSize: 12, marginTop: 24, textAlign: 'center', opacity: 0.7 },
});
