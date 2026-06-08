import { calculateNextReview } from "./srs";

// 테스트용 기본 상태 (단어 추가 직후)
const fresh = { easeFactor: 2.5, interval: 0, repetitions: 0 };

describe("calculateNextReview — 첫 복습", () => {
  test("grade=5(쉬움): interval=1, repetitions=1", () => {
    const result = calculateNextReview(fresh, 5);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  test("grade=4(좋음): interval=1, repetitions=1", () => {
    const result = calculateNextReview(fresh, 4);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  test("grade=3(어려움): interval=1, repetitions=1", () => {
    const result = calculateNextReview(fresh, 3);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
  });

  test("grade=0(다시): interval=1, repetitions=0 (리셋)", () => {
    const result = calculateNextReview(fresh, 0);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
  });
});

describe("calculateNextReview — 두 번째 복습 (repetitions=1)", () => {
  const after1 = { easeFactor: 2.5, interval: 1, repetitions: 1 };

  test("grade=5: interval=6, repetitions=2", () => {
    const result = calculateNextReview(after1, 5);
    expect(result.interval).toBe(6);
    expect(result.repetitions).toBe(2);
  });

  test("grade=0: repetitions 리셋, interval=1", () => {
    const result = calculateNextReview(after1, 0);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });
});

describe("calculateNextReview — 세 번째 이상 (repetitions=2)", () => {
  const after2 = { easeFactor: 2.5, interval: 6, repetitions: 2 };

  test("grade=5: interval = round(6 × 2.5) = 15", () => {
    const result = calculateNextReview(after2, 5);
    expect(result.interval).toBe(15);
    expect(result.repetitions).toBe(3);
  });

  test("grade=4: interval = round(6 × easeFactor) 계산됨", () => {
    const result = calculateNextReview(after2, 4);
    // easeFactor=2.5, grade=4 → 조정값: 0.1-(5-4)*(0.08+(5-4)*0.02)=0.1-0.1=0 → 그대로 2.5
    expect(result.interval).toBe(Math.round(6 * 2.5));
  });

  test("grade=0: repetitions=0, interval=1로 리셋", () => {
    const result = calculateNextReview(after2, 0);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });
});

describe("easeFactor 조정", () => {
  test("grade=5: easeFactor 증가", () => {
    const result = calculateNextReview(fresh, 5);
    // 0.1-(5-5)*(0.08+0*0.02) = 0.1 → 2.5+0.1=2.6
    expect(result.easeFactor).toBeCloseTo(2.6);
  });

  test("grade=4: easeFactor 유지 (≈2.5)", () => {
    const result = calculateNextReview(fresh, 4);
    // 0.1-(5-4)*(0.08+1*0.02)=0.1-0.1=0 → 2.5+0=2.5
    expect(result.easeFactor).toBeCloseTo(2.5);
  });

  test("grade=3: easeFactor 감소", () => {
    const result = calculateNextReview(fresh, 3);
    // 0.1-(5-3)*(0.08+2*0.02)=0.1-0.24=-0.14 → 2.5-0.14=2.36
    expect(result.easeFactor).toBeCloseTo(2.36);
  });

  test("grade=0: easeFactor 감소하되 최소 1.3 보장", () => {
    // easeFactor가 낮아진 상태에서 grade=0 반복 시 1.3 하한 보장
    const low = { easeFactor: 1.35, interval: 1, repetitions: 0 };
    const result = calculateNextReview(low, 0);
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  test("easeFactor가 1.3 이하로 내려가지 않음", () => {
    const borderline = { easeFactor: 1.3, interval: 1, repetitions: 0 };
    const result = calculateNextReview(borderline, 0);
    expect(result.easeFactor).toBe(1.3);
  });
});

describe("dueAt / lastReviewedAt", () => {
  test("dueAt은 now + interval일 이후", () => {
    const before = new Date();
    const result = calculateNextReview(fresh, 5);
    const expectedDue = new Date(before);
    expectedDue.setDate(expectedDue.getDate() + result.interval);
    // 날짜(일)만 비교
    expect(result.dueAt.toDateString()).toBe(expectedDue.toDateString());
  });

  test("lastReviewedAt은 현재 시각 근처", () => {
    const before = Date.now();
    const result = calculateNextReview(fresh, 5);
    const after = Date.now();
    expect(result.lastReviewedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.lastReviewedAt.getTime()).toBeLessThanOrEqual(after);
  });
});

describe("연속 성공 시뮬레이션 (grade=4 반복)", () => {
  test("interval이 1 → 6 → 15로 성장", () => {
    let state = fresh;

    const r1 = calculateNextReview(state, 4);
    expect(r1.interval).toBe(1); // 첫 번째
    state = { easeFactor: r1.easeFactor, interval: r1.interval, repetitions: r1.repetitions };

    const r2 = calculateNextReview(state, 4);
    expect(r2.interval).toBe(6); // 두 번째
    state = { easeFactor: r2.easeFactor, interval: r2.interval, repetitions: r2.repetitions };

    const r3 = calculateNextReview(state, 4);
    expect(r3.interval).toBe(15); // 세 번째: round(6 × 2.5) = 15
  });
});
