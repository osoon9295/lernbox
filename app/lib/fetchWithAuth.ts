// 인증이 필요한 API 요청에 사용하는 fetch 래퍼.
// 401 응답 → /api/auth/refresh 호출 → 성공 시 원래 요청 재시도.
// 리프레시도 실패하면 /login으로 리다이렉트.

// 여러 요청이 동시에 401을 받아도 refresh는 한 번만 시도되도록 Promise를 공유
let pendingRefresh: Promise<boolean> | null = null;

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status !== 401) return res;

  // 동시 다발 401 처리: 이미 refresh 중이면 그 결과를 기다림
  if (!pendingRefresh) {
    pendingRefresh = fetch("/api/auth/refresh", { method: "POST" })
      .then((r) => r.ok)
      .finally(() => {
        pendingRefresh = null;
      });
  }

  const refreshed = await pendingRefresh;

  if (!refreshed) {
    // 리프레시 실패 = 세션 완전 만료 → 로그인 페이지로
    window.location.href = "/login?reason=session_expired";
    // 리다이렉트 전까지 호출부가 처리할 수 있도록 원래 401 응답 반환
    return res;
  }

  // 새 액세스 토큰 쿠키가 자동 첨부된 상태로 원래 요청 재시도
  return fetch(input, init);
}
