import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="max-w-xl w-full text-center space-y-8">

        {/* 로고 & 타이틀 */}
        <div className="space-y-3">
          <p className="text-5xl">🇩🇪</p>
          <h1 className="text-4xl font-bold tracking-tight">Lernbox</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            독일어 단어를 추가하면 AI가 예문·뉘앙스와 함께 풀어주고<br />
            간격 반복 알고리즘이 복습 일정을 관리해줍니다.
          </p>
        </div>

        {/* 기능 요약 */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl border p-4 space-y-1">
            <p className="text-2xl">🤖</p>
            <p className="font-medium">AI 분석</p>
            <p className="text-muted-foreground text-xs">뜻·문법·예문·뉘앙스 자동 생성</p>
          </div>
          <div className="rounded-xl border p-4 space-y-1">
            <p className="text-2xl">🔁</p>
            <p className="font-medium">간격 반복</p>
            <p className="text-muted-foreground text-xs">SM-2 알고리즘 기반 복습 일정</p>
          </div>
          <div className="rounded-xl border p-4 space-y-1">
            <p className="text-2xl">📖</p>
            <p className="font-medium">내 단어장</p>
            <p className="text-muted-foreground text-xs">단어 추가·수정·삭제</p>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="flex gap-3 justify-center">
          <Link href="/signup">
            <Button size="lg">시작하기</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">로그인</Button>
          </Link>
        </div>

      </div>
    </main>
  );
}
