-- DropIndex
DROP INDEX "topics_name_key";

-- CreateTable
CREATE TABLE "part_instructions" (
    "partNumber" INTEGER NOT NULL,
    "audioUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_instructions_pkey" PRIMARY KEY ("partNumber")
);

-- CreateTable
CREATE TABLE "system_audio" (
    "key" TEXT NOT NULL,
    "audioUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_audio_pkey" PRIMARY KEY ("key")
);
