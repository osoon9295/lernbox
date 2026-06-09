"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface QuizWord {
  id: string;
  word: string;
  meaning: string;
  aiAnalysis: { text: string } | null;
}

function extractBlankSentence(word: string, analysisText: string): string | null {
  const lines = analysisText.split("\n");
  for (const line of lines) {
    const match = line.match(/^\*\*\d+\.\*\*\s+(.+)/);
    if (!match) continue;
    const sentence = match[1].split("→")[0].trim();
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    if (regex.test(sentence)) {
      return sentence.replace(regex, "____");
    }
  }
  return null;
}

type ResultState = "correct" | "incorrect" | null;

export default function QuizPage() {
  const [queue, setQueue] = useState<QuizWord[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ResultState>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/words")
      .then((r) => r.json())
      .then((data) => {
        const shuffled = [...(data.words ?? [])].sort(() => Math.random() - 0.5);
        setQueue(shuffled);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (result === null) inputRef.current?.focus();
  }, [result, current]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (result !== null) return;
    const word = queue[current];
    const correct = input.trim().toLowerCase() === word.word.toLowerCase();
    setResult(correct ? "correct" : "incorrect");
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }

  function handleNext() {
    const next = current + 1;
    if (next >= queue.length) {
      setDone(true);
    } else {
      setCurrent(next);
      setInput("");
      setResult(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center text-muted-foreground">
        불러오는 중...
      </main>
    );
  }

  if (queue.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <p className="text-4xl">📚</p>
        <h1 className="text-xl font-bold">단어가 없습니다</h1>
        <p className="text-sm text-muted-foreground">먼저 단어를 추가해주세요.</p>
        <Link href="/dashboard"><Button variant="outline">단어장으로</Button></Link>
      </main>
    );
  }

  if (done) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <p className="text-4xl">{pct >= 80 ? "🎉" : pct >= 50 ? "🙂" : "📖"}</p>
        <h1 className="text-xl font-bold">퀴즈 완료!</h1>
        <p className="text-3xl font-bold">
          {score.correct} / {score.total}
          <span className="text-lg font-normal text-muted-foreground ml-2">({pct}%)</span>
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link href="/quiz">
            <Button>다시 풀기</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">단어장으로</Button>
          </Link>
        </div>
      </main>
    );
  }

  const word = queue[current];
  const blankSentence = word.aiAnalysis
    ? extractBlankSentence(word.word, word.aiAnalysis.text)
    : null;

  return (
    <main className="mx-auto max-w-xl px-4 py-10 flex flex-col gap-4">
      {/* 헤더: 항상 고정 높이 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">빈칸 퀴즈</h1>
        <span className="text-sm text-muted-foreground">{current + 1} / {queue.length}</span>
      </div>

      {/* 문제 카드: 고정 높이 */}
      <Card className="h-52">
        <CardContent className="h-full flex flex-col justify-center px-6 py-5 gap-2">
          {blankSentence ? (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                예문의 빈칸에 들어갈 독일어 단어는?
              </p>
              <p className="text-lg leading-relaxed font-medium">{blankSentence}</p>
              <p className="text-sm text-muted-foreground">뜻: {word.meaning}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                뜻에 해당하는 독일어 단어는?
              </p>
              <p className="text-2xl font-bold">{word.meaning}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* 피드백 영역: 항상 고정 높이 — invisible로 공간 유지 */}
      <div className={`rounded-lg px-4 py-3 text-sm border h-12 flex items-center ${
        result === "correct"
          ? "bg-green-50 text-green-800 border-green-200"
          : result === "incorrect"
          ? "bg-red-50 text-red-800 border-red-200"
          : "invisible border-transparent"
      }`}>
        {result === "correct" && <span>✅ 정답입니다!</span>}
        {result === "incorrect" && <span>❌ 오답 — 정답: <strong>{word.word}</strong></span>}
      </div>

      {/* 입력 + 버튼: 항상 고정 높이 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="독일어 단어 입력..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={result !== null}
          autoComplete="off"
          autoCapitalize="none"
        />
        {/* 버튼 두 개를 항상 렌더링하고 invisible 전환 — 크기 고정 */}
        <Button
          type="submit"
          disabled={!input.trim() || result !== null}
          className={result !== null ? "invisible" : ""}
        >
          확인
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          className={result === null ? "invisible" : ""}
        >
          다음 →
        </Button>
      </form>

      {/* 진행 바 */}
      <div className="w-full bg-muted rounded-full h-1.5">
        <div
          className="bg-primary h-1.5 rounded-full transition-all"
          style={{ width: `${(current / queue.length) * 100}%` }}
        />
      </div>

      {/* 점수 */}
      <p className="text-center text-xs text-muted-foreground">
        현재 점수: {score.correct} / {score.total}
        {score.total > 0 && ` (${Math.round((score.correct / score.total) * 100)}%)`}
      </p>
    </main>
  );
}
