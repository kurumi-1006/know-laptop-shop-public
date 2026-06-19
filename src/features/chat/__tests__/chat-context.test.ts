import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import { buildChatContext } from "../lib/chat-context";
import { isWithinLaptopScope } from "../lib/chat-scope";

function message(role: "user" | "assistant", text: string): UIMessage {
  return {
    id: crypto.randomUUID(),
    role,
    parts: [{ type: "text", text }],
  };
}

describe("laptop chat scope", () => {
  it("hiểu từ khóa tiếng Việt không dấu và dòng máy", () => {
    expect(isWithinLaptopScope([message("user", "tu van ThinkPad cho lap trinh Docker")])).toBe(true);
    expect(isWithinLaptopScope([message("user", "may mong nhe pin lau duoi 30 trieu")])).toBe(true);
  }); 

  it("giữ câu hỏi nối tiếp khi trước đó đang nói về laptop", () => {
    const messages = [
      message("user", "So sánh ASUS TUF và Lenovo LOQ cho gaming"),
      message("assistant", "Hai mẫu có ưu điểm khác nhau."),
      message("user", "Còn mẫu thứ hai thì pin thế nào?"),
    ];
    expect(isWithinLaptopScope(messages)).toBe(true);
  });

  it("từ chối chủ đề rõ ràng ngoài phạm vi", () => {
    expect(isWithinLaptopScope([message("user", "Dự báo thời tiết ngày mai")])).toBe(false);
  });
});

describe("chat context extraction", () => {
  it("trích xuất nhu cầu, hãng, ngân sách và cấu hình qua nhiều lượt", () => {
    const context = buildChatContext([
      message("user", "Tôi cần laptop ASUS để lập trình Docker"),
      message("assistant", "Bạn có ngân sách bao nhiêu?"),
      message("user", "Khoảng 20 đến 30 triệu, RAM 16GB và pin lâu"),
    ]);

    expect(context.brands).toContain("asus");
    expect(context.useCases).toContain("programming");
    expect(context.constraints).toContain("longBattery");
    expect(context.budget).toEqual({ min: 20_000_000, max: 30_000_000 });
    expect(context.mentionedSpecs).toContain("16gb ram");
  });
});
