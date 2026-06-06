import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getAuthenticatedUserId } from "@/app/lib/auth/session";
import { updateWordSchema } from "@/app/lib/auth/schemas";

// PATCH /api/words/[id] — 단어 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateWordSchema.parse(body);

    // userId 조건을 함께 걸어 다른 사용자의 단어는 수정 불가 (IDOR 방어)
    const existing = await prisma.word.findUnique({ where: { id } });
    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: "단어를 찾을 수 없습니다." }, { status: 404 });
    }

    const updated = await prisma.word.update({
      where: { id },
      data,
      select: { id: true, word: true, meaning: true, createdAt: true },
    });

    return NextResponse.json({ word: updated });
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
    console.error("[PATCH /api/words/:id]", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE /api/words/[id] — 단어 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  const existing = await prisma.word.findUnique({ where: { id } });
  if (!existing || existing.userId !== auth.userId) {
    return NextResponse.json({ error: "단어를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.word.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
