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
import { SuperAdminNavigator } from '../../features/admin/navigation/SuperAdminNavigator';
import { AdminLoginScreen } from '../../features/admin/screens/AdminLoginScreen';
import { ManagerLoginScreen } from '../../features/hub/screens/manager/ManagerLoginScreen';
import { TailorLoginScreen } from '../../features/tailor/screens/TailorLoginScreen';
import { ActivateAccountScreen } from '../../features/auth/screens/ActivateAccountScreen';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['http://localhost:8081', 'tailor24://'],
  config: {
    screens: {
      AdminLogin: 'admin/login',
      SuperAdminRoot: {
        path: 'admin',
        screens: {
          AdminDashboard: 'dashboard',
          AdminHubs: 'hubs',
        },
      },
    },
  },
};

export const RootNavigator = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
            <Stack.Screen name="ManagerLogin" component={ManagerLoginScreen} />
            <Stack.Screen name="TailorLogin" component={TailorLoginScreen} />
            <Stack.Screen name="ActivateAccount" component={ActivateAccountScreen} />
          </>
        ) : (
          <>
            {role === 'customer' && <Stack.Screen name="CustomerRoot" component={CustomerNavigator} />}
            {role === 'hub_staff' && <Stack.Screen name="HubStaffRoot" component={HubStaffNavigator} />}
            {role === 'hub_manager' && <Stack.Screen name="HubManagerRoot" component={HubManagerNavigator} />}
            {role === 'tailor' && <Stack.Screen name="TailorRoot" component={TailorNavigator} />}
            {role === 'rider' && <Stack.Screen name="RiderRoot" component={RiderNavigator} />}
            {role === 'admin' && <Stack.Screen name="AdminRoot" component={AdminNavigator} />}
            {role === 'super_admin' && <Stack.Screen name="SuperAdminRoot" component={SuperAdminNavigator} />}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
