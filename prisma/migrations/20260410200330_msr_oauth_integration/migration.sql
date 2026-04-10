-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "access_token_secret" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "msrEventId" TEXT;

-- CreateIndex
CREATE INDEX "Event_userId_msrEventId_idx" ON "Event"("userId", "msrEventId");
