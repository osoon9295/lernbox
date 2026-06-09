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

  return NextResponse.json({ total, reviewedToday, startRate, streak });
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
