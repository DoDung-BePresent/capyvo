-- Custom migration to safely change SubscriptionPlanId enum values
-- This migration handles data migration before changing the enum

-- Step 1: Add new enum values to the existing enum type
ALTER TYPE "SubscriptionPlanId" ADD VALUE IF NOT EXISTS 'BASIC';
ALTER TYPE "SubscriptionPlanId" ADD VALUE IF NOT EXISTS 'PREMIUM';
ALTER TYPE "SubscriptionPlanId" ADD VALUE IF NOT EXISTS 'CLASSROOM';

-- Step 2: Migrate existing subscription data
-- Map old values to new values in subscriptions table
UPDATE "subscriptions" 
SET "planId" = CASE 
  WHEN "planId" = 'MONTHLY' THEN 'BASIC'
  WHEN "planId" = 'QUARTERLY' THEN 'PREMIUM'
  WHEN "planId" = 'BIANNUAL' THEN 'PREMIUM'
  ELSE "planId"
END
WHERE "planId" IN ('MONTHLY', 'QUARTERLY', 'BIANNUAL');

-- Step 3: Delete old subscription plan records
-- We'll recreate them with new IDs via seed script
DELETE FROM "subscription_plans" 
WHERE "id" IN ('MONTHLY', 'QUARTERLY', 'BIANNUAL');

-- Step 4: Drop foreign key constraints temporarily
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_planId_fkey";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_subscriptionId_fkey";

-- Step 5: Create new enum type with only the new values
CREATE TYPE "SubscriptionPlanId_new" AS ENUM ('BASIC', 'PREMIUM', 'CLASSROOM');

-- Step 6: Alter tables to use the new enum type
ALTER TABLE "subscription_plans" 
  ALTER COLUMN "id" TYPE "SubscriptionPlanId_new" 
  USING ("id"::text::"SubscriptionPlanId_new");

ALTER TABLE "subscriptions" 
  ALTER COLUMN "planId" TYPE "SubscriptionPlanId_new" 
  USING ("planId"::text::"SubscriptionPlanId_new");

-- Step 7: Drop old enum and rename new one
DROP TYPE "SubscriptionPlanId";
ALTER TYPE "SubscriptionPlanId_new" RENAME TO "SubscriptionPlanId";

-- Step 8: Recreate foreign key constraints
ALTER TABLE "subscriptions" 
  ADD CONSTRAINT "subscriptions_planId_fkey" 
  FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments" 
  ADD CONSTRAINT "payments_subscriptionId_fkey" 
  FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

