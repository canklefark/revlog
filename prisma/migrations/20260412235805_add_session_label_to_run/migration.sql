-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "sessionLabel" TEXT;

-- CreateIndex
CREATE INDEX "Run_eventId_sessionLabel_idx" ON "Run"("eventId", "sessionLabel");
