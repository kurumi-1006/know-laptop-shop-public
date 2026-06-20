"use client";

import type { AccountAddress, AccountDetail, AccountFeedback, AccountOrder, AccountSession } from "@/features/admin/api/accounts";
import { useAccountDetail, useUpdateAccount } from "@/features/admin/hooks/use-accounts";
import type { UpdateAccountValues } from "@/features/admin/schemas/accounts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeftIcon, BanIcon, CalendarIcon, CheckCircle2Icon, ClockIcon,
  KeyIcon, MailIcon, MapPinIcon, PackageIcon, PhoneIcon,
  ShieldCheckIcon, StarIcon, UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";





function getInitials(name: string | null, email: string) {
  return (name || email)
    .split(/[\s@]+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: vi });
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "-";
  return format(new Date(value), "dd/MM/yyyy", { locale: vi });
}





const AUTH_PROVIDER_LABELS: Record<string, string> = {
  credential: "Email / Mật khẩu",
  google: "Google",
};

function describeAuthMethod(providers: string[]): string {
  const labels = providers
    .map((p) => AUTH_PROVIDER_LABELS[p] ?? p)
    .filter(Boolean);
  if (labels.length === 0) return "Không xác định";
  return labels.join(", ");
}

function hasInternalPassword(providers: string[]): boolean {
  return providers.includes("credential");
}





function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerStats({ orderCount, feedbackCount, wishlistCount, sessionCount }: {
  orderCount: number;
  feedbackCount: number;
  wishlistCount: number;
  sessionCount: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <StatCard label="Đơn hàng" value={String(orderCount)} icon={PackageIcon} />
      <StatCard label="Phản hồi" value={String(feedbackCount)} icon={StarIcon} />
      <StatCard label="Yêu thích" value={String(wishlistCount)} icon={ShieldCheckIcon} />
      <StatCard label="Phiên" value={String(sessionCount)} icon={ClockIcon} />
    </div>
  );
}

function StaffStats({ sessionCount }: { sessionCount: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard label="Phiên đăng nhập" value={String(sessionCount)} icon={ClockIcon} />
      <StatCard label="Đơn đã xử lý" value="—" icon={PackageIcon} />
      <StatCard label="Hoạt động gần đây" value="—" icon={CalendarIcon} />
    </div>
  );
}





function InfoField({ label, value, icon: Icon }: {
  label: string;
  value: string | null;
  icon: React.ComponentType<{ className?: string }> | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p className="text-sm font-medium">{value || "-"}</p>
    </div>
  );
}

function CustomerProfileInfo({ account }: { account: AccountDetail }) {
  const providers = account.accounts.map((a) => a.providerId);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <InfoField label="Số điện thoại" icon={PhoneIcon} value={account.profile?.phone ?? null} />
      <InfoField
        label="Ngày sinh"
        icon={null}
        value={account.profile?.birthDate ? formatShortDate(account.profile.birthDate) : null}
      />
      <InfoField label="Giới tính" icon={null} value={account.profile?.gender ?? null} />
      <InfoField
        label="Số địa chỉ"
        icon={MapPinIcon}
        value={String(account.profile?.addresses.length ?? 0)}
      />
      <InfoField label="Phương thức đăng nhập" icon={ShieldCheckIcon} value={describeAuthMethod(providers)} />
      {hasInternalPassword(providers) && (
        <InfoField label="Mật khẩu nội bộ" icon={KeyIcon} value="Đã thiết lập" />
      )}
    </div>
  );
}

function StaffProfileInfo({ account }: { account: AccountDetail }) {
  const providers = account.accounts.map((a) => a.providerId);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <InfoField label="Số điện thoại" icon={PhoneIcon} value={account.profile?.phone ?? null} />
      <InfoField label="Phương thức đăng nhập" icon={ShieldCheckIcon} value={describeAuthMethod(providers)} />
      {hasInternalPassword(providers) && (
        <InfoField label="Mật khẩu nội bộ" icon={KeyIcon} value="Đã thiết lập" />
      )}
      <InfoField label="Vai trò hệ thống" icon={UserIcon} value={account.role} />
      <InfoField label="Trạng thái" icon={null} value={account.banned ? "Bị khóa" : "Hoạt động"} />
      <InfoField label="Ngày tham gia" icon={null} value={formatShortDate(account.createdAt)} />
      <InfoField label="Cập nhật gần nhất" icon={null} value={formatShortDate(account.updatedAt)} />
    </div>
  );
}





function EmptyTab({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
      <Icon className="size-8 text-muted-foreground" />
      <p className="mt-3 font-medium">{message}</p>
    </div>
  );
}

function AddressesTab({ addresses }: { addresses: AccountAddress[] }) {
  if (addresses.length === 0) {
    return <EmptyTab icon={MapPinIcon} message="Không có địa chỉ nào." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Loại</TableHead>
          <TableHead>Người nhận</TableHead>
          <TableHead>Địa chỉ</TableHead>
          <TableHead>Mặc định</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {addresses.map((addr) => (
          <TableRow key={addr.id}>
            <TableCell className="capitalize">{addr.type}</TableCell>
            <TableCell>
              <div className="space-y-0.5">
                <p className="font-medium">{addr.receiverName || "-"}</p>
                {addr.receiverPhone && (
                  <p className="text-xs text-muted-foreground">{addr.receiverPhone}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              {[addr.street, addr.wardName, addr.districtName, addr.provinceName]
                .filter(Boolean)
                .join(", ") || "-"}
            </TableCell>
            <TableCell>{addr.isDefault ? <Badge variant="secondary">Mặc định</Badge> : "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SessionsTab({ sessions }: { sessions: AccountSession[] }) {
  if (sessions.length === 0) {
    return <EmptyTab icon={ClockIcon} message="Không có phiên hoạt động nào." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tạo</TableHead>
          <TableHead>Hết hạn</TableHead>
          <TableHead>Địa chỉ IP</TableHead>
          <TableHead>Trình duyệt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(s.expiresAt)}</TableCell>
            <TableCell>{s.ipAddress || "-"}</TableCell>
            <TableCell className="max-w-48 truncate">{s.userAgent || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OrdersTab({ orders }: { orders: AccountOrder[] }) {
  if (orders.length === 0) {
    return <EmptyTab icon={PackageIcon} message="Chưa có đơn hàng." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã đơn</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Tổng</TableHead>
          <TableHead>Ngày</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="font-mono text-xs">#{o.id}</TableCell>
            <TableCell className="capitalize">{o.status}</TableCell>
            <TableCell>{o.total}</TableCell>
            <TableCell className="text-muted-foreground">{formatShortDate(o.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function FeedbacksTab({ feedbacks }: { feedbacks: AccountFeedback[] }) {
  if (feedbacks.length === 0) {
    return <EmptyTab icon={StarIcon} message="Chưa có phản hồi." />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sản phẩm</TableHead>
          <TableHead>Đánh giá</TableHead>
          <TableHead>Nội dung</TableHead>
          <TableHead>Hiển thị</TableHead>
          <TableHead>Ngày</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {feedbacks.map((f) => (
          <TableRow key={f.id}>
            <TableCell className="font-medium">{f.product?.name ?? "Không rõ"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <StarIcon className="size-3.5 text-yellow-500" />
                <span>{f.rating}</span>
              </div>
            </TableCell>
            <TableCell className="max-w-64 truncate">{f.content || "-"}</TableCell>
            <TableCell>
              <Badge variant={f.isVisible ? "secondary" : "outline"}>
                {f.isVisible ? "Hiển thị" : "Ẩn"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatShortDate(f.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ActivityTab() {
  return (
    <EmptyTab
      icon={CalendarIcon}
      message="Chưa có dữ liệu hoạt động. Dữ liệu sẽ hiển thị khi nhân viên bắt đầu xử lý đơn hàng."
    />
  );
}

function PermissionsTab({ role }: { role: string }) {
  const permissions = role === "admin"
    ? [
        "Quản lý người dùng (xem, khóa, phân quyền)",
        "Quản lý sản phẩm & danh mục",
        "Quản lý toàn bộ đơn hàng",
        "Xem dashboard & thống kê",
        "Quản lý mã giảm giá",
        "Xuất báo cáo CSV",
      ]
    : role === "staff"
      ? [
          "Quản lý đơn hàng (xem, cập nhật trạng thái)",
          "Quản lý sản phẩm",
          "Xem dashboard",
          "Xuất báo cáo CSV",
        ]
      : [
          "Mua hàng & thanh toán",
          "Quản lý hồ sơ cá nhân",
          "Quản lý địa chỉ giao hàng",
          "Xem lịch sử đơn hàng",
          "Đánh giá sản phẩm",
          "Danh sách yêu thích",
        ];

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ShieldCheckIcon className="size-3" />
          Vai trò
        </p>
        <Badge className="capitalize" variant="outline">{role}</Badge>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <KeyIcon className="size-3" />
          Quyền hạn
        </p>
        <ul className="rounded-md border divide-y">
          {permissions.map((perm) => (
            <li key={perm} className="flex items-center gap-2 px-4 py-2.5 text-sm">
              <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
              {perm}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}





function BanDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
  reason,
  onReasonChange,
  expires,
  onExpiresChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
  reason: string;
  onReasonChange: (value: string) => void;
  expires: string;
  onExpiresChange: (value: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Khóa tài khoản</DialogTitle>
          <DialogDescription>
            Tất cả phiên hoạt động sẽ bị thu hồi ngay lập tức. Người dùng sẽ không thể đăng nhập.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Lý do</Label>
            <Textarea
              id="ban-reason"
              maxLength={200}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Lý do khóa tài khoản..."
              value={reason}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ban-expires">Hết hạn khóa (tùy chọn)</Label>
            <Input
              id="ban-expires"
              type="datetime-local"
              onChange={(e) => onExpiresChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
              value={expires ? format(new Date(expires), "yyyy-MM-dd'T'HH:mm") : ""}
            />
            <p className="text-xs text-muted-foreground">Để trống để khóa vĩnh viễn.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Đang khóa..." : "Xác nhận khóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UnbanDialog({
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Khôi phục tài khoản</DialogTitle>
          <DialogDescription>
            Người dùng sẽ có thể đăng nhập lại. Các phiên trước đó không được khôi phục.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button disabled={isPending} onClick={onConfirm}>
            {isPending ? "Đang khôi phục..." : "Xác nhận khôi phục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





function AccountHeader({
  account,
  backHref,
  canManage,
  canBan,
  onBan,
  onUnban,
}: {
  account: AccountDetail;
  backHref: string;
  canManage: boolean;
  canBan: boolean;
  onBan: () => void;
  onUnban: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backHref}><ArrowLeftIcon /></Link>
        </Button>
        <div>
          <p className="text-sm font-medium text-primary">Chi tiết tài khoản</p>
          <h1 className="text-2xl font-bold tracking-tight">{account.name || "Tài khoản chưa đặt tên"}</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="size-16">
                <AvatarImage alt={account.name ?? account.email} src={account.image ?? undefined} />
                <AvatarFallback className="text-lg">{getInitials(account.name, account.email)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold">{account.name || "Tài khoản chưa đặt tên"}</h2>
                  {account.permissions.isSelf && <Badge variant="secondary">Bạn</Badge>}
                  <RoleBadge role={account.role} />
                  <Badge variant={account.banned ? "destructive" : "secondary"}>
                    {account.banned ? "Bị khóa" : "Hoạt động"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <MailIcon className="size-3.5" />
                  <span>{account.email}</span>
                  {account.emailVerified && (
                    <Badge className="ml-1" variant="secondary">Đã xác minh</Badge>
                  )}
                </div>
                {account.banned && (
                  <div className="mt-2 rounded-md bg-destructive/10 p-3">
                    <p className="text-sm font-medium text-destructive">Chi tiết khóa</p>
                    <p className="text-sm mt-0.5">
                      Lý do: {account.banReason || "Không xác định"}
                    </p>
                    {account.banExpires && (
                      <p className="text-sm">
                        Hết hạn: {formatDate(account.banExpires)}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                  <span>Tham gia {formatShortDate(account.createdAt)}</span>
                  <span>Cập nhật {formatShortDate(account.updatedAt)}</span>
                </div>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2 shrink-0">
                {canBan && (
                  account.banned ? (
                    <Button variant="default" size="sm" onClick={onUnban}>
                      <CheckCircle2Icon /> Khôi phục tài khoản
                    </Button>
                  ) : (
                    <Button variant="destructive" size="sm" onClick={onBan}>
                      <BanIcon /> Khóa tài khoản
                    </Button>
                  )
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  const variant = role === "admin" ? "default" : role === "staff" ? "secondary" : "outline";
  const label = role === "admin" ? "Quản trị viên" : role === "staff" ? "Nhân viên" : "Khách hàng";
  return (
    <Badge variant={variant as "default" | "secondary" | "outline"}>
      {label}
    </Badge>
  );
}





type CustomerTabKey = "addresses" | "sessions" | "orders" | "feedbacks";
type StaffTabKey = "sessions" | "activity" | "permissions";

const customerTabs: { key: CustomerTabKey; label: string }[] = [
  { key: "addresses", label: "Địa chỉ" },
  { key: "sessions", label: "Phiên" },
  { key: "orders", label: "Đơn hàng" },
  { key: "feedbacks", label: "Phản hồi" },
];

const staffTabs: { key: StaffTabKey; label: string }[] = [
  { key: "sessions", label: "Phiên" },
  { key: "activity", label: "Hoạt động" },
  { key: "permissions", label: "Quyền hạn" },
];

export function AccountDetail({ userId, backHref }: { userId: string; backHref: string }) {
  const { data: account, isLoading, isError, error } = useAccountDetail(userId);
  const updateMutation = useUpdateAccount();
  const [activeCustomerTab, setActiveCustomerTab] = useState<CustomerTabKey>("addresses");
  const [activeStaffTab, setActiveStaffTab] = useState<StaffTabKey>("sessions");
  const [banOpen, setBanOpen] = useState(false);
  const [unbanOpen, setUnbanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banExpires, setBanExpires] = useState("");

  if (isLoading) return <DetailSkeleton />;
  if (isError || !account) {
    return (
      <Card>
        <CardContent className="flex min-h-56 flex-col items-center justify-center">
          <p className="text-destructive font-medium">Không thể tải tài khoản</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : "Không tìm thấy tài khoản."}
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href={backHref}><ArrowLeftIcon /> Quay lại</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isCustomer = account.role === "customer";

  const confirmBan = async () => {
    const values: UpdateAccountValues = {
      action: "set-ban",
      banned: true,
      reason: banReason.trim() || undefined,
      banExpires: banExpires || null,
    };
    try {
      await updateMutation.mutateAsync({ userId: account.id, values });
      toast.success("Đã khóa tài khoản. Tất cả phiên hoạt động đã bị thu hồi.");
      setBanOpen(false);
      setBanReason("");
      setBanExpires("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể khóa tài khoản.");
    }
  };

  const confirmUnban = async () => {
    const values: UpdateAccountValues = { action: "set-ban", banned: false };
    try {
      await updateMutation.mutateAsync({ userId: account.id, values });
      toast.success("Đã khôi phục tài khoản thành công.");
      setUnbanOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể khôi phục tài khoản.");
    }
  };

  return (
    <div className="space-y-6">
      <AccountHeader
        account={account}
        backHref={backHref}
        canManage={account.permissions.canManage}
        canBan={account.permissions.canBan}
        onBan={() => setBanOpen(true)}
        onUnban={() => setUnbanOpen(true)}
      />

      {isCustomer ? (
        <CustomerStats
          orderCount={account.stats.orderCount}
          feedbackCount={account.stats.feedbackCount}
          wishlistCount={account.stats.wishlistCount}
          sessionCount={account.stats.sessionCount}
        />
      ) : (
        <StaffStats sessionCount={account.stats.sessionCount} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hồ sơ</CardTitle>
        </CardHeader>
        <CardContent>
          {isCustomer ? (
            <CustomerProfileInfo account={account} />
          ) : (
            <StaffProfileInfo account={account} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex gap-1">
            {isCustomer
              ? customerTabs.map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={activeCustomerTab === key ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveCustomerTab(key)}
                  >
                    {label}
                  </Button>
                ))
              : staffTabs.map(({ key, label }) => (
                  <Button
                    key={key}
                    variant={activeStaffTab === key ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setActiveStaffTab(key)}
                  >
                    {label}
                  </Button>
                ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isCustomer ? (
            <>
              {activeCustomerTab === "addresses" && <AddressesTab addresses={account.profile?.addresses ?? []} />}
              {activeCustomerTab === "sessions" && <SessionsTab sessions={account.sessions} />}
              {activeCustomerTab === "orders" && <OrdersTab orders={account.orders} />}
              {activeCustomerTab === "feedbacks" && <FeedbacksTab feedbacks={account.feedbacks} />}
            </>
          ) : (
            <>
              {activeStaffTab === "sessions" && <SessionsTab sessions={account.sessions} />}
              {activeStaffTab === "activity" && <ActivityTab />}
              {activeStaffTab === "permissions" && <PermissionsTab role={account.role} />}
            </>
          )}
        </CardContent>
      </Card>

      <BanDialog
        open={banOpen}
        onOpenChange={setBanOpen}
        isPending={updateMutation.isPending}
        onConfirm={confirmBan}
        reason={banReason}
        onReasonChange={setBanReason}
        expires={banExpires}
        onExpiresChange={setBanExpires}
      />

      <UnbanDialog
        open={unbanOpen}
        onOpenChange={setUnbanOpen}
        isPending={updateMutation.isPending}
        onConfirm={confirmUnban}
      />
    </div>
  );
}





function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-48" />
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-12" />
              </div>
              <Skeleton className="size-10 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
