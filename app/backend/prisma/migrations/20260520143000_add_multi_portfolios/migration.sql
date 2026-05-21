ALTER TABLE "Portfolio" ADD COLUMN "name" TEXT;
ALTER TABLE "Portfolio" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "Portfolio" ("id", "userId", "name", "isDefault", "cash", "createdAt", "updatedAt")
SELECT
  'portfolio_' || "User"."id",
  "User"."id",
  "User"."username",
  true,
  10000.00,
  NOW(),
  NOW()
FROM "User"
WHERE NOT EXISTS (
  SELECT 1
  FROM "Portfolio"
  WHERE "Portfolio"."userId" = "User"."id"
);

UPDATE "Portfolio"
SET
  "name" = "User"."username",
  "isDefault" = true
FROM "User"
WHERE "Portfolio"."userId" = "User"."id"
  AND "Portfolio"."name" IS NULL;

ALTER TABLE "Portfolio" ALTER COLUMN "name" SET NOT NULL;

ALTER TABLE "User" ADD COLUMN "activePortfolioId" TEXT;

UPDATE "User"
SET "activePortfolioId" = "Portfolio"."id"
FROM "Portfolio"
WHERE "Portfolio"."userId" = "User"."id"
  AND "Portfolio"."isDefault" = true;

ALTER TABLE "PortfolioHolding" ADD COLUMN "portfolioId" TEXT;

UPDATE "PortfolioHolding"
SET "portfolioId" = "Portfolio"."id"
FROM "Portfolio"
WHERE "PortfolioHolding"."userId" = "Portfolio"."userId";

ALTER TABLE "PortfolioHolding" ALTER COLUMN "portfolioId" SET NOT NULL;

ALTER TABLE "Transaction" ADD COLUMN "portfolioId" TEXT;

UPDATE "Transaction"
SET "portfolioId" = "Portfolio"."id"
FROM "Portfolio"
WHERE "Transaction"."userId" = "Portfolio"."userId";

ALTER TABLE "Transaction" ALTER COLUMN "portfolioId" SET NOT NULL;

ALTER TABLE "GroupMember" ADD COLUMN "portfolioId" TEXT;

UPDATE "GroupMember"
SET "portfolioId" = "Portfolio"."id"
FROM "Portfolio"
WHERE "GroupMember"."userId" = "Portfolio"."userId"
  AND "Portfolio"."isDefault" = true;

ALTER TABLE "GroupMember" ALTER COLUMN "portfolioId" SET NOT NULL;

DROP INDEX IF EXISTS "Portfolio_userId_key";
DROP INDEX IF EXISTS "PortfolioHolding_userId_symbol_key";

ALTER TABLE "PortfolioHolding" DROP CONSTRAINT IF EXISTS "PortfolioHolding_userId_fkey";
ALTER TABLE "PortfolioHolding" DROP COLUMN "userId";

CREATE UNIQUE INDEX "Portfolio_userId_name_key" ON "Portfolio"("userId", "name");
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");
CREATE UNIQUE INDEX "PortfolioHolding_portfolioId_symbol_key" ON "PortfolioHolding"("portfolioId", "symbol");
CREATE INDEX "Transaction_portfolioId_idx" ON "Transaction"("portfolioId");
CREATE INDEX "GroupMember_portfolioId_idx" ON "GroupMember"("portfolioId");

ALTER TABLE "User"
ADD CONSTRAINT "User_activePortfolioId_fkey"
FOREIGN KEY ("activePortfolioId") REFERENCES "Portfolio"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PortfolioHolding"
ADD CONSTRAINT "PortfolioHolding_portfolioId_fkey"
FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_portfolioId_fkey"
FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupMember"
ADD CONSTRAINT "GroupMember_portfolioId_fkey"
FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
