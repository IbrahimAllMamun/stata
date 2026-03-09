-- CreateTable
CREATE TABLE "visitor_logs" (
    "id" SERIAL NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "visited_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitor_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visitor_logs_ip_idx" ON "visitor_logs"("ip");

-- CreateIndex
CREATE INDEX "visitor_logs_visited_at_idx" ON "visitor_logs"("visited_at");
