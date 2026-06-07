"use client";

import { useState, useEffect, type SyntheticEvent } from "react";
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
  const [streamingText, setStreamingText] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchWords();
  }, []);

  async function fetchWords() {
    const res = await fetch("/api/words");
    if (res.ok) {
      const data = await res.json();
      setWords(data.words);
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
            ? { ...w, aiAnalysis: { text: accumulated }, analyzedAt: new Date().toISOString() }
            : w,
        ),
      );
    } finally {
      setAnalyzingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      <h1 className="text-2xl font-bold">내 단어장</h1>

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
        {words.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            아직 추가한 단어가 없습니다.
          </p>
        )}
        {words.map((w) =>
          editingId === w.id ? (
            // 인라인 수정 폼
            <Card key={w.id}>
              <CardContent className="flex gap-2 pt-4">
                <Input value={editWord} onChange={(e) => setEditWord(e.target.value)} />
                <Input value={editMeaning} onChange={(e) => setEditMeaning(e.target.value)} />
                <Button size="sm" onClick={() => handleEdit(w.id)}>저장</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>취소</Button>
              </CardContent>
            </Card>
          ) : (
            <Card key={w.id}>
              <CardContent className="pt-4 space-y-3">
                {/* 단어 헤더 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{w.word}</span>
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
                    <Button size="sm" variant="ghost" onClick={() => startEdit(w)}>수정</Button>
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

                {/* AI 분석 결과 — 스트리밍 중이거나 저장된 결과 표시 */}
                {(streamingText[w.id] || w.aiAnalysis?.text) && (
                  <div className="border-t pt-3">
                    <pre className="text-sm whitespace-pre-wrap font-sans text-foreground leading-relaxed">
                      {streamingText[w.id] || w.aiAnalysis?.text}
                    </pre>
                    {analyzingId === w.id && (
                      <span className="inline-block w-1 h-4 bg-foreground animate-pulse ml-0.5" />
                    )}
                    {w.analyzedAt && analyzingId !== w.id && (
                      <p className="text-xs text-muted-foreground mt-2">
                        분석일: {new Date(w.analyzedAt).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </main>
  );
}
