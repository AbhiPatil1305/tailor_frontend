import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface StageActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const StageActionButton: React.FC<StageActionButtonProps> = ({
  label, onPress, disabled = false, loading = false, variant = 'primary'
}) => {
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isSecondary && styles.btnSecondary,
        isDanger && styles.btnDanger,
        disabled && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? '#64748b' : '#fff'} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            isSecondary && styles.textSecondary,
            disabled && styles.textDisabled,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#6d28d9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnSecondary: {
    backgroundColor: '#f1f5f9',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnDanger: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  btnDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textSecondary: {
    color: '#475569',
  },
  textDisabled: {
    color: '#94a3b8',
  },
});
