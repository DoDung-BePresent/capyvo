/*
  Warnings:

  - You are about to drop the column `durationDays` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `isPremium` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `premiumExpiresAt` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "durationDays";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isPremium",
DROP COLUMN "premiumExpiresAt";
