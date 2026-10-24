# Xidaa Discount Calculator & Commercial Quotation Engine

> **"RIDE THE ELECTRIC THUNDER"** — Official Commercial Discount, Freight Logistics & B2B Settlement Calculation Engine for **Xidaa Moto Pvt. Ltd.**

A full-stack, enterprise-grade automotive calculation and quotation application built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Supabase PostgreSQL (RLS)**, and **Vitest**.

---

## ⚡ Core Capabilities & Architecture

### 1. Touch-Friendly Fast Quantity Selectors
- **Keyboard-Free Operation**: Eliminates the requirement to open a mobile virtual keyboard for routine order entry.
- **Tactile Steppers**: Large, accessible `−` and `+` buttons for quick incremental adjustments.
- **Automotive Preset Trays**: Tapping the count badge opens a quick-preset drawer with standard truck-friendly numbers: `0`, `1`, `2`, `5`, `10`, `12` (1 small truck), `15`, `20`, `24` (2 trucks), `25`, `32` (1 large truck), `50`, `55` (1 max truck), `100`.
- **Bulk Fleet Option**: "Custom Large Quantity (>100)..." option for massive distributor consignments.
- Applied uniformly across **scooter model entries** and **battery line items**.

### 2. Automatic Discount Recommendation Engine
- Automatically evaluates and compares all permitted commercial settlement strategies:
  1. **Option A: Scooty/Battery Discount**: Approved discount applied strictly to vehicle invoice; ₹0 company transport support; customer pays 100% freight.
  2. **Option B: Transport Support (50%)**: Company absorbs 50% of the final transport cost; ₹0 vehicle invoice discount.
  3. **Option C: No Discount / Baseline**: Zero company support; customer pays full invoice and full freight.
- **Smart Profit Protection**: Automatically identifies the strategy yielding the highest corporate profit while checking configured minimum margin requirements.
- **One-Click Apply**: Direct 1-tap activation of the recommended strategy onto the active order.
- Embedded in both **Step 3 (Review & Calculate)** and the **Results Screen**.

### 3. Strict 5-Step Transport Freight Formula
- **Step 1**: $\text{Base Transport} = \text{Distance (km)} \times \text{Applicable Truck Rate}$
  - 12-Scooter Truck: ₹40 / km
  - 32-Scooter Truck: ₹55 / km
  - 55-Scooter Truck: ₹65 / km
- **Step 2**: $\text{Additional 10\% Surcharge} = \text{Base Transport} \times 0.10$
- **Step 3**: $\text{Transport Subtotal} = \text{Base Transport} + \text{Surcharge}$
- **Step 4**: $\text{Transport GST (5\%)} = \text{Transport Subtotal} \times 0.05$
- **Step 5**: $\text{Final Transport Payable} = \text{Transport Subtotal} + \text{GST} = \text{Base} \times 1.10 \times 1.05$
- **Per-Scooty Metric**: Displays actual freight cost per delivered vehicle ($\text{Final Freight} \div \text{Total Scooters}$).

### 4. Supabase Permanent Data Store & Row Level Security (RLS)
- Permanent cloud persistence backed by Supabase PostgreSQL.
- **Database Schema**:
  - `profiles`: User roles (`admin`, `manager`, `sales_rep`), force-change password flag.
  - `customers`: Dealership and partner registry.
  - `orders`: Core order header with automatic order reference.
  - `order_scooter_items`: Model-wise quantities and prices.
  - `order_battery_items`: Variant-wise battery quantities and allowances.
  - `transport_allocations`: Fleet truck allocation records.
  - `calculation_snapshots`: Complete, immutable JSON financial snapshot.
  - `discount_recommendations`: Recommended strategy and rationale.
  - `app_settings`: Global discount rates and transport parameters.
  - `audit_history`: Financial change and security logs.
- **Row Level Security (RLS)**: Anonymous public access is denied. Authenticated commercial staff can read/write orders, while Admins/Managers control settings and deletions.
- **Fail-Safe Integrity**: Failed saves trigger explicit error notices (`saveError`), ensuring users are never misled into believing an unsaved order was persisted.
- **Local-to-Cloud Migration**: One-click "Sync to Cloud" button in Order History safely migrates pre-existing local orders to Supabase.

### 5. Secure Authentication & Role-Based Access Control (RBAC)
- **Login Screen**: Styled with official Xidaa branding, racing-red accents, show/hide password, session persistence, and demo credential filler for offline testing.
- **Forced Password Change**: Forces administrators and users to change temporary passwords on their first login.
- **Server-Side Admin Setup**: Secure provisioning script (`scripts/setup-admin.mjs`) provisions initial admins using server environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). Privileged secrets are never embedded in React code.

### 6. Typeset A4 Portrait PDF Export
- Tailored specifically for `@media print` with zero layout distortion.
- Official Xidaa header, Indian tricolour precision line, itemized scooter & battery tables, 11-point financial settlement table, automatic recommendation strategy summary, triple signature blocks, and the compliance footer: `Internal Calculation / Subject to Approval — Not a Tax Invoice`.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Lucide Icons + Canvas Confetti
- **Backend / Database**: Supabase (PostgreSQL + RLS + GoTrue Auth)
- **Testing**: Vitest (`npm test`) + Oxlint (`npm run lint`) + Selenium WebDriver E2E
- **Arithmetic**: Pure integer-paise calculations preventing floating-point rounding errors.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Apply Supabase Database Migration
In your **Supabase Dashboard $\to$ SQL Editor**, execute:
`supabase/migrations/20261023_init_xidaa_schema.sql`

### 4. Provision Initial Administrator (Server-Side)
```bash
SUPABASE_URL="https://your-project-id.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-secret-key" \
ADMIN_EMAIL="admin@xidaamoto.com" \
ADMIN_PASSWORD="TemporarySecurePassword#2026" \
node scripts/setup-admin.mjs
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Run Automated Tests & Linter
```bash
npm test -- --run
npm run lint
```

### 7. Production Build
```bash
npm run build
```

---

## 🔒 Confidentiality & Brand Compliance
*Designed exclusively for Xidaa Moto Pvt. Ltd. internal B2B commercial authorization.*
