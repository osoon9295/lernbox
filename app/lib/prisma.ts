import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma 7부터 PrismaClient는 driver adapter를 필수로 요구한다.
 * Rust 쿼리 엔진이 제거되고 Node.js 표준 DB 드라이버를 사용하는 방식으로 바뀌었다.
 * 그 결과 번들이 가볍고 콜드 스타트가 빠르다.
 */
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

/**
 * Next.js Hot Reload 환경에서 PrismaClient 인스턴스가 폭증하는 것을 막기 위한 싱글톤.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
