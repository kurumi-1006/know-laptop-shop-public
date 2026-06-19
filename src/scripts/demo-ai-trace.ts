import "dotenv/config";
import prisma from "@/lib/prisma";
import { ChatFacade } from "@/features/chat/lib/chat-facade";
import {
  createAiTrace,
  getAiTracesForUser,
} from "@/features/chat/lib/ai-trace";
import { RecommendationService } from "@/features/recommendation/lib/recommendation.service";

async function main() {
  process.env.AI_TRACE_ENABLED = "true";
  const email = process.env.DEMO_USER_EMAIL || "minh.customer@know.test";
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) throw new Error(`Không tìm thấy user demo ${email}. Hãy chạy seed trước.`);

  const recommendationInput = {
    userId: user.id,
    sessionId: null,
    limit: 5,
    useAi: false,
    contextualKeywords: [
      "laptop lập trình Docker",
      "khoảng 20 đến 30 triệu",
      "RAM 16GB",
      "pin lâu",
    ],
  };
  const recommendationTraceId = createAiTrace("recommendation", user.id);
  const recommendationOutput = await new RecommendationService().getRecommendations({
    ...recommendationInput,
    traceId: recommendationTraceId,
  });

  console.log("\n=== RECOMMENDATION INPUT ===");
  console.log(JSON.stringify(recommendationInput, null, 2));
  console.log("\n=== RECOMMENDATION OUTPUT ===");
  console.log(JSON.stringify(recommendationOutput, null, 2));

  const messages = [
    {
      id: "demo-user-1",
      role: "user",
      parts: [{ type: "text", text: "Tôi cần laptop ASUS để lập trình Docker." }],
    },
    {
      id: "demo-assistant-1",
      role: "assistant",
      parts: [{ type: "text", text: "Bạn có ngân sách và yêu cầu di động thế nào?" }],
    },
    {
      id: "demo-user-2",
      role: "user",
      parts: [{ type: "text", text: "Khoảng 20 đến 30 triệu, RAM 16GB và pin lâu. Gợi ý cho tôi." }],
    },
  ];
  const request = new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const response = await new ChatFacade().handle(request, user.id);
  await response.text();
  const chatTraceId = response.headers.get("X-AI-Trace-Id");
  const traces = getAiTracesForUser(user.id, 10);

  console.log("\n=== CHAT INPUT ===");
  console.log(JSON.stringify(messages, null, 2));
  console.log("\n=== CHAT TRACE ===");
  console.log(
    JSON.stringify(
      traces.find((trace) => trace.id === chatTraceId) ?? { traceId: chatTraceId, events: [] },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
