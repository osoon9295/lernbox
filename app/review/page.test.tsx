/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ReviewPage from "./page";

// next/link는 jsdom에서 동작하지 않으므로 단순 앵커로 대체
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

// shadcn 컴포넌트는 실제 DOM 요소로 렌더링되므로 별도 모킹 불필요

const mockWord = (overrides = {}) => ({
  id: "word-1",
  word: "schadenfreude",
  meaning: "남의 불행에서 기쁨",
  aiAnalysis: null,
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  dueAt: null,
  lastReviewedAt: null,
  ...overrides,
});

// fetch를 각 테스트에서 직접 제어
global.fetch = jest.fn();

afterEach(() => {
  jest.clearAllMocks();
});

function mockFetchReview(words: ReturnType<typeof mockWord>[]) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    json: async () => ({ words }),
    ok: true,
  });
}

function mockFetchReviewPost() {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    json: async () => ({ word: { id: "word-1", interval: 1 } }),
    ok: true,
  });
}

describe("ReviewPage", () => {
  test("초기 로딩 중 스켈레톤(role=status) 표시", () => {
    // fetch가 resolve되지 않도록 대기 상태로 둠
    (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
    render(<ReviewPage />);
    expect(
      screen.getByRole("status", { name: "불러오는 중" }),
    ).toBeInTheDocument();
  });

  test("복습 단어 없을 때 빈 상태 메시지 표시", async () => {
    mockFetchReview([]);
    render(<ReviewPage />);

    await waitFor(() => {
      expect(
        screen.getByText("오늘 복습할 단어가 없습니다!"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("단어장으로 돌아가기")).toBeInTheDocument();
  });

  test("단어 카드: 단어명과 '답 보기' 버튼 표시", async () => {
    mockFetchReview([mockWord()]);
    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText("schadenfreude")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "답 보기" })).toBeInTheDocument();
    // 뜻은 아직 숨겨져 있어야 함
    expect(screen.queryByText("남의 불행에서 기쁨")).not.toBeInTheDocument();
  });

  test("진행 표시: '1 / 1' 표시", async () => {
    mockFetchReview([mockWord()]);
    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText("1 / 1")).toBeInTheDocument();
    });
  });

  test("'답 보기' 클릭 → 뜻과 난이도 버튼 4개 표시", async () => {
    mockFetchReview([mockWord()]);
    render(<ReviewPage />);

    await waitFor(() => screen.getByText("schadenfreude"));
    fireEvent.click(screen.getByRole("button", { name: "답 보기" }));

    expect(screen.getByText("남의 불행에서 기쁨")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /다시/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /어려움/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /좋음/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /쉬움/ })).toBeInTheDocument();
  });

  test("AI 분석 있는 단어: 답 보기 후 분석 텍스트 표시", async () => {
    mockFetchReview([mockWord({ aiAnalysis: { text: "## 뜻\n기쁨의 일종" } })]);
    render(<ReviewPage />);

    await waitFor(() => screen.getByText("schadenfreude"));
    fireEvent.click(screen.getByRole("button", { name: "답 보기" }));

    expect(screen.getByText(/기쁨의 일종/)).toBeInTheDocument();
  });

  test("단어 1개: 난이도 클릭 후 복습 완료 화면 표시", async () => {
    mockFetchReview([mockWord()]);
    mockFetchReviewPost();
    render(<ReviewPage />);

    await waitFor(() => screen.getByText("schadenfreude"));
    fireEvent.click(screen.getByRole("button", { name: "답 보기" }));
    fireEvent.click(screen.getByRole("button", { name: /좋음/ }));

    await waitFor(() => {
      expect(screen.getByText(/복습 완료!/)).toBeInTheDocument();
    });
    expect(
      screen.getByText("수고했습니다. 다음 복습일에 다시 만나요."),
    ).toBeInTheDocument();
  });

  test("단어 2개: 첫 카드 완료 후 두 번째 카드로 이동", async () => {
    const word2 = mockWord({
      id: "word-2",
      word: "Weltschmerz",
      meaning: "세계의 고통",
    });
    mockFetchReview([mockWord(), word2]);
    mockFetchReviewPost();
    render(<ReviewPage />);

    await waitFor(() => screen.getByText("schadenfreude"));

    // 첫 번째 카드 완료
    fireEvent.click(screen.getByRole("button", { name: "답 보기" }));
    fireEvent.click(screen.getByRole("button", { name: /쉬움/ }));

    await waitFor(() => {
      expect(screen.getByText("Weltschmerz")).toBeInTheDocument();
    });
    // 진행 표시 갱신
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    // 두 번째 카드는 다시 뜻이 숨겨져 있어야 함
    expect(screen.queryByText("세계의 고통")).not.toBeInTheDocument();
  });

  test("난이도 클릭 시 POST /api/words/[id]/review 호출", async () => {
    mockFetchReview([mockWord()]);
    mockFetchReviewPost();
    render(<ReviewPage />);

    await waitFor(() => screen.getByText("schadenfreude"));
    fireEvent.click(screen.getByRole("button", { name: "답 보기" }));
    fireEvent.click(screen.getByRole("button", { name: /다시/ }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const reviewCall = calls.find(
        (c) => c[0].includes("/review") && c[1]?.method === "POST",
      );
      expect(reviewCall).toBeDefined();
      expect(JSON.parse(reviewCall[1].body)).toEqual({ grade: 0 });
    });
  });
});
