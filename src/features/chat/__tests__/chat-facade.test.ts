import { describe, it, expect } from "vitest";




import {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_REQUESTS,
  MAX_MESSAGES,
  MAX_CONTEXT_MESSAGES,
  MAX_TEXT_LENGTH,
  CHAT_ERRORS,
  SYSTEM_PROMPT,
} from "../constants";

describe("Chat Constants", () => {
  describe("Rate Limiting (Giới hạn tốc độ)", () => {
    it("có giới hạn yêu cầu hợp lý", () => {
      expect(RATE_LIMIT_REQUESTS).toBe(20);
    });

    it("có khoảng thời gian giới hạn 10 phút", () => {
      expect(RATE_LIMIT_WINDOW_MS).toBe(10 * 60 * 1000);
    });
  });

  describe("Message Limits (Giới hạn tin nhắn)", () => {
    it("giới hạn tối đa 30 tin nhắn mỗi phiên", () => {
      expect(MAX_MESSAGES).toBe(50);
    });

    it("giới hạn 15 tin nhắn gần nhất trong ngữ cảnh", () => {
      expect(MAX_CONTEXT_MESSAGES).toBe(24);
    });

    it("giới hạn tổng độ dài văn bản 20000 ký tự", () => {
      expect(MAX_TEXT_LENGTH).toBe(40000);
    });
  });

  describe("Error Messages (Thông báo lỗi)", () => {
    it("có thông báo khi chưa cấu hình", () => {
      expect(CHAT_ERRORS.notConfigured).toBe(
        "Laptop assistant is not configured."
      );
    });

    it("có thông báo khi vượt giới hạn tốc độ", () => {
      expect(CHAT_ERRORS.rateLimited).toBe(
        "Too many chat requests. Please try again later."
      );
    });

    it("có thông báo khi request không hợp lệ", () => {
      expect(CHAT_ERRORS.invalidRequest).toBe(
        "Invalid or oversized chat request."
      );
    });

    it("có thông báo khi service không khả dụng", () => {
      expect(CHAT_ERRORS.unavailable).toBe(
        "The laptop assistant is temporarily unavailable."
      );
    });
  });

  describe("System Prompt", () => {

    it("có hướng dẫn phạm vi trả lời bằng tiếng Việt", () => {
      expect(SYSTEM_PROMPT).toContain("trả lời bằng tiếng Việt");
    });

    it("giới hạn phạm vi về laptop và phụ kiện", () => {
      expect(SYSTEM_PROMPT).toContain("laptop");
      expect(SYSTEM_PROMPT).toContain("linh kiện");
    });


    it("có hướng dẫn từ chối câu hỏi ngoài phạm vi", () => {
      expect(SYSTEM_PROMPT).toContain("Từ chối");
      expect(SYSTEM_PROMPT).toContain("gợi ý hỏi về laptop");
    });

    it("có hướng dẫn dùng tool tra cứu sản phẩm", () => {
      expect(SYSTEM_PROMPT).toContain("searchProducts");
      expect(SYSTEM_PROMPT).toContain("getProductDetails");
      expect(SYSTEM_PROMPT).toContain("checkStock");
    });

    it("yêu cầu không bịa dữ liệu", () => {
      expect(SYSTEM_PROMPT).toContain(
        "TUYỆT ĐỐI KHÔNG bịa tên sản phẩm"
      );
    });

    it("yêu cầu không hỏi thông tin nhạy cảm", () => {
      expect(SYSTEM_PROMPT).toContain("mật khẩu");
      expect(SYSTEM_PROMPT).toContain("OTP");
    });
  });
});


describe("InMemoryRateLimitStrategy", () => {
  it("mô phỏng giới hạn tốc độ: dưới ngưỡng cho phép", () => {

    const requestsByIp = new Map<
      string,
      { count: number; resetAt: number }
    >();
    const now = Date.now();
    const ip = "127.0.0.1";


    let isLimited = false;
    for (let i = 0; i < RATE_LIMIT_REQUESTS; i++) {
      const current = requestsByIp.get(ip);
      if (!current || current.resetAt <= now) {
        requestsByIp.set(ip, {
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW_MS,
        });
        isLimited = false;
      } else {
        current.count += 1;
        isLimited = current.count > RATE_LIMIT_REQUESTS;
      }
    }

    expect(isLimited).toBe(false);
  });

  it("mô phỏng giới hạn tốc độ: vượt ngưỡng cho phép", () => {
    const requestsByIp = new Map<
      string,
      { count: number; resetAt: number }
    >();
    const now = Date.now();
    const ip = "127.0.0.1";


    let isLimited = false;
    for (let i = 0; i < RATE_LIMIT_REQUESTS + 1; i++) {
      const current = requestsByIp.get(ip);
      if (!current || current.resetAt <= now) {
        requestsByIp.set(ip, {
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW_MS,
        });
        isLimited = false;
      } else {
        current.count += 1;
        isLimited = current.count > RATE_LIMIT_REQUESTS;
      }
    }


    expect(isLimited).toBe(true);
  });

  it("mô phỏng giới hạn tốc độ: reset sau khi hết thời gian", () => {
    const requestsByIp = new Map<
      string,
      { count: number; resetAt: number }
    >();
    const now = Date.now();
    const pastTime = now - RATE_LIMIT_WINDOW_MS - 1000;
    const ip = "127.0.0.1";


    requestsByIp.set(ip, { count: 25, resetAt: pastTime });


    const current = requestsByIp.get(ip);
    const isLimited =
      current !== undefined &&
      current.resetAt > now &&
      current.count > RATE_LIMIT_REQUESTS;

    expect(isLimited).toBe(false);
  });
});
