-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "carId" TEXT,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "partNumber" TEXT,
    "category" TEXT,
    "description" TEXT,
    "productLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'stock',
    "price" DOUBLE PRECISION,
    "purchaseDate" TIMESTAMP(3),
    "vendor" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "installedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "parts_userId_idx" ON "parts"("userId");

-- CreateIndex
CREATE INDEX "parts_userId_status_idx" ON "parts"("userId", "status");

-- CreateIndex
CREATE INDEX "parts_carId_idx" ON "parts"("carId");

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE SET NULL ON UPDATE CASCADE;
