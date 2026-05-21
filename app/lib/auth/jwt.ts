import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { getEnv } from "@/app/lib/env";

/**
 * JWT에 담을 페이로드 타입.
 * 민감 정보(비밀번호 등)는 절대 넣지 않는다.
 */
export interface AuthTokenPayload extends JWTPayload {
  userId: string;
}

/**
 * 토큰 종류. Access와 Refresh는 서로 다른 비밀키로 서명한다.
 */
type TokenType = "access" | "refresh";

const TOKEN_CONFIG = {
  access: {
    secret: getEnv("JWT_ACCESS_SECRET"),
    expiresIn: "15m",
  },
  refresh: {
    secret: getEnv("JWT_REFRESH_SECRET"),
    expiresIn: "7d",
  },
} as const;

/**
 * 비밀키 문자열을 jose가 요구하는 Uint8Array 형태로 변환.
 * jose는 Web Crypto API 기반이라 바이트 배열을 받는다.
 */
function getSecretKey(type: TokenType): Uint8Array {
  return new TextEncoder().encode(TOKEN_CONFIG[type].secret);
}

/**
 * JWT 토큰을 발급한다.
 */
export async function signToken(
  payload: AuthTokenPayload,
  type: TokenType,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_CONFIG[type].expiresIn)
    .sign(getSecretKey(type));
}

/**
 * JWT 토큰을 검증하고 페이로드를 반환한다.
 * 검증 실패(만료, 위조 등)시 jose가 에러를 던진다.
 */
export async function verifyToken(
  token: string,
  type: TokenType,
): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(type));
  return payload as AuthTokenPayload;
}
