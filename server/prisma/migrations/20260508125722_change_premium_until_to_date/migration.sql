-- AlterTable
-- Change premiumUntil from TIMESTAMP to DATE
-- This removes the time component, storing only the date
ALTER TABLE "users" ALTER COLUMN "premiumUntil" TYPE DATE;
