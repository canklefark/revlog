-- AddColumn frontSize (copy existing size values, then make NOT NULL)
ALTER TABLE "TireSet" ADD COLUMN "frontSize" TEXT;
UPDATE "TireSet" SET "frontSize" = "size";
ALTER TABLE "TireSet" ALTER COLUMN "frontSize" SET NOT NULL;

-- Drop old size column
ALTER TABLE "TireSet" DROP COLUMN "size";

-- Add new optional columns
ALTER TABLE "TireSet" ADD COLUMN "rearSize" TEXT;
ALTER TABLE "TireSet" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "TireSet" ADD COLUMN "dotCode" TEXT;
ALTER TABLE "TireSet" ADD COLUMN "maxHeatCycles" INTEGER;
ALTER TABLE "TireSet" ADD COLUMN "rearCost" DOUBLE PRECISION;
