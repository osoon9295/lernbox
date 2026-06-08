import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAuthenticatedUserId } from "@/app/lib/auth/session";

// GET /api/review — 오늘 복습할 단어 목록
// dueAt이 현재 시각 이전이거나 null(한 번도 복습 안 한 단어)인 것만 반환
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return auth.error;

  const now = new Date();

  const words = await prisma.word.findMany({
    where: {
      userId: auth.userId,
      OR: [{ dueAt: null }, { dueAt: { lte: now } }],
    },
    orderBy: { dueAt: "asc" },
    select: {
      id: true,
      word: true,
      meaning: true,
      aiAnalysis: true,
      easeFactor: true,
      interval: true,
      repetitions: true,
      dueAt: true,
      lastReviewedAt: true,
    },
  });

  return NextResponse.json({ words });
}
