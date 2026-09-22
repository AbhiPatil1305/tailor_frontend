import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

export interface ManagerHubInfo {
  id?: string;
  _id?: string;
  name: string;
  code: string;
  city?: string;
  manager?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
  } | null;
}

interface Props {
  visible: boolean;
  hub: ManagerHubInfo | null;
  onClose: () => void;
  onSuccess: (createdManager: any, hubName: string) => void;
}

export const CreateHubManagerModal: React.FC<Props> = ({ visible, hub, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setName('');
      setPhone('');
      setPassword('');
      setEmail('');
      setError(null);
      setShowPassword(false);
    }
  }, [visible]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!hub) return;
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please enter the manager full name.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Manager name must be at least 2 characters.');
      return;
    }

    if (!trimmedPhone) {
      setError('Please enter the login phone number.');
      return;
    }
    // E.164 or 10-15 digit phone validation
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setError('Please enter a valid phone number (10 to 15 digits, e.g. +919876543210).');
      return;
    }

    if (!trimmedPassword) {
      setError('Please enter a secure password.');
      return;
    }
    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const hubId = hub.id || hub._id;
      if (!hubId) throw new Error('Hub ID not found');

      const payload: any = {
        name: trimmedName,
        phone: trimmedPhone,
        password: trimmedPassword,
      };
      if (trimmedEmail) {
        payload.email = trimmedEmail;
      }

      const created = await ApiClient.createHubManager(hubId, payload);
      onClose();
      onSuccess(created, hub.name);
    } catch (e: any) {
      let msg = e.message || 'Failed to create hub manager';
      try {
        const jsonStart = msg.indexOf('{');
        if (jsonStart !== -1) {
          const parsed = JSON.parse(msg.slice(jsonStart));
          if (Array.isArray(parsed.detail)) {
            msg = parsed.detail.map((d: any) => `${d.loc?.[d.loc.length - 1] || 'Field'}: ${d.msg}`).join('\n');
          } else if (parsed.detail?.message) {
            msg = parsed.detail.message;
          }
        }
      } catch {}
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!hub) return null;

  const currentManager = hub.manager;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.title}>Create Hub Manager</Text>
              <Text style={styles.subtitle}>
                Facility: <Text style={styles.hubHighlight}>{hub.name}</Text> ({hub.code})
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Current Manager Notice if assigned */}
          {currentManager?.name && (
            <View style={styles.currentManagerBox}>
              <Ionicons name="information-circle" size={18} color="#2563eb" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.currentManagerTitle}>Currently Assigned Manager:</Text>
                <Text style={styles.currentManagerText}>
                  {currentManager.name} ({currentManager.phone})
                </Text>
                <Text style={styles.currentManagerNotice}>
                  Creating a new manager will reassign this hub to the new manager credentials.
                </Text>
              </View>
            </View>
          )}

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <Text style={styles.fieldLabel}>Manager Full Name *</Text>
            <TextInput
              placeholder="e.g. Priya Sharma"
              style={styles.input}
              value={name}
              onChangeText={(t) => { setName(t); setError(null); }}
              editable={!loading}
            />

            {/* Login Phone */}
            <Text style={styles.fieldLabel}>Login Phone Number (Primary ID) *</Text>
            <TextInput
              placeholder="e.g. +919876543210"
              style={styles.input}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => { setPhone(t); setError(null); }}
              editable={!loading}
            />
            <Text style={styles.fieldHint}>
              This phone number will be used by the manager to log in to the system.
            </Text>

            {/* Password with toggle */}
            <Text style={styles.fieldLabel}>Initial Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Minimum 6 characters"
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldHint}>
              The manager can use this password along with their phone number to authenticate.
            </Text>

            {/* Optional Email */}
            <Text style={styles.fieldLabel}>Email Address (Optional)</Text>
            <TextInput
              placeholder="e.g. priya.sharma@tailor24.dev"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(null); }}
              editable={!loading}
            />
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.button, styles.cancelBtn]}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.button, styles.submitBtn, loading && styles.submitBtnDisabled]}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Credentials</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  hubHighlight: {
    fontWeight: '700',
    color: '#2563eb',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 6,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  currentManagerBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currentManagerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  currentManagerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3a8a',
    marginTop: 2,
  },
  currentManagerNotice: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 16,
    color: '#dc2626',
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  formScroll: {
    maxHeight: 380,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: -8,
    marginBottom: 12,
    lineHeight: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
  },
  cancelText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
  },
  submitBtnDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
