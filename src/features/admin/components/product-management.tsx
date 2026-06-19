"use client";

import { useState, useEffect } from "react";
import {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUploadProductImage,
  useDeleteProductImage,
  useSetProductPrimaryImage,
  useBrands,
  useCategories,
} from "@/features/admin/hooks/use-products";
import { useVouchers, useAssignVoucher } from "@/features/admin/hooks/use-vouchers";
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
import { Textarea } from "@/components/ui/textarea";
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
  TrashIcon,
  ImageIcon,
  SettingsIcon,
  CheckIcon,
  UploadIcon,
  Loader2,
  PackageIcon,
  CheckCircle2Icon,
  CircleOffIcon,
  Edit3Icon,
  AlertTriangleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

type SpecItem = { attribute: { name: string }; value: string };
type CouponLink = { couponId: string; coupon?: { code: string; name?: string } };
type CategoryOption = { id: string; name: string };
type BrandOption = { id: string; name: string };
type ProductImage = { id: string; imageUrl: string; isPrimary?: boolean; displayOrder?: number };
type VoucherOption = { id: string; code: string; name?: string; discountType: string; discountValue: number };
type ProductRow = { id: string; name: string; slug: string; price: number; salePrice: number | null; stock: number; status: string; createdAt: string; category?: CategoryOption; brand?: BrandOption; images: ProductImage[]; specs?: SpecItem[]; productCoupons?: CouponLink[] };

const SPEC_FIELDS = [
  { name: "Processor", label: "CPU", groupName: "Performance" },
  { name: "GPU", label: "Card đồ họa (GPU)", groupName: "Performance" },
  { name: "Memory", label: "RAM", groupName: "Performance" },
  { name: "Storage", label: "SSD / Ổ cứng", groupName: "Performance" },
  { name: "Display", label: "Màn hình", groupName: "Display" },
  { name: "Battery", label: "Dung lượng Pin", groupName: "Battery" },
  { name: "OS", label: "Hệ điều hành", groupName: "General" },
  { name: "Weight", label: "Trọng lượng", groupName: "General" },
  { name: "Warranty", label: "Bảo hành (tháng)", groupName: "General" },
];

export function ProductManagement() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const [status, setStatus] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "specs" | "images" | "vouchers">("info");


  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("");
  const [prodStatus, setProdStatus] = useState("active");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");


  const [specsState, setSpecsState] = useState<Record<string, string>>({});


  const [selectedVoucherIds, setSelectedVoucherIds] = useState<string[]>([]);


  const [newProductImages, setNewProductImages] = useState<Array<{ imageUrl: string; publicId: string; isPrimary: boolean }>>([]);
  const [isUploadingNew, setIsUploadingNew] = useState(false);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);

  const showUploadPreviews = (files: FileList) => {
    setUploadPreviews((current) => {
      current.forEach((url) => URL.revokeObjectURL(url));
      return Array.from(files).map((file) => URL.createObjectURL(file));
    });
  };

  const clearUploadPreviews = () => {
    setUploadPreviews((current) => {
      current.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  };



  const { data: productsData, isLoading, isError, error } = useProducts({
    page,
    pageSize,
    search: debouncedSearch,
    status,
    categoryId,
    brandId,
    sortBy,
    sortOrder,
  });


  const { data: productDetail } = useProduct(selectedProductId);


  const { data: vouchersData } = useVouchers(
    { page: 1, pageSize: 100, search: "" },
    { enabled: dialogOpen && activeTab === "vouchers" && selectedProductId !== null }
  );

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();


  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const uploadImageMutation = useUploadProductImage();
  const deleteImageMutation = useDeleteProductImage();
  const setPrimaryImageMutation = useSetProductPrimaryImage();
  const assignVoucherMutation = useAssignVoucher();


  useEffect(() => {
    if (selectedProductId && productDetail) {
      setName(productDetail.name || "");
      setDescription(productDetail.description || "");
      setPrice(String(productDetail.price || ""));
      setSalePrice(productDetail.salePrice ? String(productDetail.salePrice) : "");
      setStock(String(productDetail.stock || "0"));
      setProdStatus(productDetail.status || "active");
      setSelectedCategory(String(productDetail.categoryId || ""));
      setSelectedBrand(String(productDetail.brandId || ""));


      const specsObj: Record<string, string> = {};
      SPEC_FIELDS.forEach((f) => {
        const found = productDetail.specs.find((s: SpecItem) => s.attribute.name === f.name);
        specsObj[f.name] = found ? found.value : "";
      });
      setSpecsState(specsObj);


      const vIds = productDetail.productCoupons.map((pc: CouponLink) => pc.couponId);
      setSelectedVoucherIds(vIds);
    } else if (!selectedProductId) {

      setName("");
      setDescription("");
      setPrice("");
      setSalePrice("");
      setStock("");
      setProdStatus("active");
      setSelectedCategory("");
      setSelectedBrand("");
      setSpecsState({});
      setSelectedVoucherIds([]);
      setNewProductImages([]);
    }
  }, [selectedProductId, productDetail]);

  const handleOpenAdd = () => {
    setSelectedProductId(null);
    setActiveTab("info");
    setDialogOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setSelectedProductId(id);
    setActiveTab("info");
    setDialogOpen(true);
  };

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      if (!selectedProductId && newProductImages.length > 0) {
        const imagesToDelete = [...newProductImages];
        setNewProductImages([]);
        setDialogOpen(false);


        (async () => {
          for (const img of imagesToDelete) {
            if (img.publicId) {
              try {
                await fetch(`/api/admin/upload?publicId=${encodeURIComponent(img.publicId)}`, {
                  method: "DELETE",
                });
              } catch (err) {
                console.error("Failed to clean up image on close", err);
              }
            }
          }
        })();
        return;
      }
    }
    setDialogOpen(open);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Giá sản phẩm phải lớn hơn 0");
      return;
    }
    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Số lượng tồn kho không được âm");
      return;
    }
    if (!selectedCategory) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }
    if (!selectedBrand) {
      toast.error("Vui lòng chọn thương hiệu");
      return;
    }

    const specsArray = Object.entries(specsState).map(([name, value]) => {
      const field = SPEC_FIELDS.find((f) => f.name === name);
      return {
        name,
        groupName: field?.groupName || "General",
        value,
      };
    });

    const values = {
      name,
      description,
      price: priceNum,
      salePrice: salePrice ? parseFloat(salePrice) : null,
      stock: stockNum,
      status: prodStatus,
      categoryId: selectedCategory,
      brandId: selectedBrand,
      specs: specsArray,
      images: selectedProductId ? undefined : newProductImages,
    };

    try {
      if (selectedProductId) {

        await updateProductMutation.mutateAsync({ id: selectedProductId, values });


        await assignVoucherMutation.mutateAsync({
          productId: selectedProductId,
          voucherIds: selectedVoucherIds,
        });

        toast.success("Cập nhật sản phẩm thành công");
      } else {

        await createProductMutation.mutateAsync(values);
        toast.success("Thêm sản phẩm thành công");
        setNewProductImages([]);
      }
      setDialogOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Đã xảy ra lỗi"));
    }
  };

  const handleUploadNewProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    showUploadPreviews(files);
    setIsUploadingNew(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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
        setNewProductImages((prev) => [
          ...prev,
          {
            imageUrl: data.url,
            publicId: data.publicId,
            isPrimary: prev.length === 0,
          },
        ]);
        toast.success(`Đã tải lên ảnh ${file.name}`);
      } catch (err: any) {
        toast.error(err.message || `Tải ảnh ${file.name} thất bại`);
      }
    }
    setIsUploadingNew(false);
    clearUploadPreviews();
  };

  const handleDeleteNewProductImage = async (imageUrl: string) => {
    const imgToDelete = newProductImages.find((img) => img.imageUrl === imageUrl);
    if (imgToDelete?.publicId) {
      try {
        await fetch(`/api/admin/upload?publicId=${encodeURIComponent(imgToDelete.publicId)}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete physical file during preview deletion", err);
      }
    }

    setNewProductImages((prev) => {
      const filtered = prev.filter((img) => img.imageUrl !== imageUrl);
      if (prev.find((img) => img.imageUrl === imageUrl)?.isPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryNewProductImage = (imageUrl: string) => {
    setNewProductImages((prev) =>
      prev.map((img) => ({
        ...img,
        isPrimary: img.imageUrl === imageUrl,
      }))
    );
  };


  const handleDeleteProduct = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa (soft delete) sản phẩm này không?")) {
      try {
        await deleteProductMutation.mutateAsync(id);
        toast.success("Đã xóa sản phẩm thành công");
      } catch (error) {
        toast.error("Không thể xóa sản phẩm");
      }
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedProductId) return;

    showUploadPreviews(files);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        await uploadImageMutation.mutateAsync({ productId: selectedProductId, formData });
        toast.success(`Đã upload ảnh ${file.name}`);
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, `Upload ảnh ${file.name} thất bại`));
      }
    }
    clearUploadPreviews();
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!selectedProductId) return;
    try {
      await setPrimaryImageMutation.mutateAsync({ productId: selectedProductId, imageId });
      toast.success("Đã đặt làm ảnh đại diện");
    } catch (err) {
      toast.error("Không thể thay đổi ảnh đại diện");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!selectedProductId) return;
    if (confirm("Bạn có chắc chắn muốn xóa ảnh này không?")) {
      try {
        await deleteImageMutation.mutateAsync({ productId: selectedProductId, imageId });
        toast.success("Đã xóa ảnh thành công");
      } catch (err) {
        toast.error("Không thể xóa ảnh");
      }
    }
  };

  const toggleVoucherSelection = (voucherId: string) => {
    setSelectedVoucherIds((current) =>
      current.includes(voucherId)
        ? current.filter((id) => id !== voucherId)
        : [...current, voucherId]
    );
  };

  const pagination = productsData?.pagination;
  const stats = productsData?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Quản lý cửa hàng</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Sản phẩm</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý kho sản phẩm laptop, thông số kỹ thuật, hình ảnh và voucher liên kết.
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <PlusIcon />
          Thêm sản phẩm
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Tổng sản phẩm", value: stats?.total, icon: PackageIcon },
          { label: "Đang hoạt động", value: stats?.active, icon: CheckCircle2Icon },
          { label: "Không hoạt động", value: stats?.inactive, icon: CircleOffIcon },
          { label: "Bản nháp", value: stats?.draft, icon: Edit3Icon },
          { label: "Sắp hết hàng", value: stats?.lowStock, icon: AlertTriangleIcon },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                {isLoading && !productsData ? (
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
              <CardTitle>Danh sách sản phẩm</CardTitle>
              <CardDescription>
                {pagination?.total ?? 0} sản phẩm đang hiển thị
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-64">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                />
              </div>
              <Select
                onValueChange={(val) => {
                  setCategoryId(val);
                  setPage(1);
                }}
                value={categoryId}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories?.map((cat: CategoryOption) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => {
                  setBrandId(val);
                  setPage(1);
                }}
                value={brandId}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Thương hiệu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                  {brands?.map((brand: BrandOption) => (
                    <SelectItem key={brand.id} value={String(brand.id)}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(val) => {
                  setStatus(val);
                  setPage(1);
                }}
                value={status}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 w-16">STT</TableHead>
                <TableHead>Ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Danh mục / Hiệu</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Voucher</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="w-12 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell className="pl-5"><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="size-10 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="pr-5"><Skeleton className="size-8 rounded-full" /></TableCell>
                  </TableRow>
                ))
                : productsData?.data.map((product: ProductRow, index: number) => (
                  <TableRow key={product.id}>
                    <TableCell className="pl-5 font-mono text-xs">{(page - 1) * pageSize + index + 1}</TableCell>
                    <TableCell>
                      <div className="relative size-10 bg-muted rounded overflow-hidden border">
                        {product.images[0]?.imageUrl ? (
                          <img
                            alt={product.name}
                            className="size-full object-cover"
                            src={product.images[0].imageUrl}
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="size-4" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{product.name}</TableCell>
                    <TableCell>
                      {product.salePrice ? (
                        <div className="space-y-0.5">
                          <span className="text-sm font-semibold text-primary">
                            {Number(product.salePrice).toLocaleString("vi-VN")}
                          </span>
                          <span className="block text-xs line-through text-muted-foreground">
                            {Number(product.price).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm">
                          {Number(product.price).toLocaleString("vi-VN")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{product.stock}</TableCell>
                    <TableCell className="text-sm">
                      {product.brand?.name ?? ""} · {product.category?.name ?? ""}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === "active"
                            ? "default"
                            : product.status === "inactive"
                              ? "destructive"
                              : "secondary"
                        }
                        className="capitalize"
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {product.productCoupons && product.productCoupons.length > 0 ? (
                          product.productCoupons.map((pc: CouponLink) => (
                            <Badge key={pc.couponId} variant="outline" className="text-[10px]">
                              {pc.coupon?.code ?? ""}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Không áp dụng</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(product.createdAt).toLocaleDateString("vi-VN")}
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
                          <DropdownMenuItem onSelect={() => handleOpenEdit(product.id)}>
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleDeleteProduct(product.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {!isLoading && productsData?.data.length === 0 && (
            <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
              <PackageIcon className="size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Không tìm thấy sản phẩm nào</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
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
                  <ChevronLeftIcon />
                  Trước
                </Button>
                <Button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((val) => val + 1)}
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

      {                          }
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProductId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</DialogTitle>
            <DialogDescription>
              Nhập đầy đủ các thông tin của laptop để hiển thị trên cửa hàng.
            </DialogDescription>
          </DialogHeader>

          <div className="flex border-b mb-4">
            {(["info", "specs", "images", "vouchers"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-b-2 font-medium text-sm capitalize duration-150 ${activeTab === tab
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab === "info"
                  ? "Thông tin"
                  : tab === "specs"
                    ? "Thông số"
                    : tab === "images"
                      ? "Hình ảnh"
                      : "Voucher"}
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={handleSaveProduct}>
            {activeTab === "info" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="prod-name">Tên sản phẩm</Label>
                  <Input
                    id="prod-name"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="prod-desc">Mô tả sản phẩm</Label>
                  <Textarea
                    id="prod-desc"
                    onChange={(e) => setDescription(e.target.value)}
                    value={description}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-price">Giá gốc (VND)</Label>
                  <Input
                    id="prod-price"
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    value={price}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-salePrice">Giá khuyến mãi (VND - tùy chọn)</Label>
                  <Input
                    id="prod-salePrice"
                    onChange={(e) => setSalePrice(e.target.value)}
                    type="number"
                    value={salePrice}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-stock">Số lượng kho</Label>
                  <Input
                    id="prod-stock"
                    onChange={(e) => setStock(e.target.value)}
                    type="number"
                    value={stock}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-status">Trạng thái</Label>
                  <Select onValueChange={(val) => setProdStatus(val)} value={prodStatus}>
                    <SelectTrigger id="prod-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-cat">Danh mục</Label>
                  <Select onValueChange={(val) => setSelectedCategory(val)} value={selectedCategory}>
                    <SelectTrigger id="prod-cat">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat: CategoryOption) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-brand">Thương hiệu</Label>
                  <Select onValueChange={(val) => setSelectedBrand(val)} value={selectedBrand}>
                    <SelectTrigger id="prod-brand">
                      <SelectValue placeholder="Chọn thương hiệu" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands?.map((brand: BrandOption) => (
                        <SelectItem key={brand.id} value={String(brand.id)}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {activeTab === "specs" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {SPEC_FIELDS.map((field) => (
                  <div key={field.name} className="space-y-1">
                    <Label htmlFor={`spec-${field.name}`}>{field.label}</Label>
                    <Input
                      id={`spec-${field.name}`}
                      onChange={(e) =>
                        setSpecsState((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      value={specsState[field.name] || ""}
                      placeholder={`Nhập ${field.label.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === "images" && selectedProductId && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>Tải ảnh lên sản phẩm</Label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (!files || files.length === 0 || !selectedProductId) return;

                      showUploadPreviews(files);
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const formData = new FormData();
                        formData.append("file", file);

                        try {
                          await uploadImageMutation.mutateAsync({ productId: selectedProductId, formData });
                          toast.success(`Đã upload ảnh ${file.name}`);
                        } catch (err: unknown) {
                          toast.error(getErrorMessage(err, `Upload ảnh ${file.name} thất bại`));
                        }
                      }
                      clearUploadPreviews();
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.multiple = true;
                      input.accept = "image/jpeg,image/png,image/webp,image/avif";
                      input.onchange = (e: any) => {
                        handleUploadImage(e);
                      };
                      input.click();
                    }}
                    className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 px-6 py-8 hover:border-primary/50 transition-colors cursor-pointer bg-muted/10 hover:bg-muted/20"
                  >
                    {uploadImageMutation.isPending ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <span className="mt-3 text-sm text-muted-foreground font-medium">Đang tải ảnh lên...</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <UploadIcon className="mx-auto size-8 text-muted-foreground/60" />
                        <div className="mt-3 flex text-sm text-muted-foreground justify-center">
                          <span className="font-semibold text-primary hover:underline">Tải ảnh lên</span>
                          <p className="pl-1">hoặc kéo thả nhiều ảnh vào đây</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          Chấp nhận ảnh JPG, PNG, WEBP, AVIF tối đa 10MB mỗi ảnh
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4">
                  {uploadPreviews.map((previewUrl, index) => (
                    <div
                      key={previewUrl}
                      className="relative aspect-square overflow-hidden rounded border bg-muted"
                    >
                      <img
                        alt={`Ảnh đang tải ${index + 1}`}
                        className="size-full object-cover opacity-70"
                        src={previewUrl}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 text-white">
                        <Loader2 className="size-6 animate-spin" />
                        <span className="text-xs font-medium">Đang tải...</span>
                      </div>
                    </div>
                  ))}
                  {productDetail?.images.map((img: ProductImage) => (
                    <div key={img.id} className="relative aspect-square border rounded bg-muted overflow-hidden group">
                      <img alt="product gallery" className="size-full object-cover" src={img.imageUrl} />

                      {img.isPrimary && (
                        <Badge className="absolute top-1 left-1 text-[9px] bg-primary">Thumbnail</Badge>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity duration-150">
                        {!img.isPrimary && (
                          <Button
                            type="button"
                            size="icon"
                            className="size-7 bg-white text-black hover:bg-white/80"
                            onClick={() => handleSetPrimaryImage(img.id)}
                            title="Đặt làm ảnh chính"
                          >
                            <CheckIcon className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="size-7"
                          onClick={() => handleDeleteImage(img.id)}
                          title="Xóa hình ảnh"
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {uploadPreviews.length === 0 && (!productDetail?.images || productDetail.images.length === 0) && (
                    <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                      Sản phẩm này chưa có hình ảnh nào.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "images" && !selectedProductId && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>Tải ảnh lên sản phẩm</Label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (!files || files.length === 0) return;

                      showUploadPreviews(files);
                      setIsUploadingNew(true);
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
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
                          setNewProductImages((prev) => [
                            ...prev,
                            {
                              imageUrl: data.url,
                              publicId: data.publicId,
                              isPrimary: prev.length === 0,
                            },
                          ]);
                          toast.success(`Đã tải lên ảnh ${file.name}`);
                        } catch (err: any) {
                          toast.error(err.message || `Tải ảnh ${file.name} thất bại`);
                        }
                      }
                      setIsUploadingNew(false);
                      clearUploadPreviews();
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.multiple = true;
                      input.accept = "image/jpeg,image/png,image/webp,image/avif";
                      input.onchange = (e: any) => {
                        handleUploadNewProductImage(e);
                      };
                      input.click();
                    }}
                    className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 px-6 py-8 hover:border-primary/50 transition-colors cursor-pointer bg-muted/10 hover:bg-muted/20"
                  >
                    {isUploadingNew ? (
                      <div className="flex flex-col items-center py-2">
                        <Loader2 className="size-8 animate-spin text-primary" />
                        <span className="mt-3 text-sm text-muted-foreground font-medium">Đang tải ảnh lên...</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <UploadIcon className="mx-auto size-8 text-muted-foreground/60" />
                        <div className="mt-3 flex text-sm text-muted-foreground justify-center">
                          <span className="font-semibold text-primary hover:underline">Tải ảnh lên</span>
                          <p className="pl-1">hoặc kéo thả nhiều ảnh vào đây</p>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          Chấp nhận ảnh JPG, PNG, WEBP, AVIF tối đa 10MB mỗi ảnh
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-3 sm:grid-cols-4">
                  {uploadPreviews.map((previewUrl, index) => (
                    <div
                      key={previewUrl}
                      className="relative aspect-square overflow-hidden rounded border bg-muted"
                    >
                      <img
                        alt={`Ảnh đang tải ${index + 1}`}
                        className="size-full object-cover opacity-70"
                        src={previewUrl}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 text-white">
                        <Loader2 className="size-6 animate-spin" />
                        <span className="text-xs font-medium">Đang tải...</span>
                      </div>
                    </div>
                  ))}
                  {newProductImages.map((img) => (
                    <div key={img.imageUrl} className="relative aspect-square border rounded bg-muted overflow-hidden group">
                      <img alt="product gallery" className="size-full object-cover" src={img.imageUrl} />

                      {img.isPrimary && (
                        <Badge className="absolute top-1 left-1 text-[9px] bg-primary">Thumbnail</Badge>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity duration-150">
                        {!img.isPrimary && (
                          <Button
                            type="button"
                            size="icon"
                            className="size-7 bg-white text-black hover:bg-white/80"
                            onClick={() => handleSetPrimaryNewProductImage(img.imageUrl)}
                            title="Đặt làm ảnh chính"
                          >
                            <CheckIcon className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="size-7"
                          onClick={() => handleDeleteNewProductImage(img.imageUrl)}
                          title="Xóa hình ảnh"
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {uploadPreviews.length === 0 && newProductImages.length === 0 && (
                    <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                      Sản phẩm này chưa có hình ảnh nào. Bạn có thể kéo thả để tải lên trước khi tạo sản phẩm.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "vouchers" && selectedProductId && (
              <div className="space-y-4">
                <Label>Áp dụng các Voucher giảm giá</Label>
                <div className="max-h-60 overflow-y-auto border rounded p-3 space-y-2">
                  {vouchersData?.data.map((voucher: VoucherOption) => (
                    <div key={voucher.id} className="flex items-center space-x-2 py-1.5 border-b last:border-0">
                      <Checkbox
                        id={`voucher-chk-${voucher.id}`}
                        checked={selectedVoucherIds.includes(voucher.id)}
                        onCheckedChange={() => toggleVoucherSelection(voucher.id)}
                      />
                      <label
                        htmlFor={`voucher-chk-${voucher.id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        <span className="font-semibold text-primary">{voucher.code}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {voucher.name || "Không tên"} ({voucher.discountType === "percent" ? `${voucher.discountValue}%` : `${Number(voucher.discountValue).toLocaleString("vi-VN")} VND`})
                        </span>
                      </label>
                    </div>
                  ))}
                  {(!vouchersData?.data || vouchersData.data.length === 0) && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      Không có mã giảm giá nào đang khả dụng.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "vouchers" && !selectedProductId && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <SettingsIcon className="size-10 text-muted-foreground/40" />
                <p className="mt-3 font-medium text-muted-foreground">Chưa thể gán voucher</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vui lòng lưu sản phẩm trước, sau đó quay lại tab Voucher để liên kết mã giảm giá.
                </p>
              </div>
            )}

            <DialogFooter className="mt-6 border-t pt-4">
              <Button onClick={() => handleOpenChange(false)} type="button" variant="outline">
                Hủy bỏ
              </Button>
              {activeTab === "info" || activeTab === "specs" || !selectedProductId ? (
                <Button
                  disabled={
                    isUploadingNew ||
                    uploadImageMutation.isPending ||
                    createProductMutation.isPending ||
                    updateProductMutation.isPending
                  }
                  type="submit"
                >
                  {selectedProductId ? "Lưu thay đổi" : "Tạo sản phẩm"}
                </Button>
              ) : null}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
