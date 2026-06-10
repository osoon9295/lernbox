"use client";

import { useState, useEffect, type SyntheticEvent } from "react";
import { fetchWithAuth } from "@/app/lib/fetchWithAuth";
import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Word {
  id: string;
  word: string;
  meaning: string;
  aiAnalysis: { text: string } | null;
  analyzedAt: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  reviewedToday: number;
  startRate: number;
  streak: number;
}

const STAT_CONFIGS: {
  label: string;
  icon: string;
  getValue: (s: Stats) => string;
}[] = [
  { label: "전체 단어", icon: "📚", getValue: (s) => `${s.total}개` },
  { label: "오늘 복습", icon: "✅", getValue: (s) => `${s.reviewedToday}개` },
  { label: "학습 시작률", icon: "📈", getValue: (s) => `${s.startRate}%` },
  { label: "연속 학습일", icon: "🔥", getValue: (s) => `${s.streak}일` },
];

export default function DashboardPage() {
  // null = 로딩 중, [] = 로드 완료 but 비어있음
  const [words, setWords] = useState<Word[] | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editMeaning, setEditMeaning] = useState("");

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState<Record<string, string>>(
    {},
  );

  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchWords();
    fetchStats();
  }, []);

  async function fetchWords() {
    const res = await fetchWithAuth("/api/words");
    if (res.ok) {
      const data = await res.json();
      setWords(data.words);
    }
  }

  async function fetchStats() {
    const res = await fetchWithAuth("/api/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  }

  async function handleAdd(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    try {
      const res = await fetchWithAuth("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord, meaning: newMeaning }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "추가에 실패했습니다.");
        return;
      }
      setWords((prev) => [data.word, ...(prev ?? [])]);
      setNewWord("");
      setNewMeaning("");
      fetchStats();
    } finally {
      setAdding(false);
    }
  }

  function startEdit(w: Word) {
    setEditingId(w.id);
    setEditWord(w.word);
    setEditMeaning(w.meaning);
  }

  async function handleEdit(id: string) {
    const res = await fetchWithAuth(`/api/words/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: editWord, meaning: editMeaning }),
    });
    if (res.ok) {
      const data = await res.json();
      setWords((prev) =>
        prev ? prev.map((w) => (w.id === id ? data.word : w)) : prev,
      );
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetchWithAuth(`/api/words/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWords((prev) => (prev ? prev.filter((w) => w.id !== id) : prev));
      fetchStats();
    }
  }

  async function handleAnalyze(id: string) {
    setAnalyzingId(id);
    setStreamingText((prev) => ({ ...prev, [id]: "" }));

    try {
      const res = await fetchWithAuth(`/api/words/${id}/analyze`, { method: "POST" });
      if (!res.ok || !res.body) {
        setStreamingText((prev) => ({
          ...prev,
          [id]: "분석에 실패했습니다.",
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamingText((prev) => ({ ...prev, [id]: accumulated }));
      }

      setWords((prev) =>
        prev
          ? prev.map((w) =>
              w.id === id
                ? {
                    ...w,
                    aiAnalysis: { text: accumulated },
                    analyzedAt: new Date().toISOString(),
                  }
                : w,
            )
          : prev,
      );
    } finally {
      setAnalyzingId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 단어장</h1>
        <div className="flex gap-2">
          <Link href="/quiz">
            <Button variant="outline">퀴즈</Button>
          </Link>
          <Link href="/review">
            <Button variant="outline">복습하기</Button>
          </Link>
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={handleLogout}
          >
            로그아웃
          </Button>
        </div>
      </div>

      {/* 학습 통계 — 항상 렌더링, 로딩 중엔 skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {STAT_CONFIGS.map(({ label, icon, getValue }) => (
          <Card key={label}>
            <CardContent className="h-24 flex flex-col items-center justify-center gap-1 pt-0">
              <p className="text-xl">{icon}</p>
              {stats ? (
                <>
                  <p className="text-lg font-bold leading-none">
                    {getValue(stats)}
                  </p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </>
              ) : (
                <>
                  <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-full rounded bg-muted animate-pulse" />
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 새 단어 추가 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 단어 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="독일어 단어"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              required
            />
            <Input
              placeholder="한국어 뜻"
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              required
            />
            <Button type="submit" disabled={adding}>
              {adding ? "추가 중..." : "추가"}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {/* 단어 목록 */}
      <div className="space-y-4">
        {/* 검색 — 단어가 있을 때만 */}
        {words && words.length > 0 && (
          <Input
            placeholder="단어 또는 뜻 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}

        {/* 로딩 skeleton — 실제 단어 카드와 동일한 구조·높이로 레이아웃 점프 방지 */}
        {words === null && (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* text-2xl word placeholder */}
                      <div className="h-8 w-1/3 rounded bg-muted animate-pulse" />
                      {/* meaning placeholder */}
                      <div className="h-4 w-1/4 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <div className="h-8 w-16 rounded bg-muted animate-pulse" />
                      <div className="h-8 w-10 rounded bg-muted animate-pulse" />
                      <div className="h-8 w-10 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {words !== null && words.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            아직 추가한 단어가 없습니다.
          </p>
        )}

        {/* 단어 카드 목록 */}
        {words !== null &&
          words.length > 0 &&
          (() => {
            const query = search.trim().toLowerCase();
            const filtered = query
              ? words.filter(
                  (w) =>
                    w.word.toLowerCase().includes(query) ||
                    w.meaning.toLowerCase().includes(query),
                )
              : words;

            if (filtered.length === 0)
              return (
                <p className="text-sm text-muted-foreground text-center py-8">
                  &ldquo;{search}&rdquo;에 해당하는 단어가 없습니다.
                </p>
              );

            return filtered.map((w) =>
              editingId === w.id ? (
                <Card key={w.id}>
                  <CardContent className="flex gap-2 pt-4">
                    <Input
                      value={editWord}
                      onChange={(e) => setEditWord(e.target.value)}
                    />
                    <Input
                      value={editMeaning}
                      onChange={(e) => setEditMeaning(e.target.value)}
                    />
                    <Button size="sm" onClick={() => handleEdit(w.id)}>
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      취소
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card key={w.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-2xl">{w.word}</span>
                        <span className="mx-2 text-muted-foreground">—</span>
                        <span className="text-muted-foreground">
                          {w.meaning}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyze(w.id)}
                          disabled={analyzingId === w.id}
                        >
                          {analyzingId === w.id ? "분석 중..." : "AI 분석"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(w)}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(w.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>

                    {(streamingText[w.id] || w.aiAnalysis?.text) && (
                      <div className="border-t pt-3">
                        <div className="prose prose-sm max-w-none text-foreground">
                          <Markdown remarkPlugins={[remarkGfm]}>
                            {streamingText[w.id] || w.aiAnalysis?.text}
                          </Markdown>
                        </div>
                        {analyzingId === w.id && (
                          <span className="inline-block w-1 h-4 bg-foreground animate-pulse ml-0.5" />
                        )}
                        {w.analyzedAt && analyzingId !== w.id && (
                          <p className="text-xs text-muted-foreground mt-2">
                            분석일:{" "}
                            {new Date(w.analyzedAt).toLocaleDateString("ko-KR")}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ),
            );
          })()}
      </div>
    </main>
  );
}
