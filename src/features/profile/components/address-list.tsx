"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDistricts,
  useProvinces,
  useWards,
} from "@/features/profile/hooks/use-address-options";
import {
  useProfile,
  useUpdateAddresses,
} from "@/features/profile/hooks/use-profile";
import {
  addressFormSchema,
  emptyAddress,
  type AddressFormValues,
} from "@/features/profile/schemas/profile";
import { useProfileStore } from "@/features/profile/stores/profile-store";
import { MAX_ADDRESSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BriefcaseIcon,
  HomeIcon,
  MapPinIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

const typeConfig = {
  home: {
    icon: HomeIcon,
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  work: {
    icon: BriefcaseIcon,
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  other: {
    icon: MoreHorizontalIcon,
    className:
      "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  },
};

export function AddressList() {
  const profile = useProfile();
  const updateAddresses = useUpdateAddresses();
  const dialogOpen = useProfileStore((state) => state.addressDialogOpen);
  const editingIndex = useProfileStore((state) => state.editingIndex);
  const addressDraft = useProfileStore((state) => state.addressDraft);
  const openDialog = useProfileStore((state) => state.openAddressDialog);
  const closeDialog = useProfileStore((state) => state.closeAddressDialog);

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: emptyAddress,
  });

  const provinceCode =
    useWatch({ control: addressForm.control, name: "provinceCode" }) ?? 0;
  const districtCode =
    useWatch({ control: addressForm.control, name: "districtCode" }) ?? 0;
  const wardCode =
    useWatch({ control: addressForm.control, name: "wardCode" }) ?? 0;
  const provinces = useProvinces();
  const districts = useDistricts(provinceCode);
  const wards = useWards(districtCode);

  useEffect(() => {
    if (dialogOpen && addressDraft) addressForm.reset(addressDraft);
  }, [addressDraft, addressForm, dialogOpen]);

  const persistAddresses = async (
    addresses: AddressFormValues[],
    successMessage: string,
  ) => {
    try {
      await updateAddresses.mutateAsync(addresses);
      toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật địa chỉ.",
      );
      return false;
    }
  };

  const setDefault = async (index: number) => {
    const addresses = profile.data?.addresses ?? [];
    await persistAddresses(
      addresses.map((address, addressIndex) => ({
        ...address,
        isDefault: addressIndex === index,
      })),
      "Đã cập nhật địa chỉ mặc định.",
    );
  };

  const removeAddress = async (index: number) => {
    const addresses = profile.data?.addresses ?? [];
    if (addresses.length <= 1) {
      toast.error("Bạn phải giữ ít nhất một địa chỉ.");
      return;
    }
    const remaining = addresses.filter((_, i) => i !== index);
    await persistAddresses(remaining, "Đã xóa địa chỉ.");
  };

  const openAdd = () => {
    if ((profile.data?.addresses.length ?? 0) >= MAX_ADDRESSES) {
      toast.error(`Bạn chỉ có thể lưu tối đa ${MAX_ADDRESSES} địa chỉ.`);
      return;
    }

    openDialog(
      {
        ...emptyAddress,
        isDefault: (profile.data?.addresses.length ?? 0) === 0,
      },
      null,
    );
  };

  const openEdit = (index: number) => {
    const address = profile.data?.addresses[index];
    if (address) openDialog(address, index);
  };

  const saveAddressDraft = addressForm.handleSubmit(async (values) => {
    const addresses = profile.data?.addresses ?? [];

    if (editingIndex === null && addresses.length >= MAX_ADDRESSES) {
      toast.error(`Bạn chỉ có thể lưu tối đa ${MAX_ADDRESSES} địa chỉ.`);
      closeDialog();
      return;
    }

    let nextAddresses =
      editingIndex === null
        ? [...addresses, values]
        : addresses.map((address, index) =>
            index === editingIndex ? values : address,
          );

    if (values.isDefault) {
      const targetIndex = editingIndex ?? addresses.length;
      nextAddresses = nextAddresses.map((address, index) => ({
        ...address,
        isDefault: index === targetIndex,
      }));
    }

    const saved = await persistAddresses(
      nextAddresses,
      editingIndex === null ? "Đã thêm địa chỉ." : "Đã cập nhật địa chỉ.",
    );
    if (saved) closeDialog();
  });
  const addresses = profile.data?.addresses ?? [];

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <MapPinIcon className="size-5" />
              </div>
              <div>
                <CardTitle>Địa chỉ đã lưu</CardTitle>
                <CardDescription>
                  Chọn nơi bạn muốn nhận laptop và phụ kiện.
                </CardDescription>
              </div>
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={addresses.length >= MAX_ADDRESSES}
              onClick={openAdd}
              size="sm"
            >
              <PlusIcon data-icon="inline-start" />
              {addresses.length >= MAX_ADDRESSES
                ? "Đã đạt giới hạn"
                : "Thêm địa chỉ"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  className="flex items-center justify-between rounded-xl border p-4"
                  key={index}
                >
                  <div className="flex flex-1 items-start gap-4">
                    <Skeleton className="hidden size-11 rounded-lg sm:block" />
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        {index === 0 && (
                          <Skeleton className="h-5 w-20 rounded-full" />
                        )}
                      </div>
                      <Skeleton className="h-4 w-48 max-w-full" />
                      <Skeleton className="h-4 w-80 max-w-full" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="size-7 rounded-lg" />
                    <Skeleton className="size-7 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-14 text-center">
              <div className="rounded-full bg-background p-3 shadow-sm ring-1 ring-border">
                <MapPinIcon className="size-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Chưa có địa chỉ</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thêm địa chỉ giao hàng để thanh toán nhanh hơn.
                </p>
              </div>
              <Button onClick={openAdd} size="sm" variant="outline">
                <PlusIcon data-icon="inline-start" />
                Thêm địa chỉ đầu tiên
              </Button>
            </div>
          ) : (
              <div className="space-y-3">
                <p className="text-right text-xs text-muted-foreground">
                  {addresses.length}/{MAX_ADDRESSES} địa chỉ
                </p>
                {addresses.map((address, index) => {
                  const config = typeConfig[address.type];
                  const Icon = config.icon;

                  return (
                    <article
                      className={cn(
                        "group flex flex-col gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between",
                        address.isDefault &&
                          "border-primary/40 bg-primary/3",
                      )}
                      key={address.id ?? `${address.street}-${index}`}
                    >
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="hidden rounded-lg bg-muted p-3 text-muted-foreground sm:block">
                            <MapPinIcon className="size-5" />
                          </div>
                          <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              className={cn("gap-1 capitalize", config.className)}
                              variant="secondary"
                            >
                              <Icon className="size-3.5" />
                              {address.type}
                            </Badge>
                            {address.isDefault && (
                              <Badge className="gap-1">
                                <StarIcon className="size-3" />
                                Mặc định
                              </Badge>
                            )}
                          </div>
                          <div>
                            {(address.receiverName || address.receiverPhone) && (
                              <p className="flex items-center gap-2 text-sm">
                                {address.receiverName && (
                                  <span className="inline-flex items-center gap-1 font-medium">
                                    <UserIcon className="size-3.5 text-muted-foreground" />
                                    {address.receiverName}
                                  </span>
                                )}
                                {address.receiverPhone && (
                                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                                    <PhoneIcon className="size-3.5" />
                                    {address.receiverPhone}
                                  </span>
                                )}
                              </p>
                            )}
                            <p className="font-semibold">{address.street}</p>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {[
                                address.wardName,
                                address.districtName,
                                address.provinceName,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
                          {!address.isDefault && (
                            <Button
                              aria-label="Đặt làm mặc định"
                              disabled={updateAddresses.isPending}
                              onClick={() => setDefault(index)}
                              size="icon-sm"
                              type="button"
                              variant="ghost"
                            >
                              <StarIcon />
                            </Button>
                          )}
                          <Button
                            aria-label="Sửa địa chỉ"
                            disabled={updateAddresses.isPending}
                            onClick={() => openEdit(index)}
                            size="icon-sm"
                            type="button"
                            variant="ghost"
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            aria-label="Xóa địa chỉ"
                            disabled={updateAddresses.isPending || addresses.length <= 1}
                            onClick={() => removeAddress(index)}
                            size="icon-sm"
                            type="button"
                            variant="destructive"
                          >
                            <TrashIcon />
                          </Button>
                        </div>
                    </article>
                  );
                })}
              </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingIndex === null ? "Thêm địa chỉ" : "Sửa địa chỉ"}
            </DialogTitle>
            <DialogDescription>
              Nhập địa điểm bạn muốn nhận hàng.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-5" onSubmit={saveAddressDraft}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address-receiver-name">Tên người nhận</Label>
                <Input
                  id="address-receiver-name"
                  placeholder="Nguyễn Văn A"
                  {...addressForm.register("receiverName")}
                />
                {addressForm.formState.errors.receiverName && (
                  <p className="text-xs text-destructive">
                    {addressForm.formState.errors.receiverName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-receiver-phone">Số điện thoại</Label>
                <Input
                  id="address-receiver-phone"
                  placeholder="0912345678"
                  {...addressForm.register("receiverPhone")}
                />
                {addressForm.formState.errors.receiverPhone && (
                  <p className="text-xs text-destructive">
                    {addressForm.formState.errors.receiverPhone.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="space-y-2">
                <Label htmlFor="address-street">Địa chỉ đường</Label>
                <Input
                  id="address-street"
                  placeholder="Căn hộ, đường, tòa nhà..."
                  {...addressForm.register("street")}
                />
                {addressForm.formState.errors.street && (
                  <p className="text-xs text-destructive">
                    {addressForm.formState.errors.street.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Loại</Label>
                <Controller
                  control={addressForm.control}
                  name="type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Nhà riêng</SelectItem>
                        <SelectItem value="work">Cơ quan</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <AddressSelect
                label="Tỉnh/Thành"
                options={provinces.data ?? []}
                value={provinceCode}
                onChange={(code) => {
                  const option = provinces.data?.find((item) => item.code === code);
                  addressForm.setValue("provinceCode", code);
                  addressForm.setValue("provinceName", option?.name ?? "");
                  addressForm.setValue("districtCode", 0);
                  addressForm.setValue("districtName", "");
                  addressForm.setValue("wardCode", 0);
                  addressForm.setValue("wardName", "");
                }}
              />
              <AddressSelect
                disabled={!provinceCode}
                label="Quận/Huyện"
                options={districts.data ?? []}
                value={districtCode}
                onChange={(code) => {
                  const option = districts.data?.find((item) => item.code === code);
                  addressForm.setValue("districtCode", code);
                  addressForm.setValue("districtName", option?.name ?? "");
                  addressForm.setValue("wardCode", 0);
                  addressForm.setValue("wardName", "");
                }}
              />
              <AddressSelect
                disabled={!districtCode}
                label="Phường/Xã"
                options={wards.data ?? []}
                value={wardCode}
                onChange={(code) => {
                  const option = wards.data?.find((item) => item.code === code);
                  addressForm.setValue("wardCode", code);
                  addressForm.setValue("wardName", option?.name ?? "");
                }}
              />
            </div>

            <Controller
              control={addressForm.control}
              name="isDefault"
              render={({ field }) => (
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40",
                    field.value && "border-primary/40 bg-primary/5",
                  )}
                >
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <StarIcon className="size-4 text-primary" />
                      Đặt làm địa chỉ mặc định
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Địa chỉ này sẽ được chọn tự động.
                    </span>
                  </span>
                </label>
              )}
            />

            <DialogFooter>
              <Button onClick={closeDialog} type="button" variant="outline">
                Hủy
              </Button>
              <Button disabled={updateAddresses.isPending} type="submit">
                {updateAddresses.isPending
                  ? "Đang lưu..."
                  : editingIndex === null
                    ? "Thêm địa chỉ"
                    : "Cập nhật địa chỉ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddressSelect({
  disabled,
  label,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: number) => void;
  options: { code: number; name: string }[];
  value: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        disabled={disabled}
        onValueChange={(nextValue) => onChange(Number(nextValue))}
        value={value ? String(value) : ""}
      >
        <SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={String(option.code)}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
