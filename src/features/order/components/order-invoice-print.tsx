"use client";

import { Button } from "@/components/ui/button";
import { PrinterIcon } from "lucide-react";
import { formatCurrencyVN, formatDateVN } from "@/lib/invoice-utils";

interface InvoiceOrder {
  id: string;
  orderCode: string;
  createdAt: string;
  receiverName: string;
  receiverPhone: string;
  street: string | null;
  provinceName: string;
  districtName: string;
  wardName: string;
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  total: number;
  paymentMethod: string;
  note?: string | null;
  items: Array<{
    productName: string;
    productBrand?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export function OrderInvoicePrint({ order }: { order: InvoiceOrder }) {
  const handlePrint = () => {
    const paymentLabel = order.paymentMethod === "stripe" ? "Stripe (Thẻ)" : "COD (Tiền mặt)";

    const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Hóa đơn ${order.orderCode} - Know</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #292724; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #f97316; padding-bottom: 16px; }
    .brand { font-size: 24px; font-weight: 700; }
    .brand-accent { color: #f97316; }
    .invoice-title { font-size: 28px; font-weight: 700; color: #f97316; }
    .info-grid { display: flex; gap: 24px; margin-bottom: 20px; }
    .info-col { flex: 1; }
    .label { font-size: 11px; color: #a39d94; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .value { font-size: 14px; font-weight: 600; }
    .value-sm { font-size: 13px; color: #6b655d; margin-top: 2px; }
    .receiver-box { border: 1px solid #e6e1d8; border-radius: 8px; padding: 12px 16px; background: #fafaf9; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #fafaf9; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #a39d94; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    th.center { text-align: center; }
    th.right { text-align: right; }
    td { padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
    td.center { text-align: center; }
    td.right { text-align: right; }
    .totals { margin-left: auto; width: 300px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .totals-divider { border-top: 2px solid #292724; margin: 8px 0; }
    .totals-final { font-size: 18px; font-weight: 700; color: #f97316; }
    .discount { color: #22c55e; }
    .footer { margin-top: 32px; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
    .footer-text { font-size: 13px; font-weight: 600; }
    .footer-sub { font-size: 11px; color: #a39d94; margin-top: 4px; }
    @media print {
      body { padding: 20px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand"><span class="brand-accent">K</span>now</div>
      <div style="font-size:12px;color:#6b655d;">Cửa hàng Laptop</div>
    </div>
    <div class="invoice-title">HÓA ĐƠN</div>
  </div>

  <div class="info-grid">
    <div class="info-col">
      <div class="label">Mã đơn hàng</div>
      <div class="value" style="font-size:18px;">${order.orderCode}</div>
      <div class="value-sm">${formatDateVN(order.createdAt)}</div>
    </div>
    <div class="info-col" style="text-align:right;">
      <div class="label">Thanh toán</div>
      <div class="value">${paymentLabel}</div>
      ${order.note ? `<div class="value-sm">Ghi chú: ${order.note}</div>` : ""}
    </div>
  </div>

  <div class="receiver-box">
    <div class="label">Người nhận</div>
    <div class="value">${order.receiverName}</div>
    <div class="value-sm">${order.receiverPhone}</div>
    <div class="value-sm">${[order.street, order.wardName, order.districtName, order.provinceName].filter(Boolean).join(", ")}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Sản phẩm</th>
        <th class="center">SL</th>
        <th class="right">Đơn giá</th>
        <th class="right">T.tiền</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map(item => `
      <tr>
        <td>
          <strong>${item.productName}</strong>
          ${item.productBrand ? `<br><span style="color:#78716c;font-size:12px;">${item.productBrand}</span>` : ""}
        </td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrencyVN(item.unitPrice)}</td>
        <td class="right" style="font-weight:600;">${formatCurrencyVN(item.totalPrice)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Tạm tính:</span><span>${formatCurrencyVN(order.subtotal)}</span></div>
    <div class="totals-row"><span>Phí vận chuyển:</span><span>${order.shippingFee === 0 ? "Miễn phí" : formatCurrencyVN(order.shippingFee)}</span></div>
    ${order.discountTotal > 0 ? `<div class="totals-row discount"><span>Giảm giá:</span><span>-${formatCurrencyVN(order.discountTotal)}</span></div>` : ""}
    <div class="totals-divider"></div>
    <div class="totals-row totals-final"><span>Tổng cộng:</span><span>${formatCurrencyVN(order.total)}</span></div>
  </div>

  <div class="footer">
    <div class="footer-text">Cảm ơn bạn đã mua hàng tại Know!</div>
    <div class="footer-sub">Nếu có thắc mắc, vui lòng liên hệ hỗ trợ của chúng tôi.</div>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <PrinterIcon className="size-4" />
      In hóa đơn
    </Button>
  );
}
