"use client";

import { useState, useEffect, type SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Word {
  id: string;
  word: string;
  meaning: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수정 중인 단어 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editMeaning, setEditMeaning] = useState("");

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
      <div className="space-y-2">
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
              <CardContent className="flex items-center justify-between pt-4">
                <div>
                  <span className="font-medium">{w.word}</span>
                  <span className="mx-2 text-muted-foreground">—</span>
                  <span className="text-muted-foreground">{w.meaning}</span>
                </div>
                <div className="flex gap-1">
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
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </main>
  );
}
