import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, TextInput, Alert, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../core/auth/AuthContext';
<<<<<<< HEAD
import { MockApi } from '../../../infrastructure/api/MockApi';
import { Order, GarmentMeasurements } from '../../../domain/models/types';
=======
import { ApiClient } from '../../../infrastructure/api/ApiClient';
import { Order } from '../../../domain/models/types';
import { UserProfileModal } from '../../../shared/components/UserProfileModal';
import { LocationPickerModal } from '../../../shared/components/LocationPickerModal';
import { LocationService, Coordinates } from '../../../infrastructure/services/LocationService';
>>>>>>> c0a5703 (good morning)

const GARMENT_TYPES = ['Shirt', 'Trousers', 'Kurta', 'Suit', 'Saree', 'Dress', 'Other'];
const GENDER_OPTIONS = ['ladies', 'gents', 'kids', 'unisex'] as const;

type MeasurementOption = 'saved' | 'new' | 'none';

interface BookingGarment {
  id: string; // local unique id to track
  type: string;
  gender: 'ladies' | 'gents' | 'kids' | 'unisex';
  measurementOption: MeasurementOption;
  measurementsData: Record<string, string>;
}

const MEASUREMENT_FIELDS: Record<string, string[]> = {
  Shirt: ['Chest', 'Shoulder', 'Sleeve', 'Length', 'Waist'],
  Trousers: ['Waist', 'Hip', 'Length', 'Thigh', 'Bottom'],
  Kurta: ['Chest', 'Shoulder', 'Sleeve', 'Length'],
  Suit: ['Chest', 'Shoulder', 'Sleeve', 'Length', 'Waist', 'Hip', 'Thigh', 'Bottom'],
  Saree: ['Blouse Bust', 'Blouse Waist', 'Blouse Length'],
  Dress: ['Bust', 'Waist', 'Hips', 'Length'],
  Other: ['Custom 1', 'Custom 2']
};

export const CustomerBookingScreen = () => {
  const { logout, userName } = useAuth();
<<<<<<< HEAD
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Booking form state
  const [customerName, setCustomerName] = useState('Ravi Kumar');
  const [customerPhone, setCustomerPhone] = useState('9000000001');
  const [customerAddress, setCustomerAddress] = useState('12, Gandhi Nagar, Bidar');
  
  const [garments, setGarments] = useState<BookingGarment[]>([
    { id: Math.random().toString(), type: 'Shirt', gender: 'gents', measurementOption: 'none', measurementsData: {} }
  ]);
  
  const [savedMeasurements, setSavedMeasurements] = useState<Record<string, Record<string, any>>>({});
  
  const [pickupDate, setPickupDate] = useState('Tomorrow');
  const [pickupTime, setPickupTime] = useState('10:00 AM – 12:00 PM');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
=======
  const [showProfile, setShowProfile] = useState(false);

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) logout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]);
    }
  };
  const [tab, setTab] = useState<'book' | 'track'>('book');
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Booking form state
  const [customerName, setCustomerName] = useState('John Doe');
  const [customerPhone, setCustomerPhone] = useState('+919876543210');
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCoords, setCustomerCoords] = useState<Coordinates | null>(null);

  const [showMapModal, setShowMapModal] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [garments, setGarments] = useState([{ type: 'Shirt', gender: 'gents' as const }]);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
>>>>>>> c0a5703 (good morning)
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

<<<<<<< HEAD
  useEffect(() => {
    loadSavedMeasurements();
  }, []);

  const loadSavedMeasurements = async () => {
    const saved = await MockApi.getCustomerSavedMeasurements('c1');
    setSavedMeasurements(saved || {});
=======
  useEffect(() => { loadOrders(); loadAddresses(); }, []);
  useEffect(() => { if (tab === 'track') loadOrders(); }, [tab]);

  const loadOrders = async () => {
    try {
      const data = await ApiClient.getMyOrders();
      setOrders(data.reverse());
    } catch (e) {
      console.warn('Failed to load orders', e);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await ApiClient.getAddresses();
      setSavedAddresses(data);
      if (data.length > 0) {
        setSelectedAddressId(data[0].id || data[0]._id);
        setCustomerAddress(data[0].addressLine1);
      }
    } catch (e) {
      console.warn('Failed to load addresses', e);
    }
>>>>>>> c0a5703 (good morning)
  };

  const getPayout = (t: string) => t === 'Shirt' ? 150 : t === 'Trousers' ? 180 : t === 'Kurta' ? 200 : t === 'Suit' ? 500 : t === 'Saree' ? 300 : t === 'Dress' ? 250 : 160;

  const handleIncrement = (type: string) => {
    const defaultGender = (type === 'Saree' || type === 'Dress') ? 'ladies' : (type === 'Other' ? 'unisex' : 'gents');
    setGarments(prev => [...prev, {
      id: Math.random().toString(),
      type,
      gender: defaultGender,
      measurementOption: 'none',
      measurementsData: {}
    }]);
  };

  const handleDecrement = (type: string) => {
    setGarments(prev => {
      const idx = prev.map(g => g.type).lastIndexOf(type);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  };

  const updateGarment = (id: string, field: keyof BookingGarment, value: any) => {
    setGarments(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const updateMeasurement = (id: string, key: string, val: string) => {
    setGarments(prev => prev.map(g => g.id === id ? { ...g, measurementsData: { ...g.measurementsData, [key]: val } } : g));
  };

  const handleBook = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!customerName.trim()) newErrors.customerName = 'Name is required';
    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(customerPhone.trim())) {
      newErrors.customerPhone = 'Enter a valid 10-digit mobile number';
    }
    if (!customerAddress.trim()) newErrors.customerAddress = 'Address is required';
    if (garments.length === 0) newErrors.garments = 'At least one garment is required';
    if (!pickupDate) newErrors.pickupDate = 'Pickup date is required';
    if (!pickupTime) newErrors.pickupTime = 'Pickup time window is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
<<<<<<< HEAD
      // Map frontend state to API format
      const finalGarments = garments.map(g => {
        let measurementPayload: GarmentMeasurements | undefined = undefined;

        if (g.measurementOption === 'saved') {
          const savedData = savedMeasurements[g.type];
          measurementPayload = {
            version: 1,
            status: 'CONFIRMED',
            source: 'SAVED',
            data: savedData || {},
            confirmedAt: new Date().toISOString(),
            confirmedBy: 'c1'
          };
        } else if (g.measurementOption === 'new') {
          measurementPayload = {
            version: 1,
            status: 'CONFIRMED',
            source: 'NEW',
            data: g.measurementsData,
            confirmedAt: new Date().toISOString(),
            confirmedBy: 'c1'
          };
        } else {
          measurementPayload = {
            version: 1,
            status: 'NOT_PROVIDED',
            source: 'NEW',
            data: {}
          };
        }

        return {
          type: g.type,
          gender: g.gender,
          measurements: measurementPayload
        };
      });

      const order = await MockApi.bookOrder({
        customerName, customerPhone, customerAddress,
        pickupDate, pickupTime,
        paymentMethod,
        garments: finalGarments as any,
=======
      let finalAddressId = selectedAddressId;

      // If it's a newly picked address (no ID), save it to DB first
      if (!finalAddressId) {
        const parts = customerAddress.split(',');
        const newAddr = await ApiClient.createAddress({
          label: 'My Location',
          recipientName: customerName,
          phone: customerPhone,
          addressLine1: customerAddress,
          city: parts.length > 1 ? parts[parts.length - 2].trim() : 'Bidar',
          state: parts.length > 0 ? parts[parts.length - 1].trim() : 'Karnataka',
          pincode: '585401', // Default pin if unable to parse
          location: customerCoords ? {
            type: 'Point',
            coordinates: [customerCoords.longitude, customerCoords.latitude]
          } : undefined
        });
        finalAddressId = newAddr.id || newAddr._id;
        await loadAddresses();
      }

      const order = await ApiClient.bookOrder({
        addressId: finalAddressId,
        hubId: 'h1',
        pickupSlot: {
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '11:00'
        },
        paymentMethod,
        garments: garments.map(g => ({
          type: g.type.toUpperCase(),
          gender: g.gender.toUpperCase(),
          serviceCharge: 120.00,
          measurements: { unit: 'cm' }
        })),
>>>>>>> c0a5703 (good morning)
      });
      setConfirmedOrder(order);
    } catch (e: any) {
      Alert.alert('Booking Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const renderStepper = (type: string) => {
    const count = garments.filter(g => g.type === type).length;
    const price = Math.round(getPayout(type) * 1.6);
    return (
      <View key={type} style={styles.counterRow}>
        <View>
          <Text style={styles.counterLabel}>{type}</Text>
          <Text style={styles.counterPrice}>₹{price} / pc</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {count > 0 && <Text style={styles.counterSubtotal}>₹{count * price}</Text>}
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => handleDecrement(type)}>
              <Text style={styles.stepperBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{count}</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={() => handleIncrement(type)}>
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
=======
  const stageIndex = (stage: string) => STAGE_ORDER.indexOf(stage);
  const getSlaColor = (slaDeadline?: string) => {
    if (!slaDeadline) return '#94a3b8';
    const sla = ApiClient.getSlaStatus(slaDeadline);
    return sla.color;
>>>>>>> c0a5703 (good morning)
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
<<<<<<< HEAD
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.profileIcon}><Text style={styles.profileIconText}>👤</Text></View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
=======
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.logoutBtn, { marginRight: 8 }]} onPress={() => setShowProfile(true)}>
            <Ionicons name="person-outline" size={24} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={24} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
      <LocationPickerModal 
        visible={showMapModal} 
        onClose={() => setShowMapModal(false)}
        onSelectAddress={(addr, coords) => {
          setCustomerAddress(addr);
          setCustomerCoords(coords);
          setSelectedAddressId(null);
        }}
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'book' && styles.activeTab]} onPress={() => setTab('book')}>
          <Text style={[styles.tabText, tab === 'book' && styles.activeTabText]}>New Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'track' && styles.activeTab]} onPress={() => setTab('track')}>
          <Text style={[styles.tabText, tab === 'track' && styles.activeTabText]}>
            Track Orders {orders.length > 0 ? `(${orders.length})` : ''}
          </Text>
        </TouchableOpacity>
>>>>>>> c0a5703 (good morning)
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {!confirmedOrder && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Details</Text>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={[styles.input, errors.customerName ? styles.inputError : null]} value={customerName} onChangeText={setCustomerName} placeholder="e.g. Ravi Kumar" />
              {errors.customerName && <Text style={styles.errorText}>{errors.customerName}</Text>}
              
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput style={[styles.input, errors.customerPhone ? styles.inputError : null]} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="10-digit number" />
              {errors.customerPhone && <Text style={styles.errorText}>{errors.customerPhone}</Text>}
              
              <Text style={styles.inputLabel}>Delivery Address</Text>
<<<<<<< HEAD
              <TextInput style={[styles.input, { height: 60 }, errors.customerAddress ? styles.inputError : null]} value={customerAddress} onChangeText={setCustomerAddress} multiline placeholder="Full address" />
              {errors.customerAddress && <Text style={styles.errorText}>{errors.customerAddress}</Text>}
=======
              <TextInput 
                style={[styles.input, { height: 60 }]} 
                value={customerAddress} 
                onChangeText={(txt) => { setCustomerAddress(txt); setSelectedAddressId(null); }} 
                multiline 
                placeholder="Full address" 
              />
              
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { flex: 1, backgroundColor: '#f1f5f9' }]}
                  onPress={() => setShowMapModal(true)}
                >
                  <Ionicons name="location" size={18} color="#3b82f6" />
                  <Text style={[styles.actionBtnText, { color: '#3b82f6' }]}>Get My Current Location</Text>
                </TouchableOpacity>
              </View>

              {savedAddresses.length > 0 && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: 20, fontSize: 13, color: '#94a3b8' }]}>Or pick from saved:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {savedAddresses.map((addrObj, i) => {
                      const id = addrObj.id || addrObj._id;
                      const isSelected = selectedAddressId === id;
                      return (
                        <TouchableOpacity 
                          key={id} 
                          style={[styles.savedAddressChip, isSelected && styles.savedAddressChipActive]}
                          onPress={() => {
                            setSelectedAddressId(id);
                            setCustomerAddress(addrObj.addressLine1);
                            if (addrObj.location?.coordinates) {
                              setCustomerCoords({
                                longitude: addrObj.location.coordinates[0],
                                latitude: addrObj.location.coordinates[1]
                              });
                            }
                          }}
                        >
                          <Ionicons name={isSelected ? "radio-button-on" : "radio-button-off"} size={16} color={isSelected ? "#3b82f6" : "#94a3b8"} />
                          <Text style={[styles.savedAddressText, isSelected && styles.savedAddressTextActive]}>{addrObj.label || 'Home'}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}
>>>>>>> c0a5703 (good morning)
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Select Garments</Text>
              <View style={{ marginTop: 8 }}>
                {GARMENT_TYPES.map(type => renderStepper(type))}
              </View>
              {errors.garments && <Text style={styles.errorText}>{errors.garments}</Text>}
            </View>

            {garments.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Garment Details & Measurements</Text>
                {garments.map((g, idx) => {
                  const price = Math.round(getPayout(g.type) * 1.6);
                  return (
                    <View key={g.id} style={styles.garmentDetailCard}>
                      <View style={styles.garmentHeader}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <View style={styles.garmentIndex}><Text style={styles.garmentIndexText}>{idx + 1}</Text></View>
                          <Text style={styles.garmentTitleText}>{g.type}</Text>
                        </View>
                        <Text style={styles.garmentPrice}>₹{price}</Text>
                      </View>
                      
                      {/* Gender Selection */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        <View style={styles.pillGroup}>
                          {GENDER_OPTIONS.map(gv => (
                            <TouchableOpacity key={gv} style={[styles.pill, g.gender === gv && styles.activePillGender]} onPress={() => updateGarment(g.id, 'gender', gv)}>
                              <Text style={[styles.pillText, g.gender === gv && styles.activePillText]}>{gv}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>

                      {/* Measurements Section */}
                      <View style={styles.measurementsBox}>
                        <Text style={styles.measurementsTitle}>Measurements</Text>
                        <View style={styles.radioGroup}>
                          <TouchableOpacity style={styles.radioOpt} onPress={() => updateGarment(g.id, 'measurementOption', 'saved')}>
                            <View style={styles.radioCircle}>{g.measurementOption === 'saved' && <View style={styles.radioDot} />}</View>
                            <Text style={styles.radioLabel}>Use Saved</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.radioOpt} onPress={() => updateGarment(g.id, 'measurementOption', 'new')}>
                            <View style={styles.radioCircle}>{g.measurementOption === 'new' && <View style={styles.radioDot} />}</View>
                            <Text style={styles.radioLabel}>Enter New</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.radioOpt} onPress={() => updateGarment(g.id, 'measurementOption', 'none')}>
                            <View style={styles.radioCircle}>{g.measurementOption === 'none' && <View style={styles.radioDot} />}</View>
                            <Text style={styles.radioLabel}>I Don't Have</Text>
                          </TouchableOpacity>
                        </View>

                        {g.measurementOption === 'saved' && (
                          <View style={styles.savedBox}>
                            {savedMeasurements[g.type] ? (
                              <>
                                <Text style={styles.savedTitle}>{g.type} Profile — Ravi Kumar</Text>
                                <Text style={styles.savedData}>
                                  {Object.entries(savedMeasurements[g.type]).map(([k, v]) => `${k}: ${v}"`).join('  •  ')}
                                </Text>
                              </>
                            ) : (
                              <Text style={styles.savedData}>No saved measurements for {g.type}.</Text>
                            )}
                          </View>
                        )}

                        {g.measurementOption === 'new' && (
                          <View style={styles.newMeasurementsGrid}>
                            {(MEASUREMENT_FIELDS[g.type] || []).map(f => (
                              <View key={f} style={styles.measurementField}>
                                <Text style={styles.measurementLabel}>{f}</Text>
                                <TextInput 
                                  style={styles.measurementInput}
                                  placeholder='in'
                                  keyboardType="numeric"
                                  value={g.measurementsData[f] || ''}
                                  onChangeText={(v) => updateMeasurement(g.id, f, v)}
                                />
                              </View>
                            ))}
                          </View>
                        )}
                        
                        {g.measurementOption === 'none' && (
                          <Text style={styles.noMeasurementsHelp}>Measurements can be clarified later by the tailor or hub.</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment</Text>
              <View style={styles.paymentRow}>
                <TouchableOpacity style={[styles.payBtn, paymentMethod === 'COD' && styles.payBtnActive]} onPress={() => setPaymentMethod('COD')}>
                  <Text style={paymentMethod === 'COD' ? styles.payBtnTextActive : styles.payBtnText}>💵 Cash on Delivery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.payBtn, paymentMethod === 'ONLINE' && styles.payBtnActive]} onPress={() => setPaymentMethod('ONLINE')}>
                  <Text style={paymentMethod === 'ONLINE' ? styles.payBtnTextActive : styles.payBtnText}>📱 UPI / Card</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pickup Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pillGroup}>
                  {['Today', 'Tomorrow', '24 Sep', '25 Sep'].map(dt => (
                    <TouchableOpacity key={dt} style={[styles.pill, pickupDate === dt && styles.activePill]} onPress={() => setPickupDate(dt)}>
                      <Text style={[styles.pillText, pickupDate === dt && styles.activePillText]}>{dt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors.pickupDate && <Text style={[styles.errorText, { marginTop: 10 }]}>{errors.pickupDate}</Text>}

              <Text style={[styles.cardTitle, { marginTop: 20 }]}>Pickup Time Window</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pillGroup}>
                  {['10:00 AM – 12:00 PM', '02:00 PM – 04:00 PM', '05:00 PM – 07:00 PM'].map(time => (
                    <TouchableOpacity key={time} style={[styles.pill, pickupTime === time && styles.activePill]} onPress={() => setPickupTime(time)}>
                      <Text style={[styles.pillText, pickupTime === time && styles.activePillText]}>{time}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {errors.pickupTime && <Text style={[styles.errorText, { marginTop: 10 }]}>{errors.pickupTime}</Text>}
            </View>

            {/* PRE-BOOKING SUMMARY OF MEASUREMENTS */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Booking Summary</Text>
              {garments.map((g, idx) => (
                <View key={g.id} style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 8}}>
                  <Text style={{color:'#1e293b', fontWeight:'600'}}>{idx+1}. {g.type} ({g.gender})</Text>
                  <Text style={{color: g.measurementOption === 'none' ? '#f59e0b' : '#10b981', fontWeight:'600'}}>
                    {g.measurementOption === 'none' ? '⚠ Not provided' : (g.measurementOption === 'saved' ? '✓ Saved' : '✓ Confirmed')}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryText}>Pickup: {pickupDate}</Text>
                <Text style={[styles.summaryText, { fontSize: 12, color: '#64748b', marginTop: 2 }]}>{pickupTime}</Text>
              </View>
              <Text style={styles.summaryAmount}>₹{garments.reduce((sum, g) => sum + Math.round(getPayout(g.type) * 1.6), 0)}</Text>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} onPress={handleBook} disabled={loading}>
              <Text style={styles.primaryBtnText}>{loading ? 'Booking...' : `Confirm Booking (₹${garments.reduce((sum, g) => sum + Math.round(getPayout(g.type) * 1.6), 0)})`}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── SUCCESS CARD ──────────────────────────── */}
        {confirmedOrder && (
          <View style={styles.successCard}>
            <View style={styles.successIconBox}><Text style={styles.successIcon}>✓</Text></View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSub}>Our rider will arrive for pickup.</Text>
            
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Tracking Reference</Text>
              <Text style={styles.refValue}>{confirmedOrder.trackingReference}</Text>
            </View>
            
            <View style={{ width: '100%', marginBottom: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 }}>
              <View style={styles.successRow}><Text style={styles.successRowLabel}>Garments</Text><Text style={styles.successRowValue}>{confirmedOrder.garments.length} Items</Text></View>
              <View style={styles.successRow}><Text style={styles.successRowLabel}>Pickup Date</Text><Text style={styles.successRowValue}>{confirmedOrder.pickupDate}</Text></View>
              <View style={styles.successRow}><Text style={styles.successRowLabel}>Time Window</Text><Text style={styles.successRowValue}>{confirmedOrder.pickupTime}</Text></View>
              <View style={styles.successRow}><Text style={styles.successRowLabel}>Payment</Text><Text style={styles.successRowValue}>{confirmedOrder.paymentMethod.toUpperCase()}</Text></View>
              <View style={[styles.successRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8, marginTop: 4 }]}><Text style={[styles.successRowLabel, { fontWeight: '700' }]}>Total</Text><Text style={[styles.successRowValue, { fontWeight: '900', color: '#10b981' }]}>₹{confirmedOrder.totalAmount}</Text></View>
            </View>

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setConfirmedOrder(null); setGarments([{ id: Math.random().toString(), type: 'Shirt', gender: 'gents', measurementOption: 'none', measurementsData: {} }]); }}>
              <Text style={styles.secondaryBtnText}>Book Another Order</Text>
            </TouchableOpacity>
          </View>
        )}
<<<<<<< HEAD
=======

        {/* ── TRACKING TAB ─────────────────────────── */}
        {tab === 'track' && (
          <>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>No Orders Yet</Text>
                <Text style={styles.emptySub}>Book a pickup to get started.</Text>
              </View>
            ) : (
              orders.map(order => (
                <View key={order.id} style={styles.trackingCard}>
                  <View style={styles.trackingHeader}>
                    <View>
                      <Text style={styles.trackingRef}>{order.trackingReference}</Text>
                      <Text style={styles.trackingDate}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                    <View style={[styles.paymentBadge, { backgroundColor: order.paymentStatus === 'cod_pending' ? '#fef3c7' : '#dcfce7' }]}>
                      <Text style={[styles.paymentBadgeText, { color: order.paymentStatus === 'cod_pending' ? '#d97706' : '#16a34a' }]}>
                        {order.paymentMethod === 'cod' ? 'COD' : 'PAID'}
                      </Text>
                    </View>
                  </View>

                  {/* Per-garment tracking timeline */}
                  {order.garments.map((garment, gi) => {
                    const currentIdx = stageIndex(garment.stage);
                    const sla = garment.slaDeadline ? ApiClient.getSlaStatus(garment.slaDeadline) : null;
                    return (
                      <View key={garment.id} style={styles.garmentTracker}>
                        <View style={styles.garmentTrackerHeader}>
                          <Text style={styles.garmentTrackerTitle}>{garment.type} ({garment.gender})</Text>
                          <Text style={styles.garmentQr}>{garment.qrCode}</Text>
                        </View>
                        {sla && (
                          <View style={[styles.slaBadge, { backgroundColor: sla.color + '20' }]}>
                            <Text style={[styles.slaText, { color: sla.color }]}>⏱ {sla.label}</Text>
                          </View>
                        )}
                        <View style={styles.timeline}>
                          {TRACKING_STAGES.filter(s => s.key !== 'rework').map((stage, si) => {
                            const realIdx = stageIndex(stage.key);
                            const done = currentIdx >= realIdx;
                            const isCurrent = currentIdx === realIdx;
                            return (
                              <View key={stage.key} style={styles.timelineStep}>
                                <View style={styles.timelineLeft}>
                                  <View style={[styles.dot, done ? styles.dotDone : styles.dotPending, isCurrent && styles.dotCurrent]} />
                                  {si < TRACKING_STAGES.filter(s => s.key !== 'rework').length - 1 && (
                                    <View style={[styles.line, done && styles.lineDone]} />
                                  )}
                                </View>
                                <Text style={[styles.stageLabel, done && styles.stageLabelDone, isCurrent && styles.stageLabelCurrent]}>
                                  {stage.label} {isCurrent ? '←' : ''}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}
>>>>>>> c0a5703 (good morning)
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
<<<<<<< HEAD
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  greeting: { fontSize: 13, color: '#64748b' },
  userName: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  profileIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  profileIconText: { fontSize: 16 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 6 },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
=======
  safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  greeting: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  userName: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  logoutBtn: { padding: 4 },
>>>>>>> c0a5703 (good morning)

  scrollContent: { padding: 16, paddingBottom: 60 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  inputLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, height: 44, color: '#1e293b' },
  inputError: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '600', marginTop: 4 },

  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  counterLabel: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  counterPrice: { fontSize: 12, color: '#64748b', marginTop: 2 },
  counterSubtotal: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginRight: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
  stepperBtn: { width: 28, height: 28, backgroundColor: '#fff', borderRadius: 6, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  stepperBtnText: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  stepperValue: { width: 24, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#1e293b' },

  garmentDetailCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, marginBottom: 12 },
  garmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  garmentIndex: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  garmentIndexText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  garmentTitleText: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  garmentPrice: { color: '#10b981', fontSize: 14, fontWeight: '800' },

  pillGroup: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 20 },
  activePillGender: { backgroundColor: '#ec4899' },
  activePill: { backgroundColor: '#1e293b' },
  pillText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  activePillText: { color: '#fff' },

  measurementsBox: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12 },
  measurementsTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  radioGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  radioOpt: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  radioCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
  radioLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },

  savedBox: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  savedTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  savedData: { fontSize: 12, color: '#64748b', lineHeight: 18 },

  newMeasurementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  measurementField: { width: '48%', marginBottom: 8 },
  measurementLabel: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 4 },
  measurementInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6, height: 36, paddingHorizontal: 10, fontSize: 14 },
  
  noMeasurementsHelp: { fontSize: 12, color: '#f59e0b', fontStyle: 'italic', marginTop: 4 },

  paymentRow: { flexDirection: 'row', gap: 12 },
  payBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' },
  payBtnActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  payBtnText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  payBtnTextActive: { color: '#3b82f6', fontWeight: '700', fontSize: 14 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  summaryText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  summaryAmount: { color: '#1e293b', fontWeight: '800', fontSize: 18 },

  primaryBtn: { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  primaryBtnDisabled: { backgroundColor: '#93c5fd' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  successCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' },
  successIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIcon: { fontSize: 36, color: '#22c55e', fontWeight: '900' },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  refBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  refLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  refValue: { fontSize: 20, fontWeight: '900', color: '#1e293b', letterSpacing: 2 },
  successRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  successRowLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  successRowValue: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  secondaryBtn: { backgroundColor: '#f8fafc', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  secondaryBtnText: { color: '#475569', fontSize: 15, fontWeight: '700' },
<<<<<<< HEAD
=======

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b' },

  trackingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  trackingRef: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  trackingDate: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  paymentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paymentBadgeText: { fontWeight: '800', fontSize: 12 },

  garmentTracker: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  garmentTrackerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  garmentTrackerTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  garmentQr: { fontSize: 12, color: '#94a3b8', fontFamily: 'Courier' },
  slaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12, alignSelf: 'flex-start' },
  slaText: { fontSize: 12, fontWeight: '700' },

  timeline: { paddingLeft: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 32 },
  timelineLeft: { alignItems: 'center', marginRight: 12, width: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  dotPending: { backgroundColor: '#e2e8f0', borderWidth: 2, borderColor: '#cbd5e1' },
  dotDone: { backgroundColor: '#10b981' },
  dotCurrent: { backgroundColor: '#3b82f6', width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, flex: 1, minHeight: 16, backgroundColor: '#e2e8f0', marginTop: 2 },
  lineDone: { backgroundColor: '#10b981' },
  stageLabel: { fontSize: 14, color: '#94a3b8', paddingTop: 1, paddingBottom: 12, fontWeight: '500' },
  stageLabelDone: { color: '#475569' },
  stageLabelCurrent: { color: '#3b82f6', fontWeight: '800' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  savedAddressChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0', gap: 6 },
  savedAddressChipActive: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  savedAddressText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  savedAddressTextActive: { color: '#1e40af', fontWeight: '700' }
>>>>>>> c0a5703 (good morning)
});
