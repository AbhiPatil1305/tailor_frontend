import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';

interface CreateTailorModalProps {
  visible: boolean;
  onSubmit: (data: { name: string; phone: string; email?: string; password?: string; skills?: string[]; genderSpecialization?: string[] }) => Promise<void>;
  onClose: () => void;
}

export const CreateTailorModal: React.FC<CreateTailorModalProps> = ({ visible, onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skillsStr, setSkillsStr] = useState('Kurtis, Blouses');
  const [genderSpecStr, setGenderSpecStr] = useState('LADIES');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Full Name and Mobile Number are required.');
      return;
    }
    if (password && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters if provided.');
      return;
    }
    setErrorMsg('');
    try {
      setLoading(true);
      const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const genderSpec = genderSpecStr.split(',').map(s => s.trim()).filter(Boolean);

      await onSubmit({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password: password.trim() || undefined,
        skills: skills.length > 0 ? skills : undefined,
        genderSpecialization: genderSpec.length > 0 ? genderSpec : undefined,
      });
      setName('');
      setPhone('');
      setEmail('');
      setPassword('');
      onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to create tailor account.');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>ADD INDEPENDENT TAILOR</Text>
          <Text style={styles.sub}>Create credentials and assign tailor to your hub.</Text>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formScroll}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Lata Tailor"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543213"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.label}>Password (Optional / Set Directly)</Text>
            <TextInput
              style={styles.input}
              placeholder="Min 6 characters (Leave blank for activation link)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.label}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. lata@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Skills (Comma Separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="Kurtis, Blouses, Sarees"
              value={skillsStr}
              onChangeText={setSkillsStr}
            />

            <Text style={styles.label}>Gender Specialization</Text>
            <TextInput
              style={styles.input}
              placeholder="LADIES, GENTS, KIDS"
              value={genderSpecStr}
              onChangeText={setGenderSpecStr}
            />
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>CREATE TAILOR</Text>
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
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '600',
  },
  formScroll: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 10,
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
