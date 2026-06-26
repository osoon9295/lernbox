import { prisma } from "../app/lib/prisma";
import { hashPassword } from "../app/lib/auth/password";

async function main() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL / TEST_USER_PASSWORD 환경변수가 필요합니다",
    );
  }

  // 이미 있으면 그대로 두고, 없으면 생성 (여러 번 돌려도 안전)
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: await hashPassword(password),
    },
  });

  console.log(`시드 완료: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
