/*
  Warnings:

  - You are about to drop the `PenaltyDefault` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PenaltyDefault" DROP CONSTRAINT "PenaltyDefault_userId_fkey";

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "isDnf" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "PenaltyDefault";

-- CreateIndex
CREATE INDEX "Event_userId_startDate_idx" ON "Event"("userId", "startDate");

-- CreateIndex
CREATE INDEX "Event_userId_type_idx" ON "Event"("userId", "type");

-- CreateIndex
CREATE INDEX "MaintenanceEntry_carId_idx" ON "MaintenanceEntry"("carId");

-- CreateIndex
CREATE INDEX "Mod_carId_idx" ON "Mod"("carId");

-- CreateIndex
CREATE INDEX "Run_eventId_idx" ON "Run"("eventId");

-- CreateIndex
CREATE INDEX "Run_carId_idx" ON "Run"("carId");

-- CreateIndex
CREATE INDEX "WishlistItem_carId_idx" ON "WishlistItem"("carId");
