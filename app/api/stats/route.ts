import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAuthenticatedUserId } from "@/app/lib/auth/session";
import { utcDayStart } from "@/app/lib/date";

// GET /api/stats — 학습 통계 반환
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return auth.error;

  const words = await prisma.word.findMany({
    where: { userId: auth.userId },
    select: { repetitions: true, lastReviewedAt: true, dueAt: true },
  });

  const now = new Date();

  const total = words.length;
  const started = words.filter((w) => w.repetitions > 0).length;
  const startRate = total > 0 ? Math.round((started / total) * 100) : 0;
  const streak = calcStreak(words.map((w) => w.lastReviewedAt));

  // 복습 대기 단어 수 (dueAt이 null이거나 현재 이전)
  const dueCount = words.filter(
    (w) => w.dueAt === null || w.dueAt <= now,
  ).length;

  // 최근 7일 복습 횟수 — DailyReviewCount에서 정확한 날짜별 카운트를 읽는다.
  // (lastReviewedAt은 단어당 마지막 1건만 남아 같은 단어를 재복습하면 과거 카운트가 줄어드는 문제가 있었음)
  const todayKey = utcDayStart(now);
  const weekStart = new Date(todayKey);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  const dailyRows = await prisma.dailyReviewCount.findMany({
    where: { userId: auth.userId, date: { gte: weekStart } },
    select: { date: true, count: true },
  });
  const countByDay = new Map(dailyRows.map((r) => [toDateStr(r.date), r.count]));

  const weeklyReviews: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayKey);
    d.setUTCDate(d.getUTCDate() - i);
    const key = toDateStr(d);
    weeklyReviews.push({ date: key, count: countByDay.get(key) ?? 0 });
  }

  // "오늘 복습" 카드도 차트의 오늘 막대와 동일한 출처를 쓰도록 통일
  const reviewedToday = countByDay.get(toDateStr(todayKey)) ?? 0;

  return NextResponse.json({ total, reviewedToday, startRate, streak, dueCount, weeklyReviews });
}

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
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
