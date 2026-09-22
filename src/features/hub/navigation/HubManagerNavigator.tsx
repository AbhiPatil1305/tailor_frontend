import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Screens
import { ManagerDashboardScreen }    from '../screens/manager/ManagerDashboardScreen';
import { ManagerGarmentListScreen }  from '../screens/manager/ManagerGarmentListScreen';
import { ManagerGarmentDetailScreen } from '../screens/manager/ManagerGarmentDetailScreen';
import { ManagerQueueScreen }        from '../screens/manager/ManagerQueueScreen';
import { ManagerAssignmentScreen }   from '../screens/manager/ManagerAssignmentScreen';
import { ManagerTailorsScreen }     from '../screens/manager/ManagerTailorsScreen';
import { ManagerTailorDetailScreen } from '../screens/manager/ManagerTailorDetailScreen';
import { ManagerRidersScreen }      from '../screens/manager/ManagerRidersScreen';
import { ManagerRiderDetailScreen }  from '../screens/manager/ManagerRiderDetailScreen';
import { ManagerWorkersScreen }     from '../screens/manager/ManagerWorkersScreen';
import { ManagerWorkerDetailScreen } from '../screens/manager/ManagerWorkerDetailScreen';
import { ManagerLeaveScreen }        from '../screens/manager/ManagerLeaveScreen';
import { ManagerQCScreen }           from '../screens/manager/ManagerQCScreen';
import { ManagerDeliveryScreen }     from '../screens/manager/ManagerDeliveryScreen';
import { ManagerPayoutScreen }       from '../screens/manager/ManagerPayoutScreen';
import { ManagerReportsScreen }      from '../screens/manager/ManagerReportsScreen';
import { ManagerSettingsScreen }     from '../screens/manager/ManagerSettingsScreen';
import { ManagerOrdersScreen }       from '../screens/manager/ManagerOrdersScreen';
import { HubQRScreen }               from '../screens/HubQRScreen';

const Stack = createStackNavigator();

// ── Header ──────────────────────────────────────────────────────────────────
const Header = ({ title, navigation, showBack = false }: {
  title: string;
  navigation: any;
  showBack?: boolean;
}) => (
  <View style={headerStyles.bar}>
    {showBack ? (
      <TouchableOpacity style={headerStyles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={headerStyles.backText}>‹</Text>
      </TouchableOpacity>
    ) : (
      <View style={headerStyles.logo}>
        <Text style={headerStyles.logoText}>T24</Text>
      </View>
    )}
    <Text style={headerStyles.title} numberOfLines={1}>{title}</Text>
    <TouchableOpacity style={headerStyles.settingsBtn} onPress={() => navigation.navigate('MGRSettings')}>
      <Text style={headerStyles.settingsIcon}>⚙️</Text>
    </TouchableOpacity>
  </View>
);

const headerStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backText: { fontSize: 22, color: '#7c3aed', lineHeight: 24 },
  logo: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoText: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  title: { flex: 1, fontSize: 17, fontWeight: '800', color: '#1e293b' },
  settingsBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  settingsIcon: { fontSize: 18 },
});

// ── Navigator ────────────────────────────────────────────────────────────────
export const HubManagerNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Root dashboard */}
    <Stack.Screen
      name="MGRDashboard"
      component={ManagerDashboardScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Hub Dashboard" navigation={navigation} />,
      })}
    />

    {/* Delivery Riders */}
    <Stack.Screen
      name="MGRRiders"
      component={ManagerRidersScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Delivery Riders" navigation={navigation} showBack />,
      })}
    />
    <Stack.Screen
      name="MGRRiderDetail"
      component={ManagerRiderDetailScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Rider Detail" navigation={navigation} showBack />,
      })}
    />

    {/* Hub Workers */}
    <Stack.Screen
      name="MGRWorkers"
      component={ManagerWorkersScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Hub Workers" navigation={navigation} showBack />,
      })}
    />
    <Stack.Screen
      name="MGRWorkerDetail"
      component={ManagerWorkerDetailScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Worker Detail" navigation={navigation} showBack />,
      })}
    />

    {/* Independent Tailors */}
    <Stack.Screen
      name="MGRTailors"
      component={ManagerTailorsScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Independent Tailors" navigation={navigation} showBack />,
      })}
    />
    <Stack.Screen
      name="MGRTailorDetail"
      component={ManagerTailorDetailScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Tailor Profile" navigation={navigation} showBack />,
      })}
    />

    {/* Garments */}
    <Stack.Screen
      name="MGRGarments"
      component={ManagerGarmentListScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Garments" navigation={navigation} showBack />,
      })}
    />
    <Stack.Screen
      name="MGRGarmentDetail"
      component={ManagerGarmentDetailScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Garment Detail" navigation={navigation} showBack />,
      })}
    />

    {/* Queue */}
    <Stack.Screen
      name="MGRQueue"
      component={ManagerQueueScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Station Queue" navigation={navigation} showBack />,
      })}
    />

    {/* Assignments */}
    <Stack.Screen
      name="MGRAssignments"
      component={ManagerAssignmentScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Tailor Assignments" navigation={navigation} showBack />,
      })}
    />

    {/* Leave */}
    <Stack.Screen
      name="MGRLeave"
      component={ManagerLeaveScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Leave Requests" navigation={navigation} showBack />,
      })}
    />

    {/* QC */}
    <Stack.Screen
      name="MGRQC"
      component={ManagerQCScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="QC / Rework" navigation={navigation} showBack />,
      })}
    />

    {/* Delivery */}
    <Stack.Screen
      name="MGRDelivery"
      component={ManagerDeliveryScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Dispatch & Delivery" navigation={navigation} showBack />,
      })}
    />

    {/* Payouts */}
    <Stack.Screen
      name="MGRPayouts"
      component={ManagerPayoutScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Payout Claims" navigation={navigation} showBack />,
      })}
    />

    {/* Reports */}
    <Stack.Screen
      name="MGRReports"
      component={ManagerReportsScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Hub Reports" navigation={navigation} showBack />,
      })}
    />

    {/* Orders */}
    <Stack.Screen
      name="MGROrders"
      component={ManagerOrdersScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Hub Orders" navigation={navigation} showBack />,
      })}
    />

    {/* QR Scan */}
    <Stack.Screen
      name="MGRScan"
      component={HubQRScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Scan Garment" navigation={navigation} showBack />,
      })}
    />

    {/* Settings */}
    <Stack.Screen
      name="MGRSettings"
      component={ManagerSettingsScreen}
      options={({ navigation }) => ({
        headerShown: true,
        header: () => <Header title="Settings" navigation={navigation} showBack />,
      })}
    />
  </Stack.Navigator>
);

