"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/app/lib/fetchWithAuth";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, RotateCcw, Trophy } from "lucide-react";

interface Stats {
  total: number;
  reviewedToday: number;
  startRate: number;
  streak: number;
  dueCount: number;
  weeklyReviews: { date: string; count: number }[];
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

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${parseInt(month)}/${parseInt(day)}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  async function fetchStats() {
    const res = await fetchWithAuth("/api/stats");
    if (res.ok) {
      const data = await res.json();
      setStats(data);
    }
  }

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="w-full mx-auto max-w-2xl px-4 py-10 space-y-6">
      {/* 헤더 — 앱 제목 + 로그아웃만 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lernbox</h1>
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </div>

      {/* 핵심 기능 카드 */}
      {/* 단어장 — 가장 중요한 기능, 풀 width 강조 */}
      <Link href="/words" className="block">
        <Card className="border-primary/30 hover:border-primary hover:shadow-md transition-all cursor-pointer">
          <CardContent className="flex items-center justify-between py-6 px-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">단어장</p>
                <p className="text-sm text-muted-foreground">
                  {stats === null ? (
                    <span className="inline-block h-4 w-24 rounded bg-muted animate-pulse" />
                  ) : (
                    `${stats.total}개 저장됨 · 단어 추가 및 AI 분석`
                  )}
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>

      {/* 복습하기 + 퀴즈 — 2열 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/review" className="block">
          <Card className="hover:border-foreground/30 hover:shadow-sm transition-all cursor-pointer h-full">
            <CardContent className="flex flex-col gap-3 py-5 px-5">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-muted">
                  <RotateCcw className="w-5 h-5 text-foreground" />
                </div>
                {stats !== null && stats.dueCount > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    {stats.dueCount}개 대기
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold">복습하기</p>
                <p className="text-sm text-muted-foreground">SRS 간격 반복</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quiz" className="block">
          <Card className="hover:border-foreground/30 hover:shadow-sm transition-all cursor-pointer h-full">
            <CardContent className="flex flex-col gap-3 py-5 px-5">
              <div className="p-2 rounded-lg bg-muted w-fit">
                <Trophy className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="font-semibold">퀴즈</p>
                <p className="text-sm text-muted-foreground">실력 테스트</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 스탯 카드 */}
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

      {/* 주간 복습 그래프 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 7일 복습 현황</CardTitle>
        </CardHeader>
        <CardContent>
          {stats === null ? (
            <div className="h-40 rounded bg-muted animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={stats.weeklyReviews.map((d) => ({
                  ...d,
                  label: formatDateLabel(d.date),
                }))}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value}개`, "복습"]}
                  labelFormatter={(label) => `날짜: ${label}`}
                  // 바 색상(primary/muted-foreground)과 겹치지 않도록 반투명 흰색 계열 사용
                  cursor={{ fill: "rgba(0,0,0,0.06)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "13px",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.weeklyReviews.map((d) => (
                    <Cell
                      key={d.date}
                      fill={
                        d.date === today
                          ? "hsl(var(--primary))"
                          : "hsl(var(--muted-foreground) / 0.25)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-muted-foreground mt-2 text-right">
            오늘(진한 색) 기준 최근 7일
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
