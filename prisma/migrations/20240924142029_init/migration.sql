/*
  Warnings:

  - A unique constraint covering the columns `[User_Name]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_User_Name_key" ON "User"("User_Name");
