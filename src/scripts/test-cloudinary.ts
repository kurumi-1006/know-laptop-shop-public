import * as dotenv from "dotenv";
import { resolve } from "path";


dotenv.config({ path: resolve(process.cwd(), ".env") });

import { storageService } from "../lib/storage/storage-service";

async function testUpload() {
  console.log("Starting Cloudinary upload test...");
  console.log("Cloud name:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  console.log("API Key configured:", !!process.env.CLOUDINARY_API_KEY);
  console.log("API Secret configured:", !!process.env.CLOUDINARY_API_SECRET);


  const content = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
  ]);
  const file = new File([content], "test-image-cloudinary.png", { type: "image/png" });

  try {
    const uploadResult = await storageService.upload(file);
    console.log("\n[SUCCESS] Uploaded to Cloudinary successfully!");
    console.log("URL:", uploadResult.url);
    console.log("Key (public_id):", uploadResult.key);

    console.log("\nCleaning up: Deleting uploaded image...");
    await storageService.delete(uploadResult.key);
    console.log("[SUCCESS] Deleted from Cloudinary successfully!");
  } catch (error) {
    console.error("\n[FAILURE] Cloudinary operation failed:", error);
  }
}

testUpload();
