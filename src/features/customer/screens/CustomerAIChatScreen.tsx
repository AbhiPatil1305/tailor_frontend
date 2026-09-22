import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth } from '../../../core/auth/AuthContext';
import { AiChatService, BookingDraft, ChatOption } from '../../../infrastructure/api/AiChatService';
import { MockApi } from '../../../infrastructure/api/MockApi';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  bookingDraft?: BookingDraft | null;
  options?: ChatOption[];
  showForm?: 'measurements' | 'location_confirm' | null;
}

export const CustomerAIChatScreen = ({ navigation }: any) => {
  const { userId, userName } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'ai',
      text: `Hi ${userName?.split(' ')[0] || 'there'}! 👋
What would you like to stitch today?`,
      options: [
        { id: 'shirt', label: 'Shirt', icon: '👔' },
        { id: 'pants', label: 'Pants', icon: '👖' },
        { id: 'dress', label: 'Dress', icon: '👗' },
        { id: 'saree', label: 'Saree', icon: '🥻' },
        { id: 'other', label: 'Other', icon: '➕' }
      ]
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<BookingDraft | null>(null);
  
  // Voice state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioSound = useRef<Audio.Sound | null>(null);


  // DatePicker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateMode, setDateMode] = useState<'date'|'time'>('date');

  // Forms state
  const [measWaist, setMeasWaist] = useState('');
  const [measLength, setMeasLength] = useState('');
  const [tempLocation, setTempLocation] = useState<any>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const isPreparing = useRef(false);
  const sessionId = useRef(`${userId}_${Date.now()}`).current;

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading, currentDraft, isRecording, tempLocation]);

  
  const normalizeTranscript = (text: string) => {
    let t = text.trim();
    // Whisper hallucinations filter
    if (['.', 'jaya matadi', '内念', 'thank you.', 'silence.'].includes(t.toLowerCase())) {
       return "";
    }
    const lower = t.toLowerCase();
    if (lower === 'gents' || lower === 'men') return 'GENTS';
    if (lower === 'ladies' || lower === 'lady' || lower === 'women' || lower === 'female') return 'LADIES';
    if (lower === 'cash on delivery' || lower === 'cod' || lower === 'pay when delivered') return 'COD';
    if (lower === 'online payment' || lower === 'pay online') return 'ONLINE';
    return t;
  };

  const handleSend = async (text: string) => {
    text = normalizeTranscript(text);
    if (!text) {
      Alert.alert('Try Again', 'I didn\'t quite catch that. Could you say it again?');
      return;
    }

    if (!text.trim() || loading || orderConfirmed) return;
    
    setInputText('');
    setMessages(prev => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].sender === 'ai') {
        copy[copy.length - 1].options = [];
        copy[copy.length - 1].showForm = null;
      }
      return [...copy, { id: Date.now().toString(), sender: 'user', text }];
    });
    setLoading(true);

    try {
      const response = await AiChatService.sendMessage(text, sessionId);
      
      let dynamicOptions = response.options || [];
      let showForm = null;

      // Handle Measurement form
      if (response.bookingDraft?.garments?.[0]?.measurementOption === 'new' && !response.bookingDraft?.garments?.[0]?.measurementsData) {
        showForm = 'measurements';
      }

      setCurrentDraft(response.bookingDraft);

      const newMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { 
        id: newMsgId, 
        sender: 'ai', 
        text: response.reply,
        bookingDraft: response.bookingDraft,
        options: dynamicOptions,
        showForm: showForm as any
      }]);
      speakText(newMsgId, response.reply);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: "Sorry, I'm having trouble connecting right now. Please try again.",
        options: [{ id: 'retry', label: 'Try Again', icon: '🔄' }]
      }]);
    } finally {
      setLoading(false);
    }
  };




  const speakText = async (msgId: string, text: string) => {
    try {
      if (playingId === msgId) {
        await audioSound.current?.stopAsync();
        setPlayingId(null);
        return;
      }
      
      if (audioSound.current) {
        await audioSound.current.stopAsync();
        await audioSound.current.unloadAsync();
        audioSound.current = null;
      }
      
      setPlayingId(msgId);
      
      const res = await fetch(`${process.env.EXPO_PUBLIC_AI_API_URL || 'http://localhost:4000'}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) {
        setPlayingId(null);
        return;
      }
      
      const blob = await res.blob();
      let uriToPlay = '';
      if (Platform.OS === 'web') {
         uriToPlay = URL.createObjectURL(blob);
      } else {
         uriToPlay = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
         });
      }
      
      const { sound } = await Audio.Sound.createAsync({ uri: uriToPlay });
      audioSound.current = sound;
      
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
           setPlayingId(null);
        }
      });
      
      await sound.playAsync();
    } catch (e) {
      console.log("TTS Autoplay/Playback Error:", e);
      setPlayingId(null);
    }
  };

  const handleVoiceRecord = async () => {
    try {
      if (isRecording) {
        if (isPreparing.current) return;
        isPreparing.current = true;
        // Stop recording
        setIsRecording(false);
        try {
          await recording?.stopAndUnloadAsync();
        } catch (e) {
          console.log("Error stopping recording", e);
        }
        const uri = recording?.getURI();
        setRecording(null);
        isPreparing.current = false;
        
        if (!uri) return;
        setLoading(true);

        const formData = new FormData();
        
        if (Platform.OS === 'web') {
          // In Expo Web, URI is a blob URL. We need to fetch it to a Blob before appending to FormData.
          const res = await fetch(uri);
          const blob = await res.blob();
          formData.append('audio', blob, 'audio.webm');
        } else {
          formData.append('audio', {
            uri,
            name: 'audio.m4a',
            type: 'audio/m4a'
          } as any);
        }

        try {
          const res = await fetch(`${process.env.EXPO_PUBLIC_AI_API_URL || 'http://localhost:4000'}/api/voice/transcribe`, {
            method: 'POST',
            body: formData,
            // Do NOT manually set Content-Type for multipart/form-data. Browser sets it with the correct boundary.
          });
          
          const contentType = res.headers.get("content-type") || "";
          
          if (!res.ok) {
             const errorText = contentType.includes("application/json") ? await res.json() : await res.text();
             throw new Error(typeof errorText === "string" ? errorText : (errorText?.error || "Voice transcription failed"));
          }
          
          const data = await res.json();
          if (data.text) {
            handleSend(data.text);
          } else {
            Alert.alert('Voice Error', 'Could not understand audio.');
          }
        } catch (apiError: any) {
          Alert.alert('Voice Error', apiError.message || 'Failed to connect to transcription service');
        } finally {
          setLoading(false);
        }

      } else {
        // Start recording
        if (isPreparing.current) return;
        isPreparing.current = true;
        
        try {
          await Audio.requestPermissionsAsync();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          const newRecording = new Audio.Recording();
          await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          await newRecording.startAsync();
          setRecording(newRecording);
          setIsRecording(true);
        } catch (e: any) {
          console.error("Recording start error", e);
          if (e.message.includes('Only one Recording object')) {
             // If web client got stuck in a bad state, just alert user to refresh or we clear it implicitly
             Alert.alert('Recording Error', 'Recording is already in progress. Please wait a moment.');
          }
        } finally {
          isPreparing.current = false;
        }
      }
    } catch (err) {
      console.error(err);
      setIsRecording(false);
      setLoading(false);
      isPreparing.current = false;
    }
  };
  const handleLocationFlow = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required.');
        return;
      }
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync(loc.coords);
      setLoading(false);
      
      if (address) {
        const readable = `${address.street || address.name}, ${address.city}, ${address.region}`;
        setTempLocation(readable);
      }
    } catch (e) {
      setLoading(false);
      Alert.alert('Location Error', 'Could not fetch current location.');
    }
  };

  const submitMeasurements = () => {
    if (!measWaist || !measLength) {
      Alert.alert('Validation', 'Please enter both values');
      return;
    }
    handleSend(`Measurements: Waist ${measWaist}, Length ${measLength}`);
  };

  const confirmLocation = () => {
    const loc = tempLocation;
    setTempLocation(null);
    handleSend(`Use address: ${loc}`);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split('T')[0];
      handleSend(`Pickup date: ${formatted}`);
    }
  };

  const handleConfirmOrder = async (draft: BookingDraft) => {
    if (orderConfirmed) return;
    try {
      const payload = {
        customerName: userName || 'Customer',
        customerPhone: '9000000001',
        customerAddress: draft.address || 'Home',
        pickupDate: draft.pickupDate || 'Tomorrow',
        pickupTime: draft.pickupTimeWindow || 'Morning',
        paymentMethod: (draft.paymentMethod?.toLowerCase().includes('cod') ? 'cod' : 'online') as 'cod'|'online',
        garments: draft.garments.map(g => ({
          type: g.type || 'Shirt',
          gender: (g.gender?.toLowerCase() || 'unisex') as any,
          measurements: { version: 1, status: 'NOT_PROVIDED', source: 'NEW', data: {} }
        }))
      };

      const order = await MockApi.bookOrder(payload as any);
      setOrderConfirmed(true);
      
      setMessages(prev => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].sender === 'ai') copy[copy.length - 1].options = [];
        return [...copy, { 
          id: Date.now().toString(), 
          sender: 'ai', 
          text: `🎉 Order confirmed!

Your tracking reference is:
TRK-${order.trackingReference}

You can track your order from the Orders section.` 
        }];
      });
      setTimeout(() => { navigation.navigate('COrders'); }, 3000);
    } catch (e: any) {
      Alert.alert('Booking Error', e.message);
    }
  };

  const renderProgress = () => {
    const g = currentDraft?.garments?.[0];
    const steps = [
      { key: 'Garment', done: !!g?.type },
      { key: 'Gender', done: !!g?.gender },
      { key: 'Measurements', done: !!g?.measurementOption },
      { key: 'Address', done: !!currentDraft?.address },
      { key: 'Pickup', done: !!currentDraft?.pickupDate },
      { key: 'Payment', done: !!currentDraft?.paymentMethod },
    ];
    
    return (
      <View style={s.progressContainer}>
        <Text style={s.progressTitle}>BOOKING PROGRESS</Text>
        <View style={s.progressRow}>
          {steps.map(st => (
            <Text key={st.key} style={[s.progressItem, st.done ? s.progressItemDone : null]}>
              {st.done ? '✓' : '○'} {st.key}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.navigate('CHome')} style={s.backBtn}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>TAILOR24 AI Assistant</Text>
            <Text style={s.headerSub}>Smart Booking Assistant</Text>
          </View>
        </View>

        {renderProgress()}

        <ScrollView ref={scrollViewRef} contentContainerStyle={s.chatContent} showsVerticalScrollIndicator={false}>
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            const draft = msg.bookingDraft;
            const hasOptions = msg.options && msg.options.length > 0;
            
            return (
              <View key={msg.id} style={{ marginBottom: 16 }}>
                <View style={[s.bubble, isUser ? s.userBubble : s.aiBubble]}>
                  <View style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                    <View style={{flex: 1}}>
                      {msg.text.split('\n').map((line, i) => (
                        <Text key={i} style={[s.bubbleText, isUser ? s.userBubbleText : s.aiBubbleText]}>{line}</Text>
                      ))}
                    </View>
                    {!isUser && (
                      <TouchableOpacity onPress={() => speakText(msg.id, msg.text)} style={{marginLeft: 8, padding: 4}}>
                        <Text style={{fontSize: 16}}>{playingId === msg.id ? '⏹' : '🔊'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Option Buttons */}
                {hasOptions && !isUser && !msg.showForm && (
                  <View style={s.optionsContainer}>
                    {msg.options!.map(opt => (
                      <TouchableOpacity 
                        key={opt.id} 
                        style={s.optionBtn}
                        onPress={() => {
                          if (opt.id === 'confirm') handleConfirmOrder(draft!);
                          else if (opt.id === 'retry') handleSend('Retry');
                          else if (opt.id === 'choose' || opt.label.includes('Choose Date')) setShowDatePicker(true);
                          else if (opt.id === 'current' || opt.label.includes('Current Location')) handleLocationFlow();
                          else handleSend(opt.label);
                        }}
                      >
                        <Text style={s.optionBtnText}>{opt.icon ? `${opt.icon} ` : ''}{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Measurement Form */}
                {msg.showForm === 'measurements' && !isUser && (
                  <View style={s.formCard}>
                    <Text style={s.formTitle}>Enter Measurements</Text>
                    <View style={s.formRow}>
                      <TextInput style={s.formInput} placeholder="Waist (in)" keyboardType="numeric" value={measWaist} onChangeText={setMeasWaist} />
                      <TextInput style={s.formInput} placeholder="Length (in)" keyboardType="numeric" value={measLength} onChangeText={setMeasLength} />
                    </View>
                    <TouchableOpacity style={s.formSubmitBtn} onPress={submitMeasurements}>
                      <Text style={s.formSubmitText}>✓ Continue</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Order Summary */}
                {!isUser && draft && draft.readyForConfirmation && !orderConfirmed && (
                  <View style={s.summaryCard}>
                    <Text style={s.summaryTitle}>✂️ TAILOR24 ORDER SUMMARY</Text>
                    {draft.garments.map((g, idx) => (
                      <View key={idx} style={{marginBottom: 8}}>
                        <Text style={s.summaryValue}>👔 {g.gender} {g.type}</Text>
                      </View>
                    ))}
                    <View style={s.summaryRow}><Text style={s.summaryLabel}>📍 Address</Text><Text style={s.summaryValue}>{draft.address}</Text></View>
                    <View style={s.summaryRow}><Text style={s.summaryLabel}>📅 Pickup</Text><Text style={s.summaryValue}>{draft.pickupDate} ({draft.pickupTimeWindow})</Text></View>
                    <View style={s.summaryRow}><Text style={s.summaryLabel}>💳 Payment</Text><Text style={s.summaryValue}>{draft.paymentMethod}</Text></View>
                  </View>
                )}
              </View>
            );
          })}
          
          {tempLocation && (
            <View style={s.formCard}>
              <Text style={s.formTitle}>📍 Current Location Found</Text>
              <Text style={s.locationText}>{tempLocation}</Text>
              <View style={{flexDirection: 'row', gap: 10, marginTop: 12}}>
                <TouchableOpacity style={[s.formSubmitBtn, {flex: 1}]} onPress={confirmLocation}><Text style={s.formSubmitText}>✓ Use</Text></TouchableOpacity>
                <TouchableOpacity style={[s.formSubmitBtn, {flex: 1, backgroundColor: '#94a3b8'}]} onPress={() => setTempLocation(null)}><Text style={s.formSubmitText}>Cancel</Text></TouchableOpacity>
              </View>
            </View>
          )}

          {isRecording && (
            <View style={[s.bubble, s.aiBubble, { alignSelf: 'center', paddingVertical: 12, borderColor: '#ef4444' }]}>
              <Text style={{color: '#ef4444', fontSize: 13, fontWeight: '700'}}>🔴 Listening... Tap Mic to Stop</Text>
            </View>
          )}

          {loading && !isRecording && (
            <View style={[s.bubble, s.aiBubble, { alignSelf: 'flex-start', paddingVertical: 12 }]}>
              <Text style={{color: '#64748b', fontSize: 13}}>🤖 TAILOR24 is thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={s.inputContainer}>
          <TextInput
            style={s.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type anything..."
            placeholderTextColor="#94a3b8"
            multiline
            editable={!loading && !orderConfirmed && !isRecording}
          />
          <TouchableOpacity style={s.micBtn} onPress={handleVoiceRecord}>
            <Text style={{fontSize: 18}}>{isRecording ? '⏹' : '🎤'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.sendBtn, (!inputText.trim() || loading || orderConfirmed || isRecording) && s.sendBtnDisabled]} 
            onPress={() => handleSend(inputText)}
            disabled={!inputText.trim() || loading || orderConfirmed || isRecording}
          >
            <Text style={s.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode={dateMode}
            display="default"
            onChange={handleDateChange}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  backBtnText: { fontSize: 20, color: '#3b82f6', fontWeight: '800' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#64748b' },
  
  progressContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  progressTitle: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginBottom: 4, letterSpacing: 1 },
  progressRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  progressItem: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  progressItemDone: { color: '#10b981' },

  chatContent: { padding: 16, flexGrow: 1, justifyContent: 'flex-end' },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  bubbleText: { fontSize: 14, lineHeight: 22 },
  userBubbleText: { color: '#fff' },
  aiBubbleText: { color: '#1e293b' },
  
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 12, maxWidth: '90%' },
  optionBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' },
  optionBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 13 },

  formCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, alignSelf: 'flex-start', width: '85%' },
  formTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  formRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  formInput: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, backgroundColor: '#f8fafc' },
  formSubmitBtn: { backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  formSubmitText: { color: '#fff', fontWeight: '700' },
  locationText: { fontSize: 13, color: '#475569', lineHeight: 18 },

  summaryCard: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0', width: '100%', marginBottom: 16 },
  summaryTitle: { fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  summaryValue: { fontSize: 13, color: '#1e293b', fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  input: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 14, color: '#1e293b', maxHeight: 100, minHeight: 44 },
  micBtn: { marginLeft: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  sendBtn: { marginLeft: 8, backgroundColor: '#3b82f6', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#94a3b8' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
