"use client";

import { useEffect, useState } from "react";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/features/admin/hooks/use-products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SKELETON_ROW_COUNT } from "@/features/admin/constants";
import { PlusIcon, PencilIcon, TrashIcon, UploadIcon, Loader2, TagIcon, CheckCircle2Icon, CircleOffIcon } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage, getLogoUrl } from "@/lib/utils";


type Brand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  isActive: boolean;
};

export function BrandManagement() {
  const { data: brands, isLoading, isError, error } = useBrands();
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Tải ảnh lên thất bại");
      }

      const data = await res.json();
      const uploadedImage = data.data?.[0];
      if (!uploadedImage?.url) {
        throw new Error("Phan hoi upload khong co URL anh");
      }
      setLogo(uploadedImage.url);
      setLogoPreview("");
      toast.success("Tải ảnh logo lên thành công");
    } catch (err: any) {
      setLogoPreview("");
      toast.error(err.message || "Không thể tải ảnh lên");
    } finally {
      setIsUploading(false);
    }
  };


  const resetForm = () => {
    setName("");
    setLogo("");
    setLogoPreview("");
    setDescription("");
    setEditId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditId(brand.id);
    setName(brand.name);
    setLogo(brand.logo ?? "");
    setDescription(brand.description ?? "");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên thương hiệu");
      return;
    }
    try {
      if (editId) {
        await updateMutation.mutateAsync({
          id: editId,
          values: {
            name: name.trim(),
            logo: logo || null,
            description: description || null,
          },
        });
        toast.success("Đã cập nhật thương hiệu");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          logo: logo || null,
          description: description || null,
        });
        toast.success("Đã thêm thương hiệu mới");
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Đã xảy ra lỗi"));
    }
  };

  const handleToggleActive = async (brand: Brand) => {
    try {
      await updateMutation.mutateAsync({
        id: brand.id,
        values: { isActive: !brand.isActive },
      });
      toast.success(brand.isActive ? "Đã tắt thương hiệu" : "Đã bật thương hiệu");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Không thể cập nhật"));
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa thương hiệu "${brand.name}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await deleteMutation.mutateAsync(brand.id);
      toast.success("Đã xóa thương hiệu thành công");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Không thể xóa thương hiệu"));
    }
  };

  const list = (brands ?? []) as Brand[];

  const stats = {
    total: list.length,
    active: list.filter((b) => b.isActive).length,
    inactive: list.filter((b) => !b.isActive).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Quản lý cửa hàng</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Thương hiệu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý thương hiệu laptop: Dell, HP, Asus, Lenovo, Apple...
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <PlusIcon />
          Thêm thương hiệu
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Tổng thương hiệu", value: stats.total, icon: TagIcon },
          { label: "Đang hiển thị", value: stats.active, icon: CheckCircle2Icon },
          { label: "Đang ẩn", value: stats.inactive, icon: CircleOffIcon },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-7 w-12" />
                ) : (
                  <p className="mt-1 text-2xl font-semibold">{value}</p>
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
          <CardTitle>Danh sách thương hiệu</CardTitle>
          <CardDescription>{list.length} thương hiệu</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 w-16">STT</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-12 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-5"><Skeleton className="h-4 w-6" /></TableCell>
                      <TableCell><Skeleton className="size-10 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="pr-5"><Skeleton className="size-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                : list.map((brand, i) => (
                    <TableRow key={brand.id}>
                      <TableCell className="pl-5 font-mono text-xs">{i + 1}</TableCell>
                      <TableCell>
                        <Avatar className="size-10 rounded-md">
                          <AvatarImage alt={brand.name} src={getLogoUrl(brand.logo) ?? undefined} />
                          <AvatarFallback className="rounded-md text-xs">
                            {brand.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{brand.slug}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                        {brand.description ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={brand.isActive ? "default" : "secondary"}>
                          {brand.isActive ? "Hiển thị" : "Ẩn"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => handleOpenEdit(brand)}>
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleToggleActive(brand)}>
                            <Badge variant={brand.isActive ? "secondary" : "default"} className="text-[10px] cursor-pointer">
                              {brand.isActive ? "Ẩn" : "Hiện"}
                            </Badge>
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(brand)}>
                            <TrashIcon className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {!isLoading && list.length === 0 && (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <TagIcon className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Chưa có thương hiệu nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nhấn &quot;Thêm thương hiệu&quot; để bắt đầu.
              </p>
            </div>
          )}

          {isError && (
            <div className="p-6 text-center text-sm text-destructive">
              {error.message}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Chỉnh sửa thương hiệu" : "Thêm thương hiệu mới"}</DialogTitle>
            <DialogDescription>
              Thương hiệu giúp khách hàng lọc sản phẩm theo hãng.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Tên thương hiệu</Label>
              <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Logo thương hiệu</Label>
              {logo || logoPreview ? (
                <div className="flex items-start gap-3">
                  <div className="group relative aspect-square w-28 overflow-hidden rounded-lg border bg-muted">
                    <img
                      src={logoPreview || getLogoUrl(logo) || undefined}
                      alt="Logo Preview"
                      className="size-full object-cover"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 text-white">
                        <Loader2 className="size-6 animate-spin" />
                        <span className="text-xs font-medium">Đang tải...</span>
                      </div>
                    )}
                    {!isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        size="icon"
                        className="size-8 bg-white text-black hover:bg-white/80"
                        title="Thay đổi logo"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/jpeg,image/png,image/webp,image/avif";
                          input.onchange = () => {
                            const file = input.files?.[0];
                            if (file) {
                              void handleFileUpload({
                                target: { files: input.files },
                              } as React.ChangeEvent<HTMLInputElement>);
                            }
                          };
                          input.click();
                        }}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="size-8"
                        title="Xóa logo"
                        onClick={() => {
                          setLogo("");
                          setLogoPreview("");
                        }}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                      </div>
                    )}
                  </div>
                  <p className="max-w-56 pt-1 text-xs text-muted-foreground">
                    Rê chuột lên ảnh để thay đổi hoặc xóa logo.
                  </p>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const event = { target: { files: [file] } } as any;
                      handleFileUpload(event);
                    }
                  }}
                  className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 px-6 py-8 hover:border-primary/50 transition-colors"
                >
                  <UploadIcon className="size-8 text-muted-foreground/60" />
                  <div className="mt-3 flex text-sm text-muted-foreground">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none hover:underline"
                    >
                      <span>Tải ảnh lên</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="sr-only"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </label>
                    <p className="pl-1">hoặc kéo thả vào đây</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    Chấp nhận 1 ảnh JPG, PNG, WEBP hoặc AVIF, tối đa 10MB
                  </p>
                </div>
              )}
              {isUploading && !logo && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Đang xử lý ảnh...</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-desc">Mô tả</Label>
              <Textarea id="brand-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button
                type="submit"
                disabled={isUploading || createMutation.isPending || updateMutation.isPending}
              >
                {editId ? "Lưu" : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
