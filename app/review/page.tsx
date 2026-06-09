"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ReviewWord {
  id: string;
  word: string;
  meaning: string;
  aiAnalysis: { text: string } | null;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueAt: string | null;
  lastReviewedAt: string | null;
}

const GRADE_BUTTONS: { label: string; grade: 0 | 3 | 4 | 5; description: string }[] = [
  { label: "다시", grade: 0, description: "기억 못 함" },
  { label: "어려움", grade: 3, description: "힘들게 기억" },
  { label: "좋음", grade: 4, description: "약간 망설임" },
  { label: "쉬움", grade: 5, description: "바로 기억" },
];

export default function ReviewPage() {
  const [queue, setQueue] = useState<ReviewWord[]>([]);
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((data) => {
        setQueue(data.words ?? []);
        setLoading(false);
      });
  }, []);

  async function handleGrade(grade: 0 | 3 | 4 | 5) {
    const word = queue[current];
    setSubmitting(true);
    await fetch(`/api/words/${word.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade }),
    });
    setSubmitting(false);
    setSessionCount((n) => n + 1);

    const next = current + 1;
    if (next >= queue.length) {
      setDone(true);
    } else {
      setCurrent(next);
      setRevealed(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 flex flex-col gap-4">
        {/* 헤더 skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-16 rounded bg-muted animate-pulse" />
          <div className="h-4 w-12 rounded bg-muted animate-pulse" />
        </div>
        {/* 단어 카드 skeleton — 실제와 동일한 h-72 */}
        <Card className="h-72">
          <CardContent className="h-full flex flex-col items-center justify-center gap-3 pt-0">
            <div className="h-9 w-1/3 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
        {/* 난이도 버튼 skeleton — 실제와 동일한 4칸 그리드 */}
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
        {/* 진행 바 skeleton */}
        <div className="w-full bg-muted rounded-full h-1.5" />
      </main>
    );
  }

  if (queue.length === 0 || done) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <p className="text-4xl">🎉</p>
        <h1 className="text-xl font-bold">
          {queue.length === 0 ? "오늘 복습할 단어가 없습니다!" : `복습 완료! (${sessionCount}개)`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {queue.length === 0
            ? "단어를 추가하거나 내일 다시 확인하세요."
            : "수고했습니다. 다음 복습일에 다시 만나요."}
        </p>
        <Link href="/dashboard">
          <Button variant="outline" className="mt-2">단어장으로 돌아가기</Button>
        </Link>
      </main>
    );
  }

  const word = queue[current];

  return (
    <main className="mx-auto max-w-xl px-4 py-10 flex flex-col gap-4">
      {/* 헤더: 항상 고정 높이 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">복습</h1>
        <span className="text-sm text-muted-foreground">{current + 1} / {queue.length}</span>
      </div>

      {/* 단어 카드: 고정 높이 + 내부 스크롤 */}
      <Card className="h-72">
        <CardContent className="h-full flex flex-col pt-6 pb-4 overflow-hidden">
          {/* 단어: 항상 상단 고정 */}
          <p className="text-3xl font-bold text-center shrink-0">{word.word}</p>

          {/* 내용 영역: 답 공개 전후 공간 동일하게 유지 */}
          <div className="flex-1 overflow-y-auto mt-4">
            {!revealed ? (
              <div className="h-full flex items-center justify-center">
                <Button onClick={() => setRevealed(true)}>답 보기</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-lg text-muted-foreground">{word.meaning}</p>
                {word.aiAnalysis?.text && (
                  <div className="border-t pt-3 prose prose-sm max-w-none text-foreground">
                    <Markdown remarkPlugins={[remarkGfm]}>{word.aiAnalysis.text}</Markdown>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 난이도 버튼: 항상 동일 높이 — invisible로 공간 유지 */}
      <div className={`grid grid-cols-4 gap-2 ${revealed ? "" : "invisible"}`}>
        {GRADE_BUTTONS.map(({ label, grade, description }) => (
          <button
            key={grade}
            onClick={() => handleGrade(grade)}
            disabled={submitting || !revealed}
            className="flex flex-col items-center gap-1 rounded-lg border p-3 text-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            <span className="font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </button>
        ))}
      </div>

      {/* 진행 바: 항상 고정 */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${(current / queue.length) * 100}%` }}
        />
      </div>
    </main>
  );
}
