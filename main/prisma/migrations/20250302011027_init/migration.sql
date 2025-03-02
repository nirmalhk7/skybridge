-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Fundraiser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "pitch" TEXT NOT NULL,
    CONSTRAINT "Fundraiser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sponsorer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    CONSTRAINT "Sponsorer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fundraiserId" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    CONSTRAINT "Opportunity_fundraiserId_fkey" FOREIGN KEY ("fundraiserId") REFERENCES "Fundraiser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_FundraiserTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_FundraiserTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Fundraiser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FundraiserTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_SponsorerTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SponsorerTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Sponsorer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SponsorerTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_OpportunityTags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_OpportunityTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Opportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_OpportunityTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fundraiser_userId_key" ON "Fundraiser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsorer_userId_key" ON "Sponsorer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_FundraiserTags_AB_unique" ON "_FundraiserTags"("A", "B");

-- CreateIndex
CREATE INDEX "_FundraiserTags_B_index" ON "_FundraiserTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SponsorerTags_AB_unique" ON "_SponsorerTags"("A", "B");

-- CreateIndex
CREATE INDEX "_SponsorerTags_B_index" ON "_SponsorerTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_OpportunityTags_AB_unique" ON "_OpportunityTags"("A", "B");

-- CreateIndex
CREATE INDEX "_OpportunityTags_B_index" ON "_OpportunityTags"("B");
