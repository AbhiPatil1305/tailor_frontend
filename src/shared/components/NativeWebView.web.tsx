import React from 'react';

// Stub WebView for Web so Metro doesn't crash trying to parse react-native-webview
export const WebView = (props: any) => {
  return <div {...props} />;
};
