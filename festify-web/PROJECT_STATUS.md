# Festify — Technical Codebase Audit & Project Status Report

*Generated Snapshot Date: September 17, 2026*  
*Target Environment: Node.js / Express / Prisma ORM / SQLite / React / Vite / PWA*

---

## Executive Summary & Runtime Reality

This document provides a strict, evidence-based technical audit of the **Festify** codebase as it actually exists in repository source files and database tables.

- **Verified Running Core**: Interactive 2D Vector Campus Venue Map (SVG engine with ray-casting point-in-polygon locate), Event CRUD & Capacity Tracking, Atomic Concurrency-Safe Student Event Registration (`prisma.$transaction`), Signed JWT QR Code Pass Generation, and Gate Scanner Verification.
- **Partially Implemented**: Authentication & RBAC (Login works, but no User Signup API and plain-text passwords), Multi-Tenancy (scoped on reads/creates, but missing on event update/delete), Organizer Dashboard (real event/map tabs, but overview metrics & attendee table use hardcoded mock data).
- **Not Started / UI Mock Only**: Real-time Crowd Density Telemetry & Gate Hardware Scanning, Push Notifications System.

---

## 1. Module-by-Module Audit

### 1.1 Authentication & RBAC
- **Status**: **PARTIALLY IMPLEMENTED**
- **Files**:
  - Backend: [server/routes/auth.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/auth.ts), [server/middleware/auth.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/middleware/auth.ts)
  - Frontend: [src/components/LoginModal.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/LoginModal.tsx)
- **API Endpoints**:
  - `POST /api/auth/login` (Public)
- **End-to-End Verification**:
  - **Login Flow**: **Working**. `POST /api/auth/login` verifies credentials against the database and signs a JWT token containing `{ id, username, role }`.
  - **JWT Verification**: **Working**. `authenticateJWT` extracts `Authorization: Bearer <token>` and verifies it using `JWT_SECRET`.
  - **RBAC Enforcement**: **Working**. `requireAdmin` checks `req.user.role === 'ADMIN'` and returns `403 Forbidden` for non-admin users on protected admin endpoints.
- **What is Broken / Missing**:
  - ❌ **No User Signup API**: There is NO `POST /api/auth/register` or registration endpoint for new users. Users can only be created by seeding the database via `prisma/seed.ts`.
  - ❌ **Plain Text Passwords**: Passwords are compared directly (`user.password !== password`) without `bcrypt` or Argon2 hashing.
  - ⚠️ **Token Key Mismatch**: `LoginModal.tsx` stores both `festify_token` and `token` in `localStorage`. If `token` is missing or cleared, certain frontend components fallback to unauthenticated state.

---

### 1.2 Multi-Tenancy
- **Status**: **PARTIALLY IMPLEMENTED**
- **Files**:
  - [server/routes/venue.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/venue.ts)
  - [server/routes/events.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/events.ts)
- **API Endpoints**:
  - `GET /api/fests/:festId/venue` (Tenant-scoped)
  - `POST /api/fests/:festId/venue/zones` (Tenant isolation enforced)
  - `GET /api/fests/:festId/events` (Tenant-scoped)
- **End-to-End Verification**:
  - Multi-tenancy is modeled implicitly by assigning an admin user ID (`festId` / `createdById`) to events and venue zones.
  - `POST /api/fests/:festId/venue/zones` checks `if (req.user!.id !== festId)` and rejects cross-tenant writes with `403 Forbidden`.
  - Verified by integration tests in `server/venue.test.ts`.
- **What is Broken / Missing**:
  - ❌ **No Dedicated `Fest` Entity**: Fests do not exist as a table in the database; festId is simply an alias for an admin `User.id`.
  - ⚠️ **Cross-Tenant Event Mutation Vulnerability**: In `server/routes/events.ts`, `PUT /api/admin/events/:id` and `DELETE /api/admin/events/:id` update/delete events by primary key without checking if `event.createdById === req.user.id`. Any logged-in admin can edit or delete events owned by another admin.

---

### 1.3 Fest & Event Management
- **Status**: **IMPLEMENTED**
- **Files**:
  - Backend: [server/routes/events.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/events.ts)
  - Frontend: [src/components/CreateEventModal.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/CreateEventModal.tsx), [src/components/EventDetailsModal.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/EventDetailsModal.tsx)
- **API Endpoints**:
  - `GET /api/events` (Public event list with live `registeredCount` and `remainingSeats`)
  - `GET /api/fests/:festId/events` (Public tenant event list)
  - `GET /api/admin/events` (Admin event list)
  - `POST /api/admin/events` (Admin create event)
  - `PUT /api/admin/events/:id` (Admin update event)
  - `DELETE /api/admin/events/:id` (Admin delete event)
- **End-to-End Verification**:
  - **Working**. Events can be listed, created, updated, and deleted. Live capacity calculation computes `remainingSeats = Math.max(0, maxParticipants - registeredCount)`. Frontend modals render rules, deadlines, prizes, and seat availability.

---

### 1.4 Registration & QR Passes
- **Status**: **IMPLEMENTED**
- **Files**:
  - Backend: [server/routes/events.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/events.ts)
  - Tests: [server/registration.test.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/registration.test.ts)
  - Frontend: [src/components/StudentUserView.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/StudentUserView.tsx), [src/components/EventDetailsModal.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/EventDetailsModal.tsx)
- **API Endpoints**:
  - `POST /api/events/:eventId/register` (Protected student registration)
  - `GET /api/registrations/my` (Protected student pass listing)
  - `POST /api/registrations/:registrationId/checkin` (Protected gate check-in)
- **End-to-End Verification**:
  - **Atomic Transaction Safety**: Registration is executed inside a `prisma.$transaction` block to guarantee atomic capacity checks and prevent race conditions when registration occurs for the last remaining seat. Verified by automated concurrency tests firing simultaneous requests (`7/7` tests passing in `server/registration.test.ts`).
  - **Signed QR Token**: Issues JWT encoding `{ userId, eventId, registrationId, issuedAt }`.
  - **Frontend Rendering**: `StudentUserView.tsx` features a "My Passes" tab rendering scannable QR codes generated via `qrcode`.
  - **Gate Check-in**: `POST /registrations/:id/checkin` verifies JWT token signatures and updates status to `CHECKED_IN`.

---

### 1.5 Interactive Venue Map
- **Status**: **IMPLEMENTED**
- **Files**:
  - Backend: [server/routes/venue.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/venue.ts)
  - Tests: [server/venue.test.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/venue.test.ts)
  - Frontend: [src/components/VenueMap.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/VenueMap.tsx)
- **API Endpoints**:
  - `GET /api/fests/:festId/venue` (Public venue zone array)
  - `POST /api/fests/:festId/venue/zones` (Admin zone creation)
  - `POST /api/fests/:festId/venue/locate` (Point-in-polygon & landmark radius lookup)
- **End-to-End Verification**:
  - **Working**. Renders a vector campus layout inside an SVG canvas (`1000 × 700` viewBox).
  - Features pan/zoom controls, category filter chips (Stages, Food, Gates, Parking, Restrooms, First Aid, Info), click-to-inspect side panel, and ray-casting point-in-polygon locate lookup.
  - Automatically seeds default campus layout if the database table is empty (`7/7` tests passing in `server/venue.test.ts`).

---

### 1.6 Organizer Dashboard
- **Status**: **PARTIALLY IMPLEMENTED**
- **Files**:
  - [src/components/AdminDashboardView.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/AdminDashboardView.tsx)
- **What is Working**:
  - Sidebar tab navigation between Overview, Events, Registrations, Scanner, and Venue Map.
  - **Event Management Tab**: Connected to `/api/admin/events` backend API (lists, creates, updates, deletes events).
  - **Venue Map Tab**: Embeds live `<VenueMap>` connected to `/api/fests/:festId/venue`.
- **What is UI Mock / Broken**:
  - ❌ **Overview Metric Cards**: Metrics such as *Total Revenue ($42.8k)*, *Total Tickets (1,280)*, *Active Events (4)*, and *Live Attendees (842)* are hardcoded static values in JSX.
  - ❌ **Registrations Table Tab**: Displays a static, hardcoded array `INITIAL_REGISTRATIONS` (`Aarav Kapoor`, `Riya Desai`, etc.) instead of querying real rows from the `Registration` database table.

---

### 1.7 Notifications System
- **Status**: **NOT STARTED AT ALL (UI MOCK ONLY)**
- **Files**:
  - [src/components/AdminDashboardView.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/AdminDashboardView.tsx#L515)
- **Reality**:
  - There is NO database table for notifications, NO push notification service integration (Web Push API / Firebase Cloud Messaging), and NO WebSocket/SSE streaming endpoint.
  - Clicking "Dispatch Alert" in the modal simply executes `confetti({ particleCount: 30 })` in the browser and closes the modal dialog.

---

### 1.8 Crowd Density & Gate Telemetry Module
- **Status**: **NOT STARTED AT ALL (UI MOCK ONLY)**
- **Files**:
  - [src/three/GateScannerCanvas.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/three/GateScannerCanvas.tsx)
- **Reality**:
  - There is NO real-time density monitoring, NO Bluetooth/beacon telemetry, NO heatmaps, and NO camera QR scanning hardware hook.
  - The "3D Gate Scanner" tab renders a static 3D canvas animation (`GateScannerCanvas.tsx`) with a manual "Simulate Scan" button that increments a local React state counter.

---

## 2. Database Schema (Current SQLite Instance)

Extracted directly from [prisma/schema.prisma](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/prisma/schema.prisma):

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            Int            @id @default(autoincrement())
  username      String         @unique
  password      String         // Plain text string (unhashed)
  role          String         // 'ADMIN' or 'STUDENT'
  events        Event[]
  registrations Registration[]
}

model Event {
  id                   Int            @id @default(autoincrement())
  name                 String
  description          String
  image                String?
  category             String
  date                 String
  startTime            String
  endTime              String
  venue                String
  maxParticipants      Int
  registrationDeadline String
  rules                String?
  prizes               String?
  contact              String?
  status               String         @default("Upcoming")
  createdAt            DateTime       @default(now())

  createdById          Int
  createdBy            User           @relation(fields: [createdById], references: [id])
  registrations        Registration[]
}

model VenueZone {
  id          Int      @id @default(autoincrement())
  name        String
  type        String   @default("zone")       // "zone" | "landmark"
  category    String   @default("other")      // "stage" | "food" | "gate" | "restroom" | "parking" | etc.
  coordinates String                          // JSON string: "[[x1,y1],...]" or "[x,y]"
  color       String   @default("#F4C430")
  description String?
  icon        String?
  festId      Int                             // Admin User.id (Tenant ID)
  createdAt   DateTime @default(now())
}

model Registration {
  id          Int       @id @default(autoincrement())
  userId      Int
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId     Int
  event       Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  qrToken     String    @unique
  status      String    @default("REGISTERED") // "REGISTERED" | "CHECKED_IN" | "CANCELLED"
  checkedInAt DateTime?
  createdAt   DateTime  @default(now())

  @@unique([userId, eventId])
}
```

### Schema Drift & Planned vs. Existing Analysis:
- ❌ **No `Fest` Table**: Planned multi-tenant `Fest` model does not exist. Fests are mapped to admin `User.id`.
- ❌ **No PostGIS Spatial Columns**: Planned PostgreSQL PostGIS `GEOMETRY` column is running on SQLite stringified JSON arrays.
- ❌ **No `Notification` Table**: Missing entirely.
- ❌ **No `GateLog` / `CrowdDensity` Table**: Missing entirely.

---

## 3. What Currently Runs vs. Code / UI Mocks

| Feature / Code Path | Actually Runs & Verified? | Verification Evidence |
|---|---|---|
| **User Login (`/api/auth/login`)** | ✅ **Runs** | Tested via cURL & LoginModal component |
| **Event CRUD (`/api/admin/events`)** | ✅ **Runs** | Tested via Admin Dashboard & CreateEventModal |
| **Event Capacity & Remaining Seats** | ✅ **Runs** | Dynamically computed on `GET /events` |
| **Atomic Concurrency Registration** | ✅ **Runs** | Verified by 7/7 tests in `registration.test.ts` |
| **Signed QR Ticket Issuance & Render** | ✅ **Runs** | JWT signed & rendered via `qrcode` in Student View |
| **Gate Check-in Validation** | ✅ **Runs** | Verified by `POST /registrations/:id/checkin` |
| **Interactive Vector Venue Map** | ✅ **Runs** | Verified by 7/7 tests in `venue.test.ts` |
| **Ray-Casting Point-in-Polygon Locate** | ✅ **Runs** | Tested via `POST /venue/locate` & UI button |
| **User Signup / Registration API** | ❌ **UI Mock / Missing** | No API endpoint exists |
| **Password Hashing (`bcrypt`)** | ❌ **Missing** | Passwords stored as plain text |
| **Cross-Tenant Event Write Protection** | ❌ **Vulnerable** | `PUT/DELETE /admin/events/:id` missing tenant check |
| **Admin Registrations Table** | ❌ **UI Mock** | Renders static `INITIAL_REGISTRATIONS` array |
| **Emergency Broadcast Alert** | ❌ **UI Mock** | Triggers confetti animation only |
| **3D Gate Scanner Hardware Scanning** | ❌ **UI Mock** | Manual button & Three.js animation only |
