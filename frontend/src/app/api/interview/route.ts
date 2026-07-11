import { NextResponse } from "next/server";
import { createLocalInterviewResult } from "@/lib/interviewFallback";
import {
  normalizeConfirmedProfile,
  runInterviewProvider,
} from "@/lib/ai/interviewProvider";
import type {
  ApiChatMessage,
  InterviewApiRequest,
  TeamProfile,
} from "@/types/chat";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "请求体不是合法 JSON。" },
      { status: 400 },
    );
  }

  const parsedRequest = parseInterviewRequest(body);

  if (!parsedRequest) {
    return NextResponse.json(
      { error: "请求参数不完整。" },
      { status: 400 },
    );
  }

  const providerResult = await runInterviewProvider(parsedRequest);

  return NextResponse.json({
    ...providerResult.result,
    fallback: providerResult.usedFallback,
    error: providerResult.error,
  });
}

function parseInterviewRequest(value: unknown): InterviewApiRequest | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Partial<InterviewApiRequest>;

  if (
    typeof record.message !== "string" ||
    !Array.isArray(record.messages) ||
    !record.messages.every(isApiChatMessage)
  ) {
    return null;
  }

  const confirmedProfile = normalizeConfirmedProfile(record.confirmedProfile) as TeamProfile;

  return {
    message: record.message,
    messages: record.messages,
    confirmedProfile,
  };
}

function isApiChatMessage(value: unknown): value is ApiChatMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ApiChatMessage>;

  return (
    (record.role === "user" || record.role === "assistant") &&
    typeof record.content === "string"
  );
}

export function createFallbackInterviewResponse(request: InterviewApiRequest) {
  return createLocalInterviewResult(request.message, request.confirmedProfile);
}
