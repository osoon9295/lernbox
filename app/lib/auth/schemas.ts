import { z } from "zod";

/**
 * 회원가입 요청 바디 스키마.
 * 검증과 타입 추론을 한 번에 처리한다.
 */
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요.")
    .email("올바른 이메일 형식이 아닙니다."),
  password: z
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
    .max(100, "비밀번호가 너무 깁니다."),
});

/**
 * signupSchema에서 자동 추론된 타입.
 * 별도로 interface 작성 안 해도 됨.
 */
export type SignupInput = z.infer<typeof signupSchema>;

/**
 * 로그인 요청 바디 스키마.
 * 회원가입과 달리 password에 길이 제한을 두지 않는다.
 * 이미 가입된 사용자가 기존 비밀번호로 로그인하는 거라,
 * 회원가입 시점의 정책 변경에 영향받지 않게 한다.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요.")
    .email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export type LoginInput = z.infer<typeof loginSchema>;
