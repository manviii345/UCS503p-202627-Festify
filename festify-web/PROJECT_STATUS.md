# Festify — Project Status & Technical Documentation

Festify is a multi-tenant college fest management web platform featuring interactive vector campus venue maps, event management, atomic capacity-locked registration, signed JWT QR code passes, and gate check-in verification.

---

## 1. Architecture Overview

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Canvas / Three.js (3D Digital Pass), Vite PWA (Offline-ready caching).
- **Backend**: Node.js, Express (TypeScript via `tsx`), JSON Web Tokens (JWT), Role-Based Access Control (`authenticateJWT`, `requireAdmin`).
- **Database & ORM**: SQLite (`dev.db`), Prisma ORM (`@prisma/client` v5.22).
- **Tenant Isolation**: Multi-tenant partitioning where each Fest is owned by an admin `User.id` (`festId` / `createdById`). All admin write routes strictly enforce tenant ownership.
- **Concurrency & Transaction Safety**: Registration endpoint executes inside a serializable `prisma.$transaction` block, ensuring atomic capacity checks and unique constraints so concurrent registrations cannot overbook limited seats.
- **Venue Vector Engine**: Local campus plan rendered using an SVG coordinate system (`1000 × 700` viewBox) with ray-casting point-in-polygon lookup for zone location.

---

## 2. Implemented Modules & Status

| Module | Features & Purpose | API Endpoints | Key Files | Status |
|---|---|---|---|---|
| **Auth & RBAC** | User login, JWT token issuance, role-based access (`ADMIN` vs `STUDENT`). | `POST /api/auth/login` | [server/routes/auth.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/auth.ts)<br/>[server/middleware/auth.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/middleware/auth.ts) | ✅ Working |
| **Event Management** | CRUD operations for fest events with live capacity tracking & remaining seats. | `GET /api/events`<br/>`GET /api/fests/:festId/events`<br/>`GET /api/admin/events`<br/>`POST /api/admin/events`<br/>`PUT /api/admin/events/:id`<br/>`DELETE /api/admin/events/:id` | [server/routes/events.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/events.ts)<br/>[src/components/CreateEventModal.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/CreateEventModal.tsx) | ✅ Working |
| **Interactive Venue Map** | SVG campus map with category filters, pan/zoom, click inspection, locate API (ray-casting point-in-polygon). | `GET /api/fests/:festId/venue`<br/>`POST /api/fests/:festId/venue/zones`<br/>`POST /api/fests/:festId/venue/locate` | [server/routes/venue.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/venue.ts)<br/>[src/components/VenueMap.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/VenueMap.tsx) | ✅ Working |
| **Registration & QR Passes** | Capacity-locked student registration, signed QR JWT pass generation, My Passes tab, and gate check-in validation. | `POST /api/events/:eventId/register`<br/>`GET /api/registrations/my`<br/>`POST /api/registrations/:registrationId/checkin` | [server/routes/events.ts](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/server/routes/events.ts)<br/>[src/components/EventDetailsModal.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/EventDetailsModal.tsx)<br/>[src/components/StudentUserView.tsx](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/src/components/StudentUserView.tsx) | ✅ Working |

---

## 3. Database Schema

Defined in [prisma/schema.prisma](file:///c:/Users/Manvi/OneDrive/Desktop/UCS503p-202627-Festify/festify-web/prisma/schema.prisma):

```prisma
model User {
  id            Int            @id @default(autoincrement())
  username      String         @unique
  password      String
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
  coordinates String                          // JSON string: "[[x1,y1],...]" for zones, "[x,y]" for landmarks
  color       String   @default("#F4C430")
  description String?
  icon        String?
  festId      Int                             // Tenant admin user ID
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

---

## 4. How to Run Locally

1. **Install Dependencies**:
   ```powershell
   npm install
   ```

2. **Sync Database Schema**:
   ```powershell
   npx prisma db push
   ```

3. **Seed Campus Data (Users, Events, 14 Venue Zones)**:
   ```powershell
   npx tsx prisma/seed.ts
   ```

4. **Start Development Application**:
   ```powershell
   npm run dev
   ```
   - Vite Frontend: `http://localhost:5173`
   - Express Backend API: `http://localhost:3000`

---

## 5. How to Test Each Module

### 1. Venue Map Integration Tests
Validates GET venue zones, tenant isolation (403 on cross-tenant zone creation), empty fest return, point-in-polygon locate hits/misses, and unauthorized protection:
```powershell
npx tsx server/venue.test.ts
```
*Expected output: `7 passed, 0 failed`*

### 2. Registration & Concurrency Tests
Validates capacity calculation, concurrent registration capacity locking (`Promise.all` with 1 remaining seat), signed QR token generation, duplicate registration prevention, and gate check-in:
```powershell
npx tsx server/registration.test.ts
```
*Expected output: `7 passed, 0 failed`*

---

## 6. Known Issues / TODOs

1. **PostgreSQL / PostGIS Migration Path**: The current environment runs on SQLite using stringified JSON coordinates and in-memory ray-casting. For production deployment to PostgreSQL with PostGIS, update `schema.prisma` provider to `postgresql` and replace `coordinates` string with PostGIS `GEOMETRY(Geometry, 3857)` column.
2. **Scanner App UI Integration**: The gate check-in API `POST /api/registrations/:id/checkin` is fully working; a dedicated mobile camera QR scanner view can be built for gate stewards in a future iteration.
