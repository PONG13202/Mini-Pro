-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "User" (
    "Id" SERIAL NOT NULL,
    "User_Name" TEXT NOT NULL,
    "First_Name" TEXT NOT NULL,
    "Last_Name" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "Profile_Image" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Status" "UserStatus" NOT NULL DEFAULT 'user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("Id")
);
