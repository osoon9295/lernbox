"use client";

import { useState, useEffect, type SyntheticEvent } from "react";
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

export default function DashboardPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 인라인 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editMeaning, setEditMeaning] = useState("");

  // AI 분석 상태: wordId → 스트리밍 중인 텍스트
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
    const res = await fetch("/api/words");
    if (res.ok) {
      const data = await res.json();
      setWords(data.words);
    }
  }

  async function fetchStats() {
    const res = await fetch("/api/stats");
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
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: newWord, meaning: newMeaning }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "추가에 실패했습니다.");
        return;
      }
      setWords((prev) => [data.word, ...prev]);
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
    const res = await fetch(`/api/words/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: editWord, meaning: editMeaning }),
    });
    if (res.ok) {
      const data = await res.json();
      setWords((prev) => prev.map((w) => (w.id === id ? data.word : w)));
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/words/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWords((prev) => prev.filter((w) => w.id !== id));
      fetchStats();
    }
  }

  // Claude API 스트리밍 분석
  // ReadableStream을 청크 단위로 읽어 실시간으로 화면에 표시한다.
  async function handleAnalyze(id: string) {
    setAnalyzingId(id);
    setStreamingText((prev) => ({ ...prev, [id]: "" }));

    try {
      const res = await fetch(`/api/words/${id}/analyze`, { method: "POST" });
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

      // 스트림 완료 후 단어 목록의 aiAnalysis 업데이트 (재fetch 없이)
      setWords((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                aiAnalysis: { text: accumulated },
                analyzedAt: new Date().toISOString(),
              }
            : w,
        ),
      );
    } finally {
      setAnalyzingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 단어장</h1>
        <div className="flex gap-2">
          <Link href="/quiz">
            <Button variant="outline">퀴즈</Button>
          </Link>
          <Link href="/review">
            <Button variant="outline">복습하기</Button>
          </Link>
        </div>
      </div>

      {/* 학습 통계 */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "전체 단어", value: `${stats.total}개`, icon: "📚" },
            {
              label: "오늘 복습",
              value: `${stats.reviewedToday}개`,
              icon: "✅",
            },
            { label: "학습 시작률", value: `${stats.startRate}%`, icon: "📈" },
            { label: "연속 학습일", value: `${stats.streak}일`, icon: "🔥" },
          ].map(({ label, value, icon }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-3 text-center space-y-1">
                <p className="text-xl">{icon}</p>
                <p className="text-lg font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 단어 추가 폼 */}
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
        {/* 검색 */}
        {words.length > 0 && (
          <Input
            placeholder="단어 또는 뜻 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}

        {(() => {
          const query = search.trim().toLowerCase();
          const filtered = query
            ? words.filter(
                (w) =>
                  w.word.toLowerCase().includes(query) ||
                  w.meaning.toLowerCase().includes(query),
              )
            : words;

          if (words.length === 0)
            return (
              <p className="text-sm text-muted-foreground text-center py-8">
                아직 추가한 단어가 없습니다.
              </p>
            );

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
                      <span className="text-muted-foreground">{w.meaning}</span>
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
