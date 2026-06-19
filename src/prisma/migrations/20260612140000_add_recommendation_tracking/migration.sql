CREATE TABLE "product_view" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_view_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "search_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "keyword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_view_userId_productId_createdAt_idx"
ON "product_view"("userId", "productId", "createdAt");

CREATE INDEX "product_view_sessionId_productId_createdAt_idx"
ON "product_view"("sessionId", "productId", "createdAt");

CREATE INDEX "product_view_createdAt_idx"
ON "product_view"("createdAt");

CREATE INDEX "search_history_userId_createdAt_idx"
ON "search_history"("userId", "createdAt");

CREATE INDEX "search_history_sessionId_createdAt_idx"
ON "search_history"("sessionId", "createdAt");

CREATE INDEX "search_history_createdAt_idx"
ON "search_history"("createdAt");

ALTER TABLE "product_view"
ADD CONSTRAINT "product_view_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_view"
ADD CONSTRAINT "product_view_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "product"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "search_history"
ADD CONSTRAINT "search_history_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
