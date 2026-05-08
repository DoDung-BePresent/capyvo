-- CreateTable
CREATE TABLE "public_shares" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "public_shares_responseId_key" ON "public_shares"("responseId");

-- CreateIndex
CREATE INDEX "public_shares_questionId_idx" ON "public_shares"("questionId");

-- CreateIndex
CREATE INDEX "public_shares_createdAt_idx" ON "public_shares"("createdAt");

-- CreateIndex
CREATE INDEX "reactions_shareId_idx" ON "reactions"("shareId");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_shareId_userId_key" ON "reactions"("shareId", "userId");

-- AddForeignKey
ALTER TABLE "public_shares" ADD CONSTRAINT "public_shares_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "user_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_shares" ADD CONSTRAINT "public_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_shares" ADD CONSTRAINT "public_shares_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "public_shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
