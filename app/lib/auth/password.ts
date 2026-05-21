import bcrypt from "bcrypt";

/**
 * bcrypt의 cost factor.
 * 값이 1 올라갈 때마다 해싱 속도가 2배 느려진다.
 * 10 ≈ 0.1초, 12 ≈ 0.4초. 보안과 사용성의 균형점으로 12를 선택.
 */
const SALT_ROUNDS = 12;

/**
 * 평문 비밀번호를 bcrypt로 해싱한다.
 * salt는 bcrypt가 자동으로 생성해서 결과 문자열에 포함시킨다.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * 평문 비밀번호가 저장된 해시와 일치하는지 검증한다.
 * 일치하면 true, 아니면 false를 반환한다.
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
