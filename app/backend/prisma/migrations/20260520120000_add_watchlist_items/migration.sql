CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchlist_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "watchlist_items_userId_symbol_key" ON "watchlist_items"("userId", "symbol");
CREATE INDEX "watchlist_items_symbol_idx" ON "watchlist_items"("symbol");

ALTER TABLE "watchlist_items"
ADD CONSTRAINT "watchlist_items_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
