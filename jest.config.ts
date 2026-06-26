import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/tests/"],
};

const getConfig = async (): Promise<Config> => {
  const jestConfig = await createJestConfig(config)();
  return {
    ...jestConfig,
    transformIgnorePatterns: [
      // react-markdown과 그 ESM 의존성 전부를 변환 허용
      "node_modules/(?!.*(react-markdown|micromark|mdast|hast|unist|unified|bail|trough|vfile|remark|rehype|property-information|space-separated-tokens|comma-separated-tokens|decode-named-character-reference|character-entities|trim-lines|html-url-attributes|zwitch|longest-streak|ccount|escape-string-regexp|markdown-table|devlop|estree|is-plain-obj)).+\\.js$",
      "^.+\\.module\\.(css|sass|scss)$",
    ],
  };
};

export default getConfig;
