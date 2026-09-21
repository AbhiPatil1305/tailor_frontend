/**
 * TAILOR24 — Demo State Engine
 * 
 * Single source of truth for all demo/seed data.
 * Call resetDemoState() at any point to restore the known demo scenario.
 * This module is development/demo only — never exposes production data.
 */

import {
  Order, Garment, Tailor, GarmentEvent, GarmentEventType,
  GarmentStage, LeaveRequest, PayoutClaim, PayoutLedger, Hub, QCRecord
} from '../../domain/models/types';

// ─── Counter ─────────────────────────────────────────────────────────────────
let _eventId = 1;
export const genEventId = () => `evt_${_eventId++}`;
export const genId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ─── Time helpers ─────────────────────────────────────────────────────────────
const now = () => new Date();
export const hoursAgo = (h: number) => new Date(now().getTime() - h * 3_600_000).toISOString();
export const hoursFromNow = (h: number) => new Date(now().getTime() + h * 3_600_000).toISOString();

// ─── Stage → Event ────────────────────────────────────────────────────────────
export const STAGE_TO_EVENT: Record<GarmentStage, GarmentEventType> = {
  booked:           'GARMENT_CREATED',
  intake:           'INTAKE',
  cutting:          'CUTTING_STARTED',
  stitching:        'STITCHING_STARTED',
  qc:               'QC_STARTED',
  rework:           'QC_REWORK',
  ironing:          'IRONING_STARTED',
  packed:           'PACKED',
  dispatched:       'DISPATCHED',
  out_for_delivery: 'OUT_FOR_DELIVERY',
  delivered:        'DELIVERED',
};

// ─── State Machine ────────────────────────────────────────────────────────────
export const VALID_TRANSITIONS: Record<GarmentStage, GarmentStage[]> = {
  booked:           ['intake'],
  intake:           ['cutting'],
  cutting:          ['stitching'],
  stitching:        ['qc'],
  qc:               ['ironing', 'rework'],
  rework:           ['stitching'],
  ironing:          ['packed'],
  packed:           ['dispatched'],
  dispatched:       ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered:        [],
};

export function validateTransition(from: GarmentStage, to: GarmentStage): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new Error(
      `INVALID_TRANSITION: "${from}" → "${to}" is not permitted.\n` +
      `Valid next stages: [${allowed.join(', ') || 'none — terminal stage'}]`
    );
  }
}

// ─── Garment factory ──────────────────────────────────────────────────────────
function makeGarment(opts: {
  id: string; orderId: string; customerId: string; hubId: string;
  type: string; gender: 'ladies'|'gents'|'kids'|'unisex';
  stage: GarmentStage; assignedTailorId?: string;
  intakeHoursAgo?: number;  // undefined = not yet intaked
  notes?: string;
}): Garment {
  const createdAt = hoursAgo((opts.intakeHoursAgo || 0) + 2);
  const intakeTime = opts.intakeHoursAgo !== undefined ? hoursAgo(opts.intakeHoursAgo) : undefined;
  const slaDeadline = intakeTime ? new Date(new Date(intakeTime).getTime() + 24 * 3_600_000).toISOString() : undefined;
  const payout = opts.type === 'Shirt' ? 150 : opts.type === 'Trousers' ? 180 : opts.type === 'Kurta' ? 200 : opts.type === 'Blouse' ? 120 : opts.type === 'Saree' ? 300 : opts.type === 'Dress' ? 250 : 160;
  return {
    id: opts.id, orderId: opts.orderId, customerId: opts.customerId,
    hubId: opts.hubId, type: opts.type, gender: opts.gender,
    serviceCharge: 120, payoutAmount: payout,
    qrCode: `T24-GRM-${opts.id.slice(-4).toUpperCase()}`,
    stage: opts.stage,
    assignedTailorId: opts.assignedTailorId,
    intakeTime, slaDeadline, createdAt,
    measurements: {
      version: 1,
      status: 'CONFIRMED',
      source: 'SAVED',
      data: { Chest: 38, Length: 32 },
      confirmedAt: createdAt,
      confirmedBy: opts.customerId
    },
    notes: opts.notes || '',
  };
}

// ─── Seed event log for a garment up to its current stage ────────────────────
function seedEventsUpTo(garment: Garment, events: GarmentEvent[]): void {
  const stageOrder: GarmentStage[] = [
    'booked','intake','cutting','stitching','qc','ironing','packed','dispatched','out_for_delivery','delivered'
  ];
  const currentIdx = stageOrder.indexOf(garment.stage);
  for (let i = 0; i <= currentIdx; i++) {
    const s = stageOrder[i];
    events.push({
      id: genEventId(),
      garmentId: garment.id,
      eventType: STAGE_TO_EVENT[s],
      previousStage: i === 0 ? null : stageOrder[i - 1],
      newStage: s,
      performedBy: 'seed',
      performedByRole: 'system',
      hubId: garment.hubId,
      timestamp: garment.intakeTime
        ? new Date(new Date(garment.intakeTime).getTime() + i * 3_600_000).toISOString()
        : hoursAgo(10 - i),
    });
  }
}

// ─── DEMO STATE FACTORY ───────────────────────────────────────────────────────
export function buildDemoState() {
  _eventId = 1;

  // ── Hubs ──
  const hubs: Hub[] = [
    { id: 'h1', name: 'Bidar Central Hub', location: 'Bidar, Karnataka', managerId: 'm1' },
    { id: 'h2', name: 'Bengaluru Hub', location: 'Koramangala, Bengaluru', managerId: 'm2' },
  ];

  // ── Tailors ──
  const tailors: Tailor[] = [
    {
      id: 't1', name: 'Lata Sharma', phone: '9876500001',
      gender: 'ladies', specialisations: ['kurti', 'blouse', 'saree', 'dress'],
      capacityPerDay: 20, assignedToday: 3, status: 'available',
      rating: 4.9, earnedBalance: 3500, pendingBalance: 500, paidBalance: 9000, hubId: 'h1',
      location: { lat: 17.9104, lng: 77.5199, updatedAt: hoursAgo(0.5) },
    },
    {
      id: 't2', name: 'Santosh Kumar', phone: '9876500002',
      gender: 'gents', specialisations: ['shirt', 'trousers', 'suit'],
      capacityPerDay: 15, assignedToday: 12, status: 'busy',
      rating: 4.7, earnedBalance: 6200, pendingBalance: 1200, paidBalance: 15000, hubId: 'h1',
    },
    {
      id: 't3', name: 'Asha Patel', phone: '9876500003',
      gender: 'ladies', specialisations: ['dress', 'salwar', 'kurti'],
      capacityPerDay: 18, assignedToday: 8, status: 'available',
      rating: 4.8, earnedBalance: 4400, pendingBalance: 800, paidBalance: 12000, hubId: 'h2',
    },
    {
      id: 't4', name: 'Priya Nair', phone: '9876500004',
      gender: 'ladies', specialisations: ['saree', 'blouse'],
      capacityPerDay: 10, assignedToday: 10, status: 'busy',
      rating: 4.6, earnedBalance: 1900, pendingBalance: 300, paidBalance: 5000, hubId: 'h2',
    },
    {
      id: 't5', name: 'Ravi Meena', phone: '9876500005',
      gender: 'gents', specialisations: ['kurta', 'trousers'],
      capacityPerDay: 12, assignedToday: 0, status: 'on-leave',
      rating: 4.5, earnedBalance: 600, pendingBalance: 0, paidBalance: 3000, hubId: 'h1',
    },
  ];

  // ── Garments at every stage (Priority 7) ──
  // Hub 1 garments
  const g001 = makeGarment({ id: 'g001', orderId: 'ord_001', customerId: 'c1', hubId: 'h1', type: 'Shirt',    gender: 'gents',  stage: 'cutting',          intakeHoursAgo: 4  });
  const g002 = makeGarment({ id: 'g002', orderId: 'ord_001', customerId: 'c1', hubId: 'h1', type: 'Trousers', gender: 'gents',  stage: 'stitching',        assignedTailorId: 't2', intakeHoursAgo: 6  });
  const g003 = makeGarment({ id: 'g003', orderId: 'ord_002', customerId: 'c2', hubId: 'h1', type: 'Kurti',    gender: 'ladies', stage: 'qc',               assignedTailorId: 't1', intakeHoursAgo: 8  });
  const g004 = makeGarment({ id: 'g004', orderId: 'ord_002', customerId: 'c2', hubId: 'h1', type: 'Blouse',   gender: 'ladies', stage: 'ironing',          assignedTailorId: 't1', intakeHoursAgo: 10 });
  const g005 = makeGarment({ id: 'g005', orderId: 'ord_003', customerId: 'c3', hubId: 'h1', type: 'Saree',    gender: 'ladies', stage: 'packed',           assignedTailorId: 't1', intakeHoursAgo: 12 });
  const g006 = makeGarment({ id: 'g006', orderId: 'ord_003', customerId: 'c3', hubId: 'h1', type: 'Kurta',    gender: 'gents',  stage: 'out_for_delivery', assignedTailorId: 't2', intakeHoursAgo: 20 });
  const g007 = makeGarment({ id: 'g007', orderId: 'ord_004', customerId: 'c1', hubId: 'h1', type: 'Suit',     gender: 'gents',  stage: 'delivered',        assignedTailorId: 't2', intakeHoursAgo: 26 });
  // AT_RISK garment — intaked 23h ago, only 1h left on SLA
  const g008 = makeGarment({ id: 'g008', orderId: 'ord_005', customerId: 'c4', hubId: 'h1', type: 'Dress',    gender: 'ladies', stage: 'stitching',        assignedTailorId: 't3', intakeHoursAgo: 23 });
  // OVERDUE garment — intaked 25h ago
  const g009 = makeGarment({ id: 'g009', orderId: 'ord_005', customerId: 'c4', hubId: 'h1', type: 'Salwar',   gender: 'ladies', stage: 'cutting',          intakeHoursAgo: 25 });

  // Hub 2 garments
  const g010 = makeGarment({ id: 'g010', orderId: 'ord_006', customerId: 'c5', hubId: 'h2', type: 'Dress',    gender: 'ladies', stage: 'qc',               assignedTailorId: 't3', intakeHoursAgo: 7 });
  const g011 = makeGarment({ id: 'g011', orderId: 'ord_006', customerId: 'c5', hubId: 'h2', type: 'Kurti',    gender: 'ladies', stage: 'stitching',        assignedTailorId: 't3', intakeHoursAgo: 9 });

  // ── Orders ──
  const orders: Order[] = [
    {
      id: 'ord_001', customerId: 'c1', customerName: 'Ravi Kumar',
      customerPhone: '9000000001', customerAddress: '12, Gandhi Nagar, Bidar',
      pickupDate: 'Tomorrow', pickupTime: '10:00 AM – 12:00 PM', paymentMethod: 'cod', paymentStatus: 'cod_pending',
      totalAmount: 660, trackingReference: 'T24-ORD-1001',
      createdAt: hoursAgo(22), garments: [g001, g002],
    },
    {
      id: 'ord_002', customerId: 'c2', customerName: 'Meena Desai',
      customerPhone: '9000000002', customerAddress: '45, MG Road, Bidar',
      pickupDate: 'Today', pickupTime: '02:00 PM – 04:00 PM', paymentMethod: 'online', paymentStatus: 'paid',
      totalAmount: 360, trackingReference: 'T24-ORD-1002',
      createdAt: hoursAgo(10), garments: [g003, g004],
    },
    {
      id: 'ord_003', customerId: 'c3', customerName: 'Arjun Singh',
      customerPhone: '9000000003', customerAddress: '7, Station Road, Bidar',
      pickupDate: 'Today', pickupTime: '05:00 PM – 07:00 PM', paymentMethod: 'cod', paymentStatus: 'cod_pending',
      totalAmount: 480, trackingReference: 'T24-ORD-1003',
      createdAt: hoursAgo(14), garments: [g005, g006],
    },
    {
      id: 'ord_004', customerId: 'c1', customerName: 'Ravi Kumar',
      customerPhone: '9000000001', customerAddress: '12, Gandhi Nagar, Bidar',
      pickupDate: 'Yesterday', pickupTime: '10:00 AM – 12:00 PM', paymentMethod: 'cod', paymentStatus: 'cod_collected',
      totalAmount: 330, trackingReference: 'T24-ORD-1000',
      createdAt: hoursAgo(28), garments: [g007],
    },
    {
      id: 'ord_005', customerId: 'c4', customerName: 'Sita Devi',
      customerPhone: '9000000004', customerAddress: '88, Old Town, Bidar',
      pickupDate: 'Today', pickupTime: '10:00 AM – 12:00 PM', paymentMethod: 'online', paymentStatus: 'pending',
      totalAmount: 440, trackingReference: 'T24-ORD-1004',
      createdAt: hoursAgo(25), garments: [g008, g009],
    },
    {
      id: 'ord_006', customerId: 'c5', customerName: 'Anjali Rao',
      customerPhone: '9000000005', customerAddress: '22, Indira Nagar, Bengaluru',
      pickupDate: 'Today', pickupTime: '10:00 AM – 12:00 PM', paymentMethod: 'cod', paymentStatus: 'cod_pending',
      totalAmount: 360, trackingReference: 'T24-ORD-1005',
      createdAt: hoursAgo(9), garments: [g010, g011],
    },
  ];

  // ── Event log ──
  const events: GarmentEvent[] = [];
  const allGarments = [g001, g002, g003, g004, g005, g006, g007, g008, g009, g010, g011];
  for (const g of allGarments) seedEventsUpTo(g, events);

  // ── Payout ledger ──
  const ledger: PayoutLedger[] = [
    // Delivered garment — tailor t2 gets paid
    { id: 'pl_001', garmentId: 'g007', garmentType: 'Suit', tailorId: 't2', orderId: 'ord_004', amount: 200, status: 'paid', createdAt: hoursAgo(2) },
    // QC-passed garments — pending claim
    { id: 'pl_002', garmentId: 'g003', garmentType: 'Kurti',  tailorId: 't1', orderId: 'ord_002', amount: 200, status: 'pending',      createdAt: hoursAgo(3) },
    { id: 'pl_003', garmentId: 'g004', garmentType: 'Blouse', tailorId: 't1', orderId: 'ord_002', amount: 120, status: 'claim_raised', createdAt: hoursAgo(3) },
    { id: 'pl_004', garmentId: 'g005', garmentType: 'Saree',  tailorId: 't1', orderId: 'ord_003', amount: 300, status: 'claim_raised', createdAt: hoursAgo(2) },
  ];

  // ── Leave requests ──
  const leaveRequests: LeaveRequest[] = [
    { id: 'lr_001', tailorId: 't5', tailorName: 'Ravi Meena', date: 'Today', reason: 'Medical appointment', status: 'approved', createdAt: hoursAgo(4) },
    { id: 'lr_002', tailorId: 't2', tailorName: 'Santosh Kumar', date: 'Tomorrow', reason: 'Family function', status: 'pending', createdAt: hoursAgo(1) },
  ];

  // ── Payout claims ──
  const payoutClaims: PayoutClaim[] = [
    {
      id: 'pc_001', tailorId: 't1', amount: 620, ledgerIds: ['pl_003', 'pl_004'],
      hubManagerApproval: 'pending', adminApproval: 'pending', createdAt: hoursAgo(1),
    },
    {
      id: 'pc_002', tailorId: 't2', amount: 200, ledgerIds: ['pl_001'],
      hubManagerApproval: 'approved', adminApproval: 'pending', createdAt: hoursAgo(3),
    },
  ];

  // ── Customer Saved Measurements ──
  const customerSavedMeasurements: Record<string, Record<string, any>> = {
    c1: {
      'Shirt': {
        'Chest': 40,
        'Shoulder': 18,
        'Sleeve': 24,
        'Length': 28,
        'Waist': 36
      }
    }
  };

  const qcRecords: QCRecord[] = [];
  return { hubs, tailors, orders, events, ledger, leaveRequests, payoutClaims, qcRecords, customerSavedMeasurements };
}
