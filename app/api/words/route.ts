import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getAuthenticatedUserId } from "@/app/lib/auth/session";
import { createWordSchema } from "@/app/lib/auth/schemas";

// GET /api/words — 로그인한 사용자의 단어 목록 반환
export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return auth.error;

  const words = await prisma.word.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, word: true, meaning: true, createdAt: true },
  });

  return NextResponse.json({ words });
}

// POST /api/words — 새 단어 추가
export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { word, meaning } = createWordSchema.parse(body);

    const created = await prisma.word.create({
      data: { word, meaning, userId: auth.userId },
      select: { id: true, word: true, meaning: true, createdAt: true },
    });

    return NextResponse.json({ word: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "입력값이 올바르지 않습니다.",
          details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        },
        { status: 400 },
      );
    }
    console.error("[POST /api/words]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
