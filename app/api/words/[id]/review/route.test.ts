import { NextRequest } from "next/server";
import { POST } from "./route";

// Prisma와 auth를 모킹 — 실제 DB/JWT 없이 라우트 로직만 검증한다.
// (DB 연결이 없는 CI 환경에서도 테스트 가능하게 하기 위함)
jest.mock("@/app/lib/prisma", () => ({
  prisma: {
    word: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    dailyReviewCount: {
      upsert: jest.fn(),
    },
    // 라우트는 [word.update, dailyReviewCount.upsert]를 트랜잭션으로 묶는다.
    // 모킹된 연산들은 이미 resolved 값이므로 Promise.all로 그대로 풀어준다.
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

jest.mock("@/app/lib/auth/session", () => ({
  getAuthenticatedUserId: jest.fn(),
}));

import { prisma } from "@/app/lib/prisma";
import { getAuthenticatedUserId } from "@/app/lib/auth/session";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetAuth = getAuthenticatedUserId as jest.MockedFunction<typeof getAuthenticatedUserId>;

// 테스트용 단어 픽스처
const mockWord = {
  id: "word-1",
  userId: "user-1",
  word: "schadenfreude",
  meaning: "남의 불행에서 기쁨",
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  aiAnalysis: null,
  analyzedAt: null,
  dueAt: null,
  lastReviewedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/words/word-1/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  // 기본: 인증 성공
  mockGetAuth.mockResolvedValue({ userId: "user-1", error: undefined } as any);
  // 기본: 단어 조회 성공
  (mockPrisma.word.findUnique as jest.Mock).mockResolvedValue(mockWord);
  // 기본: 업데이트 성공
  (mockPrisma.word.update as jest.Mock).mockResolvedValue({
    id: "word-1",
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    dueAt: new Date(),
    lastReviewedAt: new Date(),
  });
  // 기본: 일일 복습 카운터 증가 성공
  (mockPrisma.dailyReviewCount.upsert as jest.Mock).mockResolvedValue({
    id: "drc-1",
    userId: "user-1",
    date: new Date(),
    count: 1,
  });
});

describe("POST /api/words/[id]/review", () => {
  test("grade=4 정상 제출 → 200 + SRS 필드 반환", async () => {
    const req = makeRequest({ grade: 4 });
    const res = await POST(req, { params: Promise.resolve({ id: "word-1" }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.word).toHaveProperty("interval");
    expect(body.word).toHaveProperty("repetitions");
    expect(body.word).toHaveProperty("dueAt");
    expect(mockPrisma.word.update).toHaveBeenCalledTimes(1);
  });

  test("정상 복습 → 일일 복습 카운터를 UTC 자정 키로 +1 증가", async () => {
    const req = makeRequest({ grade: 4 });
    await POST(req, { params: Promise.resolve({ id: "word-1" }) });

    expect(mockPrisma.dailyReviewCount.upsert).toHaveBeenCalledTimes(1);
    const upsertArg = (mockPrisma.dailyReviewCount.upsert as jest.Mock).mock
      .calls[0][0];
    // 증가는 DB 레벨 원자적 increment여야 한다
    expect(upsertArg.update).toEqual({ count: { increment: 1 } });
    expect(upsertArg.create).toMatchObject({ userId: "user-1", count: 1 });
    // 날짜 키는 UTC 자정(시:분:초 = 0)으로 정규화되어야 한다
    const dateKey: Date = upsertArg.where.userId_date.date;
    expect(dateKey.getUTCHours()).toBe(0);
    expect(dateKey.getUTCMinutes()).toBe(0);
    expect(dateKey.getUTCSeconds()).toBe(0);
    expect(dateKey.getUTCMilliseconds()).toBe(0);
  });

  test("grade=5(쉬움) → update 호출 시 repetitions=1, interval=1 전달", async () => {
    const req = makeRequest({ grade: 5 });
    await POST(req, { params: Promise.resolve({ id: "word-1" }) });

    const updateCall = (mockPrisma.word.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.repetitions).toBe(1);
    expect(updateCall.data.interval).toBe(1);
  });

  test("grade=0(다시) → repetitions=0으로 리셋 전달", async () => {
    const req = makeRequest({ grade: 0 });
    await POST(req, { params: Promise.resolve({ id: "word-1" }) });

    const updateCall = (mockPrisma.word.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data.repetitions).toBe(0);
  });

  test("잘못된 grade 값(2) → 400", async () => {
    const req = makeRequest({ grade: 2 });
    const res = await POST(req, { params: Promise.resolve({ id: "word-1" }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test("grade 없음 → 400", async () => {
    const req = makeRequest({});
    const res = await POST(req, { params: Promise.resolve({ id: "word-1" }) });

    expect(res.status).toBe(400);
  });

  test("다른 사용자 단어 접근(IDOR) → 404", async () => {
    // 단어는 user-2 소유인데 user-1이 요청
    (mockPrisma.word.findUnique as jest.Mock).mockResolvedValue({
      ...mockWord,
      userId: "user-2",
    });

    const req = makeRequest({ grade: 4 });
    const res = await POST(req, { params: Promise.resolve({ id: "word-1" }) });

    expect(res.status).toBe(404);
    expect(mockPrisma.word.update).not.toHaveBeenCalled();
  });

  test("존재하지 않는 단어 → 404", async () => {
    (mockPrisma.word.findUnique as jest.Mock).mockResolvedValue(null);

    const req = makeRequest({ grade: 4 });
    const res = await POST(req, { params: Promise.resolve({ id: "word-1" }) });

    expect(res.status).toBe(404);
  });

  test("미인증 요청 → auth error 응답 반환", async () => {
    const mockError = new Response(JSON.stringify({ error: "인증이 필요합니다." }), {
      status: 401,
    });
    mockGetAuth.mockResolvedValue({ userId: "", error: mockError } as any);

    const req = makeRequest({ grade: 4 });
    const res = await POST(req, { params: Promise.resolve({ id: "word-1" }) });

    expect(res.status).toBe(401);
    expect(mockPrisma.word.findUnique).not.toHaveBeenCalled();
  });
});
