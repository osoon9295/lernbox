# Lernbox

> 독일어 단어를 추가하면 AI가 맥락 있는 예문·뉘앙스와 함께 풀어주고, SM-2 간격 반복 알고리즘으로 복습 일정을 관리해주는 개인 단어장

**배포:** https://lernbox.vercel.app

---

## 프로젝트 소개

독일 Bochum 어학연수 중 마주쳤던 단어들을 기록하고 싶었는데, 기존 단어장 앱은 단순 암기 위주라 뉘앙스나 예문을 따로 찾아야 했습니다.
직접 쓸 도구를 직접 만들었습니다.

**핵심 흐름:**
1. 단어 입력 → Claude AI가 뜻·문법·예문 3개·뉘앙스·학습팁을 스트리밍으로 분석
2. SM-2 알고리즘이 복습 간격을 계산해 오늘 복습할 단어만 노출
3. 복습 후 체감 난이도(다시/어려움/좋음/쉬움) 평가 → 다음 복습일 자동 조정

---

## 주요 기능

| 기능 | 설명 |
|---|---|
| 회원가입 / 로그인 | bcrypt 해싱 + JWT(Access 15분 / Refresh 7일) + HttpOnly Cookie |
| 단어 CRUD | 추가·인라인 수정·삭제, 다른 사용자 단어 접근 차단(IDOR 방어) |
| AI 분석 | Claude Opus 4.8 스트리밍 — 토큰 생성 즉시 화면에 표시, 완료 후 DB 저장 |
| 복습 시스템 | SM-2 알고리즘 기반 SRS — 오늘 복습할 단어만 카드로 노출 |
| 인증 미들웨어 | Edge Runtime에서 JWT 검증, 미인증 접근 시 /login 리다이렉트 |

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| Frontend / Backend | Next.js 16 (App Router) + TypeScript 5 |
| Database | Supabase (PostgreSQL, Seoul 리전) |
| ORM | Prisma 7.8 — driver adapter 방식 (Rust-free) |
| 인증 | bcrypt 6 + jose 6 (JWT) + HttpOnly Cookie |
| AI | Anthropic Claude API (`@anthropic-ai/sdk`) |
| 검증 | Zod 4 |
| UI | Tailwind CSS 4 + shadcn-ui |
| 테스트 | Jest 30 + React Testing Library |
| CI/CD | GitHub Actions + Vercel |

---

## 아키텍처 & 설계 결정

### 인증: jose vs jsonwebtoken

Edge Runtime(미들웨어)에서 JWT를 검증해야 하는데, `jsonwebtoken`은 Node.js `crypto` 모듈에 의존해 Edge에서 동작하지 않습니다. `jose`는 Web Crypto API 기반이라 Edge 호환됩니다.
Access/Refresh 토큰 비밀키를 분리해 Access 키가 유출돼도 Refresh 토큰은 안전합니다.

### Prisma 7 driver adapter

Prisma 7은 Rust 엔진을 제거하고 JS driver adapter 방식으로 전환됐습니다. `PrismaPg`로 직접 pg 드라이버를 주입해 커넥션을 제어합니다.
Supabase의 IPv6-only direct 연결 이슈(마이그레이션용 포트 5432 vs 앱 런타임 pooler 포트 6543)를 직접 해결했습니다.

### AI 스트리밍: ReadableStream

`anthropic.messages.stream()`으로 SSE 이벤트를 받아 `ReadableStream`에 청크 단위로 인코딩해 클라이언트에 즉시 전송합니다.
스트림이 완료된 시점에 전체 텍스트를 DB에 저장하므로 부분 저장 문제가 없습니다.

```
Claude API → content_block_delta 이벤트
  → controller.enqueue(chunk)     ← 클라이언트 실시간 렌더링
  → fullText 누적
스트림 종료 → prisma.word.update({ aiAnalysis: { text: fullText } })
```

### IDOR 방어

수정·삭제·분석·복습 API는 모두 `word.userId === 요청자 userId`를 검증합니다.
타인의 단어 ID를 직접 호출해도 404를 반환해 존재 여부조차 노출하지 않습니다.

### SM-2 알고리즘

Anki가 채택한 SuperMemo 2 알고리즘을 순수 함수로 구현했습니다.

```
grade ≥ 3 (기억함):
  repetitions=0 → interval=1일
  repetitions=1 → interval=6일
  repetitions≥2 → interval = round(interval × easeFactor)
  repetitions += 1

grade < 3 (잊음):
  repetitions=0, interval=1일 (리셋)

easeFactor += 0.1 - (5 - grade) × (0.08 + (5 - grade) × 0.02)
easeFactor = max(easeFactor, 1.3)   // 하한: 너무 낮아지면 복습 간격이 거의 늘지 않음
```

순수 함수라 외부 의존성 없이 17개 단위 테스트로 모든 경계 조건을 검증했습니다.

### 테스트 전략

| 레이어 | 파일 | 방식 |
|---|---|---|
| 알고리즘 단위 | `app/lib/srs.test.ts` | Jest, 순수 함수 — 17케이스 |
| API 라우트 | `app/api/words/[id]/review/route.test.ts` | Jest + Prisma/auth 모킹 — 8케이스 |
| 컴포넌트 | `app/review/page.test.tsx` | RTL + fetch 모킹 — 9케이스 |

API 라우트 테스트는 Prisma와 auth를 모킹해 DB 없는 환경(CI)에서도 라우트 로직만 검증합니다.

---

## 로컬 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env
# .env에 아래 값 입력:
# DATABASE_URL      — Supabase pooler URL (포트 6543)
# DIRECT_URL        — Supabase session mode URL (포트 5432)
# JWT_ACCESS_SECRET
# JWT_REFRESH_SECRET
# ANTHROPIC_API_KEY

# 3. DB 마이그레이션
npx prisma migrate dev

# 4. 개발 서버
npm run dev
```

---

## 테스트

```bash
npm test
```

전체 34개 테스트 통과 (SM-2 단위 17 + API 라우트 8 + 컴포넌트 9)

---

## CI/CD

- **GitHub Actions** — `main` push/PR 시 자동으로 타입 체크 + 테스트 실행
- **Vercel** — `main` push 시 자동 배포

빌드 스크립트에 `prisma generate`를 포함해 Vercel 환경에서 Prisma 클라이언트를 자동 생성합니다.
