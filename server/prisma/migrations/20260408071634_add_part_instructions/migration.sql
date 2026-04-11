-- CreateTable
CREATE TABLE "part_instructions" (
    "partNumber" INTEGER NOT NULL,
    "audioUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_instructions_pkey" PRIMARY KEY ("partNumber")
);
