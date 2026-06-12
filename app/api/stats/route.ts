import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAuthenticatedUserId } from "@/app/lib/auth/session";

// GET /api/stats — 학습 통계 반환
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return auth.error;

  const words = await prisma.word.findMany({
    where: { userId: auth.userId },
    select: { repetitions: true, lastReviewedAt: true, dueAt: true },
  });

  const now = new Date();
  const todayStr = toDateStr(now);

  const total = words.length;
  const reviewedToday = words.filter(
    (w) => w.lastReviewedAt && toDateStr(w.lastReviewedAt) === todayStr,
  ).length;
  const started = words.filter((w) => w.repetitions > 0).length;
  const startRate = total > 0 ? Math.round((started / total) * 100) : 0;
  const streak = calcStreak(words.map((w) => w.lastReviewedAt));

  // 복습 대기 단어 수 (dueAt이 null이거나 현재 이전)
  const dueCount = words.filter(
    (w) => w.dueAt === null || w.dueAt <= now,
  ).length;

  // 최근 7일 날짜별 복습 단어 수 (lastReviewedAt 기준)
  const weeklyReviews = calcWeeklyReviews(words.map((w) => w.lastReviewedAt), now);

  return NextResponse.json({ total, reviewedToday, startRate, streak, dueCount, weeklyReviews });
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

// 오늘 포함 7일간 날짜 배열을 만들고, 각 날에 lastReviewedAt이 해당하는 단어 수를 집계
function calcWeeklyReviews(
  dates: (Date | null)[],
  now: Date,
): { date: string; count: number }[] {
  const counts: Record<string, number> = {};

  // 7일치 날짜 키를 0으로 초기화 (데이터 없는 날도 표시)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    counts[toDateStr(d)] = 0;
  }

  for (const d of dates) {
    if (!d) continue;
    const key = toDateStr(d);
    if (key in counts) counts[key]++;
  }

  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

// lastReviewedAt 날짜 목록에서 오늘 기준 연속 학습일 계산
// 오늘 또는 어제부터 거슬러 올라가며 연속된 날 수를 셈
function calcStreak(dates: (Date | null)[]): number {
  const uniqueDays = new Set(
    dates.filter((d): d is Date => d !== null).map(toDateStr),
  );

  if (uniqueDays.size === 0) return 0;

  const today = new Date();
  let streak = 0;
  const cursor = new Date(today);

  // 오늘 복습이 없으면 어제부터 체크 (당일 복습 전이어도 streak 유지)
  if (!uniqueDays.has(toDateStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!uniqueDays.has(toDateStr(cursor))) return 0;
  }

  while (uniqueDays.has(toDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
