/*
  Warnings:

  - You are about to drop the column `festId` on the `CrowdSnapshot` table. All the data in the column will be lost.
  - You are about to drop the column `festId` on the `GateLog` table. All the data in the column will be lost.
  - Added the required column `adminId` to the `CrowdSnapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `GateLog` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CrowdSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "adminId" INTEGER NOT NULL,
    "zoneId" INTEGER,
    "count" INTEGER NOT NULL,
    "takenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrowdSnapshot_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "VenueZone" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CrowdSnapshot" ("count", "id", "takenAt", "zoneId") SELECT "count", "id", "takenAt", "zoneId" FROM "CrowdSnapshot";
DROP TABLE "CrowdSnapshot";
ALTER TABLE "new_CrowdSnapshot" RENAME TO "CrowdSnapshot";
CREATE TABLE "new_GateLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "registrationId" INTEGER NOT NULL,
    "zoneId" INTEGER,
    "adminId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GateLog_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GateLog_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "VenueZone" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GateLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GateLog" ("eventId", "id", "registrationId", "scannedAt", "zoneId") SELECT "eventId", "id", "registrationId", "scannedAt", "zoneId" FROM "GateLog";
DROP TABLE "GateLog";
ALTER TABLE "new_GateLog" RENAME TO "GateLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
