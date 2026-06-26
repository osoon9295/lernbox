import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // ① Playwright E2E 폴더는 Jest에서 제외
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/"],
  // // ② react-markdown 등 ESM 라이브러리는 변환하도록 예외 처리
  // transformIgnorePatterns: ["/node_modules/(?!(react-markdown|.*\\.mjs$))"],
};

export default createJestConfig(config);
