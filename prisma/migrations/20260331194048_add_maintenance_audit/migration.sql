-- CreateTable
CREATE TABLE "MaintenanceAudit" (
    "id" TEXT NOT NULL,
    "maintenanceEntryId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousSnoozedUntil" TIMESTAMP(3),
    "newSnoozedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceAudit_maintenanceEntryId_idx" ON "MaintenanceAudit"("maintenanceEntryId");

-- AddForeignKey
ALTER TABLE "MaintenanceAudit" ADD CONSTRAINT "MaintenanceAudit_maintenanceEntryId_fkey" FOREIGN KEY ("maintenanceEntryId") REFERENCES "MaintenanceEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
