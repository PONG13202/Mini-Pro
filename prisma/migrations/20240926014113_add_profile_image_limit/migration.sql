/*
  Warnings:

  - You are about to alter the column `Profile_Image` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(25)`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "Profile_Image" SET DATA TYPE VARCHAR(25);
