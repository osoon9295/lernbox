# Lernbox

독일어 단어장 — AI가 단어를 맥락 있는 예문/뉘앙스와 함께 풀어주고, 간격 반복(SRS)으로 복습시키는 개인 학습 도구.
어학연수 수준(B1~B2) 학습자 타깃. 만든 사람이 직접 쓰는 도구.

## Stack (버전 주의)

- **Next.js 16** (App Router) + **TypeScript 5.9**
- **Prisma 7.8** (driver adapter 방식, Rust-free 클라이언트)
- **Supabase** (PostgreSQL, Seoul 리전)
- 인증: 자체 구현 — `bcrypt` + `jose`(JWT) + HttpOnly Cookie + 미들웨어
- 검증: `zod` / 상태: `zustand` + `@tanstack/react-query` / UI: Tailwind + shadcn-ui
- AI: Claude API (스트리밍) / 테스트: Jest + RTL / 배포: Vercel

> Next 16, Prisma 7은 매우 최신이라 학습된 지식과 API가 다를 수 있음.
> 라이브러리 사용법은 추측하지 말고 Context7(`use context7`)로 현재 문서를 확인할 것.

## Commands

```bash
npm run dev        # 개발 서버
npm test           # Jest + RTL
npx prisma migrate dev    # 마이그레이션 생성/적용
npx prisma studio         # DB GUI
```

## Layout

```
app/api/auth/{signup,login,logout}/route.ts   # 인증 API
app/lib/auth/{password,jwt,cookies,schemas}.ts # 인증 유틸 (관심사 분리)
app/lib/{env,prisma}.ts                         # 환경변수 로더 / Prisma 싱글톤
prisma/schema.prisma                            # DB 스키마
```

## 항상 지킬 것

- 커밋: **Conventional Commits, 영어**로 작성 (feat:, fix:, refactor: ...)
- **시크릿 절대 커밋 금지.** DB 연결 문자열·키는 로그/출력에서 마스킹.
- 새 코드는 항상 **설명과 함께** 제시 — "왜 이렇게 했는지" 한 줄씩. (내가 이해하고 면접에서 말할 수 있어야 함)
- 큰 변경 전엔 먼저 계획을 말하고 확인받기.

> 인증/보안 상세 규칙은 인증 파일을 건드릴 때 자동 로드됨 (`.claude/rules/auth-security.md`).
> Prisma 7 상세 규칙은 prisma 파일을 건드릴 때 자동 로드됨 (`.claude/rules/prisma.md`).
