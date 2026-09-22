import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, ActivityIndicator } from 'react-native';

interface ResetAccessModalProps {
  visible: boolean;
  userName: string;
  userRole: string;
  onConfirm: () => Promise<any>;
  onClose: () => void;
}

export const ResetAccessModal: React.FC<ResetAccessModalProps> = ({
  visible,
  userName,
  userRole,
  onConfirm,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    try {
      setLoading(true);
      const res = await onConfirm();
      setResetResult(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResetResult(null);
    setCopied(false);
    onClose();
  };

  if (!visible) return null;

  const fullLink = resetResult?.activationLink
    ? `${Platform.OS === 'web' ? window.location.origin : 'https://tailor24.com'}${resetResult.activationLink}`
    : `Token: ${resetResult?.activationToken}`;

  const handleCopy = () => {
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(fullLink);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {!resetResult ? (
            <>
              <Text style={styles.title}>RESET ACCESS</Text>
              <Text style={styles.warningText}>
                This will invalidate the current activation/reset credentials and create a new activation process.
              </Text>

              <View style={styles.userBox}>
                <Text style={styles.userLabel}>User:</Text>
                <Text style={styles.userVal}>{userName}</Text>
                <Text style={styles.userLabel}>Role:</Text>
                <Text style={styles.userVal}>{userRole}</Text>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.resetBtnText}>RESET ACCESS</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.headerBox}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.title}>ACCESS RESET</Text>
              </View>

              <Text style={styles.successMsg}>
                Previous activation tokens have been invalidated. Share this new activation link with {userName}:
              </Text>

              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>{fullLink}</Text>
              </View>

              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Text style={styles.copyBtnText}>
                  {copied ? '✓ COPIED TO CLIPBOARD' : '📋 COPY NEW ACTIVATION LINK'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                <Text style={styles.doneBtnText}>DONE</Text>
              </TouchableOpacity>
            </>
          )}
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
  headerBox: {
    alignItems: 'center',
    marginBottom: 12,
  },
  successIcon: {
    fontSize: 36,
    color: '#16a34a',
    fontWeight: '900',
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
    marginTop: 2,
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
  resetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#dc2626',
  },
  resetBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  successMsg: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 16,
    lineHeight: 20,
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
