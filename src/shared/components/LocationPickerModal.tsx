import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from './NativeWebView';
import { LocationService, Coordinates } from '../../infrastructure/services/LocationService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectAddress: (address: string, coords: Coordinates) => void;
}

export const LocationPickerModal = ({ visible, onClose, onSelectAddress }: Props) => {
  const [initialCoords, setInitialCoords] = useState<Coordinates | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize with current location
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setInitialCoords(null);
      setCoords(null);
      LocationService.getCurrentLocation()
        .then(async (c) => {
          setInitialCoords(c);
          setCoords(c);
          const addr = await LocationService.reverseGeocode(c);
          setAddress(addr);
        })
        .catch((e) => {
          console.warn('Location error:', e);
          // Fallback coordinate (e.g., center of a city)
          const fallback = { latitude: 17.9135, longitude: 77.5190 };
          setInitialCoords(fallback);
          setCoords(fallback);
        })
        .finally(() => setLoading(false));
    }
  }, [visible]);

  // Handle map center change from WebView
  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'location_changed') {
        const newCoords = { latitude: data.lat, longitude: data.lon };
        setCoords(newCoords);
        setLoading(true);
        const addr = await LocationService.reverseGeocode(newCoords);
        setAddress(addr);
        setLoading(false);
      }
    } catch (e) {}
  };

  const handleConfirm = () => {
    if (address && coords) {
      onSelectAddress(address, coords);
      onClose();
    }
  };

  // Simple HTML for Leaflet Map
  const getMapHtml = (lat: number, lon: number) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; }
          #map { height: 100vh; width: 100vw; }
          .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            font-size: 40px;
            pointer-events: none;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="center-marker">📍</div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView([${lat}, ${lon}], 16);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // Listen to drag events to get center coordinates
          let debounceTimer;
          map.on('moveend', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
              const center = map.getCenter();
              const data = JSON.stringify({
                type: 'location_changed',
                lat: center.lat,
                lon: center.lng
              });
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(data);
              } else if (window.parent) {
                window.parent.postMessage(data, '*');
              }
            }, 1200); // Wait 1.2s before reverse-geocoding to avoid 429 Too Many Requests
          });
        </script>
      </body>
    </html>
  `;

  const renderMap = () => {
    if (!initialCoords) return null;
    const html = getMapHtml(initialCoords.latitude, initialCoords.longitude);

    if (Platform.OS === 'web') {
      // In a real web app, we'd use react-leaflet, but for simplicity we can use an iframe
      return (
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          // @ts-ignore
          onLoad={(e) => {
            // Setup listener for iframe messages
            window.addEventListener('message', (event) => {
              if (typeof event.data === 'string') {
                try {
                  const data = JSON.parse(event.data);
                  if (data.type === 'location_changed') {
                    const newCoords = { latitude: data.lat, longitude: data.lon };
                    setCoords(newCoords);
                    setLoading(true);
                    LocationService.reverseGeocode(newCoords)
                      .then(addr => setAddress(addr))
                      .catch(() => setAddress('Unknown location (Rate limited)'))
                      .finally(() => setLoading(false));
                  }
                } catch (err) {}
              }
            });
          }}
        />
      );
    }

    return (
      <WebView
        source={{ html }}
        onMessage={handleMessage}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>Select Location</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <View style={s.mapContainer}>
          {loading && !initialCoords ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={s.loadingText}>Detecting location...</Text>
            </View>
          ) : (
            renderMap()
          )}
        </View>

        <View style={s.footer}>
          <Text style={s.addressTitle}>Delivery Address</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#64748b" style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
          ) : (
            <Text style={s.addressText}>{address || 'Drag map to select'}</Text>
          )}

          <TouchableOpacity 
            style={[s.confirmBtn, (!address || loading) && s.confirmBtnDisabled]} 
            onPress={handleConfirm}
            disabled={!address || loading}
          >
            <Text style={s.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  mapContainer: { flex: 1, backgroundColor: '#e2e8f0' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontWeight: '500' },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  addressTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  addressText: { fontSize: 16, color: '#1e293b', fontWeight: '500', marginBottom: 20 },
  confirmBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 14, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: '#cbd5e1' },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
