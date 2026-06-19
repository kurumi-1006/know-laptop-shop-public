import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { v2 as cloudinary } from "cloudinary";

export interface StorageService {





  upload(file: File): Promise<{ url: string; key: string }>;





  delete(key: string): Promise<void>;
}

export class LocalDiskStorageAdapter implements StorageService {
  private uploadDir: string;
  private urlPrefix: string;

  constructor() {
    this.uploadDir = join(process.cwd(), "public", "uploads");
    this.urlPrefix = "/uploads";
  }

  async upload(file: File): Promise<{ url: string; key: string }> {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await mkdir(this.uploadDir, { recursive: true });

    const safeFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = join(this.uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    return {
      url: `${this.urlPrefix}/${safeFilename}`,
      key: safeFilename,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key);
    try {
      await unlink(filePath);
    } catch (error: unknown) {
      if ((error as { code?: string }).code !== "ENOENT") {
        throw error;
      }
    }
  }
}

export class CloudinaryStorageAdapter implements StorageService {
  private isConfigured = false;

  private ensureConfigured() {
    if (this.isConfigured) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "CRITICAL: Cloudinary environment variables (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured."
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    this.isConfigured = true;
  }

  async upload(file: File): Promise<{ url: string; key: string }> {
    this.ensureConfigured();
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "know-store",
      resource_type: "image",
    });

    return {
      url: result.secure_url,
      key: result.public_id,
    };
  }

  async delete(key: string): Promise<void> {
    this.ensureConfigured();
    await cloudinary.uploader.destroy(key, { resource_type: "image" });
  }
}

function createStorageService(): StorageService {

  return new CloudinaryStorageAdapter();
}

export const storageService: StorageService = createStorageService();
