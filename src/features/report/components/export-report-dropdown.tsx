"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCSV } from "@/lib/download-csv.client";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

const reportItems = [
  {
    label: "Doanh thu theo ngày",
    href: "/api/admin/reports/revenue",
    filename: "doanh-thu.csv",
  },
  {
    label: "Danh sách đơn hàng",
    href: "/api/admin/reports/orders",
    filename: "danh-sach-don-hang.csv",
  },
  {
    label: "Sản phẩm bán chạy",
    href: "/api/admin/reports/best-selling-products",
    filename: "san-pham-ban-chay.csv",
  },
  {
    label: "Sản phẩm sắp hết hàng",
    href: "/api/admin/reports/low-stock-products",
    filename: "san-pham-sap-het-hang.csv",
  },
  {
    label: "Khách hàng thân thiết",
    href: "/api/admin/reports/top-customers",
    filename: "khach-hang-than-thiet.csv",
  },
  {
    label: "Đơn chờ xác nhận",
    href: "/api/admin/reports/pending-orders",
    filename: "don-cho-xac-nhan.csv",
  },
];

export function ExportReportDropdown() {
  async function handleExport(href: string, filename: string) {
    try {
      const url = new URL(href, window.location.origin);
      url.searchParams.set("format", "csv");
      await downloadCSV(url.toString(), filename);
      toast.success(`Đã xuất: ${filename}`);
    } catch {
      toast.error("Không thể xuất báo cáo. Vui lòng thử lại.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <DownloadIcon className="size-4" />
          Xuất báo cáo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Chọn báo cáo CSV</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {reportItems.map((item) => (
          <DropdownMenuItem
            key={item.href}
            onClick={() => handleExport(item.href, item.filename)}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
