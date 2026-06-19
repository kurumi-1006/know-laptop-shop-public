import { createOpenAI } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai';
import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';
import {
  CHAT_ERRORS,
  DEEPSEEK_BASE_URL,
  DEEPSEEK_MAX_TOKENS,
  DEEPSEEK_MODEL,
  DEEPSEEK_TEMPERATURE,
  MAX_CONTEXT_MESSAGES,
  MAX_MESSAGES,
  MAX_TEXT_LENGTH,
  RATE_LIMIT_MAP_GC_THRESHOLD,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  SYSTEM_PROMPT,
} from '../constants';
import { createChatTools } from './chat-tools';
import { RecommendationService } from '@/features/recommendation/lib/recommendation.service';
import type { RecommendationResult } from '@/features/recommendation/lib/recommendation.types';
import { appendAiTrace, createAiTrace } from './ai-trace';
import { buildChatContext, formatChatContext, type ChatContext } from './chat-context';
import { getMessageText, isWithinLaptopScope, normalizeText } from './chat-scope';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface ChatProviderStrategy {
  stream(messages: UIMessage[]): Promise<Response>;
}

class DeepSeekAdapter implements ChatProviderStrategy {
  constructor(
    private readonly apiKey: string,
    private readonly systemPrompt: string,
    private readonly traceId: string,
  ) {}

  async stream(messages: UIMessage[]) {
    const deepseek = createOpenAI({
      apiKey: this.apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL || DEEPSEEK_BASE_URL,
      name: 'deepseek',
    });
    const result = streamText({
      model: deepseek.chat(process.env.DEEPSEEK_MODEL || DEEPSEEK_MODEL),
      system: this.systemPrompt,
      messages: await convertToModelMessages(messages.slice(-MAX_CONTEXT_MESSAGES)),
      maxOutputTokens: DEEPSEEK_MAX_TOKENS,
      temperature: DEEPSEEK_TEMPERATURE,
      tools: createChatTools(this.traceId),
      toolChoice: 'auto',
      stopWhen: stepCountIs(7),
      onFinish: (event) => {
        appendAiTrace(this.traceId, "chat.ai.output", {
          text: event.text,
          finishReason: event.finishReason,
          totalUsage: event.totalUsage,
          toolCalls: event.steps.flatMap((step) => step.toolCalls),
          toolResults: event.steps.flatMap((step) => step.toolResults),
        });
      },
      onError: ({ error }) => {
        appendAiTrace(this.traceId, "chat.ai.error", {
          message: error instanceof Error ? error.message : String(error),
        });
        console.error('DeepSeek chat stream failed', error);
      },
    });

    return result.toUIMessageStreamResponse({
      headers: { "X-AI-Trace-Id": this.traceId },
      onError: () => CHAT_ERRORS.unavailable,
    });
  }
}

class InMemoryRateLimitStrategy {
  private readonly requestsBySession = new Map<string, { count: number; resetAt: number }>();

  isLimited(sessionId: string) {
    const now = Date.now();

    if (this.requestsBySession.size > RATE_LIMIT_MAP_GC_THRESHOLD) {
      for (const [key, value] of this.requestsBySession) {
        if (value.resetAt <= now) this.requestsBySession.delete(key);
      }
    }

    const current = this.requestsBySession.get(sessionId);
    if (!current || current.resetAt <= now) {
      this.requestsBySession.set(sessionId, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      });
      return false;
    }

    current.count += 1;
    return current.count > RATE_LIMIT_REQUESTS;
  }
}

const rateLimiter = new InMemoryRateLimitStrategy();

const OFF_TOPIC_RESPONSE =
  "Xin lỗi, mình chỉ hỗ trợ các câu hỏi về laptop, linh kiện và phụ kiện máy tính. Bạn cần mình tư vấn gì về laptop không?";






function createStaticTextStreamResponse(text: string, traceId: string): Response {
  const textId = nanoid();
  const encoder = new TextEncoder();


  const words = text.split(/( )/);
  const CHUNK_DELAY_MS = 30;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`));
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "text-start", id: textId })}\n\n`),
      );

      for (const word of words) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text-delta", id: textId, delta: word })}\n\n`,
          ),
        );
        await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
      }

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "text-end", id: textId })}\n\n`),
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "finish", finishReason: "stop" })}\n\n`,
        ),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-vercel-ai-ui-message-stream": "v1",
      "X-AI-Trace-Id": traceId,
    },
  });
}

export class ChatFacade {
  async handle(request: Request, userId?: string) {
    const traceId = createAiTrace("chat", userId ?? null);
    if (rateLimiter.isLimited(getSessionId(request))) {
      return NextResponse.json({ error: CHAT_ERRORS.rateLimited }, { status: 429 });
    }

    const body = await parseBody(request);
    if (body instanceof Response) return body;

    const rawMessages =
      typeof body === 'object' && body !== null && 'messages' in body
        ? (body as { messages: JsonValue }).messages
        : undefined;
    const validation = await safeValidateUIMessages({ messages: rawMessages });

    if (
      !validation.success ||
      validation.data.length === 0 ||
      validation.data.length > MAX_MESSAGES ||
      getTextLength(validation.data) > MAX_TEXT_LENGTH
    ) {
      return NextResponse.json({ error: CHAT_ERRORS.invalidRequest }, { status: 400 });
    }

    const context = buildChatContext(validation.data);
    appendAiTrace(traceId, "chat.input", {
      messages: validation.data.map((message) => ({
        role: message.role,
        text: getMessageText(message),
      })),
    });
    appendAiTrace(traceId, "chat.context", context);

    const withinScope = isWithinLaptopScope(validation.data);
    appendAiTrace(traceId, "chat.scope", { withinScope });
    if (!withinScope) {
      return createStaticTextStreamResponse(OFF_TOPIC_RESPONSE, traceId);
    }

    const personalizedRequest = isPersonalizedRecommendationRequest(context);
    const recommendations =
      personalizedRequest && userId
        ? await new RecommendationService().getRecommendations({
            userId,
            sessionId: null,
            limit: 5,
            useAi: Boolean(process.env.DEEPSEEK_API_KEY),
            contextualKeywords: context.recommendationKeywords,
            traceId,
          })
        : null;
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (recommendations?.items.length && !apiKey) {
      return buildGroundedRecommendationResponse(recommendations, context, traceId);
    }

    if (!apiKey) {
      return NextResponse.json({ error: CHAT_ERRORS.notConfigured }, { status: 503 });
    }

    const contextPrompt = formatChatContext(context);
    const systemPrompt = recommendations?.items.length
      ? `${SYSTEM_PROMPT}\n\n${contextPrompt}\n\n${buildRecommendationContext(recommendations)}`
      : `${SYSTEM_PROMPT}\n\n${contextPrompt}`;
    appendAiTrace(traceId, "chat.ai.input", {
      model: process.env.DEEPSEEK_MODEL || DEEPSEEK_MODEL,
      systemPrompt,
      contextMessages: validation.data.slice(-MAX_CONTEXT_MESSAGES).map((message) => ({
        role: message.role,
        text: getMessageText(message),
      })),
    });
    const strategy: ChatProviderStrategy = new DeepSeekAdapter(apiKey, systemPrompt, traceId);
    return strategy.stream(validation.data);
  }
}

async function parseBody(request: Request): Promise<JsonValue | Response> {
  try {
    return (await request.json()) as JsonValue;
  } catch {
    return NextResponse.json({ error: CHAT_ERRORS.invalidBody }, { status: 400 });
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  return forwardedFor?.split(',')[0]?.trim() || CHAT_ERRORS.fallbackIp;
}

function getSessionId(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
  return match?.[1]?.trim() || getClientIp(request);
}

function getTextLength(messages: UIMessage[]) {
  return messages.reduce(
    (total, message) =>
      total +
      message.parts.reduce(
        (messageTotal, part) => messageTotal + (part.type === 'text' ? part.text.length : 0),
        0,
      ),
    0,
  );
}

function isPersonalizedRecommendationRequest(context: ChatContext) {
  const text = normalizeText(context.currentRequest);
  const phrases = [
    "phù hợp với tôi",
    "hợp với tôi",
    "gợi ý sản phẩm cho tôi",
    "tôi nên mua máy nào",
    "dựa vào lịch sử",
    "dựa trên lịch sử",
    "tư vấn laptop phù hợp",
    "recommend for me",
    "goi y",
    "tu van",
    "nen chon",
    "nen mua",
    "may nao",
    "mau nao",
    "lua chon",
  ];

  return (
    phrases.some((phrase) => text.includes(normalizeText(phrase))) ||
    context.useCases.length > 0 ||
    context.budget !== null
  );
}

function buildRecommendationContext(recommendations: RecommendationResult) {
  const products = recommendations.items.map((item) => ({
    productId: item.id,
    name: item.name,
    url: `/products/${item.slug}`,
    price: item.price,
    salePrice: item.salePrice,
    stock: item.stock,
    brand: item.brand,
    category: item.category,
    reason: item.reason,
  }));

  return [
    "NGỮ CẢNH ĐỀ XUẤT CÁ NHÂN HÓA:",
    recommendations.hasHistory
      ? "Danh sách dưới đây được backend tạo từ lịch sử xem, tìm kiếm và mua hàng."
      : "Người dùng chưa có đủ lịch sử; đây là danh sách bán chạy/mới/đang giảm giá.",
    "Chỉ được giới thiệu productId có trong JSON này. Không sửa tên, giá, tồn kho hoặc URL.",
    "Trả lời bằng tiếng Việt như nhân viên tư vấn: nêu nhu cầu suy ra, tầm giá, mẫu ưu tiên và lý do.",
    JSON.stringify(products),
  ].join("\n");
}

function buildGroundedRecommendationResponse(
  recommendations: RecommendationResult,
  context: ChatContext,
  traceId: string,
) {
  const lines = recommendations.items.slice(0, 5).map((item, index) => {
    const price = item.salePrice ?? item.price;
    const originalPrice =
      item.salePrice && item.salePrice < item.price
        ? ` (giá gốc ${item.price.toLocaleString("vi-VN")} ₫)`
        : "";
    return [
      `${index + 1}. ${item.name}`,
      `   Giá: ${price.toLocaleString("vi-VN")} ₫${originalPrice}`,
      `   ${item.brand} · ${item.category} · còn ${item.stock} máy`,
      `   Lý do: ${item.reason}`,
      `   Xem: /products/${item.slug}`,
    ].join("\n");
  });
  const needSummary = [
    context.useCases.length ? `nhu cầu ${context.useCases.join(", ")}` : "",
    context.budget
      ? `ngân sách ${
          context.budget.min ? `từ ${context.budget.min.toLocaleString("vi-VN")} ₫` : ""
        }${
          context.budget.min && context.budget.max ? " đến " : ""
        }${context.budget.max ? `${context.budget.max.toLocaleString("vi-VN")} ₫` : ""}`
      : "",
    context.constraints.length ? `ưu tiên ${context.constraints.join(", ")}` : "",
  ].filter(Boolean).join(", ");
  const intro = recommendations.hasHistory
    ? `Dựa trên ${needSummary || "nhu cầu hiện tại"} và lịch sử của bạn, mình ưu tiên:`
    : `Dựa trên ${needSummary || "nhu cầu hiện tại"}, mình ưu tiên:`;

  const output = `${intro}\n\n${lines.join("\n\n")}\n\nMình nghiêng về mẫu đầu tiên vì đang có điểm phù hợp tổng thể cao nhất. Mọi tên, giá và tồn kho trên đây đều lấy trực tiếp từ database.\n\n<!--SUGGESTIONS:["So sánh hai mẫu đầu tiên","Xem cấu hình mẫu đầu tiên","Mẫu nào nhẹ và pin lâu hơn?"]-->`;
  appendAiTrace(traceId, "chat.groundedRecommendation.output", { text: output });
  return createStaticTextStreamResponse(output, traceId);
}
