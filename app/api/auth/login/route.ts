import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/app/lib/prisma";
import { verifyPassword } from "@/app/lib/auth/password";
import { signToken } from "@/app/lib/auth/jwt";
import { setAuthCookies } from "@/app/lib/auth/cookies";
import { loginSchema } from "@/app/lib/auth/schemas";

/**
 * 로그인 실패 시 항상 동일한 메시지를 반환한다.
 * 이메일 존재 여부와 비밀번호 일치 여부를 구분하지 않아,
 * 공격자가 가입된 이메일을 추측할 수 없게 한다 (User Enumeration 방어).
 */
const INVALID_CREDENTIALS_MESSAGE = "이메일 또는 비밀번호가 올바르지 않습니다.";

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디 파싱 + 검증
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // 2. 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json(
        { error: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 },
      );
    }

    // 3. 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: INVALID_CREDENTIALS_MESSAGE },
        { status: 401 },
      );
    }

    // 4. 토큰 발급
    const [accessToken, refreshToken] = await Promise.all([
      signToken({ userId: user.id }, "access"),
      signToken({ userId: user.id }, "refresh"),
    ]);

    // 5. 리프레시 토큰 DB 저장 — 로그아웃/재사용 감지 시 무효화하기 위해
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 6. 응답에 Cookie 설정 (비밀번호는 제외하고 사용자 정보 반환)
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 200 },
    );
    setAuthCookies(response, { accessToken, refreshToken });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "입력값이 올바르지 않습니다.",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    console.error("[login] unexpected error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
