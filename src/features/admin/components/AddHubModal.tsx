import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (createdHub?: any) => void;
}

export const AddHubModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setError(null);
    // If code has not been manually edited yet, auto-suggest code
    if (!code || code === name.trim().toUpperCase().replace(/\s+/g, '-').slice(0, 15)) {
      const suggested = val.trim().toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 15);
      if (suggested) {
        setCode(`HUB-${suggested}`);
      }
    }
  };

  const handleCodeChange = (val: string) => {
    // Sanitize: uppercase, replace spaces with hyphen, only allow valid characters
    const sanitized = val.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9_-]/g, '');
    setCode(sanitized);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase().replace(/\s+/g, '-');
    const trimmedAddress = addressLine1.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedPincode = pincode.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      const msg = 'Please enter a Hub Name.';
      setError(msg);
      return;
    }
    if (trimmedName.length < 2) {
      const msg = 'Hub name must be at least 2 characters long.';
      setError(msg);
      return;
    }
    if (!trimmedCode) {
      const msg = 'Please enter a Hub Code.';
      setError(msg);
      return;
    }
    if (!/^[A-Z0-9_-]{2,20}$/.test(trimmedCode)) {
      const msg = 'Hub code must be 2 to 20 characters (letters, numbers, hyphens or underscores, e.g. HUB-01, JAIPUR_01).';
      setError(msg);
      return;
    }
    if (!trimmedAddress) {
      const msg = 'Please enter Address Line 1.';
      setError(msg);
      return;
    }
    if (!trimmedCity) {
      const msg = 'Please enter City.';
      setError(msg);
      return;
    }
    if (!trimmedState) {
      const msg = 'Please enter State.';
      setError(msg);
      return;
    }
    if (!trimmedPincode) {
      const msg = 'Please enter Pincode.';
      setError(msg);
      return;
    }
    if (!trimmedPhone) {
      const msg = 'Please enter Contact Phone.';
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: trimmedName,
        code: trimmedCode,
        addressLine1: trimmedAddress,
        city: trimmedCity,
        state: trimmedState,
        pincode: trimmedPincode,
        contactPhone: trimmedPhone,
      };

      const created = await ApiClient.createHub(payload);

      // Reset form fields
      setName('');
      setCode('');
      setAddressLine1('');
      setCity('');
      setState('');
      setPincode('');
      setContactPhone('');
      setError(null);

      // Show immediate feedback to user
      const successTitle = `Hub "${trimmedName}" (${trimmedCode}) created successfully!`;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(successTitle);
      } else {
        Alert.alert('Success', successTitle);
      }

      // Close modal and notify parent
      onClose();
      if (onSuccess) {
        onSuccess(created || payload);
      }
    } catch (e: any) {
      let msg = e.message || 'Failed to create hub';
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
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.modalHeader}>
            <Text style={styles.title}>Add New Hub</Text>
            <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Hub Name *</Text>
            <TextInput
              placeholder="e.g. South Delhi Hub"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={name}
              onChangeText={handleNameChange}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Hub Code * (e.g. HUB-01, JAIPUR-MAIN)</Text>
            <TextInput
              placeholder="e.g. HUB-DELHI-01"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              style={styles.input}
              value={code}
              onChangeText={handleCodeChange}
              editable={!loading}
            />

            <Text style={styles.inputLabel}>Address Line 1 *</Text>
            <TextInput
              placeholder="Plot No, Street name"
              placeholderTextColor="#94a3b8"
              style={styles.input}
              value={addressLine1}
              onChangeText={(t) => { setAddressLine1(t); setError(null); }}
              editable={!loading}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput
                  placeholder="e.g. Jaipur"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={city}
                  onChangeText={(t) => { setCity(t); setError(null); }}
                  editable={!loading}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>State *</Text>
                <TextInput
                  placeholder="e.g. Rajasthan"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={state}
                  onChangeText={(t) => { setState(t); setError(null); }}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Pincode *</Text>
                <TextInput
                  placeholder="e.g. 302001"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  keyboardType="numeric"
                  value={pincode}
                  onChangeText={(t) => { setPincode(t); setError(null); }}
                  editable={!loading}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Contact Phone *</Text>
                <TextInput
                  placeholder="e.g. +919876543210"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  keyboardType="phone-pad"
                  value={contactPhone}
                  onChangeText={(t) => { setContactPhone(t); setError(null); }}
                  editable={!loading}
                />
              </View>
            </View>

            {error && (
              <View style={[styles.errorBox, { marginTop: 8 }]}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

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
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Hub</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 5,
    marginTop: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
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
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    minWidth: 100,
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
