import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminHubsScreen } from '../screens/AdminHubsScreen';

const Stack = createStackNavigator();

export const SuperAdminNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminHubs" component={AdminHubsScreen} />
    </Stack.Navigator>
  );
};
