-- AlterTable: Add partNumber column to topics table
ALTER TABLE "topics" ADD COLUMN "partNumber" INTEGER;

-- Update existing topics to have partNumber = 1 (default)
UPDATE "topics" SET "partNumber" = 1 WHERE "partNumber" IS NULL;

-- Make partNumber NOT NULL
ALTER TABLE "topics" ALTER COLUMN "partNumber" SET NOT NULL;

-- Drop old unique constraint on name
ALTER TABLE "topics" DROP CONSTRAINT IF EXISTS "topics_name_key";

-- Create new unique constraint on (name, partNumber)
ALTER TABLE "topics" ADD CONSTRAINT "topics_name_partNumber_key" UNIQUE ("name", "partNumber");

-- Drop SystemAudio table if exists
DROP TABLE IF EXISTS "system_audio" CASCADE;

-- Drop PartInstruction table if exists
DROP TABLE IF EXISTS "part_instructions" CASCADE;
