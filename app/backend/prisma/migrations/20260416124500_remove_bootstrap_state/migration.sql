ALTER TABLE "tracked_symbols"
DROP COLUMN IF EXISTS "bootstrap_status",
DROP COLUMN IF EXISTS "bootstrapped_at";
