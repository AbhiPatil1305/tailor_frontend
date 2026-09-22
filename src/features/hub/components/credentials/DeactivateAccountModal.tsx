import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';

interface DeactivateAccountModalProps {
  visible: boolean;
  userName: string;
  userRole: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export const DeactivateAccountModal: React.FC<DeactivateAccountModalProps> = ({
  visible,
  userName,
  userRole,
  onConfirm,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>DEACTIVATE ACCOUNT</Text>
          <Text style={styles.warningText}>
            Are you sure you want to deactivate this account? The user will be unable to log in, but historical orders, garments, events, and payout records will be preserved intact.
          </Text>

          <View style={styles.userBox}>
            <Text style={styles.userLabel}>User:</Text>
            <Text style={styles.userVal}>{userName}</Text>
            <Text style={styles.userLabel}>Role:</Text>
            <Text style={styles.userVal}>{userRole}</Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deactBtn} onPress={handleDeactivate} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.deactBtnText}>DEACTIVATE</Text>
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
    maxWidth: 440,
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
    marginBottom: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  userBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  userVal: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '700',
    marginBottom: 6,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  deactBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  deactBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
});
