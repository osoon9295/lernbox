/**
 * 환경변수를 안전하게 읽는 헬퍼.
 * 값이 없으면 즉시 에러를 던져서, 서버가 잘못된 상태로 동작하는 걸 방지한다.
 */
export function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경변수 ${key}가 설정되지 않았습니다.`);
  }
  return value;
}
