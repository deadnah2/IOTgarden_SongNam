-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('HIGH_TEMPERATURE', 'HIGH_HUMIDITY');

-- AlterTable
ALTER TABLE "Garden" ADD COLUMN     "humidityThreshold" DECIMAL(5,2),
ADD COLUMN     "temperatureThreshold" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "gardenId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "temperature" DECIMAL(5,2),
    "humidity" DECIMAL(5,2),
    "thresholdValue" DECIMAL(5,2),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_gardenId_createdAt_idx" ON "Notification"("gardenId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_gardenId_type_createdAt_idx" ON "Notification"("gardenId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden"("id") ON DELETE CASCADE ON UPDATE CASCADE;
