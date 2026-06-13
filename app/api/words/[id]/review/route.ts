import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getAuthenticatedUserId } from "@/app/lib/auth/session";
import { calculateNextReview, type Grade } from "@/app/lib/srs";
import { utcDayStart } from "@/app/lib/date";

const reviewSchema = z.object({
  grade: z.union([z.literal(0), z.literal(3), z.literal(4), z.literal(5)]),
});

// POST /api/words/[id]/review — SM-2 알고리즘으로 다음 복습일 계산 후 저장
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  const word = await prisma.word.findUnique({ where: { id } });
  if (!word || word.userId !== auth.userId) {
    return NextResponse.json({ error: "단어를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "grade는 0, 3, 4, 5 중 하나여야 합니다." }, { status: 400 });
  }

  const next = calculateNextReview(
    { easeFactor: word.easeFactor, interval: word.interval, repetitions: word.repetitions },
    parsed.data.grade as Grade,
  );

  // 단어의 SRS 상태 갱신과 "오늘 복습 카운터 +1"을 한 트랜잭션으로 묶는다.
  // 둘은 하나의 복습 이벤트이므로 부분 적용(한쪽만 반영)을 막는다.
  const dayKey = utcDayStart(next.lastReviewedAt);

  const [updated] = await prisma.$transaction([
    prisma.word.update({
      where: { id },
      data: next,
      select: {
        id: true,
        easeFactor: true,
        interval: true,
        repetitions: true,
        dueAt: true,
        lastReviewedAt: true,
      },
    }),
    prisma.dailyReviewCount.upsert({
      where: { userId_date: { userId: auth.userId, date: dayKey } },
      create: { userId: auth.userId, date: dayKey, count: 1 },
      update: { count: { increment: 1 } }, // DB 레벨 원자적 증가
    }),
  ]);

  return NextResponse.json({ word: updated });
}
