/**
 * 주어진 시각이 속한 "UTC 날짜의 자정(00:00:00.000Z)" Date를 반환한다.
 *
 * DailyReviewCount의 date 버킷 키로 사용한다. 복습 기록(쓰기)과 통계 조회(읽기)가
 * 반드시 동일한 키를 만들어야 하므로 한 곳에서 정의해 공유한다.
 * stats의 toDateStr(toISOString 기반)도 UTC 기준이라 버킷이 정확히 맞물린다.
 */
export function utcDayStart(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
