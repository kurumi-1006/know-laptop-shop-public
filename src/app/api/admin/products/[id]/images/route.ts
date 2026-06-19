import { auth } from "@/features/auth/lib/auth";
import { NextResponse } from "next/server";
import { ProductImagesFacade } from "@/features/product/lib/images";
import { storageService } from "@/lib/storage/storage-service";
import { extractCloudinaryPublicId } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

async function requireAdmin(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user.role === "admin";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: productId } = await params;
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const fileList = files.length > 0
      ? files
      : ([formData.get("file")].filter(Boolean) as File[]);

    if (fileList.length === 0) {
      return NextResponse.json({ error: "Khong tim thay file de upload" }, { status: 400 });
    }
    if (fileList.length > MAX_FILES) {
      return NextResponse.json({ error: `Toi da ${MAX_FILES} anh moi lan upload.` }, { status: 400 });
    }

    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Dinh dang khong hop le. Chi chap nhan JPG, PNG, WebP, AVIF." },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File "${file.name}" vuot qua 10 MB.` }, { status: 400 });
      }
    }

    const existingImages = await ProductImagesFacade.getImages(productId);
    const newImages = [];

    for (const [index, file] of fileList.entries()) {
      const { url: imageUrl } = await storageService.upload(file);
      newImages.push(
        await ProductImagesFacade.addImage({
          productId,
          imageUrl,
          isPrimary: existingImages.length === 0 && index === 0,
          displayOrder: existingImages.length + index,
        }),
      );
    }

    return NextResponse.json({ success: true, data: newImages }, { status: 201 });
  } catch (error) {
    console.error("Upload image failed", error);
    return NextResponse.json({ error: "Unable to upload image." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: productId } = await params;
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageId } = await request.json();
    if (!imageId || typeof imageId !== "string") {
      return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
    }

    const updatedImage = await ProductImagesFacade.setPrimary(productId, imageId);
    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error("Set thumbnail failed", error);
    return NextResponse.json({ error: "Unable to set primary image." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: productId } = await params;
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");
  if (!imageId) {
    return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
  }

  try {
    const images = await ProductImagesFacade.getImages(productId);
    const imageToDelete = images.find((image) => image.id === imageId);
    if (!imageToDelete) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    await ProductImagesFacade.deleteImage(imageId);

    if (imageToDelete.imageUrl.includes("res.cloudinary.com")) {
      const publicId = extractCloudinaryPublicId(imageToDelete.imageUrl);
      if (publicId) {
        try {
          await storageService.delete(publicId);
        } catch (error) {
          console.error("Failed to delete Cloudinary file", error);
        }
      }
    } else {
      const imageKey = imageToDelete.imageUrl.replace(/^\/uploads\//, "");
      if (imageKey && imageKey !== imageToDelete.imageUrl) {
        try {
          await storageService.delete(imageKey);
        } catch (error) {
          console.error("Failed to delete physical file", error);
        }
      }
    }

    if (imageToDelete.isPrimary) {
      const nextImage = images.find((image) => image.id !== imageId);
      if (nextImage) {
        await ProductImagesFacade.setPrimary(productId, nextImage.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete image failed", error);
    return NextResponse.json({ error: "Unable to delete image." }, { status: 500 });
  }
}
