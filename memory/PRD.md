# NADI - Navigasi Data Bisnis (PRD)

## Problem Statement
Modern web/mobile responsive prototype for Indonesian UMKM (small businesses) — a smart digital business assistant. Not just POS/bookkeeping: helps owners understand data and make better decisions via simple analytics + AI recommendations.

Tagline: **"Catat transaksi. Pahami data. Ambil keputusan lebih cerdas."**

## Target Users
Warung kopi/kedai, retail/kelontong, kuliner rumahan, pemilik UMKM pemula.

## User Choices (Resolved)
- **AI:** Claude Sonnet 5 via Emergent Universal Key
- **Auth:** JWT custom (email + password)
- **Seed:** Full warung-kopi demo with 30-day transactions
- **Theme:** Modern SaaS — warm stone-50 + Hijau Nusantara (emerald-800) + Emas Warm (amber-600)
- **Language:** Bahasa Indonesia throughout

## Architecture
- **Backend:** FastAPI + MongoDB (Motor). JWT (pyjwt + bcrypt). Emergentintegrations for Claude Sonnet 5. Rule-based fallback insight engine.
- **Frontend:** React 19 + React Router + Recharts + Lucide + Sonner + Tailwind (custom emerald/amber palette). Plus Jakarta Sans + JetBrains Mono for tabular numerics.

## Implemented (Feb 2026)
- ✅ Auth: register/login/me/profile update
- ✅ Products CRUD with HPP + margin + min stock
- ✅ POS Transaksi with cart, QRIS/Tunai/Transfer + receipt modal
- ✅ Transaction history with date filter
- ✅ Dashboard: 4 KPIs, 7-day area chart, low-stock alerts, AI banner, recent transactions
- ✅ Analitik: revenue/profit trend, per-hour, per-day-of-week, category pie, top-10 products; 7/30/90-day toggle
- ✅ NADI Insight: rule-based cards (top product, peak hour/day, low stock, category) + Claude Sonnet 5 AI summary in Bahasa Indonesia
- ✅ Laporan: profit/loss statement, product performance, CSV download, print
- ✅ Profil: business info edit + subscription tier UI (Starter/Growth/Business)
- ✅ Seed endpoint auto-generates 10 products + ~600 transactions across 30 days

## Backlog / Next
- P1: Interactive AI chat on Insight page (streaming)
- P1: PDF report export (server-side)
- P2: Multi-cabang / staff management
- P2: WhatsApp receipt sending via Twilio
- P2: Bundling promo generator from AI insights
