import { NextResponse } from "next/server";
import {
  normalizeRecommendationProfile,
  runRecommendationProvider,
} from "@/lib/ai/recommendationProvider";
import type { RecommendationRequest } from "@/types/chat";

export async function handleRecommendationsPost(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON。" }, { status: 400 });
  }

  const parsedRequest = parseRecommendationRequest(body);

  if (!parsedRequest) {
    return NextResponse.json({ error: "请求参数不完整。" }, { status: 400 });
  }

  const providerResult = await runRecommendationProvider(parsedRequest);

  return NextResponse.json({
    ...providerResult.result,
    source: providerResult.usedFallback ? "fallback" : providerResult.result.source,
    error: providerResult.error,
  });
}

function parseRecommendationRequest(value: unknown): RecommendationRequest | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Partial<RecommendationRequest>;

  return {
    confirmedProfile: normalizeRecommendationProfile(record.confirmedProfile),
  };
}
