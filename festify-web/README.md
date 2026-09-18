# Festify Web — College Fest Management Platform

Festify is a full-stack, offline-capable college event management platform built for **Aurora Fest 2026**. It features a modern 3D interactive user interface, real-time ticket generation, offline PWA access, interactive venue mapping, and a multi-tenant administration portal.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **Animations & 3D**: Framer Motion + Three.js (`@react-three/fiber` & `@react-three/drei`)
- **PWA & Offline**: `vite-plugin-pwa` + Web Workers + LocalStorage Caching

### Backend & Database
- **Server**: Express.js (Node.js) + TypeScript
- **ORM**: Prisma ORM
- **Database**: SQLite
- **Security & Auth**: JWT Authentication, bcryptjs Password Hashing, RBAC Middleware

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 2. Installation
```bash
# Navigate into web workspace
cd festify-web

# Install dependencies
npm install

# Initialize Prisma Database & Seed Data
npx prisma db push
npx prisma db seed
```

### 3. Development Server
Run the full-stack development environment (Vite Frontend + Express Backend concurrently):
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

---

## 🧪 Running Integration Tests

Festify features complete integration test suites testing authentication, event security, QR pass check-in concurrency, and venue map spatial queries:

```bash
# Run Auth & JWT Security Tests
npm run test:auth

# Run Multi-tenant Event Security Tests
npm run test:events

# Run QR Pass & Concurrency Tests
npm run test:registration

# Run Spatial Venue Map Tests
npm run test:venue
```

---

## 📦 Production Build

```bash
# Type check and build Vite bundle
npm run build
```

The compiled assets will be output to the `dist/` directory.

---

## 📂 Project Architecture

```
festify-web/
├── src/
│   ├── components/         # React UI components (Hero, AdminDashboard, StudentUserView, VenueMap)
│   ├── three/              # Three.js 3D WebGL Canvas models (GateScanner, RubberStamp)
│   ├── App.tsx             # Main view router & global state
│   ├── index.css           # Global Tailwind directives & custom CSS variables
│   ├── main.tsx            # Application entry point
│   ├── mockData.ts         # Static data & feature configurations
│   └── types.ts            # Shared TypeScript interfaces
├── server/
│   ├── middleware/         # Express auth & RBAC middleware
│   ├── routes/             # REST API route handlers (auth, events, venue)
│   ├── tests/              # Automated integration test suites
│   └── index.ts            # Express server entry point
├── prisma/
│   ├── schema.prisma       # Database schema & models
│   ├── seed.ts             # Default campus & user seed data
│   └── dev.db              # SQLite local database
├── public/                 # PWA icons & manifest assets
└── package.json
```

---

## 📄 License

Developed for UCS503P Project (2026-27). All rights reserved.
