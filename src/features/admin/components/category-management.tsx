"use client";

import { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/features/admin/hooks/use-products";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { SKELETON_ROW_COUNT } from "@/features/admin/constants";
import { PlusIcon, PencilIcon, TrashIcon, FolderTreeIcon, CheckCircle2Icon, CircleOffIcon } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  parentId: number | null;
  parent: { id: number; name: string } | null;
};

export function CategoryManagement() {
  const { data: categories, isLoading, isError, error } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("none");

  const resetForm = () => {
    setName("");
    setDescription("");
    setParentId("none");
    setEditId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description ?? "");
    setParentId(cat.parentId ? String(cat.parentId) : "none");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    try {
      if (editId) {
        await updateMutation.mutateAsync({
          id: editId,
          values: {
            name: name.trim(),
            description: description || null,
            parentId: parentId === "none" ? null : parseInt(parentId),
          },
        });
        toast.success("Đã cập nhật danh mục");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description || null,
          parentId: parentId === "none" ? null : parseInt(parentId),
        });
        toast.success("Đã thêm danh mục mới");
      }
      setDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Đã xảy ra lỗi"));
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await updateMutation.mutateAsync({
        id: cat.id,
        values: { isActive: !cat.isActive },
      });
      toast.success(cat.isActive ? "Đã tắt danh mục" : "Đã bật danh mục");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Không thể cập nhật"));
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Xóa danh mục "${cat.name}"? Danh mục sẽ bị ẩn khỏi cửa hàng.`)) return;
    try {
      await deleteMutation.mutateAsync(cat.id);
      toast.success("Đã xóa danh mục");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Không thể xóa danh mục"));
    }
  };

  const list = (categories ?? []) as Category[];
  const parentOptions = list.filter((c) => c.isActive && c.id !== editId);

  const stats = {
    total: list.length,
    active: list.filter((c) => c.isActive).length,
    inactive: list.filter((c) => !c.isActive).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Quản lý cửa hàng</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Danh mục</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý danh mục sản phẩm, bao gồm danh mục cha/con.
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <PlusIcon />
          Thêm danh mục
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Tổng danh mục", value: stats.total, icon: FolderTreeIcon },
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
          <CardTitle>Danh sách danh mục</CardTitle>
          <CardDescription>{list.length} danh mục</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 w-16">STT</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Danh mục cha</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-12 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-5"><Skeleton className="h-4 w-6" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="pr-5"><Skeleton className="size-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                : list.map((cat, i) => (
                    <TableRow key={cat.id}>
                      <TableCell className="pl-5 font-mono text-xs">{i + 1}</TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{cat.slug}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {cat.parent?.name ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cat.isActive ? "default" : "secondary"}>
                          {cat.isActive ? "Hiển thị" : "Ẩn"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-5">
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => handleOpenEdit(cat)}>
                            <PencilIcon className="size-3.5" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleToggleActive(cat)}>
                            <Badge variant={cat.isActive ? "secondary" : "default"} className="text-[10px] cursor-pointer">
                              {cat.isActive ? "Ẩn" : "Hiện"}
                            </Badge>
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(cat)}>
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
              <FolderTreeIcon className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Chưa có danh mục nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nhấn &quot;Thêm danh mục&quot; để bắt đầu.
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
            <DialogDescription>
              Danh mục giúp tổ chức sản phẩm theo nhóm.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Tên danh mục</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Mô tả</Label>
              <Textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-parent">Danh mục cha</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="cat-parent">
                  <SelectValue placeholder="Không có (danh mục gốc)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có (danh mục gốc)</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editId ? "Lưu" : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
