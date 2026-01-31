/*
  Warnings:

  - A unique constraint covering the columns `[user_id,domain]` on the table `sites` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "sites_user_id_domain_key" ON "sites"("user_id", "domain");
