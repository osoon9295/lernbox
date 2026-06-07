import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "./env";

// getEnv는 키 없으면 즉시 에러 → 잘못된 상태로 요청 처리하는 걸 방지
const anthropic = new Anthropic({ apiKey: getEnv("ANTHROPIC_API_KEY") });

export default anthropic;
