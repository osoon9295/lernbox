---
paths:
  - "prisma/**"
  - "app/lib/prisma.ts"
  - "prisma.config.ts"
---

# Prisma 7 규칙

Prisma 7은 매우 최신 버전. 학습된 지식이 6.x 기준일 수 있으니 주의.
불확실하면 추측하지 말고 `use context7` (prisma)로 현재 문서 확인.

## 7 버전 핵심 변경점

- **driver adapter 방식** 사용 (`PrismaPg`). Rust 엔진 없는 클라이언트.
- `datasource`의 **`directUrl`은 deprecated** → `prisma.config.ts`로 이전 완료. 되돌리지 말 것.
- Prisma Client는 **싱글톤** (`app/lib/prisma.ts`). Next dev의 Hot Reload에서 커넥션 폭증 방지.

## 커넥션 URL

- 앱 런타임(pooling): 포트 **6543**
- 마이그레이션(direct): 포트 **5432**
- 용도별로 분리되어 있음. 섞지 말 것.

## 마이그레이션

- 스키마 변경 → `npx prisma migrate dev`로 마이그레이션 파일 생성.
- 마이그레이션 이력은 **Git 추적 대상** (커밋에 포함).
- DB 연결 문자열은 출력/로그에서 항상 마스킹.
