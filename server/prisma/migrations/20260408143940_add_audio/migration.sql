-- CreateTable
CREATE TABLE "system_audio" (
    "key" TEXT NOT NULL,
    "audioUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_audio_pkey" PRIMARY KEY ("key")
);
