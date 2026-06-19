import nodemailer from "nodemailer";
import { formatCurrencyVN, formatDateVN } from "@/lib/invoice-utils";

function getTransporter() {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!user || !password) {
    throw new Error("SMTP is not configured. Set SMTP_USER and SMTP_PASSWORD.");
  }
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass: password } });
}

const DEFAULT_FROM = process.env.EMAIL_FROM || `Know <${process.env.SMTP_USER}>`;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export async function sendEmail(options: SendEmailOptions) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: DEFAULT_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
}

export { formatCurrencyVN, formatDateVN };

export function generateInvoiceHtml(order: {
  orderCode: string;
  createdAt: Date | string;
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
    productBrand: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}): string {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;">
        <strong>${item.productName}</strong>
        ${item.productBrand ? `<br><span style="color:#78716c;font-size:12px;">${item.productBrand}</span>` : ""}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;font-size:14px;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;">${formatCurrencyVN(item.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-size:14px;font-weight:600;">${formatCurrencyVN(item.totalPrice)}</td>
    </tr>`,
    )
    .join("");

  const paymentLabel = order.paymentMethod === "stripe" ? "Stripe (Thẻ)" : "COD (Tiền mặt)";

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hóa đơn ${order.orderCode} - Know</title>
</head>
<body style="margin:0;background:#f6f4ef;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#292724;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border:1px solid #e6e1d8;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="height:6px;background:#f97316;"></td>
          </tr>
          <tr>
            <td style="padding:28px 36px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="width:36px;height:36px;border-radius:10px;background:#f97316;color:#ffffff;font-size:18px;font-weight:700;text-align:center;vertical-align:middle;">K</td>
                        <td style="padding-left:10px;font-size:20px;font-weight:700;color:#292724;">Know</td>
                      </tr>
                    </table>
                  </td>
                  <td style="text-align:right;font-size:20px;font-weight:700;color:#f97316;">HÓA ĐƠN</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order info -->
          <tr>
            <td style="padding:16px 36px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align:top;width:50%;padding-right:12px;">
                    <div style="font-size:12px;color:#a39d94;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Mã đơn hàng</div>
                    <div style="font-size:18px;font-weight:700;">${order.orderCode}</div>
                    <div style="font-size:12px;color:#6b655d;margin-top:4px;">${formatDateVN(order.createdAt)}</div>
                  </td>
                  <td style="vertical-align:top;width:50%;padding-left:12px;">
                    <div style="font-size:12px;color:#a39d94;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Thanh toán</div>
                    <div style="font-size:14px;font-weight:600;">${paymentLabel}</div>
                    ${order.note ? `<div style="font-size:12px;color:#6b655d;margin-top:4px;">Ghi chú: ${order.note}</div>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Receiver -->
          <tr>
            <td style="padding:0 36px 20px;">
              <div style="padding:14px 16px;border-radius:10px;background:#fafaf9;border:1px solid #eeeae3;">
                <div style="font-size:11px;color:#a39d94;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Người nhận</div>
                <div style="font-size:14px;font-weight:600;">${order.receiverName}</div>
                <div style="font-size:13px;color:#6b655d;margin-top:2px;">${order.receiverPhone}</div>
                <div style="font-size:13px;color:#6b655d;margin-top:2px;">${[order.street, order.wardName, order.districtName, order.provinceName].filter(Boolean).join(", ")}</div>
              </div>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:0 36px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-radius:10px;overflow:hidden;border:1px solid #eeeae3;">
                <thead>
                  <tr style="background:#fafaf9;">
                    <td style="padding:10px 12px;font-size:11px;font-weight:700;color:#a39d94;text-transform:uppercase;letter-spacing:0.5px;">Sản phẩm</td>
                    <td style="padding:10px 12px;font-size:11px;font-weight:700;color:#a39d94;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">SL</td>
                    <td style="padding:10px 12px;font-size:11px;font-weight:700;color:#a39d94;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Đơn giá</td>
                    <td style="padding:10px 12px;font-size:11px;font-weight:700;color:#a39d94;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">T.tiền</td>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding:16px 36px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align:right;padding:4px 0;font-size:13px;color:#6b655d;">Tạm tính:</td>
                  <td style="text-align:right;padding:4px 0;font-size:13px;width:130px;">${formatCurrencyVN(order.subtotal)}</td>
                </tr>
                <tr>
                  <td style="text-align:right;padding:4px 0;font-size:13px;color:#6b655d;">Phí vận chuyển:</td>
                  <td style="text-align:right;padding:4px 0;font-size:13px;width:130px;">${order.shippingFee === 0 ? "Miễn phí" : formatCurrencyVN(order.shippingFee)}</td>
                </tr>
                ${order.discountTotal > 0 ? `
                <tr>
                  <td style="text-align:right;padding:4px 0;font-size:13px;color:#22c55e;">Giảm giá:</td>
                  <td style="text-align:right;padding:4px 0;font-size:13px;color:#22c55e;width:130px;">-${formatCurrencyVN(order.discountTotal)}</td>
                </tr>` : ""}
                <tr>
                  <td colspan="2" style="padding:8px 0 0;border-top:2px solid #292724;"></td>
                </tr>
                <tr>
                  <td style="text-align:right;padding:8px 0 0;font-size:18px;font-weight:700;">Tổng cộng:</td>
                  <td style="text-align:right;padding:8px 0 0;font-size:18px;font-weight:700;width:130px;color:#f97316;">${formatCurrencyVN(order.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #eeeae3;padding:16px 36px;text-align:center;">
              <div style="font-size:13px;color:#292724;font-weight:600;">Cảm ơn bạn đã mua hàng tại Know!</div>
              <div style="font-size:11px;color:#a39d94;margin-top:4px;">Nếu có thắc mắc, vui lòng liên hệ hỗ trợ của chúng tôi.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
