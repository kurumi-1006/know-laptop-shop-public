



export function formatCurrencyVN(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export function formatDateVN(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
