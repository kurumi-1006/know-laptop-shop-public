import { nanoid } from "nanoid";








export async function POST() {
  const encoder = new TextEncoder();
  const textId = nanoid();
  const testText =
    "Xin chào! Đây là phản hồi thử nghiệm streaming token-by-token từ API test. " +
    "Mỗi từ sẽ xuất hiện sau 100ms để bạn kiểm tra rằng giao diện hiển thị chữ dần dần. " +
    "Nếu bạn thấy toàn bộ văn bản xuất hiện cùng lúc thì stream chưa hoạt động đúng. " +
    "Laptop gaming Dell RTX 4060 giá 25.990.000 ₫ đang còn hàng.";
  const words = testText.split(" ");

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`),
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "text-start", id: textId })}\n\n`,
        ),
      );

      for (let i = 0; i < words.length; i++) {
        const delta = i < words.length - 1 ? words[i] + " " : words[i];
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text-delta", id: textId, delta })}\n\n`,
          ),
        );
        await new Promise((r) => setTimeout(r, 100));
      }


      const suggestionsMarker =
        '\n\n<!--SUGGESTIONS:["So sánh RTX 4060 và 4070","Kiểm tra tồn kho Dell gaming","Laptop gaming dưới 20 triệu"]-->';
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "text-delta", id: textId, delta: suggestionsMarker })}\n\n`,
        ),
      );

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "text-end", id: textId })}\n\n`,
        ),
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
    },
  });
}
