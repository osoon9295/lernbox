-- CreateTable
CREATE TABLE "DailyReviewCount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyReviewCount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReviewCount_userId_date_key" ON "DailyReviewCount"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyReviewCount" ADD CONSTRAINT "DailyReviewCount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: 기존 단어의 lastReviewedAt을 UTC 날짜별로 집계해 시드한다.
-- 컬럼이 TIMESTAMP(3)(UTC 저장)이라 date_trunc('day', ...)가 앱의 UTC 날짜 버킷과 일치한다.
-- 단어당 마지막 복습일만 남아있어 과거 정확치는 복원 불가하지만, 현재 그래프 모습을 그대로 이어받는다.
INSERT INTO "DailyReviewCount" ("id", "userId", "date", "count")
SELECT gen_random_uuid(), "userId", date_trunc('day', "lastReviewedAt"), COUNT(*)
FROM "Word"
WHERE "lastReviewedAt" IS NOT NULL
GROUP BY "userId", date_trunc('day', "lastReviewedAt");
