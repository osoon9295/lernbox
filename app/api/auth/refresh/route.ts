import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyToken, signToken } from "@/app/lib/auth/jwt";
import { setAuthCookies } from "@/app/lib/auth/cookies";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refreshToken")?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "리프레시 토큰이 없습니다." }, { status: 401 });
  }

  try {
    // 1. JWT 서명·만료 검증
    const payload = await verifyToken(refreshToken, "refresh");

    // 2. DB에서 토큰 존재 여부 확인 — 로그아웃 또는 재사용 감지 시 없을 수 있음
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, refreshToken: true },
    });

    if (!user || user.refreshToken !== refreshToken) {
      // 이미 사용된 토큰이 다시 들어오면 탈취 가능성 → 모든 세션 강제 무효화
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null, refreshTokenExpiresAt: null },
        });
      }
      return NextResponse.json({ error: "유효하지 않은 리프레시 토큰입니다." }, { status: 401 });
    }

    // 3. 새 토큰 쌍 발급 (Refresh Token Rotation — 매 갱신마다 새 토큰 발행)
    const [newAccessToken, newRefreshToken] = await Promise.all([
      signToken({ userId: user.id }, "access"),
      signToken({ userId: user.id }, "refresh"),
    ]);

    // 4. DB에 새 리프레시 토큰으로 교체
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 5. 새 쿠키 설정
    const response = NextResponse.json({ ok: true }, { status: 200 });
    setAuthCookies(response, { accessToken: newAccessToken, refreshToken: newRefreshToken });
    return response;
  } catch {
    return NextResponse.json(
      { error: "리프레시 토큰이 만료되었거나 유효하지 않습니다." },
      { status: 401 },
    );
  }
}
