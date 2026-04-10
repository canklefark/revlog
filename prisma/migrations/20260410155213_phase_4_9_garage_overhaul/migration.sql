-- AlterTable
ALTER TABLE "MaintenanceEntry" ADD COLUMN     "receiptUrl" TEXT;

-- AlterTable
ALTER TABLE "Mod" ADD COLUMN     "receiptUrl" TEXT;

-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "brakeSetId" TEXT,
ADD COLUMN     "setupId" TEXT,
ADD COLUMN     "tireSetId" TEXT;

-- CreateTable
CREATE TABLE "TireSet" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "compound" TEXT,
    "size" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "heatCycles" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TireSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreadDepthLog" (
    "id" TEXT NOT NULL,
    "tireSetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "depth" DOUBLE PRECISION NOT NULL,
    "position" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreadDepthLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrakeSet" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "padBrand" TEXT,
    "padCompound" TEXT,
    "rotorBrand" TEXT,
    "rotorNotes" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "heatCycles" INTEGER NOT NULL DEFAULT 0,
    "wearRemaining" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrakeSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuspensionSetup" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "camberFL" DOUBLE PRECISION,
    "camberFR" DOUBLE PRECISION,
    "camberRL" DOUBLE PRECISION,
    "camberRR" DOUBLE PRECISION,
    "toeFL" DOUBLE PRECISION,
    "toeFR" DOUBLE PRECISION,
    "toeRL" DOUBLE PRECISION,
    "toeRR" DOUBLE PRECISION,
    "casterFL" DOUBLE PRECISION,
    "casterFR" DOUBLE PRECISION,
    "springRateFront" DOUBLE PRECISION,
    "springRateRear" DOUBLE PRECISION,
    "rideHeightFront" DOUBLE PRECISION,
    "rideHeightRear" DOUBLE PRECISION,
    "damperClicksFrontComp" INTEGER,
    "damperClicksFrontReb" INTEGER,
    "damperClicksRearComp" INTEGER,
    "damperClicksRearReb" INTEGER,
    "swayBarFront" TEXT,
    "swayBarRear" TEXT,
    "tirePressureFL" DOUBLE PRECISION,
    "tirePressureFR" DOUBLE PRECISION,
    "tirePressureRL" DOUBLE PRECISION,
    "tirePressureRR" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuspensionSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "vendor" TEXT,
    "description" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TireSet_carId_idx" ON "TireSet"("carId");

-- CreateIndex
CREATE INDEX "TreadDepthLog_tireSetId_idx" ON "TreadDepthLog"("tireSetId");

-- CreateIndex
CREATE INDEX "BrakeSet_carId_idx" ON "BrakeSet"("carId");

-- CreateIndex
CREATE INDEX "SuspensionSetup_carId_idx" ON "SuspensionSetup"("carId");

-- CreateIndex
CREATE INDEX "Expense_carId_idx" ON "Expense"("carId");

-- CreateIndex
CREATE INDEX "Expense_carId_date_idx" ON "Expense"("carId", "date");

-- CreateIndex
CREATE INDEX "Run_tireSetId_idx" ON "Run"("tireSetId");

-- CreateIndex
CREATE INDEX "Run_brakeSetId_idx" ON "Run"("brakeSetId");

-- CreateIndex
CREATE INDEX "Run_setupId_idx" ON "Run"("setupId");

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_brakeSetId_fkey" FOREIGN KEY ("brakeSetId") REFERENCES "BrakeSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "SuspensionSetup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TireSet" ADD CONSTRAINT "TireSet_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreadDepthLog" ADD CONSTRAINT "TreadDepthLog_tireSetId_fkey" FOREIGN KEY ("tireSetId") REFERENCES "TireSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrakeSet" ADD CONSTRAINT "BrakeSet_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspensionSetup" ADD CONSTRAINT "SuspensionSetup_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
