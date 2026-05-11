-- CreateTable
CREATE TABLE "question_assignments" (
    "id" TEXT NOT NULL,
    "examSetId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_assignments_examSetId_idx" ON "question_assignments"("examSetId");

-- CreateIndex
CREATE INDEX "question_assignments_questionId_idx" ON "question_assignments"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "question_assignments_examSetId_questionNumber_key" ON "question_assignments"("examSetId", "questionNumber");

-- Migrate existing data
INSERT INTO "question_assignments" ("id", "examSetId", "questionId", "questionNumber", "createdAt")
SELECT 
  gen_random_uuid(),
  "examSetId",
  "id",
  "questionNumber",
  "createdAt"
FROM "questions"
WHERE "examSetId" IS NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "questions_examSetId_questionNumber_key";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "questions_examSetId_fkey";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "examSetId";

-- AddForeignKey
ALTER TABLE "question_assignments" ADD CONSTRAINT "question_assignments_examSetId_fkey" FOREIGN KEY ("examSetId") REFERENCES "exam_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_assignments" ADD CONSTRAINT "question_assignments_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
