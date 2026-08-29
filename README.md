# Fruitful Interface (Kiosk POS)

## Overview
The **Fruitful Interface** is a globally-designed, McDonald's-style self-service touchscreen POS system. It is built using **TanStack Start** (SSR) and React 19, optimized for high-performance kiosk environments with a focus on ease of use and rapid transactions: *"Shop local. Pay fast. Grow good."*

## Stack
- **Framework:** TanStack Start (Full-stack React framework with SSR).
- **Frontend:** React 19, Vite, Tailwind CSS 4, Radix UI, Lucide icons.
- **Backend/DB:** Supabase (Database, Auth, Storage, and Edge Functions).
- **Runtimes:** Node.js (v22 recommended for builds) or Bun.
- **Payments:** Paystack Integration (ZAR) with server-side verification.
- **Testing:** Playwright e2e tests for kiosk scroller and responsive layout.

## Key Features
- **Kiosk Journey:** Fully optimized customer flow: Attractor Screen → Browse → Cart → Secure Payment → Success.
- **Live Catalog:** Real-time data synchronization with Supabase for flagship ranges:
  - **Bashedi Kidswear:** Searchable, filterable catalog with full price breakdowns.
  - **SamFox Prints:** Curated art gallery with live stock management.
  - **Grand Machadlela Paintings:** Integration with the Grand paintings collection.
- **Admin Portal:** Secure management interface for:
  - **Order Tracking:** Real-time list of sales with status and provider tracking.
  - **Inventory CRUD:** Product editors with automated price calculators (Cost × Markup × VAT).
  - **Bulk Import:** CSV-based catalog updates for high-volume inventory management.
- **Global Design:** Portrait-first kiosk layout with touch-optimized targets, branded keyframes, and specialized scroll-position memory.
- **Data Tools:** Integrated server-side utilities via API Ninjas (QR/Barcode generation, VAT validation, etc.).

## Getting Started

### Prerequisites
- Bun (recommended) or Node.js (v22+)
- A Supabase Project with the required migrations applied.

### Environment Setup
Configure your `.env` file with the following:
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Payments
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# Utilities
API_NINJAS_KEY=your_api_ninjas_key
```

### Installation
```bash
bun install
```

### Development
```bash
bun run dev
```

## Architecture
The project follows a "Think Global" paradigm, abstracting currency, tax, and payment methods to allow for rapid adaptation to new markets while maintaining a consistent brand experience across all kiosks.

---
*Maintained by Accio Agent for Fruitful Global Planet.*
