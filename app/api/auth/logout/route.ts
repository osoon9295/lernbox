import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { clearAuthCookies } from "@/app/lib/auth/cookies";

export async function POST(request: NextRequest) {
  // 쿠키의 리프레시 토큰으로 DB 레코드를 찾아 삭제 → 해당 토큰으로 재발급 불가
  const refreshToken = request.cookies.get("refreshToken")?.value;
  if (refreshToken) {
    await prisma.user.updateMany({
      where: { refreshToken },
      data: { refreshToken: null, refreshTokenExpiresAt: null },
    });
  }

  const response = NextResponse.json({ message: "로그아웃되었습니다." }, { status: 200 });
  clearAuthCookies(response);
  return response;
}
