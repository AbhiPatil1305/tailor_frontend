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

export function normalizeGarment(g: any): Garment {
  if (!g) return g;
  const rawStage = String(g.currentStage || g.stage || 'CUTTING_STARTED').toUpperCase();
  let stage: GarmentStage = 'cutting';
  if (rawStage.includes('INTAKE')) stage = 'intake';
  else if (rawStage.includes('CUTTING')) stage = 'cutting';
  else if (rawStage.includes('STITCH')) stage = 'stitching';
  else if (rawStage.includes('REWORK')) stage = 'rework';
  else if (rawStage.includes('QC')) stage = 'qc';
  else if (rawStage.includes('IRON')) stage = 'ironing';
  else if (rawStage.includes('PACK')) stage = 'packed';
  else if (rawStage.includes('DISPATCH')) stage = 'dispatched';
  else if (rawStage.includes('OUT_FOR_DELIVERY')) stage = 'out_for_delivery';
  else if (rawStage.includes('DELIVER')) stage = 'delivered';

  return {
    ...g,
    id: g.id || g._id,
    stage,
    currentStage: g.currentStage || g.stage,
    measurementsConfirmed: g.measurementsConfirmed ?? (g.measurements?.status === 'CONFIRMED'),
    assignedTailorId: g.assignedTailorId || g.tailorId,
  };
}

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

  // --- Hubs ---
  async listHubs(activeOnly: boolean = true): Promise<any[]> {
    const res = await this.fetchWithAuth(`/hubs?active_only=${activeOnly}`);
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

  async getOrders(hubId?: string): Promise<Order[]> {
    const q = hubId ? `?hub_id=${hubId}` : '';
    const res = await this.fetchWithAuth(`/orders${q}`); 
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

  async getOrderById(orderId: string): Promise<any> {
    try {
      const res = await this.fetchWithAuth(`/orders/${orderId}`);
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },


  async requestClarification(garmentId: string, issue: string, message: string, requestedBy: string): Promise<any> {
    try {
      const res = await this.fetchWithAuth(`/garments/${garmentId}/clarification`, {
        method: 'POST',
        body: JSON.stringify({ issue, message, requestedBy }),
      });
      return await res.json();
    } catch {
      return null;
    }
  },


  // --- 3. Hub Operations & Garment Workflow ---
  async advanceGarmentStage(
    qrCode: string,
    newStage: string,
    performedBy: string,
    performedByRole: string,
    metadata?: any
  ): Promise<Garment> {
    const stageUpper = newStage.toUpperCase();
    const res = await this.fetchWithAuth(`/garments/${qrCode}/scan`, {
      method: 'POST',
      body: JSON.stringify({ action: stageUpper, targetStage: stageUpper, metadata }),
    });
    const json = await res.json();
    const g = json.data?.garment || json.data || json;
    return normalizeGarment(g);
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
       const res = await this.fetchWithAuth(`/garments/qr/${encodeURIComponent(qrCode)}`);
       const json = await res.json();
       const g = json.data || json;
       return g ? normalizeGarment(g) : null;
    } catch (e) {
       return null;
    }
  },

  async getQueueForStage(stage: string, hubId?: string): Promise<Garment[]> {
    const q = hubId ? `&hub_id=${hubId}` : '';
    const res = await this.fetchWithAuth(`/garments?stage=${stage.toUpperCase()}${q}`);
    const json = await res.json();
    const data = json.data || json;
    return Array.isArray(data) ? data.map(normalizeGarment) : [];
  },
  
  async getGarmentEvents(garmentId: string): Promise<GarmentEvent[]> {
    const res = await this.fetchWithAuth(`/garments/${garmentId}/events`);
    const json = await res.json();
    const list = json.data || json;
    if (!Array.isArray(list)) return [];
    return list.map((ev: any) => ({
      id: ev.id || ev._id,
      garmentId: ev.garmentId,
      eventType: ev.eventType || ev.stage,
      previousStage: ev.previousStage,
      newStage: ev.stage || ev.eventType,
      performedBy: ev.actor?.name || (typeof ev.actor?.userId === 'string' ? ev.actor.userId : 'Hub Team'),
      performedByRole: ev.actor?.role || 'Staff',
      hubId: ev.hubId,
      timestamp: ev.occurredAt || ev.createdAt || new Date().toISOString(),
      metadata: ev.metadata,
    }));
  },

  getSlaStatus, // Re-use helper from MockApi

  // --- 7. Dashboards ---
  async getDashboardMetrics(hubId?: string) {
    const q = hubId ? `?hub_id=${hubId}` : '';
    const res = await this.fetchWithAuth(`/dashboard${q}`);
    const json = await res.json();
    return json.data || json;
  },
  
  // ─── Tailors ─────────────────────────────────────────────────────────────
  async getTailors(hubId?: string): Promise<Tailor[]> {
    const query = hubId ? `?hub_id=${hubId}` : '';
    const res = await this.fetchWithAuth(`/tailors${query}`);
    const json = await res.json();
    return json.data || json;
  },
  async getTailorsByHub(hubId: string): Promise<Tailor[]> {
    return this.getTailors(hubId);
  },
  async getTailorById(tailorId: string): Promise<Tailor | null> {
    try {
      const res = await this.fetchWithAuth(`/tailors/${tailorId}`);
      const json = await res.json();
      return json.data || json;
    } catch { return null; }
  },

  // ─── Garments (manager) ──────────────────────────────────────────────────
  async getGarments(params?: { hubId?: string; stage?: string; gender?: string; page?: number; limit?: number }): Promise<Garment[]> {
    const q = new URLSearchParams();
    if (params?.hubId) q.set('hub_id', params.hubId);
    if (params?.stage) q.set('stage', params.stage.toUpperCase());
    if (params?.gender) q.set('gender', params.gender);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const res = await this.fetchWithAuth(`/garments?${q.toString()}`);
    const json = await res.json();
    const data = json.data || json;
    return Array.isArray(data) ? data.map(normalizeGarment) : [];
  },
  async getGarmentById(garmentId: string): Promise<Garment | null> {
    try {
      const res = await this.fetchWithAuth(`/garments/${garmentId}`);
      const json = await res.json();
      const g = json.data || json;
      return g ? normalizeGarment(g) : null;
    } catch { return null; }
  },
  async getAllGarments(): Promise<Garment[]> { return this.getGarments(); },
  async getGarmentsByHub(hubId: string): Promise<Garment[]> { return this.getGarments({ hubId }); },

  // ─── Smart Assignment ────────────────────────────────────────────────────
  async suggestTailorWithScores(garment: Garment): Promise<TailorScore[]> {
    const res = await this.fetchWithAuth(`/assignments/garments/${garment.id}/suggest`);
    const json = await res.json();
    return json.data || json;
  },
  async suggestTailor(garment: Garment): Promise<Tailor[]> {
    const scores = await this.suggestTailorWithScores(garment);
    return scores.map(s => s.tailor);
  },
  async assignTailor(garmentId: string, tailorId: string): Promise<boolean> {
    const res = await this.fetchWithAuth(`/assignments/garments/${garmentId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ tailorId }),
    });
    return res.ok;
  },

  // ─── Leave Requests ───────────────────────────────────────────────────────
  async getLeaveRequests(hubId?: string): Promise<LeaveRequest[]> {
    try {
      const q = hubId ? `?hub_id=${hubId}` : '';
      const res = await this.fetchWithAuth(`/tailors/leave-requests${q}`);
      const json = await res.json();
      return json.data || json;
    } catch { return []; }
  },
  async approveLeaveRequest(reqId: string): Promise<void> {
    await this.fetchWithAuth(`/tailors/leave-requests/${reqId}/approve`, { method: 'POST' });
  },
  async rejectLeaveRequest(reqId: string, reason?: string): Promise<void> {
    await this.fetchWithAuth(`/tailors/leave-requests/${reqId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
  async updateLeaveRequest(reqId: string, status: string): Promise<void> {
    if (status === 'approved') return this.approveLeaveRequest(reqId);
    return this.rejectLeaveRequest(reqId);
  },
  async requestLeave(tailorId: string, date: string, reason?: string): Promise<void> {
    await this.fetchWithAuth(`/tailors/leave-requests`, {
      method: 'POST',
      body: JSON.stringify({ tailorId, date, reason }),
    });
  },

  // ─── QC ──────────────────────────────────────────────────────────────────
  async getQCQueue(hubId?: string): Promise<any[]> {
    try {
      const q = hubId ? `?hub_id=${hubId}` : '';
      const res = await this.fetchWithAuth(`/garments/qc-queue${q}`);
      const json = await res.json();
      return json.data || json;
    } catch { return []; }
  },
  async recordQC(garmentId: string, result: string, performedBy: string, reason?: string): Promise<void> {
    await this.advanceGarmentStage(
      garmentId,
      result === 'pass' ? 'qc' : 'rework',
      performedBy,
      'hub_manager',
      { reason }
    );
  },

  // ─── Payouts ─────────────────────────────────────────────────────────────
  async getPayoutLedger(tailorId?: string): Promise<PayoutLedger[]> {
    const res = await this.fetchWithAuth(`/payouts/ledger/me`);
    const json = await res.json();
    return json.data || json;
  },
  async raisePayoutClaim(tailorId: string, amount: number, ledgerIds?: string[]): Promise<void> {
    await this.fetchWithAuth(`/payouts/claims`, {
      method: 'POST',
      body: JSON.stringify({ garmentIds: ledgerIds || [] }),
    });
  },
  async getPayoutClaims(hubId?: string, status?: string): Promise<PayoutClaim[]> {
    try {
      const q = new URLSearchParams();
      if (hubId) q.set('hub_id', hubId);
      if (status) q.set('status', status);
      const res = await this.fetchWithAuth(`/payouts/claims?${q.toString()}`);
      const json = await res.json();
      return json.data || json;
    } catch { return []; }
  },
  async approvePayoutClaim(claimId: string): Promise<void> {
    await this.fetchWithAuth(`/payouts/claims/${claimId}/manager-review`, {
      method: 'POST',
      body: JSON.stringify({ status: 'approved' }),
    });
  },
  async rejectPayoutClaim(claimId: string, reason: string): Promise<void> {
    await this.fetchWithAuth(`/payouts/claims/${claimId}/manager-review`, {
      method: 'POST',
      body: JSON.stringify({ status: 'rejected', reason }),
    });
  },
  async updatePayoutClaim(claimId: string, level: string, status: string, transferReference?: string): Promise<void> {
    const endpoint = level === 'hub'
      ? `/payouts/claims/${claimId}/manager-review`
      : `/payouts/claims/${claimId}/finance-confirm`;
    await this.fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify({ status, transferReference }),
    });
  },

  // ─── Dispatch ─────────────────────────────────────────────────────────────
  async dispatchGarment(garmentId: string, performedBy: string): Promise<void> {
    await this.advanceGarmentStage(garmentId, 'dispatched', performedBy, 'hub_manager');
  },

  // ─── Hub Reports ──────────────────────────────────────────────────────────
  async getHubReport(hubId?: string, period: string = 'today'): Promise<any> {
    try {
      const q = new URLSearchParams();
      if (hubId) q.set('hub_id', hubId);
      q.set('period', period);
      const res = await this.fetchWithAuth(`/dashboard/report?${q.toString()}`);
      const json = await res.json();
      return json.data || json;
    } catch { return {}; }
  },

  // ─── Deliveries ───────────────────────────────────────────────────────────
  async getDeliveries(hubId?: string): Promise<any[]> {
    try {
      const q = hubId ? `?hub_id=${hubId}` : '';
      const res = await this.fetchWithAuth(`/deliveries${q}`);
      const json = await res.json();
      return json.data || json;
    } catch { return []; }
  },
  async createDelivery(orderId: string, riderId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/deliveries`, {
      method: 'POST',
      body: JSON.stringify({ orderId, riderId }),
    });
    const json = await res.json();
    return json.data || json;
  },
  async confirmDelivery(deliveryId: string, otp: string, codCollected: boolean = true): Promise<any> {
    const res = await this.fetchWithAuth(`/deliveries/${deliveryId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ otp, codCollected }),
    });
    const json = await res.json();
    return json.data || json;
  },

  // ─── Misc stubs ──────────────────────────────────────────────────────────
  resetDemo(): void {},
  async getAllEvents(hubId?: string): Promise<GarmentEvent[]> { return []; },
  async setTailorStatus(tailorId: string, status: string): Promise<void> {},

  // ─── Manager Credential Management ─────────────────────────────────────
  async createRider(data: { name: string; phone: string; email?: string; password?: string; emergencyContact?: string; address?: string }): Promise<any> {
    const res = await this.fetchWithAuth('/manager/riders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data || json;
  },
  async getRiders(search?: string, status?: string, accountStatus?: string): Promise<any[]> {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    if (accountStatus) q.set('account_status', accountStatus);
    const res = await this.fetchWithAuth(`/manager/riders?${q.toString()}`);
    const json = await res.json();
    return json.data || [];
  },
  async getRiderDetail(riderId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/riders/${riderId}`);
    const json = await res.json();
    return json.data || json;
  },
  async resetRiderAccess(riderId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/riders/${riderId}/reset-access`, { method: 'POST' });
    const json = await res.json();
    return json.data || json;
  },
  async deactivateRider(riderId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/riders/${riderId}/deactivate`, { method: 'POST' });
    const json = await res.json();
    return json.data || json;
  },
  async reactivateRider(riderId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/riders/${riderId}/reactivate`, { method: 'POST' });
    const json = await res.json();
    return json.data || json;
  },

  async createWorker(data: { name: string; phone: string; email?: string; password?: string; role?: string }): Promise<any> {
    const res = await this.fetchWithAuth('/manager/workers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();

    return json.data || json;
  },
  async getWorkers(search?: string, accountStatus?: string): Promise<any[]> {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (accountStatus) q.set('account_status', accountStatus);
    const res = await this.fetchWithAuth(`/manager/workers?${q.toString()}`);
    const json = await res.json();
    return json.data || [];
  },
  async getWorkerDetail(workerId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/workers/${workerId}`);
    const json = await res.json();
    return json.data || json;
  },
  async resetWorkerAccess(workerId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/workers/${workerId}/reset-access`, { method: 'POST' });
    const json = await res.json();
    return json.data || json;
  },
  async deactivateWorker(workerId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/workers/${workerId}/deactivate`, { method: 'POST' });
    const json = await res.json();
    return json.data || json;
  },
  async reactivateWorker(workerId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/workers/${workerId}/reactivate`, { method: 'POST' });
    const json = await res.json();
    return json.data || json;
  },

  async getTailorsManagement(search?: string, tab?: string): Promise<{ tailors: any[]; applications: any[] }> {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (tab) q.set('tab', tab);
    const res = await this.fetchWithAuth(`/manager/tailors?${q.toString()}`);
    const json = await res.json();
    return json.data || { tailors: [], applications: [] };
  },
  async getTailorManagementDetail(tailorId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/tailors/${tailorId}`);
    const json = await res.json();
    return json.data || json;
  },
  async createTailorFromApplication(applicationId: string, password?: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/tailors/${applicationId}/create-account`, {
      method: 'POST',
      body: password ? JSON.stringify({ password }) : undefined,
    });
    const json = await res.json();
    return json.data || json;
  },

  async createTailorDirect(data: { name: string; phone: string; email?: string; password?: string; skills?: string[]; genderSpecialization?: string[] }): Promise<any> {
    const res = await this.fetchWithAuth('/manager/tailors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data || json;
  },

  async resetTailorAccess(tailorId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/tailors/${tailorId}/reset-access`, { method: 'POST' });
    const json = await res.json();
    return json.data || json;
  },
  async deactivateTailor(tailorId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/tailors/${tailorId}/deactivate`, { method: 'POST' });
    const json = await res.json();
    return json.data || json;
  },
  async reactivateTailor(tailorId: string): Promise<any> {
    const res = await this.fetchWithAuth(`/manager/tailors/${tailorId}/reactivate`, { method: 'POST' });
    const json = await res.json();
    return json.data || json;
  },

  async activateAccount(activationToken: string, password: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activationToken, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Activation failed');
    }
    return json.data || json;
  },

  // ─── Tailor App (Module 4) ────────────────────────────────────────────────

  async getTailorDashboard(): Promise<any> {
    try {
      const res = await this.fetchWithAuth('/tailor/dashboard');
      const json = await res.json();
      return json.data || json;
    } catch { return null; }
  },

  async getTailorProfile(): Promise<any> {
    try {
      const res = await this.fetchWithAuth('/tailors/profile/me');
      const json = await res.json();
      return json.data || json;
    } catch { return null; }
  },

  async updateTailorAvailability(availability: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE'): Promise<any> {
    const res = await this.fetchWithAuth('/tailors/availability', {
      method: 'PATCH',
      body: JSON.stringify({ availability }),
    });
    const json = await res.json();
    return json.data || json;
  },

  async updateTailorLocation(latitude: number, longitude: number): Promise<any> {
    const res = await this.fetchWithAuth('/tailors/location', {
      method: 'PATCH',
      body: JSON.stringify({ location: { type: 'Point', coordinates: [longitude, latitude] } }),
    });
    const json = await res.json();
    return json.data || json;
  },

  async deleteTailorLocation(): Promise<any> {
    try {
      const res = await this.fetchWithAuth('/tailors/location', { method: 'DELETE' });
      const json = await res.json();
      return json.data || json;
    } catch { return null; }
  },

  async getMyGarments(params?: { stage?: string; page?: number; limit?: number }): Promise<any[]> {
    try {
      const q = new URLSearchParams();
      // Backend filters by tailor_id from JWT automatically via /tailors-garments scoped endpoint
      // We use the standard garments endpoint with tailor_id from JWT
      if (params?.stage) q.set('stage', params.stage.toUpperCase());
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      // The backend /garments endpoint supports tailor_id filter
      // We'll pass our own userId from token; backend scopes via tailor profile
      const res = await this.fetchWithAuth(`/garments?${q.toString()}`);
      const json = await res.json();
      return json.data || [];
    } catch { return []; }
  },

  async getMyGarmentsFull(userId: string, params?: { stage?: string }): Promise<any[]> {
    try {
      const q = new URLSearchParams();
      q.set('tailor_id', userId);
      if (params?.stage) q.set('stage', params.stage.toUpperCase());
      const res = await this.fetchWithAuth(`/garments?${q.toString()}`);
      const json = await res.json();
      return json.data || [];
    } catch { return []; }
  },

  async scanGarment(garmentId: string, action: string, metadata?: any): Promise<any> {
    const res = await this.fetchWithAuth(`/garments/${garmentId}/scan`, {
      method: 'POST',
      body: JSON.stringify({ action, metadata: metadata || {} }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Scan failed');
    return json.data || json;
  },

  async getGarmentByQrCode(qrCode: string): Promise<any> {
    try {
      const res = await this.fetchWithAuth(`/garments/qr/${encodeURIComponent(qrCode)}`);
      const json = await res.json();
      return json.data || null;
    } catch { return null; }
  },

  async getPayoutSummary(): Promise<any> {
    try {
      const res = await this.fetchWithAuth('/payouts/ledger/me/summary');
      const json = await res.json();
      return json.data || {};
    } catch { return {}; }
  },

  async getMyPayoutLedger(params?: { status?: string; page?: number }): Promise<any[]> {
    try {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.page) q.set('page', String(params.page));
      const res = await this.fetchWithAuth(`/payouts/ledger/me?${q.toString()}`);
      const json = await res.json();
      return json.data || [];
    } catch { return []; }
  },

  async getMyPayoutClaims(): Promise<any[]> {
    try {
      const res = await this.fetchWithAuth('/payouts/claims');
      const json = await res.json();
      return json.data || [];
    } catch { return []; }
  },

  async raisePayoutClaimFromLedger(ledgerEntryIds: string[]): Promise<any> {
    const res = await this.fetchWithAuth('/payouts/claims', {
      method: 'POST',
      body: JSON.stringify({ ledgerEntryIds }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Claim failed');
    return json.data || json;
  },

  async getMyLeaveRequests(status?: string): Promise<any[]> {
    try {
      const q = status ? `?status=${status}` : '';
      const res = await this.fetchWithAuth(`/leave${q}`);
      const json = await res.json();
      return json.data || [];
    } catch { return []; }
  },

  async applyForLeave(fromDate: string, toDate: string, reason?: string): Promise<any> {
    const res = await this.fetchWithAuth('/leave', {
      method: 'POST',
      body: JSON.stringify({ fromDate, toDate, reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Leave request failed');
    return json.data || json;
  },

  async getMyNotifications(page?: number): Promise<any[]> {
    try {
      const q = page ? `?page=${page}` : '';
      const res = await this.fetchWithAuth(`/notifications${q}`);
      const json = await res.json();
      return json.data || [];
    } catch { return []; }
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await this.fetchWithAuth(`/notifications/${notificationId}/read`, { method: 'PATCH' });
    } catch { /* ignore */ }
  },

  async requestClarificationForGarment(garmentId: string, issue: string, message: string, requestedBy: string): Promise<any> {
    try {
      const res = await this.fetchWithAuth(`/garments/${garmentId}/clarification`, {
        method: 'POST',
        body: JSON.stringify({ issue, message, requestedBy }),
      });
      return await res.json();
    } catch { return null; }
  },
};


