# 📦 Lernbox 프로젝트 기획서
 
> 개인 프로젝트 — 독일어 단어장 + AI 예문 생성 + 간격 반복 복습
> 최종 업데이트: 2026.06.09 (Day 11 완료 — 전체 완성)
 
---
 
## 1. 프로젝트 개요
 
### 컨셉 한 줄
> **회화/실전 수준 학습자가 마주친 단어를, AI가 맥락 있는 예문과 함께 풀어주고, 간격 반복으로 잊지 않게 도와주는 단어장.**
 
### 타겟 사용자
어학연수 경험자 수준 (회화/실전 단계). 초보용 단어장과 차별점은 **맥락 있는 예문과 뉘앙스 설명**.
 
### 왜 이 프로젝트인가
- 본인의 독일 Bochum 어학연수 경험 + 개발자라는 두 정체성을 합친 프로젝트
- "독일어 + 개발 = 본인만의 독특한 조합"으로 다른 지원자와 차별화
- 본인이 직접 쓸 수 있는 도구 → 진정성
 
---
 
## 2. 프로젝트로 배울점
 
| 부족했던 부분 | 어떻게 해결되는지 |
|--------------|-----------------|
| 개인 프로젝트 없음 | Lernbox 완성으로 해결 |
| 테스트 코드 경험 없음 | SRS 알고리즘 + RTL 테스트로 해결 |
| AI 도구 활용 경험 없음 | Claude Code로 개발 + Claude API 활용 |
| CI/CD 실무 경험 없음 | GitHub Actions로 자동화 |
| 혼자 끝까지 만든 경험 없음 | 처음부터 끝까지 본인 설계 |
 
---
 
## 3. 핵심 기능 (MVP)
 
### 1️⃣ 단어 추가 → AI가 자동으로 풀어줌
- 단어 입력 → AI가 자동 생성:
  - 뜻 (한국어/독일어 정의)
  - 품사, 격, 분리동사 등 문법 정보
  - 회화 수준 예문 3개 (B1~B2 난이도)
  - 비슷한 단어와의 뉘앙스 차이
  - 사용자가 입력한 문맥(선택) 반영
- **기술 포인트**: 스트리밍 응답
 
### 2️⃣ 간격 반복 복습 (SRS - Spaced Repetition)
- Anki 알고리즘(SM-2) 기반
- 1일 → 3일 → 7일 → 14일 → 30일 간격
- "기억나요/아니요" 선택으로 다음 복습 날짜 자동 조정
- **기술 포인트**: 비즈니스 로직이라 **테스트 코드 작성하기 가장 좋은 부분**
 
### 3️⃣ 단어장 (목록 보기)
- 추가한 단어들 리스트
- 검색, 필터(미복습/복습완료), 정렬
 
---
 
## 4. 기술 스택 (확정)
 
| 영역 | 기술 |
|------|------|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind + shadcn-ui |
| State | Zustand + TanStack Query |
| DB | Supabase (PostgreSQL) |
| ORM | Prisma 7 (driver adapter 방식) |
| 인증 | 자체 구현 (bcrypt + jose + Cookie + 미들웨어) |
| Validation | Zod |
| AI | Claude API (스트리밍) |
| 배포 | Vercel |
| 테스트 | Jest + RTL |
| CI/CD | GitHub Actions |
| AI 코딩 도구 | Claude Code |
 
---
 
## 5. 진행 상황
 
### ✅ Day 1 (5/19 화) — 셋업
- Claude Code 설치 + Pro 연동 + VS Code 익스텐션
- GitHub 레포 생성 (`lernbox`)
- Next.js + TypeScript + Tailwind 셋업
 
### ✅ Day 2 (5/20 수) — DB 연동
- Prisma 7 + Supabase 연동 (Seoul 리전)
- Prisma 7 호환성 이슈 해결 (`directUrl` deprecated → prisma.config.ts로 이전)
- User 모델 정의 + 첫 마이그레이션 성공
 
### ✅ Day 3 (5/21 목) — 회원가입 API
- bcrypt 비밀번호 해싱 유틸 (cost factor 12)
- jose 기반 JWT 발급/검증 유틸 (Access 15분 / Refresh 7일, 비밀키 이중화)
- Prisma 7 driver adapter 적용 (PrismaPg)
- Zod 입력값 검증 스키마
- HttpOnly + Secure + SameSite Cookie 유틸
- `POST /api/auth/signup` 구현 (중복 체크 + 토큰 발급)
- 5가지 시나리오 테스트 통과
 
### ✅ Day 4 (5/22 금) — 로그인/로그아웃 API
- `POST /api/auth/login` 구현 (User Enumeration 방어)
- `POST /api/auth/logout` 구현 (Cookie 삭제)
- 5가지 시나리오 테스트 통과
 
### ✅ 워밍업 작업 (5/29 목)
- `.env.example` 추가
- `.gitignore` 화이트리스트 패턴 적용 (`.env*` + `!.env.example`)
 
### ✅ Day 4 마무리 (6/5 목) — 인증 미들웨어 + UI
- `middleware.ts` 구현 (Edge Runtime, jose 기반 JWT 검증)
  - 비로그인 → 보호 경로 접근 시 `/login` 리다이렉트
  - 로그인 상태 → `/login`, `/signup` 접근 시 `/dashboard` 리다이렉트
- shadcn-ui 설치 (Tailwind v4 호환, `npx shadcn@latest init`)
- `/login`, `/signup` 페이지 구현 (shadcn Card + Input + Button)
  - 실제 API(`/api/auth/signup`, `/api/auth/login`)와 연결
  - 필드별 Zod 에러 메시지 표시
- 비밀번호 정책 강화: 영문 + 숫자 + 특수문자 필수
- 실시간 비밀번호 요건 체크리스트 (조건 미충족 시 버튼 비활성화)
- Zod v4 API 마이그레이션: `z.string().email()` → `z.email()`
- React 19 타입 마이그레이션: deprecated `FormEvent` → `SyntheticEvent`
- 임시 `/dashboard` 페이지 (리다이렉트 목적지)
- "회원가입 → 로그인 → 보호된 페이지" 전체 흐름 동작 확인 ✓

### ✅ Day 5 (6/6 금) — 단어 CRUD API + 단어장 페이지
- `Word` 모델 추가 (Prisma 스키마) + 마이그레이션 (`20260606_add_word_model`)
  - `userId` 외래키 + `onDelete: Cascade` (유저 삭제 시 단어도 같이 삭제)
- `getAuthenticatedUserId` 헬퍼 추가 (`app/lib/auth/session.ts`)
  - API 라우트마다 토큰 검증 코드 반복 방지
- Zod 스키마 추가: `createWordSchema` / `updateWordSchema` (`.partial()`)
- `GET, POST /api/words` 구현
- `PATCH, DELETE /api/words/[id]` 구현
  - PATCH 선택 이유: `.partial()` 스키마로 부분 수정 지원, AI 필드 추가 시 확장성
  - IDOR 방어: 수정/삭제 전 `word.userId === 요청자 userId` 검증
- 대시보드 페이지 구현: 단어 추가 / 인라인 수정 / 삭제 UI
- Supabase IPv6-only direct connection 이슈 해결 → session mode pooler(5432)를 `DIRECT_URL`로 사용

### ✅ Day 6 (6/7 토) — Claude API 연동 + AI 스트리밍 분석
- `Word` 모델에 `aiAnalysis Json?` / `analyzedAt DateTime?` 필드 추가 + 마이그레이션
- `app/lib/anthropic.ts`: Anthropic 클라이언트 싱글톤 (getEnv로 키 없으면 즉시 에러)
- `POST /api/words/[id]/analyze` 구현
  - IDOR 방어: `word.userId === 요청자 userId` 검증
  - `anthropic.messages.stream()` SSE 스트리밍 → `ReadableStream`으로 클라이언트에 실시간 전송
  - 스트림 완료 후 전체 텍스트를 DB에 저장 (`aiAnalysis`, `analyzedAt`)
  - 프롬프트: B1~B2 수준 학습자용 5섹션 한국어 분석 (뜻/문법/예문3개/뉘앙스/학습팁)
  - 모델: `claude-opus-4-8`
- 대시보드 페이지 업데이트
  - "AI 분석" 버튼 → 스트리밍 실시간 표시 (청크 단위로 화면 갱신)
  - 분석 중 커서 애니메이션 (`animate-pulse`)
  - 저장된 분석은 새로고침 후에도 유지
- Anthropic API 별도 과금 구조 확인 (Claude.ai 구독과 독립)
- curl + Node fetch 기반 E2E 검증: 37청크, 1622자, 18.5초 스트리밍 정상 동작 확인

### ✅ Day 7 (6/8 일) — SRS 알고리즘 + 복습 기능
- `Word` 모델에 SRS 필드 추가 + 마이그레이션
  - `easeFactor Float @default(2.5)` / `interval Int @default(0)` / `repetitions Int @default(0)`
  - `dueAt DateTime?` / `lastReviewedAt DateTime?`
- `app/lib/srs.ts`: SM-2 알고리즘 구현 (순수 함수)
  - grade 0/3/4/5 → interval 성장 (1→6→N×easeFactor), 실패 시 리셋
  - easeFactor 매 복습마다 조정 (최소 1.3 하한)
- `GET /api/review`: `dueAt ≤ 지금` 또는 `null`인 단어 반환
- `POST /api/words/[id]/review`: grade 받아 SM-2 계산 → DB 업데이트 (IDOR 방어 포함)
- `/review` 페이지: 카드 → 답 보기 → 난이도 4단계(다시/어려움/좋음/쉬움) → 다음 카드
  - AI 분석 있으면 답 공개 시 함께 표시, 진행 바 포함
- `/dashboard` → "복습하기" 버튼 추가 (Link)
- 미들웨어 보호 경로에 `/review` 추가
- E2E 검증: grade=4 복습 후 `interval=1, dueAt=내일` 저장, 복습 목록에서 즉시 제거 ✓

### ✅ Day 8 (6/8 일) — SRS 테스트 코드
- Jest + RTL 셋업: `jest`, `jest-environment-jsdom`, `@testing-library/react`, `ts-node`
- `next/jest`로 Jest 설정 (`jest.config.ts`), `jest.setup.ts`로 `jest-dom` 연결
- `app/lib/srs.test.ts` — SM-2 단위 테스트 17개
  - grade별 interval/repetitions 계산, easeFactor 조정, 1.3 하한 보장
  - 연속 성공 시 interval 1→6→15 성장 시뮬레이션
- `app/api/words/[id]/review/route.test.ts` — API 라우트 테스트 8개
  - 정상 제출, 잘못된 grade(400), IDOR 방어(404), 미인증(401), 단어 없음(404)
  - Prisma/auth 모킹으로 DB 없이 라우트 로직만 검증

### ✅ Day 9 (6/8 일) — 컴포넌트 테스트
- `app/review/page.test.tsx` — ReviewPage RTL 컴포넌트 테스트 9개
  - 로딩 중 상태, 빈 상태(단어 없음), 단어 카드 + 진행 표시
  - "답 보기" 클릭 → 뜻/AI분석/난이도 버튼 표시
  - 난이도 클릭 → POST 호출 확인, 다음 카드로 전환
  - 카드 전환 시 뜻 다시 숨겨짐, 마지막 카드 완료 후 완료 화면
- **전체 테스트: 34개 통과** (srs 17 + API 8 + 컴포넌트 9)

### ✅ Day 10 (6/9 월) — GitHub Actions CI + Vercel 배포
- `.github/workflows/ci.yml` 작성
  - 트리거: `main` push / PR
  - Steps: checkout → Node.js 22 → npm ci → prisma generate → tsc --noEmit → npm test
  - `prisma generate` 포함: `app/generated/prisma`는 gitignore라 CI에서 재생성 필요
- `build` 스크립트에 `prisma generate &&` 추가 (Vercel 빌드 시 Prisma 클라이언트 없는 문제 해결)
- Vercel 배포 완료: **https://lernbox.vercel.app**
  - 환경변수 설정: DATABASE_URL, DIRECT_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ANTHROPIC_API_KEY
- 배포 후 E2E 검증 (프로덕션 환경)
  - 회원가입 → 로그인 → 단어 추가 → 복습 제출(grade=4 → interval=1, dueAt=내일) → 복습 목록 비워짐 → 로그아웃 전부 ✅

### ✅ Day 11 (6/9 월) — README 작성 + 프로젝트 완성
- README.md 전면 재작성
  - 프로젝트 배경 및 소개, 주요 기능 표, 기술 스택 표
  - 아키텍처 & 설계 결정 섹션: jose vs jsonwebtoken, Prisma 7 driver adapter, AI 스트리밍 구조, IDOR 방어, SM-2 알고리즘 코드
  - 테스트 전략 표, 로컬 실행 방법, CI/CD 설명
- **프로젝트 완성** — 전체 11일 일정 마무리
 
---
 
## 6. 중요 포인트
 
### 환경 셋업
- `.env*` 광범위 차단 + `!.env.example` 명시적 허용 (deny by default + explicit allow)
- DB connection pooling (6543) vs direct (5432) 용도별 분리
- Prisma 마이그레이션 이력 Git 추적
 
### Prisma 7 적응
- Rust-free 클라이언트 + driver adapter 방식 적용
- 최신 버전 호환성 이슈를 직접 해결한 경험
 
### 인증/보안
- bcrypt cost factor 12 (보안과 사용성의 의도적 트레이드오프)
- jose 선택 이유: Edge Runtime 호환 (jsonwebtoken과의 차이 설명 가능)
- Access/Refresh 토큰 분리 + 비밀키 이중화
- HttpOnly + Secure + SameSite Cookie로 XSS/CSRF 방어
- DB unique + 앱 레벨 중복 체크 (Defense in depth)
- User Enumeration 방어 (로그인 실패 메시지 통일)
- 환경변수 fail-fast 처리
 
### 코드 설계
- 인증 유틸 분리 (password, jwt, cookies) → 재사용성 입증
- Prisma Client 싱글톤 (Hot Reload 환경 대응)
- Zod로 검증 + 타입 추론 일원화
- `Promise.all`로 독립 비동기 병렬화
- 에러 로깅 분리 (내부는 로그, 사용자는 일반화 메시지)
- HTTP 상태 코드 의미적 사용 (201, 400, 401, 409, 500)
 
### 보안 사고 대응
- DB credential 노출 시 즉시 회전(rotation) 대응 경험
- 이후 credential 마스킹 습관 정착
 
### API 설계
- API 라우트는 미들웨어 보호 밖 → 라우트 핸들러 내부에서 직접 토큰 검증
- 반복 로직은 헬퍼로 추출 (`getAuthenticatedUserId`) — 유지보수성
- PUT vs PATCH: 부분 수정(`.partial()`)이 필요할 때는 PATCH, AI 필드 추가 후에도 기존 필드만 보내도 동작
- IDOR(Insecure Direct Object Reference) 방어: 리소스 조회 후 소유자 검증 필수
- Supabase free tier: direct connection은 IPv6 전용 → session pooler(5432)로 대체

### 미들웨어 설계
- Edge Runtime에서 동작 → Node.js 전용 라이브러리 사용 불가
- jose 선택 이유가 여기서도 증명됨 (Web Crypto API 기반이라 Edge 호환)
- 불필요한 JWT 검증 방지: 보호/인증 경로가 아니면 검증 자체를 skip

### 라이브러리 버전 적응
- Zod v4: `z.string().email()` deprecated → `z.email()` 독립 타입으로 분리
- React 19: `FormEvent` deprecated ("doesn't actually exist") → `SyntheticEvent` 사용
- shadcn-ui: Tailwind v4 환경에서 `@import "tailwindcss"` 방식 자동 감지하여 설치
- 클라이언트 검증 규칙을 서버 Zod 스키마와 동일하게 유지 → 불필요한 API 왕복 방지

### Git 협업
- Conventional Commits 적용
- 영어 커밋 메시지 + AI 도구로 표현 다듬는 워크플로우
 
---
 
## 7. 환경 정보
 
- **OS**: macOS (darwin arm64)
- **Node.js**: v22.14.0
- **Prisma**: 7.8.0
- **TypeScript**: 5.9.3
 
 
### 주요 URL
- GitHub: https://github.com/osoon9295/lernbox
- Supabase: lernbox (Northeast Asia - Seoul 리전)
- 배포 (예정): https://lernbox.vercel.app
 
