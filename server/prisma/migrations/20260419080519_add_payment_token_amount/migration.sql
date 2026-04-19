-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "tokenAmount" INTEGER,
ALTER COLUMN "durationDays" DROP NOT NULL,
ALTER COLUMN "durationDays" DROP DEFAULT;
