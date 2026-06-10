import { NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAuthenticatedUserId } from "@/app/lib/auth/session";
import anthropic from "@/app/lib/anthropic";

// POST /api/words/[id]/analyze
// Claude API로 단어를 분석하고, 스트리밍으로 결과를 전송한 뒤 DB에 저장한다.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  // IDOR 방어: 단어가 로그인한 사용자 소유인지 확인
  const word = await prisma.word.findUnique({ where: { id } });
  if (!word || word.userId !== auth.userId) {
    return new Response(JSON.stringify({ error: "단어를 찾을 수 없습니다." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = buildPrompt(word.word, word.meaning);
  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 스트리밍 응답: 토큰이 생성될 때마다 클라이언트로 즉시 전송
        const anthropicStream = anthropic.messages.stream({
          model: "claude-haiku-4-5",
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        }

        // 스트림 완료 후 결과를 DB에 저장
        await prisma.word.update({
          where: { id },
          data: {
            aiAnalysis: { text: fullText },
            analyzedAt: new Date(),
          },
        });

        controller.close();
      } catch (error) {
        console.error("[POST /api/words/:id/analyze]", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // 브라우저가 스트림을 버퍼링하지 않고 즉시 렌더링하도록 설정
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  });
}

function buildPrompt(word: string, meaning: string): string {
  return `독일어 단어 "${word}" (뜻: ${meaning})를 B1~B2 수준 학습자를 위해 분석해주세요.

제목이나 머릿말 없이 아래 섹션부터 바로 시작하세요. 다음 형식으로 한국어로 작성해주세요:

## 📖 뜻 & 정의
한국어 뜻과 독일어 정의를 간결하게 설명해주세요.

## 📝 문법 정보
품사, 성(der/die/das), 복수형, 격 지배, 분리동사 여부 등 해당하는 항목을 알려주세요.

## 💬 예문 3개
B1~B2 수준의 실용적인 예문을 독일어와 한국어 번역을 함께 보여주세요.

## 🔍 뉘앙스 & 유사 단어
비슷한 뜻의 단어와의 차이점, 사용 맥락의 뉘앙스를 설명해주세요.

## 💡 학습 팁
이 단어를 기억하거나 활용하는 데 도움이 되는 팁을 한 가지 알려주세요.`;
}
