"use client";

import { useState, useEffect } from "react";
import {
  useVouchers,
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
  useAssignVoucher,
  useRemoveVoucher,
} from "@/features/admin/hooks/use-vouchers";
import { useProducts } from "@/features/admin/hooks/use-products";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SEARCH_DEBOUNCE_MS, SKELETON_ROW_COUNT } from "@/features/admin/constants";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import {
  PlusIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  TicketIcon,
  CalendarIcon,
  InfoIcon,
  LaptopIcon,
  FolderTreeIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

type VoucherRow = { id: string; code: string; name?: string; discountType: string; discountValue: number; minOrderValue: number; maxDiscountValue?: number | null; quantity: number; usedCount: number; startDate: string; endDate: string; isActive: boolean; productCoupons?: Array<{ couponId: string; productId: string; product?: { id: string; name: string } }> };
type VoucherProductLink = { couponId: string; productId: string; product?: { id: string; name: string } };
type AssignProduct = { id: string; name: string; price?: number; status?: string; productCoupons?: Array<{ couponId: string }> };

export function VoucherManagement() {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "assign">("list");


  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);

  const { data: vouchersData, isLoading, isError, error } = useVouchers({
    page,
    pageSize,
    search: debouncedSearch,
  });


  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherRow | null>(null);


  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscountValue, setMaxDiscountValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isActive, setIsActive] = useState(true);


  const [assignMode, setAssignMode] = useState<"voucher-to-products" | "product-to-vouchers">("voucher-to-products");


  const [assignSelectedVoucherId, setAssignSelectedVoucherId] = useState<string>("");
  const [assignProductSearch, setAssignProductSearch] = useState("");
  const [assignProductPage, setAssignProductPage] = useState(1);


  const [assignSelectedProductId, setAssignSelectedProductId] = useState<string>("");
  const [assignVoucherSearch, setAssignVoucherSearch] = useState("");
  const [assignVoucherPage, setAssignVoucherPage] = useState(1);



  const { data: allVouchersForAssign } = useVouchers(
    { page: 1, pageSize: 1000, search: "" },
    { enabled: activeSubTab === "assign" }
  );


  const { data: productsForAssignData, isLoading: isLoadingProducts } = useProducts(
    {
      page: assignProductPage,
      pageSize: 10,
      search: assignProductSearch,
      status: "active",
      categoryId: "all",
      brandId: "all",
      sortBy: "name",
      sortOrder: "asc",
    },
    {
      enabled: activeSubTab === "assign" && assignMode === "voucher-to-products" && !!assignSelectedVoucherId
    }
  );


  const { data: productsForVoucherAssignData } = useProducts(
    {
      page: assignVoucherPage,
      pageSize: 1000,
      search: "",
      status: "active",
      categoryId: "all",
      brandId: "all",
      sortBy: "name",
      sortOrder: "asc",
    },
    { enabled: activeSubTab === "assign" }
  );


  const createVoucherMutation = useCreateVoucher();
  const updateVoucherMutation = useUpdateVoucher();
  const deleteVoucherMutation = useDeleteVoucher();
  const assignVoucherMutation = useAssignVoucher();
  const removeVoucherMutation = useRemoveVoucher();


  const formatDateTimeLocal = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };


  useEffect(() => {
    if (selectedVoucher) {
      setCode(selectedVoucher.code || "");
      setName(selectedVoucher.name || "");
      setDiscountType(selectedVoucher.discountType || "percent");
      setDiscountValue(String(selectedVoucher.discountValue || ""));
      setStartDate(formatDateTimeLocal(selectedVoucher.startDate));
      setEndDate(formatDateTimeLocal(selectedVoucher.endDate));
      setMinOrderValue(String(selectedVoucher.minOrderValue || "0"));
      setMaxDiscountValue(selectedVoucher.maxDiscountValue ? String(selectedVoucher.maxDiscountValue) : "");
      setQuantity(String(selectedVoucher.quantity || "0"));
      setIsActive(selectedVoucher.isActive !== undefined ? selectedVoucher.isActive : true);
    } else {
      setCode("");
      setName("");
      setDiscountType("percent");
      setDiscountValue("");
      setStartDate("");
      setEndDate("");
      setMinOrderValue("0");
      setMaxDiscountValue("");
      setQuantity("");
      setIsActive(true);
    }
  }, [selectedVoucher]);

  const handleOpenAdd = () => {
    setSelectedVoucher(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (voucher: VoucherRow) => {
    setSelectedVoucher(voucher);
    setDialogOpen(true);
  };

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Vui lòng nhập mã voucher");
      return;
    }
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      toast.error("Giá trị giảm giá phải lớn hơn 0");
      return;
    }
    if (discountType === "percent" && val > 100) {
      toast.error("Phần trăm giảm giá tối đa là 100%");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn thời hạn áp dụng");
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      toast.error("Ngày kết thúc phải lớn hơn ngày bắt đầu");
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Số lượng sử dụng phải lớn hơn 0");
      return;
    }

    const values = {
      code,
      name,
      discountType,
      discountValue: val,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      minOrderValue: parseFloat(minOrderValue) || 0,
      maxDiscountValue: maxDiscountValue ? parseFloat(maxDiscountValue) : null,
      quantity: qty,
      isActive,
    };

    try {
      if (selectedVoucher) {
        await updateVoucherMutation.mutateAsync({ id: selectedVoucher.id, values });
        toast.success("Cập nhật voucher thành công");
      } else {
        await createVoucherMutation.mutateAsync(values);
        toast.success("Tạo voucher thành công");
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Đã xảy ra lỗi"));
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa (soft delete) voucher này không?")) {
      try {
        await deleteVoucherMutation.mutateAsync(id);
        toast.success("Đã xóa voucher thành công");
      } catch (err) {
        toast.error("Không thể xóa voucher");
      }
    }
  };


  const handleToggleProductAssignment = async (productId: string, isAssigned: boolean) => {
    if (!assignSelectedVoucherId) return;
    const vId = assignSelectedVoucherId;

    try {
      if (isAssigned) {

        await removeVoucherMutation.mutateAsync({ voucherId: vId, productId });
        toast.success("Đã ngắt liên kết sản phẩm");
      } else {

        await assignVoucherMutation.mutateAsync({ voucherId: vId, productIds: [productId] });
        toast.success("Đã liên kết sản phẩm");
      }
    } catch (err) {
      toast.error("Lỗi thay đổi phân bổ");
    }
  };

  const handleToggleVoucherAssignment = async (voucherId: string, isAssigned: boolean) => {
    if (!assignSelectedProductId) return;
    const pId = assignSelectedProductId;


    const product = productsForVoucherAssignData?.data.find((p: AssignProduct) => p.id === pId);
    if (!product) return;

    const currentVoucherIds: string[] = product.productCoupons.map((pc: { couponId: string }) => pc.couponId);
    let newVoucherIds: string[];

    if (isAssigned) {
      newVoucherIds = currentVoucherIds.filter((id) => id !== voucherId);
    } else {
      newVoucherIds = [...currentVoucherIds, voucherId];
    }

    try {
      await assignVoucherMutation.mutateAsync({ productId: pId, voucherIds: newVoucherIds });
      toast.success(isAssigned ? "Đã gỡ voucher khỏi sản phẩm" : "Đã áp dụng voucher cho sản phẩm");
    } catch (err) {
      toast.error("Lỗi thay đổi phân bổ");
    }
  };


  const getVoucherStatus = (v: VoucherRow) => {
    if (!v.isActive) return { label: "Inactive", variant: "secondary" as const };
    const now = new Date();
    const start = new Date(v.startDate);
    const end = new Date(v.endDate);
    if (now < start) return { label: "Sắp diễn ra", variant: "outline" as const };
    if (now > end) return { label: "Hết hạn", variant: "destructive" as const };
    if (v.usedCount >= v.quantity) return { label: "Hết lượt dùng", variant: "destructive" as const };
    return { label: "Đang hiệu lực", variant: "default" as const };
  };

  const pagination = vouchersData?.pagination;
  const stats = vouchersData?.stats;


  const currentAssignVoucher = allVouchersForAssign?.data.find(
    (v: VoucherRow) => v.id === assignSelectedVoucherId
  );


  const currentAssignProduct = productsForVoucherAssignData?.data.find(
    (p: AssignProduct) => p.id === assignSelectedProductId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Quản lý cửa hàng</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Voucher & Khuyến mãi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thiết lập các chương trình giảm giá và phân bổ áp dụng cho từng dòng sản phẩm.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeSubTab === "list" ? "default" : "outline"}
            onClick={() => setActiveSubTab("list")}
          >
            <TicketIcon className="mr-2 size-4" /> Danh sách
          </Button>
          <Button
            variant={activeSubTab === "assign" ? "default" : "outline"}
            onClick={() => setActiveSubTab("assign")}
          >
            <FolderTreeIcon className="mr-2 size-4" /> Phân bổ sản phẩm
          </Button>
          {activeSubTab === "list" && (
            <Button onClick={handleOpenAdd}>
              <PlusIcon className="mr-2 size-4" /> Tạo voucher mới
            </Button>
          )}
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Tổng mã giảm giá", value: stats?.total, icon: TicketIcon },
            { label: "Đang hiệu lực", value: stats?.active, icon: CheckCircle2Icon },
            { label: "Hết hạn", value: stats?.expired, icon: ClockIcon },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {isLoading && !vouchersData ? (
                    <Skeleton className="mt-2 h-7 w-12" />
                  ) : (
                    <p className="mt-1 text-2xl font-semibold">{value ?? 0}</p>
                  )}
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeSubTab === "list" ? (
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Danh sách Voucher</CardTitle>
                <CardDescription>
                  {pagination?.total ?? 0} mã giảm giá
                </CardDescription>
              </div>
              <div className="relative min-w-64">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo mã hoặc tên voucher..."
                  value={search}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Mã</TableHead>
                  <TableHead>Tên chương trình</TableHead>
                  <TableHead>Mức giảm giá</TableHead>
                  <TableHead>Đơn tối thiểu</TableHead>
                  <TableHead>Lượt dùng</TableHead>
                  <TableHead>Thời gian hiệu lực</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>SP Áp dụng</TableHead>
                  <TableHead className="w-12 pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="pl-5"><Skeleton className="h-4 w-20 font-bold" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell className="pr-5"><Skeleton className="size-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                  : vouchersData?.data.map((voucher: VoucherRow) => {
                    const statusInfo = getVoucherStatus(voucher);
                    return (
                      <TableRow key={voucher.id}>
                        <TableCell className="pl-5 font-mono font-bold text-primary">{voucher.code}</TableCell>
                        <TableCell className="font-medium">{voucher.name || "Không tên"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-semibold text-sm">
                            {voucher.discountType === "percent"
                              ? `${voucher.discountValue}%`
                              : `${Number(voucher.discountValue).toLocaleString("vi-VN")} VND`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {Number(voucher.minOrderValue).toLocaleString("vi-VN")} VND
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="font-semibold">{voucher.usedCount}</span> / {voucher.quantity}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="size-3 text-muted-foreground" />
                            <span>Bắt đầu: {new Date(voucher.startDate).toLocaleString("vi-VN")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="size-3 text-muted-foreground" />
                            <span>Kết thúc: {new Date(voucher.endDate).toLocaleString("vi-VN")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {voucher.productCoupons?.length || 0} sản phẩm
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon-sm" variant="ghost">
                                <MoreHorizontalIcon className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => handleOpenEdit(voucher)}>
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleDeleteVoucher(voucher.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>

            {!isLoading && vouchersData?.data.length === 0 && (
              <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
                <TicketIcon className="size-8 text-muted-foreground" />
                <p className="mt-3 font-medium">Không tìm thấy voucher nào</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tạo voucher mới hoặc thay đổi từ khóa tìm kiếm.
                </p>
              </div>
            )}

            {isError && (
              <div className="p-6 text-center text-sm text-destructive">
                {error.message}
              </div>
            )}

            {pagination && (
              <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Số hàng hiển thị</span>
                  <Select
                    onValueChange={(val) => {
                      setPageSize(Number(val));
                      setPage(1);
                    }}
                    value={String(pageSize)}
                  >
                    <SelectTrigger className="h-8 w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>
                    {pagination.total === 0
                      ? "0"
                      : `${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                        pagination.page * pagination.pageSize,
                        pagination.total
                      )}`}{" "}
                    trên tổng {pagination.total}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mr-1 text-xs text-muted-foreground">
                    Trang {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    disabled={page <= 1}
                    onClick={() => setPage((val) => val - 1)}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeftIcon /> Trước
                  </Button>
                  <Button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((val) => val + 1)}
                    size="sm"
                    variant="outline"
                  >
                    Sau <ChevronRightIcon />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Chế độ phân bổ</CardTitle>
              <CardDescription>Chọn cách liên kết Voucher với dòng sản phẩm laptop.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button
                  variant={assignMode === "voucher-to-products" ? "default" : "outline"}
                  onClick={() => {
                    setAssignMode("voucher-to-products");
                    setAssignSelectedProductId("");
                  }}
                  className="justify-start text-left"
                >
                  <TicketIcon className="mr-2 size-4" /> Theo Voucher
                </Button>
                <Button
                  variant={assignMode === "product-to-vouchers" ? "default" : "outline"}
                  onClick={() => {
                    setAssignMode("product-to-vouchers");
                    setAssignSelectedVoucherId("");
                  }}
                  className="justify-start text-left"
                >
                  <LaptopIcon className="mr-2 size-4" /> Theo Laptop sản phẩm
                </Button>
              </div>

              <div className="border-t pt-4 space-y-3">
                <Label>
                  {assignMode === "voucher-to-products" ? "Chọn Voucher nguồn" : "Chọn Sản phẩm nguồn"}
                </Label>
                {assignMode === "voucher-to-products" ? (
                  <Select onValueChange={setAssignSelectedVoucherId} value={assignSelectedVoucherId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn voucher..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allVouchersForAssign?.data.map((v: VoucherRow) => (
                        <SelectItem key={v.id} value={String(v.id)}>
                          [{v.code}] {v.name || "Voucher"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select onValueChange={setAssignSelectedProductId} value={assignSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sản phẩm..." />
                    </SelectTrigger>
                    <SelectContent>
                      {productsForVoucherAssignData?.data.map((p: AssignProduct) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          [{p.id}] {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {                    }
              {assignMode === "voucher-to-products" && currentAssignVoucher && (
                <div className="bg-muted p-3 rounded-lg border text-sm space-y-2">
                  <div className="font-semibold text-primary">Voucher: {currentAssignVoucher.code}</div>
                  <div>Giá trị: {currentAssignVoucher.discountType === "percent" ? `${currentAssignVoucher.discountValue}%` : `${Number(currentAssignVoucher.discountValue).toLocaleString("vi-VN")} VND`}</div>
                  <div>Áp dụng: {currentAssignVoucher.productCoupons?.length || 0} sản phẩm laptop</div>
                </div>
              )}

              {assignMode === "product-to-vouchers" && currentAssignProduct && (
                <div className="bg-muted p-3 rounded-lg border text-sm space-y-2">
                  <div className="font-semibold text-primary">{currentAssignProduct.name}</div>
                  <div>Giá gốc: {Number(currentAssignProduct.price).toLocaleString("vi-VN")} VND</div>
                  <div>Số lượng áp dụng: {currentAssignProduct.productCoupons?.length || 0} voucher</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>
                    {assignMode === "voucher-to-products" ? "Liên kết sản phẩm laptop" : "Liên kết mã giảm giá"}
                  </CardTitle>
                  <CardDescription>
                    {assignMode === "voucher-to-products"
                      ? "Đánh dấu vào sản phẩm laptop muốn áp dụng mã giảm giá này."
                      : "Đánh dấu vào mã giảm giá muốn áp dụng cho laptop này."}
                  </CardDescription>
                </div>

                {assignMode === "voucher-to-products" && (
                  <div className="relative max-w-xs">
                    <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-8 h-8 text-xs"
                      onChange={(e) => {
                        setAssignProductSearch(e.target.value);
                        setAssignProductPage(1);
                      }}
                      placeholder="Tìm laptop..."
                      value={assignProductSearch}
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {assignMode === "voucher-to-products" ? (
                !assignSelectedVoucherId ? (
                  <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                    <InfoIcon className="size-6 mb-2" />
                    Vui lòng chọn Voucher nguồn ở cột bên trái để hiển thị danh sách sản phẩm.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center">Chọn</TableHead>
                            <TableHead className="w-16">ID</TableHead>
                            <TableHead>Tên sản phẩm</TableHead>
                            <TableHead>Giá gốc</TableHead>
                            <TableHead>Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingProducts ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-center"><Skeleton className="size-4 mx-auto rounded" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-6" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                              </TableRow>
                            ))
                          ) : (
                            productsForAssignData?.data.map((product: AssignProduct) => {
                              const isAssigned = currentAssignVoucher.productCoupons.some(
                                (pc: VoucherProductLink) => pc.productId === product.id
                              );
                              return (
                                <TableRow key={product.id} className={isAssigned ? "bg-primary/5" : ""}>
                                  <TableCell className="text-center">
                                    <Checkbox
                                      checked={isAssigned}
                                      onCheckedChange={() => handleToggleProductAssignment(product.id, isAssigned)}
                                    />
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">{product.id}</TableCell>
                                  <TableCell className="font-medium">{product.name}</TableCell>
                                  <TableCell className="text-sm">
                                    {Number(product.price).toLocaleString("vi-VN")} VND
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={product.status === "active" ? "default" : "secondary"}>
                                      {product.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {productsForAssignData?.pagination && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>Trang {assignProductPage} / {productsForAssignData.pagination.totalPages}</span>
                        <div className="flex gap-1">
                          <Button
                            disabled={assignProductPage <= 1}
                            onClick={() => setAssignProductPage((val) => val - 1)}
                            size="icon"
                            variant="outline"
                            className="size-7"
                          >
                            <ChevronLeftIcon className="size-3.5" />
                          </Button>
                          <Button
                            disabled={assignProductPage >= productsForAssignData.pagination.totalPages}
                            onClick={() => setAssignProductPage((val) => val + 1)}
                            size="icon"
                            variant="outline"
                            className="size-7"
                          >
                            <ChevronRightIcon className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (

                !assignSelectedProductId ? (
                  <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
                    <InfoIcon className="size-6 mb-2" />
                    Vui lòng chọn Sản phẩm nguồn ở cột bên trái để hiển thị danh sách Voucher áp dụng.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 text-center">Chọn</TableHead>
                            <TableHead>Mã</TableHead>
                            <TableHead>Tên voucher</TableHead>
                            <TableHead>Giảm giá</TableHead>
                            <TableHead>Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allVouchersForAssign?.data.map((voucher: VoucherRow) => {
                            const isAssigned = currentAssignProduct.productCoupons.some(
                              (pc: { couponId: string }) => pc.couponId === voucher.id
                            );
                            const statusInfo = getVoucherStatus(voucher);
                            return (
                              <TableRow key={voucher.id} className={isAssigned ? "bg-primary/5" : ""}>
                                <TableCell className="text-center">
                                  <Checkbox
                                    checked={isAssigned}
                                    onCheckedChange={() => handleToggleVoucherAssignment(voucher.id, isAssigned)}
                                  />
                                </TableCell>
                                <TableCell className="font-mono font-bold text-primary">{voucher.code}</TableCell>
                                <TableCell className="font-medium">{voucher.name || "Không tên"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {voucher.discountType === "percent"
                                      ? `${voucher.discountValue}%`
                                      : `${Number(voucher.discountValue).toLocaleString("vi-VN")} VND`}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {(!allVouchersForAssign?.data || allVouchersForAssign.data.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                                Không tìm thấy voucher nào đang hoạt động.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {                          }
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedVoucher ? "Chỉnh sửa mã giảm giá" : "Tạo mã giảm giá mới"}</DialogTitle>
            <DialogDescription>
              Thiết lập thông tin và giới hạn sử dụng cho voucher khuyến mãi.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-2" onSubmit={handleSaveVoucher}>
            <div className="space-y-2">
              <Label htmlFor="v-code">Mã Voucher (viết liền không dấu)</Label>
              <Input
                id="v-code"
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ví dụ: LAPTOPNEW2026"
                value={code}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="v-name">Tên chương trình khuyến mãi</Label>
              <Input
                id="v-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Giảm giá hè rực rỡ"
                value={name}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v-type">Loại giảm giá</Label>
                <Select onValueChange={(val) => setDiscountType(val)} value={discountType}>
                  <SelectTrigger id="v-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Phần trăm (%)</SelectItem>
                    <SelectItem value="amount">Số tiền mặt (VND)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-val">Giá trị giảm giá</Label>
                <Input
                  id="v-val"
                  onChange={(e) => setDiscountValue(e.target.value)}
                  type="number"
                  placeholder={discountType === "percent" ? "Ví dụ: 10" : "Ví dụ: 500000"}
                  value={discountValue}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v-start">Ngày bắt đầu</Label>
                <Input
                  id="v-start"
                  onChange={(e) => setStartDate(e.target.value)}
                  type="datetime-local"
                  value={startDate}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-end">Ngày kết thúc</Label>
                <Input
                  id="v-end"
                  onChange={(e) => setEndDate(e.target.value)}
                  type="datetime-local"
                  value={endDate}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v-min">Đơn hàng tối thiểu (VND)</Label>
                <Input
                  id="v-min"
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  type="number"
                  value={minOrderValue}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-max">Giảm tối đa (VND - tùy chọn)</Label>
                <Input
                  id="v-max"
                  onChange={(e) => setMaxDiscountValue(e.target.value)}
                  type="number"
                  placeholder="Để trống nếu không giới hạn"
                  value={maxDiscountValue}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v-qty">Số lượt sử dụng tối đa</Label>
                <Input
                  id="v-qty"
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  placeholder="Ví dụ: 100"
                  value={quantity}
                  required
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center space-x-2 py-3">
                  <Checkbox
                    id="v-active"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(!!checked)}
                  />
                  <Label htmlFor="v-active" className="cursor-pointer font-normal">Kích hoạt voucher</Label>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t pt-4">
              <Button onClick={() => setDialogOpen(false)} type="button" variant="outline">
                Hủy bỏ
              </Button>
              <Button
                disabled={createVoucherMutation.isPending || updateVoucherMutation.isPending}
                type="submit"
              >
                {selectedVoucher ? "Lưu thay đổi" : "Tạo voucher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
