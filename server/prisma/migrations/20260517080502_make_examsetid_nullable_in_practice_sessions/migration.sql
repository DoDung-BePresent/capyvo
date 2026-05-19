-- DropForeignKey
ALTER TABLE "practice_sessions" DROP CONSTRAINT "practice_sessions_examSetId_fkey";

-- AlterTable
ALTER TABLE "practice_sessions" ALTER COLUMN "examSetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_examSetId_fkey" FOREIGN KEY ("examSetId") REFERENCES "exam_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
