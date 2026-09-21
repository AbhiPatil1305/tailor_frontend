import {
  Order, Garment, Tailor, GarmentStage, GarmentEvent, GarmentEventType,
  LeaveRequest, PayoutClaim, PayoutLedger, Hub, QCRecord, TailorScore, PayoutStatus
} from '../../domain/models/types';
import {
  buildDemoState, validateTransition, STAGE_TO_EVENT, genEventId, genId,
  hoursAgo
} from '../demo/DemoState';

// ─── Mutable in-memory store ──────────────────────────────────────────────────
let store = buildDemoState();

// ─── Reset (called by demo reset button) ─────────────────────────────────────
export function resetDemoData(): void {
  store = buildDemoState();
}

// ─── SLA helper ───────────────────────────────────────────────────────────────
export function getSlaStatus(slaDeadline?: string): { status: string; label: string; color: string } {
  if (!slaDeadline) return { status: 'no_sla', label: 'Not timed', color: '#94a3b8' };
  const remaining = new Date(slaDeadline).getTime() - Date.now();
  const hours = remaining / 3_600_000;
  if (remaining <= 0)  return { status: 'overdue',  label: 'OVERDUE ⚠️', color: '#ef4444' };
  if (hours <= 2)      return { status: 'at_risk',  label: `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m ⚠️`, color: '#f97316' };
  if (hours <= 6)      return { status: 'warning',  label: `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m left`, color: '#f59e0b' };
  return               { status: 'safe',    label: `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}m left`, color: '#10b981' };
}

// ─── Append event ─────────────────────────────────────────────────────────────
function appendEvent(
  garmentId: string,
  eventType: GarmentEventType,
  previousStage: GarmentStage | null,
  newStage: GarmentStage,
  performedBy: string,
  performedByRole: string,
  hubId: string,
  metadata?: Record<string, any>
): GarmentEvent {
  const ev: GarmentEvent = {
    id: genEventId(),
    garmentId, eventType, previousStage, newStage,
    performedBy, performedByRole, hubId,
    timestamp: new Date().toISOString(),
    metadata,
  };
  store.events.push(ev);
  return ev;
}

// ─── MockApi ──────────────────────────────────────────────────────────────────
export const MockApi = {

  // ── Demo ──────────────────────────────────────────────────────────────────
  resetDemo: (): void => resetDemoData(),

  // ── Hubs ──────────────────────────────────────────────────────────────────
  getHubs: async (): Promise<Hub[]> => [...store.hubs],

  // ── Customer ──────────────────────────────────────────────────────────────
  bookOrder: async (orderData: {
    customerName?: string; customerPhone?: string; customerAddress?: string;
    pickupDate?: string; pickupTime?: string; paymentMethod?: 'cod' | 'online';
    garments: { type: string; gender: 'ladies'|'gents'|'kids'|'unisex'; notes?: string; measurements?: any }[];
  }): Promise<Order> => {
    const orderId = genId('ord');
    const paymentMethod = orderData.paymentMethod || 'cod';
    const garments: Garment[] = orderData.garments.map((g, i) => {
      const id = genId('grm');
      const payout = g.type === 'Shirt' ? 150 : g.type === 'Trousers' ? 180 : g.type === 'Kurta' ? 200 : g.type === 'Suit' ? 500 : 160;
      const service = Math.round(payout * 1.6);
      const qrCode = `T24-GRM-${id.slice(-6).toUpperCase()}`;
      
      // Duplicate QR Protection
      const exists = store.orders.some(o => o.garments.some(existingG => existingG.qrCode === qrCode));
      if (exists) throw new Error(`Duplicate QR Code generated: ${qrCode}`);

      const garment: Garment = {
        id, orderId, customerId: 'c1', hubId: 'h1',
        type: g.type, gender: g.gender,
        serviceCharge: service, payoutAmount: payout,
        qrCode,
        stage: 'booked', notes: g.notes,
        measurements: g.measurements,
        createdAt: new Date().toISOString(),
      };
      appendEvent(id, 'GARMENT_CREATED', null, 'booked', 'c1', 'customer', 'h1');
      return garment;
    });

    const order: Order = {
      id: orderId,
      customerId: 'c1',
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      pickupDate: orderData.pickupDate,
      pickupTime: orderData.pickupTime,
      trackingReference: `TRK-${orderId.slice(-6).toUpperCase()}`,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'cod_pending' : 'paid',
      garments,
      totalAmount: garments.reduce((s, g) => s + g.serviceCharge, 0),
      createdAt: new Date().toISOString(),
    };
    store.orders.push(order);
    return order;
  },

  getOrders: async (): Promise<Order[]> => [...store.orders],
  getOrderById: async (id: string): Promise<Order | null> => store.orders.find(o => o.id === id) || null,

  // ── Garments ──────────────────────────────────────────────────────────────
  getAllGarments: async (): Promise<Garment[]> => store.orders.flatMap(o => o.garments),

  getGarmentsByHub: async (hubId: string): Promise<Garment[]> => {
    return store.orders.flatMap(o => o.garments.filter(g => g.hubId === hubId));
  },

  getAuditTrail: async (garmentId: string): Promise<GarmentEvent[]> => {
    return store.events.filter(e => e.garmentId === garmentId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  getGarmentByQR: async (qrCode: string): Promise<Garment | null> => {
    for (const order of store.orders) {
      const g = order.garments.find((g: Garment) => g.qrCode === qrCode);
      if (g) return g;
    }
    return null;
  },

  getQueueForStage: async (stage: string, hubId?: string): Promise<Garment[]> => {
    return store.orders.flatMap(o => o.garments)
      .filter(g => g.stage === stage && (hubId ? g.hubId === hubId : true));
  },

  getGarmentEvents: async (garmentId: string): Promise<GarmentEvent[]> =>
    store.events.filter(e => e.garmentId === garmentId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),

  getAllEvents: async (hubId?: string): Promise<GarmentEvent[]> => {
    let events = store.events;
    if (hubId) events = events.filter(e => e.hubId === hubId);
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // ── Stage transitions ─────────────────────────────────────────────────────
  advanceGarmentStage: async (
    qrCode: string, newStage: GarmentStage,
    performedBy: string, performedByRole: string,
    metadata?: Record<string, any>
  ): Promise<Garment> => {
    for (const order of store.orders) {
      const garment = order.garments.find((g: Garment) => g.qrCode === qrCode);
      if (garment) {
        validateTransition(garment.stage, newStage);
        const prevStage = garment.stage;
        appendEvent(
          garment.id, STAGE_TO_EVENT[newStage] || 'INTAKE',
          prevStage, newStage, performedBy, performedByRole, garment.hubId, metadata
        );
        garment.stage = newStage;

        if (newStage === 'intake') {
          garment.intakeTime = new Date().toISOString();
          garment.slaDeadline = new Date(Date.now() + 24 * 3_600_000).toISOString();
        }

        // Auto-create payout ledger on QC pass (ironing)
        if (newStage === 'ironing' && garment.assignedTailorId) {
          const exists = store.ledger.find(l => l.garmentId === garment.id);
          if (!exists) {
            store.ledger.push({
              id: genId('pl'), garmentId: garment.id, garmentType: garment.type,
              tailorId: garment.assignedTailorId, orderId: garment.orderId,
              amount: garment.payoutAmount, status: 'pending',
              createdAt: new Date().toISOString(),
            });
            const tailor = store.tailors.find(t => t.id === garment.assignedTailorId);
            if (tailor) tailor.pendingBalance += garment.payoutAmount;
          }
        }

        // COD collected on delivery
        if (newStage === 'delivered') {
          const ord = store.orders.find(o => o.id === garment.orderId);
          if (ord && ord.paymentMethod === 'cod') {
            ord.paymentStatus = 'cod_collected';
            appendEvent(garment.id, 'COD_COLLECTED', 'delivered', 'delivered', performedBy, performedByRole, garment.hubId);
          }
        }
        return garment;
      }
    }
    throw new Error(`Garment with QR "${qrCode}" not found`);
  },

  // Legacy alias — used by older screen code
  updateGarmentStage: async (qrCode: string, newStage: GarmentStage): Promise<Garment | null> => {
    try {
      return await MockApi.advanceGarmentStage(qrCode, newStage, 'system', 'system');
    } catch {
      return null;
    }
  },

  getSlaStatus,

  // ── Smart Assignment ──────────────────────────────────────────────────────
  suggestTailorWithScores: (garment: Garment, hubId?: string): TailorScore[] => {
    const targetHub = hubId || garment.hubId;
    return store.tailors
      .filter(t => t.status === 'available' && t.hubId === targetHub)
      .map(t => {
        const genderMatch    = (t.gender === garment.gender || t.gender === 'any') ? 40 : 0;
        const skillMatch     = t.specialisations.some((s: string) =>
          garment.type.toLowerCase().includes(s) || s.includes(garment.type.toLowerCase())
        ) ? 25 : 0;
        const headroom       = t.capacityPerDay - t.assignedToday;
        const capacityScore  = headroom > 0 ? 10 : 0;
        return {
          tailor: t,
          totalScore: genderMatch + skillMatch + capacityScore,
          breakdown: { genderMatch, skillMatch, capacityHeadroom: capacityScore },
          rating: t.rating,
        } as TailorScore;
      })
      .sort((a, b) => b.totalScore - a.totalScore || b.rating - a.rating);
  },

  suggestTailor: (garment: Garment): Tailor[] =>
    MockApi.suggestTailorWithScores(garment).map(s => s.tailor),

  getTailors: async (): Promise<Tailor[]> => [...store.tailors],

  getTailorsByHub: async (hubId: string): Promise<Tailor[]> =>
    store.tailors.filter(t => t.hubId === hubId),

  getTailorById: async (id: string): Promise<Tailor | null> =>
    store.tailors.find(t => t.id === id) || null,

  assignTailor: async (garmentId: string, tailorId: string): Promise<boolean> => {
    for (const order of store.orders) {
      const garment = order.garments.find((g: Garment) => g.id === garmentId);
      if (garment) {
        garment.assignedTailorId = tailorId;
        const tailor = store.tailors.find(t => t.id === tailorId);
        if (tailor) tailor.assignedToday += 1;
        appendEvent(garment.id, 'TAILOR_ASSIGNED', garment.stage, garment.stage, tailorId, 'hub_manager', garment.hubId, { tailorId });
        return true;
      }
    }
    return false;
  },

  // ── Tailor ────────────────────────────────────────────────────────────────
  setTailorStatus: async (tailorId: string, status: 'available'|'busy'|'on-leave'): Promise<void> => {
    const t = store.tailors.find(t => t.id === tailorId);
    if (t) t.status = status;
  },

  // ── Leave ─────────────────────────────────────────────────────────────────
  requestLeave: async (tailorId: string, date: string, reason?: string): Promise<void> => {
    const tailor = store.tailors.find(t => t.id === tailorId);
    store.leaveRequests.push({
      id: genId('lr'), tailorId,
      tailorName: tailor?.name || tailorId,
      date, reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  },

  getLeaveRequests: async (): Promise<LeaveRequest[]> => [...store.leaveRequests],

  updateLeaveRequest: async (reqId: string, status: 'approved'|'rejected'): Promise<void> => {
    const req = store.leaveRequests.find(r => r.id === reqId);
    if (req) {
      req.status = status;
      if (status === 'approved') {
        const tailor = store.tailors.find(t => t.id === req.tailorId);
        if (tailor) tailor.status = 'on-leave';
      }
    }
  },

  // ── QC ────────────────────────────────────────────────────────────────────
  recordQC: async (
    qrCode: string, result: 'pass'|'rework', performedBy: string, reason?: string
  ): Promise<void> => {
    const garment = await MockApi.getGarmentByQR(qrCode);
    if (!garment) throw new Error(`Garment with QR "${qrCode}" not found`);
    const newStage: GarmentStage = result === 'pass' ? 'ironing' : 'rework';
    await MockApi.advanceGarmentStage(qrCode, newStage, performedBy, 'hub_staff', { qcResult: result, reason });
    store.qcRecords.push({
      id: genId('qc'), garmentId: garment.id,
      result, reason, performedBy,
      timestamp: new Date().toISOString(),
    });
  },

  // ── Payout ────────────────────────────────────────────────────────────────
  getPayoutLedger: async (tailorId?: string): Promise<PayoutLedger[]> =>
    tailorId ? store.ledger.filter(l => l.tailorId === tailorId) : [...store.ledger],

  raisePayoutClaim: async (tailorId: string, amount: number, ledgerIds?: string[]): Promise<void> => {
    const tailor = store.tailors.find(t => t.id === tailorId);
    if (!tailor || tailor.pendingBalance <= 0) throw new Error('No pending balance to claim');
    const ids = ledgerIds || store.ledger
      .filter(l => l.tailorId === tailorId && l.status === 'pending')
      .map(l => l.id);
    if (ids.length === 0) throw new Error('No pending garments to claim');
    store.payoutClaims.push({
      id: genId('pc'), tailorId, amount, ledgerIds: ids,
      hubManagerApproval: 'pending', adminApproval: 'pending',
      createdAt: new Date().toISOString(),
    });
    ids.forEach(lid => {
      const entry = store.ledger.find(l => l.id === lid);
      if (entry) entry.status = 'claim_raised';
    });
  },

  getPayoutClaims: async (): Promise<PayoutClaim[]> => [...store.payoutClaims],

  updatePayoutClaim: async (
    claimId: string, level: 'hub'|'admin',
    status: 'approved'|'rejected', transferReference?: string
  ): Promise<void> => {
    const claim = store.payoutClaims.find(c => c.id === claimId);
    if (!claim) return;

    if (level === 'hub') {
      claim.hubManagerApproval = status;
      if (status === 'approved') {
        claim.ledgerIds.forEach((lid: string) => {
          const e = store.ledger.find(l => l.id === lid);
          if (e) e.status = 'manager_approved';
        });
      }
    }
    if (level === 'admin') {
      claim.adminApproval = status;
      if (transferReference) claim.transferReference = transferReference;
      const finalStatus: PayoutStatus = status === 'approved' ? 'paid' : 'rejected';
      claim.ledgerIds.forEach((lid: string) => {
        const e = store.ledger.find(l => l.id === lid);
        if (e) e.status = finalStatus;
      });
      if (status === 'approved') {
        const tailor = store.tailors.find(t => t.id === claim.tailorId);
        if (tailor) {
          tailor.paidBalance += claim.amount;
          tailor.pendingBalance = Math.max(0, tailor.pendingBalance - claim.amount);
        }
      }
    }
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardMetrics: async (hubId?: string) => {
    const all = store.orders.flatMap(o => o.garments)
      .filter(g => hubId ? g.hubId === hubId : true);
    const activeStages = ['intake','cutting','stitching','qc','rework','ironing','packed','dispatched','out_for_delivery'];
    const inProduction = all.filter(g => activeStages.includes(g.stage)).length;

    const today = new Date().toDateString();
    const deliveredToday = all.filter(g => {
      if (g.stage !== 'delivered') return false;
      const ev = store.events.filter(e => e.garmentId === g.id && e.eventType === 'DELIVERED');
      return ev.length > 0 && new Date(ev[ev.length - 1].timestamp).toDateString() === today;
    }).length;

    const atRisk = all.filter(g => {
      const s = getSlaStatus(g.slaDeadline);
      return s.status === 'at_risk' || s.status === 'overdue';
    }).length;

    const pendingClaims = store.payoutClaims.filter(c => c.hubManagerApproval === 'pending').length;
    const codPending = store.orders.filter(o =>
      (hubId ? o.garments.some((g: Garment) => g.hubId === hubId) : true) && o.paymentStatus === 'cod_pending'
    ).length;

    const stageQueues: Record<string, number> = {};
    for (const stage of activeStages) {
      stageQueues[stage] = all.filter(g => g.stage === stage).length;
    }
    return { inProduction, deliveredToday, atRisk, pendingClaims, codPending, stageQueues };
  },

  // ── Measurements ──
  getCustomerSavedMeasurements: async (customerId: string) => {
    // We mocked customerSavedMeasurements inside DemoState, but since DemoState object might not have it exported globally in the same way,
    // let's access it via store.
    return (store as any).customerSavedMeasurements?.[customerId] || {};
  },

  saveCustomerMeasurements: async (customerId: string, type: string, data: Record<string, any>) => {
    if (!(store as any).customerSavedMeasurements) (store as any).customerSavedMeasurements = {};
    if (!(store as any).customerSavedMeasurements[customerId]) (store as any).customerSavedMeasurements[customerId] = {};
    (store as any).customerSavedMeasurements[customerId][type] = data;
  },

  requestClarification: async (garmentId: string, issue: string, message: string, requestedBy: string) => {
    const order = store.orders.find(o => o.garments.some(g => g.id === garmentId));
    if (!order) throw new Error('Order not found');
    const garment = order.garments.find(g => g.id === garmentId);
    if (!garment) throw new Error('Garment not found');

    if (!garment.measurements) {
      garment.measurements = { version: 1, status: 'NOT_PROVIDED', source: 'NEW', data: {} };
    }
    garment.measurements.status = 'NEEDS_CLARIFICATION';
    garment.measurements.clarificationRequest = {
      issue,
      message,
      requestedBy,
      requestedAt: new Date().toISOString()
    };
    appendEvent(garmentId, 'MEASUREMENTS_CLARIFICATION_REQUESTED', garment.stage, garment.stage, requestedBy, 'hub/tailor', garment.hubId);
  },

  submitClarification: async (garmentId: string, data: Record<string, any>, confirmedBy: string) => {
    const order = store.orders.find(o => o.garments.some(g => g.id === garmentId));
    if (!order) throw new Error('Order not found');
    const garment = order.garments.find(g => g.id === garmentId);
    if (!garment) throw new Error('Garment not found');

    if (!garment.measurements) {
      garment.measurements = { version: 0, status: 'NOT_PROVIDED', source: 'CLARIFICATION', data: {} };
    }
    garment.measurements.version += 1;
    garment.measurements.status = 'CONFIRMED';
    garment.measurements.source = 'CLARIFICATION';
    garment.measurements.data = data;
    garment.measurements.confirmedAt = new Date().toISOString();
    garment.measurements.confirmedBy = confirmedBy;
    garment.measurements.clarificationRequest = undefined;
    
    appendEvent(garmentId, 'MEASUREMENTS_CONFIRMED', garment.stage, garment.stage, confirmedBy, 'customer', garment.hubId);
  },
};
