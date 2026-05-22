import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/app/lib/auth/cookies";

export async function POST() {
  const response = NextResponse.json(
    { message: "로그아웃되었습니다." },
    { status: 200 },
  );
  clearAuthCookies(response);
  return response;
}
