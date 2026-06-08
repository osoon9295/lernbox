import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getAuthenticatedUserId } from "@/app/lib/auth/session";
import { calculateNextReview, type Grade } from "@/app/lib/srs";

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

  const updated = await prisma.word.update({
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
  });

  return NextResponse.json({ word: updated });
}
