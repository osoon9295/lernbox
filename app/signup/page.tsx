"use client";

import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FieldError {
  field: string;
  message: string;
}

// 서버 스키마와 동일한 규칙 — 제출 전에 클라이언트에서 미리 안내하기 위한 용도
const PASSWORD_RULES = [
  { label: "8자 이상", test: (v: string) => v.length >= 8 },
  { label: "영문자 포함", test: (v: string) => /[A-Za-z]/.test(v) },
  { label: "숫자 포함", test: (v: string) => /[0-9]/.test(v) },
  {
    label: "특수문자 포함",
    test: (v: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v),
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [loading, setLoading] = useState(false);

  function getFieldError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  const allRulesMet = PASSWORD_RULES.every((r) => r.test(password));

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) setFieldErrors(data.details);
        setError(data.error ?? "회원가입에 실패했습니다.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <CardDescription>Lernbox 계정을 만드세요.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!getFieldError("email")}
                required
              />
              {getFieldError("email") && (
                <p className="text-sm text-destructive">
                  {getFieldError("email")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="영문 + 숫자 + 특수문자 8자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!getFieldError("password")}
                required
              />

              {/* 비밀번호를 입력하기 시작하면 즉시 요건 체크리스트 표시 */}
              {password.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {PASSWORD_RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-2 text-xs transition-colors ${
                          met ? "text-green-600" : "text-muted-foreground"
                        }`}
                      >
                        <span className="text-base leading-none">
                          {met ? "✓" : "○"}
                        </span>
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              )}

              {getFieldError("password") && (
                <p className="text-sm text-destructive">
                  {getFieldError("password")}
                </p>
              )}
            </div>

            {error && fieldErrors.length === 0 && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              className="w-full"
              // 모든 규칙을 통과해야 제출 가능 — 서버 왕복 전에 막아서 불필요한 요청 방지
              disabled={loading || !allRulesMet}
            >
              {loading ? "가입 중..." : "회원가입"}
            </Button>
            <p className="text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                로그인
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
