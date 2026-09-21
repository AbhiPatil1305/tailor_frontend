import React, { useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity } from 'react-native';
import { CustomerHomeScreen } from '../screens/CustomerHomeScreen';
import { CustomerBookingScreen } from '../screens/CustomerBookingScreen';
import { CustomerOrdersScreen } from '../screens/CustomerOrdersScreen';
import { CustomerTrackingScreen } from '../screens/CustomerTrackingScreen';
import { CustomerAIChatScreen } from '../screens/CustomerAIChatScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }: { icon: string; label: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', gap: 2 }}>
    <Text style={{ fontSize: 20 }}>{icon}</Text>
    <Text style={{ fontSize: 10, fontWeight: '700', color: focused ? '#f59e0b' : '#94a3b8' }}>{label}</Text>
  </View>
);

export const CustomerNavigator = () => {
  const [trackRef, setTrackRef] = useState<string | undefined>(undefined);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1e293b', borderTopWidth: 0, height: 70, paddingBottom: 10 },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#64748b',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="CHome"
        options={{ 
    tabBarLabel: () => null,
    tabBarButton: (props: any) => <TouchableOpacity activeOpacity={0.8} {...props} />,
    tabBarIcon: ({ focused }: any) => <TabIcon icon="🏠" label="Home" focused={focused} /> 
  }}
      >
        {({ navigation }: any) => (
          <CustomerHomeScreen
            onBookPress={() => navigation.navigate('CBook')}
            onTrackPress={() => navigation.navigate('CTrack')}
            onAIPress={() => navigation.navigate('CAssistant')}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="CBook"
        component={CustomerBookingScreen}
        options={{ 
    tabBarLabel: () => null,
    tabBarButton: (props: any) => <TouchableOpacity activeOpacity={0.8} {...props} />,
    tabBarIcon: ({ focused }: any) => <TabIcon icon="✂️" label="Book" focused={focused} /> 
  }}
      />

      <Tab.Screen
        name="COrders"
        options={{ 
    tabBarLabel: () => null,
    tabBarButton: (props: any) => <TouchableOpacity activeOpacity={0.8} {...props} />,
    tabBarIcon: ({ focused }: any) => <TabIcon icon="📦" label="Orders" focused={focused} /> 
  }}
      >
        {({ navigation }: any) => (
          <CustomerOrdersScreen
            onTrack={(ref) => { setTrackRef(ref); navigation.navigate('CTrack'); }}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="CTrack"
        options={{ 
    tabBarLabel: () => null,
    tabBarButton: (props: any) => <TouchableOpacity activeOpacity={0.8} {...props} />,
    tabBarIcon: ({ focused }: any) => <TabIcon icon="📍" label="Track" focused={focused} /> 
  }}
      >
        {() => <CustomerTrackingScreen selectedRef={trackRef} />}
      </Tab.Screen>

      <Tab.Screen
        name="CAssistant"
        component={CustomerAIChatScreen}
        options={{ 
    tabBarLabel: () => null,
    tabBarButton: (props: any) => <TouchableOpacity activeOpacity={0.8} {...props} />,
    tabBarIcon: ({ focused }: any) => <TabIcon icon="🤖" label="AI" focused={focused} /> 
  }}
      />
    </Tab.Navigator>
  );
};
