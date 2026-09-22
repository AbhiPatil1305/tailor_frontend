import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, Platform } from 'react-native';

interface ActivationSuccessModalProps {
  visible: boolean;
  data: {
    name?: string;
    phone?: string;
    role?: string;
    hubId?: string;
    accountStatus?: string;
    activationLink?: string;
    activationToken?: string;
    skills?: string[];
  } | null;
  onClose: () => void;
}

export const ActivationSuccessModal: React.FC<ActivationSuccessModalProps> = ({
  visible,
  data,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const fullLink = data.activationLink
    ? `${Platform.OS === 'web' ? window.location.origin : 'https://tailor24.com'}${data.activationLink}`
    : `Token: ${data.activationToken}`;

  const handleCopy = () => {
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(fullLink);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.headerBox}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.title}>{data.role || 'ACCOUNT'} CREATED</Text>
          </View>

          <View style={styles.detailBox}>
            <View style={styles.row}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.val}>{data.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Mobile:</Text>
              <Text style={styles.val}>{data.phone}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Role:</Text>
              <Text style={styles.val}>{data.role}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.val, { color: '#b45309' }]}>Pending Activation</Text>
            </View>
            {data.skills && data.skills.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Skills:</Text>
                <Text style={styles.val}>{data.skills.join(', ')}</Text>
              </View>
            )}
          </View>

          {/* Warning Banner */}
          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              This link is temporary. Share it only with the intended user. Do not expose passwords.
            </Text>
          </View>

          {/* Activation Link Container */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText} numberOfLines={2}>
              {fullLink}
            </Text>
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            <Text style={styles.copyBtnText}>
              {copied ? '✓ COPIED TO CLIPBOARD' : '📋 COPY ACTIVATION LINK'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>DONE</Text>
          </TouchableOpacity>
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
    maxWidth: 460,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
    color: '#16a34a',
    fontWeight: '900',
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  detailBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  val: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
    lineHeight: 16,
  },
  linkContainer: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  linkText: {
    fontSize: 12,
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  doneBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
