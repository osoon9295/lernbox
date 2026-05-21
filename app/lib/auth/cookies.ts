import type { NextResponse } from "next/server";

/**
 * Cookie의 만료 시간 (초 단위).
 * jwt.ts의 만료 시간과 일치시켜야 한다.
 */
const COOKIE_MAX_AGE = {
  access: 60 * 15, // 15분
  refresh: 60 * 60 * 24 * 7, // 7일
} as const;

/**
 * 인증 Cookie의 공통 보안 옵션.
 * - httpOnly: JS에서 접근 불가 → XSS 공격에서 토큰 보호
 * - secure: HTTPS에서만 전송 (개발 환경에선 false로 해제)
 * - sameSite: CSRF 공격 방어. 'lax'면 일반적인 사이트 이동은 허용하되 외부 폼 제출은 차단
 * - path: '/' 전체 경로에서 쿠키 전송
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/**
 * 응답에 Access + Refresh 토큰 쿠키를 설정한다.
 */
export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  response.cookies.set("accessToken", tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: COOKIE_MAX_AGE.access,
  });
  response.cookies.set("refreshToken", tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: COOKIE_MAX_AGE.refresh,
  });
}

/**
 * 응답에서 인증 쿠키를 삭제한다 (로그아웃용).
 */
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
}
