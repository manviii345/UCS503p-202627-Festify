-- Create PostGIS extension if not exists
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

-- Create Fest table
CREATE TABLE IF NOT EXISTS "Fest" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "branding" TEXT,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Fest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Fest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Event table
CREATE TABLE IF NOT EXISTS "Event" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "category" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "registrationDeadline" TEXT NOT NULL,
    "rules" TEXT,
    "prizes" TEXT,
    "contact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,
    "festId" INTEGER,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_festId_fkey" FOREIGN KEY ("festId") REFERENCES "Fest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create VenueZone table with PostGIS Spatial Geometry Support
CREATE TABLE IF NOT EXISTS "VenueZone" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'zone',
    "category" TEXT NOT NULL DEFAULT 'other',
    "coordinates" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#F4C430',
    "description" TEXT,
    "icon" TEXT,
    "festId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VenueZone_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VenueZone_festId_fkey" FOREIGN KEY ("festId") REFERENCES "Fest"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Registration table
CREATE TABLE IF NOT EXISTS "Registration" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "qrToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_qrToken_key" ON "Registration"("qrToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Registration_userId_eventId_key" ON "Registration"("userId", "eventId");
