import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../auth/AuthContext';

import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { CustomerNavigator } from '../../features/customer/navigation/CustomerNavigator';
import { HubStaffNavigator } from '../../features/hub/navigation/HubStaffNavigator';
import { HubManagerNavigator } from '../../features/hub/navigation/HubManagerNavigator';
import { TailorNavigator } from '../../features/tailor/navigation/TailorNavigator';
import { RiderNavigator } from '../../features/rider/navigation/RiderNavigator';
import { AdminNavigator } from '../../features/admin/navigation/AdminNavigator';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {role === 'customer' && <Stack.Screen name="CustomerRoot" component={CustomerNavigator} />}
            {role === 'hub_staff' && <Stack.Screen name="HubStaffRoot" component={HubStaffNavigator} />}
            {role === 'hub_manager' && <Stack.Screen name="HubManagerRoot" component={HubManagerNavigator} />}
            {role === 'tailor' && <Stack.Screen name="TailorRoot" component={TailorNavigator} />}
            {role === 'rider' && <Stack.Screen name="RiderRoot" component={RiderNavigator} />}
            {role === 'admin' && <Stack.Screen name="AdminRoot" component={AdminNavigator} />}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
