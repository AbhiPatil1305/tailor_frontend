import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface QRScannerProps {
  onScan: (data: string) => void;
  onCancel: () => void;
}

export const QRScanner = ({ onScan, onCancel }: QRScannerProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>[ Camera View ]</Text>
      
      {/* Mocking a successful scan */}
      <TouchableOpacity style={styles.mockScanBtn} onPress={() => onScan('QR_MOCK_123')}>
        <Text style={styles.mockScanText}>Simulate Scan (QR_MOCK_123)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 40,
  },
  mockScanBtn: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  mockScanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    padding: 15,
  },
  cancelText: {
    color: '#e74c3c',
    fontSize: 16,
  }
});
