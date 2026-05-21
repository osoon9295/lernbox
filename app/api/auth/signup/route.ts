import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/app/lib/prisma";
import { hashPassword } from "@/app/lib/auth/password";
import { signToken } from "@/app/lib/auth/jwt";
import { setAuthCookies } from "@/app/lib/auth/cookies";
import { signupSchema } from "@/app/lib/auth/schemas";

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디 파싱 + 검증
    const body = await request.json();
    const { email, password } = signupSchema.parse(body);

    // 2. 중복 이메일 체크
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다." },
        { status: 409 },
      );
    }

    // 3. 비밀번호 해싱 + 유저 생성
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    // 4. 토큰 발급
    const [accessToken, refreshToken] = await Promise.all([
      signToken({ userId: user.id }, "access"),
      signToken({ userId: user.id }, "refresh"),
    ]);

    // 5. 응답에 Cookie 설정
    const response = NextResponse.json({ user }, { status: 201 });
    setAuthCookies(response, { accessToken, refreshToken });

    return response;
  } catch (error) {
    // Zod 검증 실패
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

    // 예상치 못한 에러는 로깅 후 일반화된 메시지 반환
    console.error("[signup] unexpected error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
