import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/core/auth/AuthContext';
import { RootNavigator } from './src/core/navigation/RootNavigator';
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
    }
    #root > div {
      flex: 1;
      display: flex;
    }
  `;
  document.head.appendChild(style);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
