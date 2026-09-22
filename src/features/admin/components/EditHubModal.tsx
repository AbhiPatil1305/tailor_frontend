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
import { ApiClient } from '../../../infrastructure/api/ApiClient';

export interface HubData {
  id?: string;
  _id?: string;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  contactPhone: string;
  isActive?: boolean;
}

interface Props {
  visible: boolean;
  hub: HubData | null;
  onClose: () => void;
  onSuccess: (updatedHub?: any) => void;
}

export const EditHubModal: React.FC<Props> = ({ visible, hub, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hub) {
      setName(hub.name || '');
      setAddressLine1(hub.addressLine1 || '');
      setCity(hub.city || '');
      setState(hub.state || '');
      setPincode(hub.pincode || '');
      setContactPhone(hub.contactPhone || '');
      setIsActive(hub.isActive !== false);
      setError(null);
    }
  }, [hub]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!hub) return;
    setError(null);

    const trimmedName = name.trim();
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
      const hubId = hub.id || hub._id;
      if (!hubId) throw new Error('Hub ID not found');

      const payload = {
        name: trimmedName,
        addressLine1: trimmedAddress,
        city: trimmedCity,
        state: trimmedState,
        pincode: trimmedPincode,
        contactPhone: trimmedPhone,
        isActive,
      };

      const updated = await ApiClient.updateHub(hubId, payload);
      onClose();
      onSuccess(updated || { ...hub, ...payload });
    } catch (e: any) {
      let msg = e.message || 'Failed to update hub';
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

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.title}>Edit Hub</Text>
              <Text style={styles.subtitle}>Code: {hub.code}</Text>
            </View>
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

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Status Toggle */}
            <View style={styles.statusToggleRow}>
              <Text style={styles.fieldLabel}>Operational Status</Text>
              <TouchableOpacity
                style={[styles.statusToggle, isActive ? styles.statusActive : styles.statusInactive]}
                onPress={() => setIsActive(!isActive)}
                activeOpacity={0.8}
              >
                <View style={[styles.statusDot, { backgroundColor: isActive ? '#10b981' : '#94a3b8' }]} />
                <Text style={[styles.statusToggleText, { color: isActive ? '#065f46' : '#475569' }]}>
                  {isActive ? 'Operational (Active)' : 'Deactivated (Inactive)'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Hub Name</Text>
            <TextInput
              placeholder="Hub Name"
              style={styles.input}
              value={name}
              onChangeText={(t) => { setName(t); setError(null); }}
              editable={!loading}
            />

            <Text style={styles.fieldLabel}>Address Line 1</Text>
            <TextInput
              placeholder="Address Line 1"
              style={styles.input}
              value={addressLine1}
              onChangeText={(t) => { setAddressLine1(t); setError(null); }}
              editable={!loading}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  placeholder="City"
                  style={styles.input}
                  value={city}
                  onChangeText={(t) => { setCity(t); setError(null); }}
                  editable={!loading}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput
                  placeholder="State"
                  style={styles.input}
                  value={state}
                  onChangeText={(t) => { setState(t); setError(null); }}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <TextInput
                  placeholder="Pincode"
                  style={styles.input}
                  keyboardType="numeric"
                  value={pincode}
                  onChangeText={(t) => { setPincode(t); setError(null); }}
                  editable={!loading}
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Contact Phone</Text>
                <TextInput
                  placeholder="Contact Phone"
                  style={styles.input}
                  keyboardType="phone-pad"
                  value={contactPhone}
                  onChangeText={(t) => { setContactPhone(t); setError(null); }}
                  editable={!loading}
                />
              </View>
            </View>
          </ScrollView>

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
                <Text style={styles.buttonText}>Save Changes</Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
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
  formScroll: {
    maxHeight: 400,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  statusToggleRow: {
    marginBottom: 14,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  statusActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  statusInactive: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusToggleText: {
    fontSize: 13,
    fontWeight: '600',
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
