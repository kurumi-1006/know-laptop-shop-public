import type { UIMessage } from "ai";
import { normalizeVietnamese } from "@/lib/normalize-text";

const LAPTOP_SCOPE_TERMS = [

  "laptop", "notebook", "ultrabook", "macbook", "chromebook", "workstation",
  "may tinh xach tay", "may tinh", "2 in 1", "convertible", "copilot pc",

  "apple", "dell", "asus", "lenovo", "hp", "acer", "msi", "lg", "gigabyte",
  "razer", "microsoft", "samsung", "rog", "tuf", "legion", "loq", "thinkpad",
  "ideapad", "yoga", "vivobook", "zenbook", "expertbook", "inspiron", "latitude",
  "xps", "precision", "victus", "omen", "pavilion", "elitebook", "zbook",
  "nitro", "predator", "swift", "aspire", "katana", "cyborg", "surface",

  "cpu", "processor", "chip", "intel", "amd", "ryzen", "core i", "core ultra",
  "snapdragon x", "apple m1", "apple m2", "apple m3", "apple m4", "npu",
  "ram", "memory", "ddr4", "ddr5", "lpddr", "ssd", "nvme", "hdd", "o cung",
  "gpu", "vga", "card roi", "card do hoa", "graphics", "rtx", "gtx", "geforce",
  "radeon", "intel arc", "man hinh", "display", "oled", "mini led", "ips",
  "tan so quet", "hz", "2k", "3k", "4k", "pin", "battery", "sac", "charger",
  "usb c", "thunderbolt", "hdmi", "wifi", "bluetooth", "ban phim", "touchpad",
  "webcam", "loa", "tan nhiet", "fan", "nhiet do", "trong luong",

  "gaming", "choi game", "fps", "esport", "valorant", "lol", "cs2", "gta",
  "van phong", "office", "hoc tap", "sinh vien", "lap trinh", "coding",
  "developer", "docker", "may ao", "virtual machine", "do hoa", "render",
  "photoshop", "illustrator", "premiere", "after effects", "adobe", "autocad",
  "revit", "solidworks", "3d", "ai", "machine learning", "data science",
  "livestream", "edit video", "dung phim", "thiet ke", "ke toan",

  "gia", "ngan sach", "tam gia", "trieu", "mua", "tu van", "goi y", "so sanh",
  "compare", "san pham", "model", "phien ban", "cau hinh", "spec", "thong so",
  "ton kho", "stock", "con hang", "het hang", "khuyen mai", "giam gia",
  "voucher", "bao hanh", "warranty", "giao hang", "tra gop", "doi tra",
  "sua", "repair", "loi", "nang cap", "upgrade", "thay ram", "thay ssd",
  "windows", "macos", "linux", "ubuntu", "driver", "bios", "he dieu hanh",
  "phu kien", "linh kien", "accessory", "component", "dock", "hub",
];

const FOLLOW_UP_TERMS = [
  "mau nao", "may nao", "con mau", "cai nao", "loai nao", "chon cai",
  "thu nhat", "thu hai", "mau dau", "mau tren", "so sanh hai", "chi tiet hon",
  "tai sao", "co tot khong", "co nen mua", "con hang khong", "gia bao nhieu",
  "them lua chon", "doi thu", "phuong an khac", "re hon", "manh hon",
  "nhe hon", "pin lau hon", "neu vay", "the con", "ok", "duoc",
];

const OFF_TOPIC_TERMS = [
  "bong da", "thoi tiet", "nau an", "chinh tri", "tu vi", "xo so",
  "viet truyen", "lam tho", "tinh yeu", "benh an", "thuoc dieu tri",
];

export function isWithinLaptopScope(messages: UIMessage[]) {
  const userTexts = messages
    .filter((message) => message.role === "user")
    .map((message) => normalizeText(getMessageText(message)))
    .filter(Boolean);
  const latest = userTexts.at(-1) ?? "";

  if (!latest) return true;
  if (matchesAny(latest, LAPTOP_SCOPE_TERMS)) return true;

  const previousContext = userTexts.slice(-5, -1).join(" ");
  const hasLaptopContext = matchesAny(previousContext, LAPTOP_SCOPE_TERMS);
  const looksLikeFollowUp =
    latest.length <= 100 ||
    matchesAny(latest, FOLLOW_UP_TERMS) ||
    /^(con|the|vay|neu|ok|duoc|tai sao|so sanh|chi tiet)/.test(latest);

  if (hasLaptopContext && looksLikeFollowUp && !matchesAny(latest, OFF_TOPIC_TERMS)) {
    return true;
  }

  return false;
}

export function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();
}

export function normalizeText(value: string) {
  return normalizeVietnamese(value);
}

function matchesAny(text: string, terms: string[]) {
  const paddedText = ` ${text} `;
  return terms.some((term) => paddedText.includes(` ${term} `));
}
