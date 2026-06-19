"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/features/auth/lib/auth-client";
import {
  useProfile,
  useUpdatePersonalInfo,
} from "@/features/profile/hooks/use-profile";
import {
  personalInfoSchema,
  type PersonalInfoValues,
} from "@/features/profile/schemas/profile";
import { useProfileStore } from "@/features/profile/stores/profile-store";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import {
  CalendarIcon,
  ContactIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const genderLabels = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
} as const;

export function PersonalInfoForm() {
  const { data: session } = authClient.useSession();
  const profile = useProfile();
  const updateProfile = useUpdatePersonalInfo();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const dialogOpen = useProfileStore((state) => state.personalDialogOpen);
  const setDialogOpen = useProfileStore(
    (state) => state.setPersonalDialogOpen,
  );
  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: { phone: "", birthDate: "", gender: "" },
  });

  const resetForm = () => {
    form.reset({
      phone: profile.data?.phone ?? "",
      birthDate: profile.data?.birthDate?.slice(0, 10) ?? "",
      gender: profile.data?.gender ?? "",
    });
  };

  useEffect(() => {
    if (profile.data) resetForm();

  }, [profile.data]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateProfile.mutateAsync(values);
      setDialogOpen(false);
      toast.success("Đã cập nhật thông tin cá nhân.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu hồ sơ của bạn.",
      );
    }
  });

  const birthDate = profile.data?.birthDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(profile.data.birthDate),
      )
    : "Chưa cung cấp";
  const gender = profile.data?.gender
    ? genderLabels[profile.data.gender]
    : "Chưa cung cấp";

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ContactIcon className="size-5" />
              </div>
              <div>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>
                  Thông tin dùng cho đơn hàng, hóa đơn và hỗ trợ giao hàng.
                </CardDescription>
              </div>
            </div>
            <Button
              disabled={profile.isLoading}
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              size="sm"
              variant="outline"
            >
              <PencilIcon data-icon="inline-start" />
              Chỉnh sửa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profile.isLoading ? (
            <PersonalInfoSkeleton />
          ) : (
            <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <InfoGroup title="Tài khoản">
                <InfoRow
                  icon={UserIcon}
                  label="Họ tên"
                  value={session?.user?.name ?? "Chưa cung cấp"}
                />
                <InfoRow
                  icon={MailIcon}
                  label="Địa chỉ email"
                  value={session?.user?.email ?? "Chưa cung cấp"}
                />
              </InfoGroup>
              <InfoGroup className="pt-5 sm:pl-6 sm:pt-0" title="Thông tin liên hệ">
                <InfoRow
                  icon={PhoneIcon}
                  label="Số điện thoại"
                  value={profile.data?.phone || "Chưa cung cấp"}
                />
                <InfoRow
                  icon={CalendarIcon}
                  label="Ngày sinh"
                  value={birthDate}
                />
                <InfoRow icon={UsersIcon} label="Giới tính" value={gender} />
              </InfoGroup>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) resetForm();
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin cá nhân</DialogTitle>
            <DialogDescription>
              Giữ thông tin chính xác để đặt hàng và giao laptop.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Số điện thoại</Label>
              <Input
                id="profile-phone"
                inputMode="tel"
                placeholder="0912 345 678"
                {...form.register("phone")}
              />
              {form.formState.errors.phone && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-birth-date">Ngày sinh</Label>
                <Controller
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => {
                    const selectedDate = field.value
                      ? parseISO(field.value)
                      : undefined;

                    return (
                      <Popover
                        onOpenChange={setDatePickerOpen}
                        open={datePickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground",
                            )}
                            id="profile-birth-date"
                            type="button"
                            variant="outline"
                          >
                            <CalendarIcon data-icon="inline-start" />
                            {selectedDate
                              ? format(selectedDate, "PPP")
                              : "Chọn ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-auto p-0"
                        >
                          <Calendar
                            captionLayout="dropdown"
                            disabled={{ after: new Date() }}
                            endMonth={new Date()}
                            mode="single"
                            onSelect={(date) => {
                              field.onChange(
                                date ? format(date, "yyyy-MM-dd") : "",
                              );
                              setDatePickerOpen(false);
                            }}
                            selected={selectedDate}
                            startMonth={new Date(1900, 0)}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Giới tính</Label>
                <Controller
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Nam</SelectItem>
                        <SelectItem value="female">Nữ</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Hủy
              </Button>
              <Button disabled={updateProfile.isPending} type="submit">
                {updateProfile.isPending ? "Đang lưu..." : "Lưu thông tin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PersonalInfoSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {[2, 3].map((rowCount, groupIndex) => (
        <div
          className={cn(groupIndex === 1 && "border-t pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0")}
          key={groupIndex}
        >
          <Skeleton className="mb-5 h-4 w-24" />
          <div className="space-y-4">
            {Array.from({ length: rowCount }).map((_, index) => (
              <div className="flex gap-3" key={index}>
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-36 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoGroup({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={className}>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="rounded-lg bg-muted p-2 text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
