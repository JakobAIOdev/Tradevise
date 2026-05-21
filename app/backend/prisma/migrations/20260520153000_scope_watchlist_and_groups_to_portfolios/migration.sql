ALTER TABLE "watchlist_items" ADD COLUMN IF NOT EXISTS "portfolioId" TEXT;

UPDATE "watchlist_items"
SET "portfolioId" = COALESCE(
  (
    SELECT "Portfolio"."id"
    FROM "Portfolio"
    WHERE "Portfolio"."userId" = "watchlist_items"."userId"
      AND "Portfolio"."isDefault" = true
    ORDER BY "Portfolio"."createdAt" ASC
    LIMIT 1
  ),
  (
    SELECT "User"."activePortfolioId"
    FROM "User"
    WHERE "User"."id" = "watchlist_items"."userId"
  ),
  (
    SELECT "Portfolio"."id"
    FROM "Portfolio"
    WHERE "Portfolio"."userId" = "watchlist_items"."userId"
    ORDER BY "Portfolio"."createdAt" ASC
    LIMIT 1
  )
)
WHERE "watchlist_items"."portfolioId" IS NULL;

DELETE FROM "watchlist_items"
WHERE "portfolioId" IS NULL;

ALTER TABLE "watchlist_items" ALTER COLUMN "portfolioId" SET NOT NULL;

DROP INDEX IF EXISTS "GroupMember_groupId_userId_key";
DROP INDEX IF EXISTS "watchlist_items_userId_symbol_key";

ALTER TABLE "watchlist_items" DROP CONSTRAINT IF EXISTS "watchlist_items_userId_fkey";
ALTER TABLE "watchlist_items" DROP COLUMN "userId";

CREATE UNIQUE INDEX "GroupMember_groupId_portfolioId_key" ON "GroupMember"("groupId", "portfolioId");
CREATE UNIQUE INDEX "watchlist_items_portfolioId_symbol_key" ON "watchlist_items"("portfolioId", "symbol");

ALTER TABLE "watchlist_items"
ADD CONSTRAINT "watchlist_items_portfolioId_fkey"
FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
