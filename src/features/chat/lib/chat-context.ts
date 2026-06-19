import type { UIMessage } from "ai";
import { getMessageText, normalizeText } from "./chat-scope";

const BRANDS = [
  "apple", "dell", "asus", "lenovo", "hp", "acer", "msi", "lg",
  "gigabyte", "razer", "microsoft", "samsung",
];

const USE_CASES: Record<string, string[]> = {
  gaming: ["gaming", "choi game", "fps", "valorant", "cs2", "esport"],
  office: ["van phong", "office", "ke toan", "hop online", "word", "excel"],
  study: ["hoc tap", "sinh vien", "hoc sinh", "dai hoc"],
  programming: ["lap trinh", "coding", "developer", "docker", "may ao", "linux"],
  creative: ["do hoa", "render", "adobe", "photoshop", "premiere", "thiet ke", "3d"],
  engineering: ["autocad", "revit", "solidworks", "cad"],
  mobility: ["mong nhe", "di dong", "pin lau", "xach di", "cong tac"],
};

const CONSTRAINTS: Record<string, string[]> = {
  lightweight: ["mong nhe", "nhe", "duoi 1 5 kg"],
  longBattery: ["pin lau", "pin tot", "ca ngay"],
  strongCooling: ["tan nhiet", "mat", "it nong"],
  oled: ["oled", "man dep", "chuan mau"],
  upgradable: ["nang cap", "them ram", "thay ssd"],
  quiet: ["em", "it on", "fan nho"],
};

export interface ChatContext {
  recentUserMessages: string[];
  currentRequest: string;
  brands: string[];
  useCases: string[];
  constraints: string[];
  budget: { min: number | null; max: number | null } | null;
  mentionedSpecs: string[];
  recommendationKeywords: string[];
}

export function buildChatContext(messages: UIMessage[]): ChatContext {
  const recentUserMessages = messages
    .filter((message) => message.role === "user")
    .slice(-8)
    .map(getMessageText)
    .filter(Boolean);
  const combined = normalizeText(recentUserMessages.join(" "));
  const currentRequest = recentUserMessages.at(-1) ?? "";
  const brands = BRANDS.filter((brand) => combined.includes(brand));
  const useCases = matchGroups(combined, USE_CASES);
  const constraints = matchGroups(combined, CONSTRAINTS);
  const budget = extractBudget(combined);
  const mentionedSpecs = extractSpecs(combined);

  return {
    recentUserMessages,
    currentRequest,
    brands,
    useCases,
    constraints,
    budget,
    mentionedSpecs,
    recommendationKeywords: [
      currentRequest,
      ...useCases,
      ...constraints,
      ...brands,
      ...mentionedSpecs,
      budget?.max ? `dưới ${budget.max / 1_000_000} triệu` : "",
      budget?.min ? `trên ${budget.min / 1_000_000} triệu` : "",
    ].filter(Boolean),
  };
}

export function formatChatContext(context: ChatContext) {
  return [
    "NGỮ CẢNH HỘI THOẠI ĐÃ TRÍCH XUẤT:",
    JSON.stringify({
      currentRequest: context.currentRequest,
      recentUserMessages: context.recentUserMessages,
      brands: context.brands,
      useCases: context.useCases,
      constraints: context.constraints,
      budgetVnd: context.budget,
      mentionedSpecs: context.mentionedSpecs,
    }),
    "Hãy dùng cả các tin nhắn trước để hiểu câu hỏi nối tiếp như “mẫu thứ hai”, “còn mẫu rẻ hơn”, “pin thì sao”.",
    "Nếu dữ liệu còn thiếu để chọn sản phẩm, chỉ hỏi tối đa 2 câu về ngân sách hoặc nhu cầu quan trọng nhất.",
  ].join("\n");
}

function matchGroups(text: string, groups: Record<string, string[]>) {
  return Object.entries(groups)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([name]) => name);
}

function extractBudget(text: string) {
  const range = text.match(/(?:tu|khoang)\s*(\d{1,3})\s*(?:den|-)\s*(\d{1,3})\s*(?:trieu|tr)\b/);
  if (range) {
    return {
      min: Number(range[1]) * 1_000_000,
      max: Number(range[2]) * 1_000_000,
    };
  }

  const matches = [...text.matchAll(/\b(duoi|toi da|tren|tu)?\s*(\d{1,3})\s*(?:trieu|tr)\b/g)];
  const match = matches.at(-1);
  if (!match) return null;
  const amount = Number(match[2]) * 1_000_000;

  return ["tren", "tu"].includes(match[1] ?? "")
    ? { min: amount, max: null }
    : { min: null, max: amount };
}

function extractSpecs(text: string) {
  const patterns = [
    /\brtx\s*\d{4}\b/g, /\bgtx\s*\d{4}\b/g, /\b\d{1,2}\s*gb\s*ram\b/g,
    /\bram\s*\d{1,2}\s*gb\b/g, /\b\d{1,2}\s*gb\b/g,
    /\b(?:512\s*gb|1\s*tb|2\s*tb)(?:\s*ssd)?\b/g, /\bcore\s*(?:i[3579]|ultra\s*[579])\b/g,
    /\bryzen\s*[3579]\b/g, /\b(?:120|144|165|240)\s*hz\b/g,
  ];
  return [
    ...new Set(
      patterns
        .flatMap((pattern) => text.match(pattern) ?? [])
        .map((value) => value.replace(/^ram\s*(\d+\s*gb)$/i, "$1 ram")),
    ),
  ];
}
