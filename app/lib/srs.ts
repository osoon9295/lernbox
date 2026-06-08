// SM-2 알고리즘 구현
// 참고: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-super-memo-method
//
// grade: 사용자가 평가한 난이도
//   0 = 다시 (완전히 잊음)
//   3 = 어려움 (기억하긴 했지만 힘들었음)
//   4 = 좋음 (약간 망설임)
//   5 = 쉬움 (바로 기억)

export type Grade = 0 | 3 | 4 | 5;

export interface SrsState {
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueAt: Date;
  lastReviewedAt: Date;
}

export function calculateNextReview(
  current: { easeFactor: number; interval: number; repetitions: number },
  grade: Grade,
): SrsState {
  const now = new Date();
  let { easeFactor, interval, repetitions } = current;

  if (grade >= 3) {
    // 정답: interval 증가
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // 오답(다시): interval 리셋
    repetitions = 0;
    interval = 1;
  }

  // easeFactor 조정 (최소 1.3 — 너무 낮아지면 복습 간격이 거의 늘지 않음)
  easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + interval);

  return { easeFactor, interval, repetitions, dueAt, lastReviewedAt: now };
}
