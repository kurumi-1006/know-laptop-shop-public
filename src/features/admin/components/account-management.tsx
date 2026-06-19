"use client";

import type { ManagedAccount } from "@/features/admin/api/accounts";
import {
  createStaffSchema,
  type AccountKind,
  type CreateStaffValues,
  type UpdateAccountValues,
} from "@/features/admin/schemas/accounts";
import {
  useAccounts,
  useCreateStaff,
  useUpdateAccount,
} from "@/features/admin/hooks/use-accounts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EMPTY_STAFF_FORM, SEARCH_DEBOUNCE_MS, SKELETON_ROW_COUNT } from "@/features/admin/constants";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDistanceToNow } from "date-fns";
import {
  BanIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleOffIcon,
  Columns3Icon,
  MoreHorizontalIcon,
  SearchIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

type PendingAction = {
  account: ManagedAccount;
  values: UpdateAccountValues;
  title: string;
  description: string;
} | null;

type OptionalColumn = "status" | "details" | "lastActive" | "joined" | "actions";

const columnLabels: Record<OptionalColumn, string> = {
  status: "Trạng thái",
  details: "Vai trò / Giao hàng",
  lastActive: "Hoạt động cuối",
  joined: "Tham gia",
  actions: "Thao tác",
};

function getInitials(name: string | null, email: string) {
  return (name || email)
    .split(/[\s@]+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relativeDate(value: string | null) {
  if (!value) return "Chưa từng";
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function AccountManagement({ kind }: { kind: AccountKind }) {
  const isStaffPage = kind === "staff";
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const [status, setStatus] = useState<"all" | "active" | "banned">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [banReason, setBanReason] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<
    Record<OptionalColumn, boolean>
  >({
    status: true,
    details: true,
    lastActive: true,
    joined: true,
    actions: true,
  });
  const accounts = useAccounts({
    kind,
    page,
    pageSize,
    search: debouncedSearch,
    status,
  });
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateAccount();
  const createForm = useForm<CreateStaffValues>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: EMPTY_STAFF_FORM,
  });

  const confirmAction = async () => {
    if (!pendingAction) return;

    const values =
      pendingAction.values.action === "set-ban" &&
      pendingAction.values.banned
        ? { ...pendingAction.values, reason: banReason.trim() || undefined }
        : pendingAction.values;

    try {
      await updateMutation.mutateAsync({
        userId: pendingAction.account.id,
        values,
      });
      toast.success("Đã cập nhật tài khoản thành công.");
      setPendingAction(null);
      setBanReason("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật tài khoản.",
      );
    }
  };

  const submitStaff = createForm.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      toast.success("Đã tạo tài khoản nhân viên.");
      createForm.reset();
      setCreateOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo nhân viên.",
      );
    }
  });

  const queueBanChange = (account: ManagedAccount) => {
    setBanReason("");
    setPendingAction({
      account,
      values: { action: "set-ban", banned: !account.banned },
      title: account.banned ? "Khôi phục tài khoản này?" : "Khóa tài khoản này?",
      description: account.banned
        ? "Người dùng sẽ có thể đăng nhập lại."
        : "Tất cả phiên hoạt động sẽ bị thu hồi ngay lập tức.",
    });
  };

  const canManage = accounts.data?.permissions.canManage ?? false;
  const stats = accounts.data?.stats;
  const pagination = accounts.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">
            {isStaffPage ? "Tổ chức" : "Quản lý khách hàng"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {isStaffPage ? "Nhân viên" : "Khách hàng"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isStaffPage
              ? "Quản lý quyền truy cập và trạng thái tài khoản nhân viên."
              : "Xem xét tài khoản khách hàng, hoạt động, thiết lập giao hàng và quyền truy cập."}
          </p>
        </div>
        {isStaffPage && canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlusIcon />
            Thêm nhân viên
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: isStaffPage ? "Thành viên" : "Khách hàng",
            value: stats?.total,
            icon: UsersIcon,
          },
          {
            label: "Đang hoạt động",
            value: stats?.active,
            icon: CheckCircle2Icon,
          },
          {
            label: "Bị khóa",
            value: stats?.banned,
            icon: CircleOffIcon,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                {accounts.isLoading ? (
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

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                {isStaffPage ? "Danh sách nhân viên" : "Danh sách khách hàng"}
              </CardTitle>
              <CardDescription>
                {accounts.data?.pagination.total ?? 0} tài khoản phù hợp
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-64">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm tên hoặc email..."
                  value={search}
                />
              </div>
              <Select
                onValueChange={(value) => {
                  setStatus(value as "all" | "active" | "banned");
                  setPage(1);
                }}
                value={status}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="banned">Bị khóa</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="justify-start" variant="outline">
                    <Columns3Icon />
                    Cột
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Cột hiển thị</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(columnLabels) as OptionalColumn[]).map(
                    (column) => (
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns[column]}
                        key={column}
                        onCheckedChange={(checked) =>
                          setVisibleColumns((current) => ({
                            ...current,
                            [column]: checked === true,
                          }))
                        }
                      >
                        {columnLabels[column]}
                      </DropdownMenuCheckboxItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Tài khoản</TableHead>
                {visibleColumns.status && <TableHead>Trạng thái</TableHead>}
                {visibleColumns.details && (
                  <TableHead>{isStaffPage ? "Vai trò" : "Giao hàng"}</TableHead>
                )}
                {visibleColumns.lastActive && (
                  <TableHead>Hoạt động cuối</TableHead>
                )}
                {visibleColumns.joined && <TableHead>Tham gia</TableHead>}
                {visibleColumns.actions && (
                  <TableHead className="w-12 pr-5" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.isLoading
                ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-44" />
                          </div>
                        </div>
                      </TableCell>
                      {(Object.keys(columnLabels) as OptionalColumn[])
                        .filter((column) => visibleColumns[column])
                        .map((column) => (
                          <TableCell key={column}>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
                : accounts.data?.data.map((account) => {
                    const isSelf =
                      account.id === accounts.data.permissions.currentUserId;
                    return (
                      <TableRow key={account.id}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                alt={account.name ?? account.email}
                                src={account.image ?? undefined}
                              />
                              <AvatarFallback>
                                {getInitials(account.name, account.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  className="max-w-48 truncate font-medium hover:underline"
                                  href={`/dashboard/${isStaffPage ? "staff" : "users"}/${account.id}`}
                                >
                                  {account.name || "Tài khoản chưa đặt tên"}
                                </Link>
                                {isSelf && (
                                  <Badge variant="secondary">Bạn</Badge>
                                )}
                              </div>
                              <p className="max-w-56 truncate text-xs text-muted-foreground">
                                {account.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        {visibleColumns.status && (
                          <TableCell>
                            <Badge
                              variant={
                                account.banned ? "destructive" : "secondary"
                              }
                            >
                              {account.banned ? "Bị khóa" : "Hoạt động"}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.details && (
                          <TableCell>
                            {isStaffPage ? (
                              <Badge className="capitalize" variant="outline">
                                {account.role}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {account.addressCount} địa chỉ
                              </span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.lastActive && (
                          <TableCell className="text-muted-foreground">
                            {relativeDate(account.lastActiveAt)}
                          </TableCell>
                        )}
                        {visibleColumns.joined && (
                          <TableCell className="text-muted-foreground">
                            {relativeDate(account.createdAt)}
                          </TableCell>
                        )}
                        {visibleColumns.actions && (
                          <TableCell className="pr-5">
                          {canManage && !isSelf && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-label="Account actions"
                                  size="icon-sm"
                                  variant="ghost"
                                >
                                  <MoreHorizontalIcon />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>
                                  Quản lý tài khoản
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => queueBanChange(account)}
                                  variant={account.banned ? "default" : "destructive"}
                                >
                                  {account.banned ? (
                                    <CheckCircle2Icon />
                                  ) : (
                                    <BanIcon />
                                  )}
                                  {account.banned
                                    ? "Khôi phục tài khoản"
                                    : "Khóa tài khoản"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>

          {!accounts.isLoading && accounts.data?.data.length === 0 && (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <UsersIcon className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Không tìm thấy tài khoản</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Thử tìm kiếm hoặc bộ lọc trạng thái khác.
              </p>
            </div>
          )}

          {accounts.isError && (
            <div className="p-6 text-center text-sm text-destructive">
              {accounts.error.message}
            </div>
          )}

          {pagination && (
            <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Dòng mỗi trang</span>
                <Select
                  onValueChange={(value) => {
                    setPageSize(Number(value));
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
                        pagination.total,
                      )}`}{" "}
                  trong {pagination.total}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-xs text-muted-foreground">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeftIcon />
                  Trước
                </Button>
                <Button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  size="sm"
                  variant="outline"
                >
                  Sau
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm nhân viên</DialogTitle>
            <DialogDescription>
              Tạo tài khoản nhân viên. Họ có thể đăng nhập bằng mã OTP qua email.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitStaff}>
            <div className="space-y-2">
              <Label htmlFor="staff-name">Họ tên</Label>
              <Input id="staff-name" {...createForm.register("name")} />
              {createForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Địa chỉ email</Label>
              <Input
                autoComplete="email"
                id="staff-email"
                type="email"
                {...createForm.register("email")}
              />
              {createForm.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => setCreateOpen(false)}
                type="button"
                variant="outline"
              >
                Hủy
              </Button>
              <Button disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? "Đang tạo..." : "Tạo nhân viên"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
            setBanReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pendingAction?.title}</DialogTitle>
            <DialogDescription>
              {pendingAction?.description}
            </DialogDescription>
          </DialogHeader>
          {pendingAction?.values.action === "set-ban" &&
            pendingAction.values.banned && (
              <div className="space-y-2">
                <Label htmlFor="ban-reason">Lý do</Label>
                <Textarea
                  id="ban-reason"
                  maxLength={200}
                  onChange={(event) => setBanReason(event.target.value)}
                  placeholder="Lý do tùy chọn hiển thị trong hồ sơ quản trị..."
                  value={banReason}
                />
              </div>
            )}
          <DialogFooter>
            <Button
              onClick={() => setPendingAction(null)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={confirmAction}
              variant={
                pendingAction?.values.action === "set-ban" &&
                pendingAction.values.banned
                  ? "destructive"
                  : "default"
              }
            >
              {updateMutation.isPending ? "Đang cập nhật..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
