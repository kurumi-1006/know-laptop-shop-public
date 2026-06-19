import prisma from '@/lib/prisma';

interface CreateImageInput {
  productId: string;
  imageUrl: string;
  isPrimary?: boolean;
  displayOrder?: number;
}

interface UpdateImageInput {
  imageUrl?: string;
  isPrimary?: boolean;
  displayOrder?: number;
}





export class ProductImagesRepository {



  static async getProductImages(productId: string) {
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!productExists) {
      throw new Error(`Product with ID ${productId} does not exist.`);
    }

    return prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });
  }




  static async addProductImage(data: CreateImageInput) {
    const { productId, imageUrl, isPrimary = false, displayOrder = 0 } = data;

    const productExists = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!productExists) {
      throw new Error(`Product with ID ${productId} does not exist.`);
    }

    return prisma.$transaction(async (tx) => {

      if (isPrimary) {
        await tx.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        });
      }

      return tx.productImage.create({
        data: {
          productId,
          imageUrl,
          isPrimary,
          displayOrder,
        },
      });
    });
  }




  static async updateProductImage(imageId: string, data: UpdateImageInput) {
    const existingImage = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      throw new Error(`Product image with ID ${imageId} does not exist.`);
    }

    return prisma.$transaction(async (tx) => {

      if (data.isPrimary) {
        await tx.productImage.updateMany({
          where: { productId: existingImage.productId },
          data: { isPrimary: false },
        });
      }

      return tx.productImage.update({
        where: { id: imageId },
        data,
      });
    });
  }




  static async deleteProductImage(imageId: string) {
    const existingImage = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!existingImage) {
      throw new Error(`Product image with ID ${imageId} does not exist.`);
    }

    return prisma.productImage.delete({
      where: { id: imageId },
    });
  }




  static async setProductImagesBatch(
    productId: string,
    images: Array<{ imageUrl: string; isPrimary?: boolean; displayOrder?: number }>
  ) {
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!productExists) {
      throw new Error(`Product with ID ${productId} does not exist.`);
    }

    return prisma.$transaction(async (tx) => {

      await tx.productImage.deleteMany({
        where: { productId },
      });


      return tx.productImage.createMany({
        data: images.map((img) => ({
          productId,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary ?? false,
          displayOrder: img.displayOrder ?? 0,
        })),
      });
    });
  }




  static async setPrimaryImage(productId: string, imageId: string) {
    const productExists = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!productExists) {
      throw new Error(`Product with ID ${productId} does not exist.`);
    }

    const imageExists = await prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!imageExists || imageExists.productId !== productId) {
      throw new Error(`Image with ID ${imageId} does not belong to product ${productId}.`);
    }

    return prisma.$transaction(async (tx) => {

      await tx.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      });


      return tx.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      });
    });
  }
}





export class ProductImagesFacade {



  static async getImages(productId: string) {
    return ProductImagesRepository.getProductImages(productId);
  }




  static async addImage(data: CreateImageInput) {
    return ProductImagesRepository.addProductImage(data);
  }




  static async updateImage(imageId: string, data: UpdateImageInput) {
    return ProductImagesRepository.updateProductImage(imageId, data);
  }




  static async deleteImage(imageId: string) {
    return ProductImagesRepository.deleteProductImage(imageId);
  }




  static async setImagesBatch(
    productId: string,
    images: Array<{ imageUrl: string; isPrimary?: boolean; displayOrder?: number }>
  ) {
    return ProductImagesRepository.setProductImagesBatch(productId, images);
  }




  static async setPrimary(productId: string, imageId: string) {
    return ProductImagesRepository.setPrimaryImage(productId, imageId);
  }
}
