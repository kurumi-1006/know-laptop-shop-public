import { requireAdmin, handleAuthError } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { storageService } from "@/lib/storage/storage-service";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILES = 10;

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];


    const fileList = files.length > 0 ? files : [formData.get("file") as File | null].filter(Boolean) as File[];

    if (fileList.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy file để upload" }, { status: 400 });
    }

    if (fileList.length > MAX_FILES) {
      return NextResponse.json({ error: `Tối đa ${MAX_FILES} ảnh mỗi lần upload.` }, { status: 400 });
    }

    for (const file of fileList) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Định dạng "${file.type}" không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP, AVIF.` },
          { status: 400 },
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" vượt quá 10 MB.` },
          { status: 400 },
        );
      }
    }

    const results = [];
    for (const file of fileList) {
      const { url, key } = await storageService.upload(file);
      results.push({ url, publicId: key, originalName: file.name });
    }

    return NextResponse.json(
      {
        success: true,
        data: results,
        ...(results.length === 1 ? results[0] : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Upload failed", error);
    return NextResponse.json({ error: "Unable to upload image." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json({ error: "Thiếu publicId của ảnh cần xóa." }, { status: 400 });
    }

    await storageService.delete(publicId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Delete upload failed", error);
    return NextResponse.json({ error: "Unable to delete image." }, { status: 500 });
  }
}
