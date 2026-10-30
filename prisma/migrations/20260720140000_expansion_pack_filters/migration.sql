-- Separate the core card pool from thematic expansions.
ALTER TABLE "Card" ADD COLUMN "expansionKey" TEXT NOT NULL DEFAULT 'CORE';
ALTER TABLE "PackType" ADD COLUMN "expansionKey" TEXT;

CREATE INDEX "Card_expansionKey_idx" ON "Card"("expansionKey");
