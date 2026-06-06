import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/auth/jwt";

/**
 * API 라우트 핸들러에서 호출해 현재 요청자의 userId를 꺼낸다.
 * 미들웨어는 페이지 라우트만 보호하므로 API 라우트는 직접 검증해야 한다.
 * 검증 실패 시 401 응답을 함께 반환해 호출부에서 즉시 return 할 수 있게 한다.
 */
export async function getAuthenticatedUserId(
  request: NextRequest,
): Promise<{ userId: string; error?: never } | { userId?: never; error: NextResponse }> {
  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    return {
      error: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }),
    };
  }

  try {
    const payload = await verifyToken(token, "access");
    return { userId: payload.userId };
  } catch {
    return {
      error: NextResponse.json(
        { error: "유효하지 않거나 만료된 토큰입니다." },
        { status: 401 },
      ),
    };
  }
}
