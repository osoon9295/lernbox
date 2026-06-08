---
paths:
  - "app/api/auth/**"
  - "app/lib/auth/**"
  - "middleware.ts"
---

# 인증/보안 규칙

이 프로젝트의 인증은 의도적으로 직접 설계함. 아래 결정들은 이유가 있으니 임의로 바꾸지 말 것.

## 토큰 (jose)

- Access 15분 / Refresh 7일. **비밀키 이중화** (access/refresh 서로 다른 키).
- `jsonwebtoken`이 아니라 **`jose`**를 쓰는 이유: 미들웨어가 Edge Runtime에서 도는데
  jose는 Web Crypto API 기반이라 Edge 호환됨. (jsonwebtoken은 Node 전용 crypto 의존)
- 페이로드에 **민감 정보(비밀번호 등) 절대 금지** — JWT는 암호화가 아니라 서명일 뿐, 내용은 누구나 디코딩 가능.

## 비밀번호 (bcrypt)

- cost factor **12** (보안 ↔ 응답속도 트레이드오프를 의도적으로 선택한 값).

## Cookie

- **HttpOnly + Secure + SameSite** 항상. (XSS로 토큰 탈취 방지 + CSRF 완화)

## 방어적 설계 (유지할 것)

- **User Enumeration 방어**: 로그인 실패 시 "이메일 없음"/"비번 틀림" 구분하지 말고 메시지 통일.
- **Defense in depth**: DB unique 제약 + 앱 레벨 중복 체크 둘 다.
- **에러 분리**: 내부 원인은 로그로, 사용자에겐 일반화된 메시지.
- 환경변수는 **fail-fast** (없으면 시작 시점에 에러).
- HTTP 상태코드 의미대로: 201/400/401/409/500.

## 미들웨어

- 미인증 → 보호 페이지 접근 시 `/login` 리다이렉트.
- 인증됨 → `/login`,`/signup` 접근 시 홈/대시보드 리다이렉트.
- 토큰 검증은 기존 `app/lib/auth/jwt.ts`의 `verifyToken` 재사용 (중복 구현 금지).

## 새 인증 코드 작성 시

- 기존 유틸(`password`/`jwt`/`cookies`/`schemas`) 패턴을 따를 것. 새 추상화 임의 도입 금지.
- 미들웨어 API는 Next 16 기준 — 추측 말고 `use context7` (next.js middleware)로 확인.
