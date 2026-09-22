import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuth } from '../../../core/auth/AuthContext';
import { useNavigation } from '@react-navigation/native';

export const TailorLoginScreen = () => {
  const { login } = useAuth();
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your mobile number and password.');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
    } catch (e: any) {
      if (e.message.includes('Inactive')) {
        Alert.alert(
          'Account Inactive', 
          'Your account hasn\'t been activated yet. Do you have an activation token?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Activate Now', onPress: () => navigation.navigate('ActivateAccount') }
          ]
        );
      } else {
        Alert.alert('Login Failed', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🧵</Text>
          <Text style={styles.logoText}>TAILOR24</Text>
          <Text style={styles.logoSub}>TAILOR APP</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 9876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Log In</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.activateLink}
          onPress={() => navigation.navigate('ActivateAccount')}
        >
          <Text style={styles.activateText}>New tailor? <Text style={styles.activateBold}>Activate your account here</Text></Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.switchLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.switchText}>Switch to Hub Manager / Rider login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#6d28d9' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 48 },
  logoIcon: { fontSize: 64, marginBottom: 10 },
  logoText: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  logoSub: { fontSize: 14, fontWeight: '700', color: '#c4b5fd', letterSpacing: 4, marginTop: 4 },
  form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 16, color: '#1e293b', marginBottom: 20 },
  loginBtn: { backgroundColor: '#6d28d9', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: '#6d28d9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  activateLink: { marginTop: 30, alignItems: 'center' },
  activateText: { color: '#e9d5ff', fontSize: 15 },
  activateBold: { fontWeight: '800', color: '#fff', textDecorationLine: 'underline' },
  switchLink: { marginTop: 40, alignItems: 'center' },
  switchText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' }
});
