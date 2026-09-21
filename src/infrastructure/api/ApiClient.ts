import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  Order, Garment, Tailor, GarmentEvent, GarmentStage,
  LeaveRequest, PayoutClaim, PayoutLedger, Hub, QCRecord, TailorScore
} from '../../domain/models/types';
import { getSlaStatus } from './MockApi'; // keep helper
export { getSlaStatus };

// Android emulator uses 10.0.2.2 for localhost
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000/api/v1' : 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'tailor24_access_token';

export const ApiClient = {
  // --- Auth Helpers ---
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY);
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error('Error reading token', e);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  },

  async clearToken(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },

  async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error on ${endpoint}:`, response.status, errorText);
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    return response;
  },

  // --- 1. Authentication ---
  async login(phone: string, password: string = 'test1234'): Promise<any> {
    const res = await this.fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    const json = await res.json();
    const token = json.data?.access_token || json.access_token;
    if (token) {
      await this.setToken(token);
    }
    return json.data || json;
  },

  async register(name: string, phone: string, password: string = 'test1234', email?: string): Promise<any> {
    const body: any = { name, phone, password };
    if (email) body.email = email;

    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Registration Error: ${res.status} ${errorText}`);
    }
    return res.json();
  },

  async getMe(): Promise<any> {
    const res = await this.fetchWithAuth('/auth/me');
    const json = await res.json();
    return json.data || json;
  },

  // --- 2. Customer Journey & Orders ---
  async bookOrder(orderData: any): Promise<Order> {
    const res = await this.fetchWithAuth('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    const json = await res.json();
    return json.data || json;
  },

  async getOrders(): Promise<Order[]> {
    const res = await this.fetchWithAuth('/orders'); 
    const json = await res.json();
    return json.data || json;
  },

  async getMyOrders(): Promise<Order[]> {
    const res = await this.fetchWithAuth('/orders/my');
    const json = await res.json();
    return json.data || json;
  },

  async trackOrder(orderId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/tracking`);
    if (!res.ok) throw new Error('Tracking failed');
    const json = await res.json();
    return json.data || json;
  },

  async getMeasurementProfiles(): Promise<any[]> {
    const res = await this.fetchWithAuth('/measurements/customers/measurement-profiles');
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },

  async getAddresses(): Promise<any[]> {
    const res = await this.fetchWithAuth('/addresses');
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  },

  async createAddress(data: any): Promise<any> {
    const res = await this.fetchWithAuth('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create address');
    }
    const json = await res.json();
    return json.data;
  },

  // Create a new hub (admin only)
  async createHub(data: any): Promise<any> {
    const res = await this.fetchWithAuth('/hubs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },

  async getHubs(activeOnly: boolean = false): Promise<any[]> {
    const res = await this.fetchWithAuth(`/hubs?active_only=${activeOnly}`);
    const json = await res.json();
    return json.data || [];
  },

  async updateHub(hubId: string, data: any): Promise<any> {
    const res = await this.fetchWithAuth(`/hubs/${hubId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data || json;
  },

  async deleteHub(hubId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/hubs/${hubId}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    return json.data || json;
  },

  async createHubManager(hubId: string, data: any): Promise<any> {
    const res = await this.fetchWithAuth(`/hubs/${hubId}/manager`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data || json;
  },


  // --- 3. Hub Operations & Garment Workflow ---
  async advanceGarmentStage(
    qrCode: string,
    newStage: string,
    performedBy: string,
    performedByRole: string,
    metadata?: any
  ): Promise<Garment> {
    const res = await this.fetchWithAuth(`/garments/${qrCode}/scan`, {
      method: 'POST',
      body: JSON.stringify({ targetStage: newStage.toUpperCase(), notes: metadata?.reason || '' }),
    });
    const json = await res.json();
    return json.data || json;
  },

  // Legacy alias mapping
  async updateGarmentStage(qrCode: string, newStage: GarmentStage): Promise<Garment | null> {
    try {
      return await this.advanceGarmentStage(qrCode, newStage, 'system', 'system');
    } catch {
      return null;
    }
  },

  async getGarmentByQR(qrCode: string): Promise<Garment | null> {
    try {
       const res = await this.fetchWithAuth(`/garments/search?qrCode=${qrCode}`);
       const json = await res.json();
       return json.data || json;
    } catch (e) {
       return null;
    }
  },

  async getQueueForStage(stage: string, hubId?: string): Promise<Garment[]> {
    const res = await this.fetchWithAuth(`/garments?stage=${stage.toUpperCase()}`);
    const json = await res.json();
    return json.data || json;
  },
  
  async getGarmentEvents(garmentId: string): Promise<GarmentEvent[]> {
    const res = await this.fetchWithAuth(`/garments/${garmentId}/events`);
    const json = await res.json();
    return json.data || json;
  },

  getSlaStatus, // Re-use helper from MockApi

  // --- 7. Dashboards ---
  async getDashboardMetrics(hubId?: string) {
    const res = await this.fetchWithAuth(`/dashboard`);
    const json = await res.json();
    return json.data || json;
  },
  
  // (Other methods implemented as needed, stubbed here for compilation)
  async getTailorsByHub(hubId: string): Promise<Tailor[]> { return []; },
  async getTailors(): Promise<Tailor[]> { return []; },
  async suggestTailor(garment: Garment): Promise<Tailor[]> { 
    const scores = await this.suggestTailorWithScores(garment);
    return scores.map(s => s.tailor);
  },
  async suggestTailorWithScores(garment: Garment): Promise<TailorScore[]> {
    const res = await this.fetchWithAuth(`/assignments/garments/${garment.id}/suggest`);
    const json = await res.json();
    return json.data || json;
  },
  async assignTailor(garmentId: string, tailorId: string): Promise<boolean> {
    const res = await this.fetchWithAuth(`/assignments/garments/${garmentId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ tailorId })
    });
    return res.ok;
  },
  async getPayoutLedger(tailorId?: string): Promise<PayoutLedger[]> {
    const res = await this.fetchWithAuth(`/payouts/ledger/me`);
    const json = await res.json();
    return json.data || json;
  },
  async raisePayoutClaim(tailorId: string, amount: number, ledgerIds?: string[]): Promise<void> {
    await this.fetchWithAuth(`/payouts/claims`, {
      method: 'POST',
      body: JSON.stringify({ garmentIds: ledgerIds || [] })
    });
  },
  async getPayoutClaims(): Promise<PayoutClaim[]> {
    const res = await this.fetchWithAuth(`/payouts/claims`);
    const json = await res.json();
    return json.data || json;
  },
  async getAllEvents(hubId?: string): Promise<GarmentEvent[]> { return []; },
  
  // Deliveries API
  async createDelivery(orderId: string, riderId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/deliveries`, {
      method: 'POST',
      body: JSON.stringify({ orderId, riderId })
    });
    const json = await res.json();
    return json.data || json;
  },
  async confirmDelivery(deliveryId: string, otp: string, codCollected: boolean = true): Promise<any> {
    const res = await this.fetchWithAuth(`/deliveries/${deliveryId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ otp, codCollected })
    });
    const json = await res.json();
    return json.data || json;
  },
  
  // Legacy stubs
  resetDemo(): void {},
  async getAllGarments(): Promise<Garment[]> { return []; },
  async getGarmentsByHub(hubId: string): Promise<Garment[]> { return []; },
  async recordQC(qrCode: string, result: string, performedBy: string, reason?: string): Promise<void> {},
  async getLeaveRequests(): Promise<LeaveRequest[]> { return []; },
  async updateLeaveRequest(reqId: string, status: string): Promise<void> {},
  async updatePayoutClaim(claimId: string, level: string, status: string, transferReference?: string): Promise<void> {
    const endpoint = level === 'hub' ? `/payouts/claims/${claimId}/manager-review` : `/payouts/claims/${claimId}/finance-confirm`;
    await this.fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify({ status, transferReference })
    });
  },
  async setTailorStatus(tailorId: string, status: string): Promise<void> {},
  async requestLeave(tailorId: string, date: string, reason?: string): Promise<void> {},
};
