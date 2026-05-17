-- CreateEnum
CREATE TYPE "MaintenanceScope" AS ENUM ('GLOBAL', 'PRICING', 'PRACTICE', 'EXAM', 'ADMIN');

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "scope" "MaintenanceScope" NOT NULL DEFAULT 'GLOBAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "maintenance_schedules_scope_idx" ON "maintenance_schedules"("scope");

-- CreateIndex
CREATE INDEX "maintenance_schedules_isActive_idx" ON "maintenance_schedules"("isActive");

-- CreateIndex
CREATE INDEX "maintenance_schedules_scope_isActive_idx" ON "maintenance_schedules"("scope", "isActive");
