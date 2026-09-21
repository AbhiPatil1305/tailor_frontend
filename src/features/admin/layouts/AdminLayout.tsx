import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../../core/auth/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';

interface Props {
  children: ReactNode;
  title: string;
  activeRoute?: 'Dashboard' | 'Hubs' | string;
}

export const AdminLayout = ({ children, title, activeRoute = 'Dashboard' }: Props) => {
  const { logout, userName } = useAuth();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>TAILOR24</Text>
          <Text style={styles.brandSubtitle}>ADMIN PORTAL</Text>
        </View>

        <ScrollView style={styles.nav}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <TouchableOpacity
              style={[styles.navItem, activeRoute === 'Dashboard' && styles.activeNavItem]}
              onPress={() => navigation.navigate('AdminDashboard')}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={activeRoute === 'Dashboard' ? '#38bdf8' : '#94a3b8'}
                style={styles.navIcon}
              />
              <Text style={[styles.navText, activeRoute === 'Dashboard' && styles.activeNavText]}>
                Dashboard
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operations</Text>
            <TouchableOpacity
              style={[styles.navItem, activeRoute === 'Hubs' && styles.activeNavItem]}
              onPress={() => navigation.navigate('AdminHubs')}
            >
              <Ionicons
                name="business-outline"
                size={16}
                color={activeRoute === 'Hubs' ? '#38bdf8' : '#94a3b8'}
                style={styles.navIcon}
              />
              <Text style={[styles.navText, activeRoute === 'Hubs' && styles.activeNavText]}>
                Hubs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
              <Ionicons name="cart-outline" size={16} color="#94a3b8" style={styles.navIcon} />
              <Text style={styles.navText}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
              <Ionicons name="shirt-outline" size={16} color="#94a3b8" style={styles.navIcon} />
              <Text style={styles.navText}>Garments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
              <Ionicons name="cut-outline" size={16} color="#94a3b8" style={styles.navIcon} />
              <Text style={styles.navText}>Tailors</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem}>
              <Ionicons name="bicycle-outline" size={16} color="#94a3b8" style={styles.navIcon} />
              <Text style={styles.navText}>Riders</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Finance</Text>
            <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>Payments</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>COD</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>Payout Claims</Text></TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Configuration</Text>
            <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>Pricing</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>Users</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navItem}><Text style={styles.navText}>Settings</Text></TouchableOpacity>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#94a3b8" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={[styles.headerNavBtn, activeRoute === 'Dashboard' && styles.headerNavBtnActive]}
              onPress={() => navigation.navigate('AdminDashboard')}
            >
              <Ionicons
                name="grid-outline"
                size={15}
                color={activeRoute === 'Dashboard' ? '#2563eb' : '#475569'}
              />
              <Text
                style={[
                  styles.headerNavBtnText,
                  activeRoute === 'Dashboard' && styles.headerNavBtnTextActive,
                ]}
              >
                Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerNavBtn, activeRoute === 'Hubs' && styles.headerNavBtnActive]}
              onPress={() => navigation.navigate('AdminHubs')}
            >
              <Ionicons
                name="business-outline"
                size={15}
                color={activeRoute === 'Hubs' ? '#2563eb' : '#475569'}
              />
              <Text
                style={[
                  styles.headerNavBtnText,
                  activeRoute === 'Hubs' && styles.headerNavBtnTextActive,
                ]}
              >
                Hubs Management
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.search}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <Text style={styles.searchText}>Search...</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#475569" />
            </TouchableOpacity>
            <View style={styles.profile}>
              <Text style={styles.profileName}>{userName}</Text>
              <Ionicons name="person-circle-outline" size={28} color="#475569" />
            </View>
          </View>
        </View>

        <View style={styles.contentHeader}>
          <Text style={styles.pageTitle}>{title}</Text>
        </View>
        
        <ScrollView style={styles.content}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
  },
  sidebar: {
    width: 250,
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
  },
  brand: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  brandSubtitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  nav: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
  },
  navIcon: {
    marginRight: 10,
  },
  activeNavItem: {
    backgroundColor: '#1e293b',
  },
  navText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  logoutText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    height: 64,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerNavBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  headerNavBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  headerNavBtnTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  hubFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hubFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    width: 200,
  },
  searchText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  iconBtn: {
    padding: 4,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    paddingLeft: 20,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  contentHeader: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  }
});
