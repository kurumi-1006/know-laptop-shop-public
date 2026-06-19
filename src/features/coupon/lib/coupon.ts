import prisma, { type PrismaTx } from '@/lib/prisma';
import { DiscountType } from '@/app/generated/prisma/client';
import { DiscountStrategyFactory } from './discount-strategies';

interface CreateCouponInput {
  code: string;
  name?: string | null;
  discountType: DiscountType;
  discountValue: number;
  startDate: Date;
  endDate: Date;
  minOrderValue?: number;
  maxDiscountValue?: number | null;
  quantity?: number;
}

interface UpdateCouponInput {
  code?: string;
  name?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  startDate?: Date;
  endDate?: Date;
  minOrderValue?: number;
  maxDiscountValue?: number | null;
  quantity?: number;
  isActive?: boolean;
  isDeleted?: boolean;
}





export class CouponRepository {



  static async getCouponByCode(code: string) {
    return prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
  }




  static async getCouponById(couponId: string) {
    return prisma.coupon.findUnique({
      where: { id: couponId },
    });
  }




  static async getActiveCoupons() {
    const now = new Date();
    return prisma.coupon.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }




  static async createCoupon(data: CreateCouponInput) {
    const codeFormatted = data.code.toUpperCase();

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: codeFormatted },
    });

    if (existingCoupon) {
      throw new Error(`Coupon with code ${codeFormatted} already exists.`);
    }

    return prisma.coupon.create({
      data: {
        ...data,
        code: codeFormatted,
        minOrderValue: data.minOrderValue ?? 0,
        quantity: data.quantity ?? 0,
      },
    });
  }




  static async updateCoupon(couponId: string, data: UpdateCouponInput) {
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!existingCoupon) {
      throw new Error(`Coupon with ID ${couponId} does not exist.`);
    }

    const updatedData = { ...data };
    if (data.code) {
      updatedData.code = data.code.toUpperCase();
    }

    return prisma.coupon.update({
      where: { id: couponId },
      data: updatedData,
    });
  }




  static async deleteCoupon(couponId: string) {
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!existingCoupon) {
      throw new Error(`Coupon with ID ${couponId} does not exist.`);
    }

    return prisma.coupon.delete({
      where: { id: couponId },
    });
  }




  static async linkCouponToProducts(couponId: string, productIds: string[]) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new Error(`Coupon with ID ${couponId} does not exist.`);
    }

    return prisma.$transaction(async (tx) => {

      await tx.productCoupon.deleteMany({
        where: { couponId },
      });


      return tx.productCoupon.createMany({
        data: productIds.map((productId) => ({
          couponId,
          productId,
        })),
      });
    });
  }




  static async getProductsForCoupon(couponId: string) {
    const productCoupons = await prisma.productCoupon.findMany({
      where: { couponId },
      include: {
        product: true,
      },
    });
    return productCoupons.map((pc) => pc.product);
  }




  static async getProductCouponsByCouponId(couponId: string) {
    return prisma.productCoupon.findMany({
      where: { couponId },
    });
  }




  static async findMany(params: { page: number; pageSize: number; search: string }, tx: PrismaTx = prisma) {
    const { page, pageSize, search } = params;
    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    return tx.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        productCoupons: {
          include: {
            product: { select: { name: true } }
          }
        }
      }
    });
  }




  static async count(params: { search: string }, tx: PrismaTx = prisma) {
    const { search } = params;
    const where = {
      isDeleted: false,
      ...(search && {
        OR: [
          { code: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    return tx.coupon.count({ where });
  }

  static async getStats() {
    const now = new Date();
    const [total, active, expired] = await Promise.all([
      prisma.coupon.count({ where: { isDeleted: false } }),
      prisma.coupon.count({
        where: {
          isDeleted: false,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.coupon.count({
        where: {
          isDeleted: false,
          endDate: { lt: now },
        },
      }),
    ]);

    return { total, active, expired };
  }




  static async linkVoucherToProductsBatch(couponId: string, productIds: string[], tx: PrismaTx = prisma) {
    const coupon = await tx.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon) {
      throw new Error(`Coupon with ID ${couponId} does not exist.`);
    }

    return tx.$transaction(async (transactionClient: PrismaTx) => {
      for (const productId of productIds) {
        await transactionClient.productCoupon.upsert({
          where: {
            productId_couponId: { productId, couponId },
          },
          update: {},
          create: { productId, couponId },
        });
      }
    });
  }




  static async linkCouponsToProduct(productId: string, couponIds: string[], tx: PrismaTx = prisma) {
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} does not exist.`);
    }

    return tx.$transaction(async (transactionClient: PrismaTx) => {
      await transactionClient.productCoupon.deleteMany({
        where: { productId },
      });

      for (const couponId of couponIds) {
        await transactionClient.productCoupon.create({
          data: { productId, couponId },
        });
      }
    });
  }




  static async unlinkProductCoupon(productId: string, couponId: string, tx: PrismaTx = prisma) {
    return tx.productCoupon.delete({
      where: {
        productId_couponId: { productId, couponId },
      },
    });
  }
}

type CartItemForValidation = { productId: string; price: number; quantity: number };




async function validateCoupon(code: string, orderValue: number, cartItems?: CartItemForValidation[], userId?: string) {
  const coupon = await CouponRepository.getCouponByCode(code);

  if (!coupon) {
    return { valid: false, message: 'Mã giảm giá không tồn tại.' };
  }

  if (coupon.isDeleted) {
    return { valid: false, message: 'Mã giảm giá không tồn tại.' };
  }

  if (!coupon.isActive) {
    return { valid: false, message: 'Mã giảm giá đã bị vô hiệu hóa.' };
  }

  if (userId) {
    const usedOrder = await prisma.orders.findFirst({
      where: {
        couponId: coupon.id,
        userId,
        status: { not: 'cancelled' },
      },
    });
    if (usedOrder) {
      return { valid: false, message: 'Bạn đã sử dụng mã giảm giá này rồi.' };
    }
  }


  const productCoupons = await CouponRepository.getProductCouponsByCouponId(coupon.id);


  let discountableSubtotal = orderValue;

  if (productCoupons.length > 0) {
    if (!cartItems || cartItems.length === 0) {
      return {
        valid: false,
        message: 'Mã giảm giá này chỉ áp dụng cho một số sản phẩm nhất định.',
      };
    }

    const allowedProductIds = productCoupons.map((pc) => pc.productId);
    const eligibleItems = cartItems.filter((item) => allowedProductIds.includes(item.productId));

    if (eligibleItems.length === 0) {
      return {
        valid: false,
        message: 'Mã giảm giá không áp dụng cho các sản phẩm trong giỏ hàng hiện tại.',
      };
    }


    discountableSubtotal = eligibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);


    if (orderValue < Number(coupon.minOrderValue)) {
      return {
        valid: false,
        message: `Đơn hàng tối thiểu cần đạt ${Number(coupon.minOrderValue).toLocaleString('vi-VN')} VND để sử dụng mã này.`,
      };
    }
  } else {

    if (orderValue < Number(coupon.minOrderValue)) {
      return {
        valid: false,
        message: `Đơn hàng tối thiểu cần đạt ${Number(coupon.minOrderValue).toLocaleString('vi-VN')} VND để sử dụng mã này.`,
      };
    }
  }

  const now = new Date();
  if (coupon.startDate > now) {
    return { valid: false, message: 'Mã giảm giá chưa đến thời gian áp dụng.' };
  }

  if (coupon.endDate < now) {
    return { valid: false, message: 'Mã giảm giá đã hết hạn.' };
  }

  if (coupon.quantity > 0 && coupon.usedCount >= coupon.quantity) {
    return { valid: false, message: 'Mã giảm giá đã được sử dụng hết.' };
  }


  const strategy = DiscountStrategyFactory.getStrategy(coupon.discountType);
  let discountAmount = strategy.calculate(
    discountableSubtotal,
    Number(coupon.discountValue),
    coupon.maxDiscountValue ? Number(coupon.maxDiscountValue) : null
  );




  if (discountAmount > discountableSubtotal) {
    discountAmount = discountableSubtotal;
  }

  return {
    valid: true,
    discountAmount,
    coupon,
  };
}




async function getCouponsForProduct(productId: string) {
  const now = new Date();


  const activeCoupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      productCoupons: true,
    },
  });


  return activeCoupons.filter((coupon) => {
    if (coupon.productCoupons.length === 0) {
      return true;
    }
    return coupon.productCoupons.some((pc) => pc.productId === productId);
  });
}





export class CouponFacade {



  static async getByCode(code: string) {
    return CouponRepository.getCouponByCode(code);
  }




  static async getById(couponId: string) {
    return CouponRepository.getCouponById(couponId);
  }




  static async getActiveList() {
    return CouponRepository.getActiveCoupons();
  }




  static async create(data: CreateCouponInput) {
    return CouponRepository.createCoupon(data);
  }




  static async update(couponId: string, data: UpdateCouponInput) {
    return CouponRepository.updateCoupon(couponId, data);
  }




  static async delete(couponId: string) {
    return CouponRepository.deleteCoupon(couponId);
  }




  static async validate(code: string, orderValue: number, cartItems?: CartItemForValidation[], userId?: string) {
    return validateCoupon(code, orderValue, cartItems, userId);
  }




  static async linkProducts(couponId: string, productIds: string[]) {
    return CouponRepository.linkCouponToProducts(couponId, productIds);
  }




  static async getAppliedProducts(couponId: string) {
    return CouponRepository.getProductsForCoupon(couponId);
  }




  static async getApplicableCoupons(productId: string) {
    return getCouponsForProduct(productId);
  }




  static async getVouchersList(params: { page: number; pageSize: number; search: string }) {
    const [data, total, stats] = await Promise.all([
      CouponRepository.findMany(params),
      CouponRepository.count(params),
      CouponRepository.getStats(),
    ]);
    return { data, total, stats };
  }




  static async linkVoucherToProductsBatch(couponId: string, productIds: string[]) {
    return CouponRepository.linkVoucherToProductsBatch(couponId, productIds);
  }




  static async linkCouponsToProduct(productId: string, couponIds: string[]) {
    return CouponRepository.linkCouponsToProduct(productId, couponIds);
  }




  static async unlinkProductCoupon(productId: string, couponId: string) {
    return CouponRepository.unlinkProductCoupon(productId, couponId);
  }
}
