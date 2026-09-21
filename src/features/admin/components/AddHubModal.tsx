import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Platform } from 'react-native';
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

  const handleSubmit = async () => {
    setError(null);

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedAddress = addressLine1.trim();
    const trimmedCity = city.trim();
    const trimmedState = state.trim();
    const trimmedPincode = pincode.trim();
    const trimmedPhone = contactPhone.trim();

    if (!trimmedName) {
      setError('Please enter a Hub Name.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('Hub name must be at least 2 characters long.');
      return;
    }
    if (!trimmedCode) {
      setError('Please enter a Hub Code.');
      return;
    }
    if (!/^[A-Z0-9_-]{2,20}$/.test(trimmedCode)) {
      setError('Hub code must be 2 to 20 characters (letters, numbers, hyphens or underscores, e.g. HUB-01, JAIPUR_01).');
      return;
    }
    if (!trimmedAddress) {
      setError('Please enter Address Line 1.');
      return;
    }
    if (!trimmedCity) {
      setError('Please enter City.');
      return;
    }
    if (!trimmedState) {
      setError('Please enter State.');
      return;
    }
    if (!trimmedPincode) {
      setError('Please enter Pincode.');
      return;
    }
    if (!trimmedPhone) {
      setError('Please enter Contact Phone.');
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

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TextInput
            placeholder="Hub Name (e.g. South Delhi Hub)"
            style={styles.input}
            value={name}
            onChangeText={(t) => { setName(t); setError(null); }}
            editable={!loading}
          />
          <TextInput
            placeholder="Hub Code (e.g. HUB-01, BLR-MAIN)"
            autoCapitalize="characters"
            style={styles.input}
            value={code}
            onChangeText={(t) => { setCode(t.toUpperCase()); setError(null); }}
            editable={!loading}
          />
          <TextInput
            placeholder="Address Line 1"
            style={styles.input}
            value={addressLine1}
            onChangeText={(t) => { setAddressLine1(t); setError(null); }}
            editable={!loading}
          />
          <View style={styles.row}>
            <TextInput
              placeholder="City"
              style={[styles.input, styles.halfInput]}
              value={city}
              onChangeText={(t) => { setCity(t); setError(null); }}
              editable={!loading}
            />
            <TextInput
              placeholder="State"
              style={[styles.input, styles.halfInput]}
              value={state}
              onChangeText={(t) => { setState(t); setError(null); }}
              editable={!loading}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              placeholder="Pincode"
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
              value={pincode}
              onChangeText={(t) => { setPincode(t); setError(null); }}
              editable={!loading}
            />
            <TextInput
              placeholder="Contact Phone"
              style={[styles.input, styles.halfInput]}
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={(t) => { setContactPhone(t); setError(null); }}
              editable={!loading}
            />
          </View>

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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
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
