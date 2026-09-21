// ─── Primitive types ────────────────────────────────────────────────────────

export type GarmentStage =
  | 'booked'
  | 'intake'
  | 'cutting'
  | 'stitching'
  | 'qc'
  | 'rework'
  | 'ironing'
  | 'packed'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered';

export type PaymentStatus = 'pending' | 'paid' | 'cod_pending' | 'cod_collected';
export type PaymentMethod = 'online' | 'cod';
export type GenderCategory = 'ladies' | 'gents' | 'kids' | 'unisex';

export type SlaStatus = 'safe' | 'warning' | 'at_risk' | 'overdue';

// ─── Event Log ───────────────────────────────────────────────────────────────

export type GarmentEventType =
  | 'GARMENT_CREATED'
  | 'INTAKE'
  | 'CUTTING_STARTED'
  | 'CUTTING_COMPLETED'
  | 'TAILOR_ASSIGNED'
  | 'STITCHING_STARTED'
  | 'STITCHING_COMPLETED'
  | 'QC_STARTED'
  | 'QC_PASSED'
  | 'QC_REWORK'
  | 'REWORK_COMPLETED'
  | 'IRONING_STARTED'
  | 'IRONING_COMPLETED'
  | 'PACKED'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COD_COLLECTED';

export interface GarmentEvent {
  id: string;
  garmentId: string;
  eventType: GarmentEventType;
  previousStage: GarmentStage | null;
  newStage: GarmentStage;
  performedBy: string;        // userId
  performedByRole: string;    // role label
  hubId: string;
  timestamp: string;          // ISO string
  metadata?: Record<string, any>; // rework reason, OTP, etc.
}

// ─── Garment ─────────────────────────────────────────────────────────────────

export interface Garment {
  id: string;
  orderId: string;
  customerId: string;
  hubId: string;
  type: string;
  gender: GenderCategory;
  measurements?: string;
  notes?: string;
  serviceCharge: number;
  payoutAmount: number;
  qrCode: string;
  // Derived from event log — do NOT write directly
  stage: GarmentStage;
  assignedTailorId?: string;
  // SLA
  intakeTime?: string;        // ISO — set on INTAKE event
  slaDeadline?: string;       // intakeTime + 24h
  createdAt: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  pickupSlot: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  garments: Garment[];
  createdAt: string;
  trackingReference: string;
}

// ─── Tailor ──────────────────────────────────────────────────────────────────

export interface Tailor {
  id: string;
  name: string;
  phone: string;
  gender: GenderCategory | 'any';
  specialisations: string[];
  capacityPerDay: number;
  assignedToday: number;
  status: 'available' | 'busy' | 'on-leave';
  rating: number;
  earnedBalance: number;
  pendingBalance: number;
  paidBalance: number;
  hubId: string;
  location?: { lat: number; lng: number; updatedAt: string };
}

// ─── Tailor Assignment Score ──────────────────────────────────────────────────

export interface TailorScore {
  tailor: Tailor;
  totalScore: number;
  breakdown: {
    genderMatch: number;      // +40 or 0
    skillMatch: number;       // +25 or 0
    capacityHeadroom: number; // +10 or 0
  };
  rating: number;
}

// ─── Leave Request ────────────────────────────────────────────────────────────

export interface LeaveRequest {
  id: string;
  tailorId: string;
  tailorName: string;
  date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// ─── Payout ───────────────────────────────────────────────────────────────────

export type PayoutStatus = 'pending' | 'claim_raised' | 'manager_approved' | 'finance_confirmed' | 'paid' | 'rejected';

export interface PayoutLedger {
  id: string;
  garmentId: string;
  garmentType: string;
  tailorId: string;
  orderId: string;
  amount: number;
  status: PayoutStatus;
  createdAt: string;
}

export interface PayoutClaim {
  id: string;
  tailorId: string;
  amount: number;
  ledgerIds: string[];           // which ledger entries this claim covers
  hubManagerApproval: 'pending' | 'approved' | 'rejected';
  adminApproval: 'pending' | 'approved' | 'rejected';
  transferReference?: string;
  createdAt: string;
}

// ─── Hub ──────────────────────────────────────────────────────────────────────

export interface Hub {
  id: string;
  name: string;
  location: string;
  managerId?: string;
}

// ─── QC Record ───────────────────────────────────────────────────────────────

export interface QCRecord {
  id: string;
  garmentId: string;
  result: 'pass' | 'rework';
  reason?: string;
  performedBy: string;
  timestamp: string;
}
