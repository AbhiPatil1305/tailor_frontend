# TAILOR24 ✂️

> **On-Demand Digital Tailoring Platform for Tier-2 & Tier-3 Indian Cities**

Book it. Tag it. Stitch it. Pay it.

---

## Problem

Tailors in small cities manage orders via WhatsApp messages, handwritten registers, and verbal communication.
This causes lost orders, measurement errors, missed SLAs, and opaque payout settlement.

## Solution

TAILOR24 is a full-stack MVP that digitises the complete garment lifecycle from customer booking to tailor payout, with:

- Garment-level QR identity and tracking
- Append-only event log (no status overwrites)
- Smart tailor assignment with explainable scoring
- 24-hour SLA monitoring per garment
- Role-based dashboards for 6 user types
- Two-step payout approval (Manager → Finance)

---

## Technology

| Layer | Technology |
|---|---|
| Mobile / PWA | React Native (Expo ~51) |
| Web target | react-native-web |
| Navigation | React Navigation v6 (Stack) |
| State | React Context + in-memory MockApi |
| TypeScript | Strict mode, 0 errors |
| Bundler | Metro (Expo) |
| QR | Text-based QR codes (camera scan: future) |

---

## Architecture

### Frontend — Feature-based axis

```
src/
├── core/
│   ├── auth/AuthContext.tsx        ← Role + hub context
│   └── navigation/RootNavigator.tsx
├── domain/
│   └── models/types.ts             ← All TypeScript interfaces
├── infrastructure/
│   ├── api/MockApi.ts              ← Business logic layer
│   └── demo/DemoState.ts           ← Seed data factory + reset
└── features/
    ├── auth/screens/LoginScreen.tsx
    ├── customer/screens/CustomerBookingScreen.tsx
    ├── hub/screens/HubManagerDashboard.tsx
    ├── tailor/screens/TailorDashboardScreen.tsx
    ├── rider/screens/RiderDeliveryScreen.tsx
    └── admin/screens/AdminFinanceScreen.tsx
```

Business rules live in `MockApi.ts`, **not** in UI components.
Controllers (screens) only call the API and update display state.

### State Machine

```
booked → intake → cutting → stitching → qc → ironing → packed → dispatched → out_for_delivery → delivered
                                          ↘ rework → stitching
```

Invalid transitions are **rejected by the state machine** at the API layer.

### Main Workflow

```
Book → Intake → QR Tag → Cut → Smart Assign → Stitch → QC → Iron → Pack → Dispatch → Deliver → Pay → Tailor Payout
```

---

## Demo Accounts

| Role | Email | Name |
|---|---|---|
| Customer | customer@tailor24.demo | Ravi Kumar |
| Hub Staff | staff@tailor24.demo | Hub Staff |
| Hub Manager | manager@tailor24.demo | Hub Manager |
| Tailor (Ladies) | lata@tailor24.demo | Lata Sharma |
| Tailor (Gents) | santosh@tailor24.demo | Santosh Kumar |
| Rider | rider@tailor24.demo | Rider |
| Admin / Finance | admin@tailor24.demo | Finance Admin |

> These are development-only demo credentials. No real authentication is implemented in the MVP.

---

## Run Instructions

### Prerequisites

```bash
# Node 18+
node --version

# Watchman (fixes macOS file watcher limit)
brew install watchman
```

### Start (Web — recommended for demo)

```bash
cd tailor_frontend
npx expo start --web
```

Then open: **http://localhost:8081**

### Start (Mobile / Expo Go)

```bash
npx expo start
```

Scan QR with Expo Go app.

### macOS EMFILE Fix

If you still see `EMFILE: too many open files, watch`:

```bash
ulimit -n 10000 && npx expo start --web
```

Or add this to your shell profile:
```bash
echo 'ulimit -n 10000' >> ~/.zshrc && source ~/.zshrc
```

Watchman (installed above) usually eliminates this entirely.

---

## Demo Reset

Before each judge presentation, press **"🔄 Reset Demo Data"** on the Login screen.

This restores:
- 5 tailors across 2 hubs
- 11 garments at every pipeline stage
- Pre-seeded SLA states (safe / warning / at-risk / overdue)
- Pending payout claims
- Leave requests

---

## 2-Minute Judge Walkthrough

| Time | Action | What to Show |
|---|---|---|
| 0:00–0:20 | Login as Customer → Book 2 garments (COD) | Booking form, multiple garments, tracking reference |
| 0:20–0:35 | Login as Hub Staff → Scan Intake QR → Move to Cutting | Garment QR, 24h SLA countdown starts |
| 0:35–0:55 | Login as Hub Manager → Smart Assign Tailor | Score breakdown: +40 Gender, +25 Skill, +10 Capacity |
| 0:55–1:15 | Login as Tailor (Lata) → See assigned garment → Finish → QC | Queue view, SLA badge, one-tap finish |
| 1:15–1:30 | Back to Hub Staff → QC Pass | Both Pass and Rework options visible |
| 1:30–1:40 | Hub Staff → Pack → Dispatch | Pipeline advances |
| 1:40–2:00 | Login as Rider → Start Delivery → OTP 1234 → Deliver | OTP modal, COD status flips to Collected |
| +30 sec | Tailor → Earnings tab → Raise Claim → Manager Approve → Finance Confirm with UTR | Two-step payout trail |

---

## Known Limitations (Hackathon MVP)

| Limitation | Status |
|---|---|
| In-memory only — refresh resets live session | ⚠️ Use Reset button |
| QR camera scanning | Mocked — QR shown as text |
| OTP delivery via SMS | Mocked — hardcoded 1234 |
| GPS / live location | Alert only |
| Online payment gateway | UPI/Card UI only, no processing |
| Push notifications | Not implemented |
| Production backend / database | Not implemented |
| Offline sync | Not implemented |
