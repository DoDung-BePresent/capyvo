-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_examSetId_fkey";

-- AlterTable
ALTER TABLE "questions" ALTER COLUMN "examSetId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_examSetId_fkey" FOREIGN KEY ("examSetId") REFERENCES "exam_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
