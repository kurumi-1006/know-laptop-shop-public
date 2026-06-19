import crypto from "crypto";
import prisma from "@/lib/prisma";
import { isStaff } from "@/lib/roles";
import { CartFacade } from "@/features/cart/lib/cart-facade";
import { CouponFacade } from "@/features/coupon/lib/coupon";
import { StripeService } from "@/features/payment/lib/stripe-service";
import { OrderRepository } from "./order-repository";
import { canTransition } from "./order-state-machine";
import {
  cancelOrderAndReleaseResources,
  OrderCancellationConflictError,
} from "./order-cancellation";
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from "./order-constants";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@/app/generated/prisma/enums";

const VALID_PAYMENT_METHODS: string[] = [PaymentMethod.cod, PaymentMethod.stripe];

const ONLINE_PAYMENT_METHODS: string[] = [PaymentMethod.stripe];

type SessionUser = {
  id: string;
  role?: string | null;
  [key: string]: unknown;
};

type CheckoutInput = {
  addressId?: string;
  couponCode?: string;
  note?: string;
  paymentMethod?: string;
  selectedProductIds?: string[];
};

export class OrderAccessError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function assertCustomer(user: SessionUser | null | undefined) {
  if (!user) throw new OrderAccessError("Vui lòng đăng nhập để tiếp tục.", 401);
  if (isStaff(user.role)) {
    throw new OrderAccessError("Chỉ khách hàng mới có thể thực hiện chức năng này.", 403);
  }
}

function assertStaff(user: SessionUser | null | undefined) {
  if (!user) throw new OrderAccessError("Vui lòng đăng nhập để tiếp tục.", 401);
  if (!isStaff(user.role)) {
    throw new OrderAccessError("Bạn không có quyền truy cập.", 403);
  }
}

function generateOrderCode(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
  return `ORD-${datePart}-${randomPart}`;
}

export class OrderFacade {
  static async checkout(user: SessionUser, input: CheckoutInput) {
    assertCustomer(user);

    const cartFacade = new CartFacade();
    const cartItems = await cartFacade.getCart(user);

    if (!cartItems || cartItems.length === 0) {
      throw new OrderAccessError("Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.", 400);
    }

    let filteredCartItems = cartItems;
if (input.selectedProductIds && input.selectedProductIds.length > 0) {
  filteredCartItems = cartItems.filter((item) =>
    input.selectedProductIds!.includes(item.productId)
  );
}

if (!filteredCartItems || filteredCartItems.length === 0) {
  throw new OrderAccessError("Giỏ hàng trống hoặc các sản phẩm được chọn không hợp lệ.", 400);
}


const [profile, userRecord] = await Promise.all([
  prisma.profile.findUnique({
    where: { userId: user.id },
    select: { phone: true },
  }),
  prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  }),
]);


let address;
if (input.addressId) {
  address = await prisma.address.findFirst({
    where: { id: input.addressId, profile: { userId: user.id } },
  });
  if (!address) {
    throw new OrderAccessError("Địa chỉ giao hàng không tồn tại hoặc không thuộc về bạn.", 400);
  }
} else {
  address = await prisma.address.findFirst({
    where: { profile: { userId: user.id } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

if (!address) {
  throw new OrderAccessError(
    "Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ trong phần Cài đặt tài khoản.",
    400,
  );
}

const receiverPhone = address.receiverPhone ?? profile?.phone ?? "";
if (!receiverPhone.trim()) {
  throw new OrderAccessError(
    "Vui lòng bổ sung số điện thoại người nhận trước khi đặt hàng.",
    400,
  );
}


let subtotal = 0;
const orderDetailsData: Array<{
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  productImage: string | null;
  productBrand: string | null;
  productId: string;
}> = [];

for (const item of filteredCartItems) {
  const product = item.product;
  const unitPrice = Number(product.salePrice ?? product.price);
  const lineTotal = unitPrice * item.quantity;

  subtotal += lineTotal;

  orderDetailsData.push({
    quantity: item.quantity,
    unitPrice,
    totalPrice: lineTotal,
    productName: product.name,
    productImage: product.images?.[0]?.imageUrl ?? null,
    productBrand: product.brand?.name ?? null,
    productId: item.productId,
  });
}



if (input.couponCode) {
  const preValidation = await CouponFacade.validate(
    input.couponCode,
    subtotal,
    filteredCartItems.map((item) => ({
      productId: item.productId,
      price: Number(item.product.salePrice ?? item.product.price),
      quantity: item.quantity,
    })),
    user.id,
  );
  if (!preValidation.valid) {
    throw new OrderAccessError(preValidation.message ?? "Mã giảm giá không hợp lệ.", 400);
  }
}

const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;

const rawPaymentMethod = (input.paymentMethod as string) ?? "cod";
if (!VALID_PAYMENT_METHODS.includes(rawPaymentMethod as PaymentMethod)) {
  throw new OrderAccessError("Phương thức thanh toán không hợp lệ.", 400);
}
const paymentMethod = rawPaymentMethod as PaymentMethod;
if (
  paymentMethod === PaymentMethod.stripe &&
  !StripeService.isConfigured()
) {
  throw new OrderAccessError(
    "Stripe chưa được cấu hình. Vui lòng chọn phương thức thanh toán khác.",
    503,
  );
}

const result = await prisma.$transaction(async (tx) => {

  let discountTotal = 0;
  let couponId: string | null = null;

  if (input.couponCode) {
    const coupon = await tx.coupon.findUnique({
      where: { code: input.couponCode.toUpperCase() },
      include: { productCoupons: true },
    });

    if (!coupon || coupon.isDeleted || !coupon.isActive) {
      throw new OrderAccessError("Mã giảm giá không hợp lệ.", 400);
    }

    const usedOrder = await tx.orders.findFirst({
      where: {
        couponId: coupon.id,
        userId: user.id,
        status: { not: "cancelled" },
      },
    });
    if (usedOrder) {
      throw new OrderAccessError("Bạn đã sử dụng mã giảm giá này rồi.", 400);
    }

    const now = new Date();
    if (coupon.startDate > now || coupon.endDate < now) {
      throw new OrderAccessError("Mã giảm giá không trong thời gian áp dụng.", 400);
    }

    if (coupon.quantity > 0 && coupon.usedCount >= coupon.quantity) {
      throw new OrderAccessError("Mã giảm giá đã được sử dụng hết.", 400);
    }

    if (subtotal < Number(coupon.minOrderValue)) {
      throw new OrderAccessError(
        `Đơn hàng tối thiểu cần đạt ${Number(coupon.minOrderValue).toLocaleString("vi-VN")} VND.`,
        400,
      );
    }


    let discountableSubtotal = subtotal;
    if (coupon.productCoupons.length > 0) {
      const allowedProductIds = coupon.productCoupons.map((pc) => pc.productId);
      const eligibleItems = filteredCartItems.filter((item) =>
        allowedProductIds.includes(item.productId),
      );
      if (eligibleItems.length === 0) {
        throw new OrderAccessError("Mã giảm giá không áp dụng cho các sản phẩm trong giỏ hàng.", 400);
      }
      discountableSubtotal = eligibleItems.reduce(
        (sum, item) => sum + Number(item.product.salePrice ?? item.product.price) * item.quantity,
        0,
      );
    }


    const { DiscountStrategyFactory } = await import("@/features/coupon/lib/discount-strategies");
    const strategy = DiscountStrategyFactory.getStrategy(coupon.discountType);
    discountTotal = strategy.calculate(
      discountableSubtotal,
      Number(coupon.discountValue),
      coupon.maxDiscountValue ? Number(coupon.maxDiscountValue) : null,
    );
    if (discountTotal > discountableSubtotal) {
      discountTotal = discountableSubtotal;
    }

    couponId = coupon.id;
  }

  const total = subtotal - discountTotal + shippingFee;
  if (total < 0) {
    throw new OrderAccessError("Tổng đơn hàng không hợp lệ.", 400);
  }


  const orderCode = generateOrderCode();

  const orderData = {
    orderCode,
    status: "pending" as OrderStatus,
    paymentStatus: "unpaid" as PaymentStatus,
    paymentMethod,
    subtotal,
    shippingFee,
    discountTotal,
    total,
    receiverName: address.receiverName ?? userRecord?.name ?? profile?.phone ?? "Khách hàng",
    receiverPhone,
    street: address.street,
    provinceName: address.provinceName,
    districtName: address.districtName,
    wardName: address.wardName,
    note: input.note ?? null,
    userId: user.id,
    couponId,
  };


  const sortedItems = [...filteredCartItems].sort((a, b) =>
    a.productId.localeCompare(b.productId),
  );


  for (const item of sortedItems) {
    const updateResult = await tx.product.updateMany({
      where: {
        id: item.productId,
        isDeleted: false,
        status: "active",
        stock: { gte: item.quantity },
      },
      data: {
        stock: { decrement: item.quantity },
      },
    });

    if (updateResult.count === 0) {
      throw new OrderAccessError(
        `Sản phẩm "${item.product.name}" đã hết hàng, không đủ số lượng, hoặc không còn khả dụng.`,
        400,
      );
    }
  }


  const order = await OrderRepository.createOrder(tx, orderData, orderDetailsData);


  if (couponId) {

    const coupon = await tx.coupon.findUnique({
      where: { id: couponId },
      select: { isActive: true, quantity: true },
    });
    if (!coupon || !coupon.isActive) {
      throw new OrderAccessError("Mã giảm giá không còn khả dụng.", 400);
    }



    const updateResult = await tx.coupon.updateMany({
      where: {
        id: couponId,
        isActive: true,
        ...(coupon.quantity > 0
          ? { quantity: { gt: 0 }, usedCount: { lt: coupon.quantity } }
          : {}),
      },
      data: { usedCount: { increment: 1 } },
    });

    if (updateResult.count === 0) {
      throw new OrderAccessError(
        "Mã giảm giá đã được sử dụng hết.",
        400,
      );
    }
  }


  const cart = await tx.cart.findUnique({ where: { userId: user.id } });
  if (cart) {
    const productIdsToClear = filteredCartItems.map((item) => item.productId);
    const deletedCartItems = await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        productId: { in: productIdsToClear },
      },
    });
    if (deletedCartItems.count === 0) {
      throw new OrderAccessError("Giỏ hàng trống hoặc đã được xử lý.", 400);
    }
  } else {
    throw new OrderAccessError("Giỏ hàng không tồn tại.", 400);
  }

  return order;
});




if (paymentMethod === "stripe" && StripeService.isConfigured()) {
  try {
    const stripeResult = await StripeService.createCheckoutSession({
      orderCode: result.orderCode,
      amount: Number(result.total),
    });

    await OrderRepository.updateStatus(prisma, result.id, result.status, {
      paymentSessionId: stripeResult.sessionId,
    });
    return { ...result, payUrl: stripeResult.payUrl };
  } catch (error) {
    console.error("Stripe Checkout Session creation failed", error);
    const cancelledOrder = await prisma.$transaction((tx) =>
      cancelOrderAndReleaseResources(tx, result.id, {
        allowedStatuses: [OrderStatus.pending],
        paymentStatuses: [PaymentStatus.unpaid],
        paymentStatus: PaymentStatus.failed,
      }),
    );
    return {
      ...cancelledOrder,
      paymentError:
        "Không thể tạo phiên thanh toán Stripe. Tồn kho và voucher đã được hoàn lại.",
    };
  }
}

return result;
  }

  static async getMyOrders(user: SessionUser, page: number = 1, pageSize: number = 10) {
  assertCustomer(user);

  const [orders, total] = await Promise.all([
    OrderRepository.findByUserId(user.id, page, pageSize),
    OrderRepository.countByUserId(user.id),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

  static async getMyOrderDetail(user: SessionUser, orderId: string) {
  assertCustomer(user);

  const order = await OrderRepository.findById(orderId);
  if (!order) {
    throw new OrderAccessError("Đơn hàng không tồn tại.", 404);
  }

  if (order.userId !== user.id) {
    throw new OrderAccessError("Bạn không có quyền xem đơn hàng này.", 403);
  }

  return order;
}

  static async cancelMyOrder(user: SessionUser, orderId: string) {
  assertCustomer(user);


  const order = await OrderRepository.findById(orderId);
  if (!order) {
    throw new OrderAccessError("Đơn hàng không tồn tại.", 404);
  }

  if (order.userId !== user.id) {
    throw new OrderAccessError("Bạn không có quyền hủy đơn hàng này.", 403);
  }


  if (order.status === "cancelled") {
    return order;
  }


  if (!canTransition(order.status as OrderStatus, "cancelled")) {
    throw new OrderAccessError("Không thể hủy đơn hàng ở trạng thái hiện tại.", 400);
  }
  if (
    order.paymentMethod === PaymentMethod.stripe &&
    order.paymentStatus === PaymentStatus.paid
  ) {
    throw new OrderAccessError(
      "Đơn hàng đã thanh toán online cần được hoàn tiền trước khi hủy.",
      400,
    );
  }

  try {
    return await prisma.$transaction((tx) =>
      cancelOrderAndReleaseResources(tx, orderId, {
        userId: user.id,
        allowedStatuses: [OrderStatus.pending, OrderStatus.confirmed],
        paymentStatuses: [PaymentStatus.unpaid, PaymentStatus.failed],
      }),
    );
  } catch (error) {
    if (error instanceof OrderCancellationConflictError) {
      throw new OrderAccessError(
        "Không thể hủy đơn hàng ở trạng thái hiện tại.",
        400,
      );
    }
    throw error;
  }
}

  static async getAllOrders(
  user: SessionUser,
  filters: { search?: string; status?: string; paymentStatus?: string },
  page: number = 1,
  pageSize: number = 10,
) {
  assertStaff(user);

  const [orders, total, stats] = await Promise.all([
    OrderRepository.findMany(filters, page, pageSize),
    OrderRepository.count(filters),
    OrderRepository.getOrderStats(),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    stats,
  };
}

  static async getOrderDetail(user: SessionUser, orderId: string) {
  assertStaff(user);

  const order = await OrderRepository.findById(orderId);
  if (!order) {
    throw new OrderAccessError("Đơn hàng không tồn tại.", 404);
  }

  return order;
}

  static async updateOrderStatus(
  user: SessionUser,
  orderId: string,
  newStatus: OrderStatus,
) {
  assertStaff(user);

  const order = await OrderRepository.findById(orderId);
  if (!order) {
    throw new OrderAccessError("Đơn hàng không tồn tại.", 404);
  }

  if (!canTransition(order.status as OrderStatus, newStatus)) {
    throw new OrderAccessError(
      `Không thể chuyển trạng thái từ "${order.status}" sang "${newStatus}".`,
      400,
    );
  }


  if (
    newStatus === "completed" &&
    ONLINE_PAYMENT_METHODS.includes(order.paymentMethod ?? "") &&
    order.paymentStatus !== PaymentStatus.paid
  ) {
    throw new OrderAccessError(
      "Không thể hoàn thành đơn hàng khi chưa nhận được thanh toán online.",
      400,
    );
  }

  return prisma.$transaction(async (tx) => {

    const freshOrder = await tx.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        couponId: true,
        paymentMethod: true,
        paymentStatus: true,
        orderDetails: { select: { productId: true, quantity: true } },
      },
    });

    if (!freshOrder) {
      throw new OrderAccessError("Đơn hàng không tồn tại.", 404);
    }

    if (!canTransition(freshOrder.status as OrderStatus, newStatus)) {
      throw new OrderAccessError(
        `Không thể chuyển trạng thái từ "${freshOrder.status}" sang "${newStatus}".`,
        400,
      );
    }


    if (
      newStatus === "completed" &&
      ONLINE_PAYMENT_METHODS.includes(freshOrder.paymentMethod ?? "") &&
      freshOrder.paymentStatus !== PaymentStatus.paid
    ) {
      throw new OrderAccessError(
        "Không thể hoàn thành đơn hàng khi chưa nhận được thanh toán online.",
        400,
      );
    }

    if (
      newStatus === OrderStatus.cancelled &&
      freshOrder.paymentMethod === PaymentMethod.stripe &&
      freshOrder.paymentStatus === PaymentStatus.paid
    ) {
      throw new OrderAccessError(
        "Đơn hàng đã thanh toán online cần được hoàn tiền trước khi hủy.",
        400,
      );
    }

    if (newStatus === "cancelled") {
      return cancelOrderAndReleaseResources(tx, orderId, {
        allowedStatuses: [OrderStatus.pending, OrderStatus.confirmed],
        paymentStatuses: [PaymentStatus.unpaid, PaymentStatus.failed],
      });
    }

    const extra: Record<string, unknown> = {};

    if (
      newStatus === "completed" &&
      freshOrder.paymentMethod === PaymentMethod.cod
    ) {
      extra.paymentStatus = PaymentStatus.paid;
    }

    return OrderRepository.updateStatus(tx, orderId, newStatus, Object.keys(extra).length > 0 ? extra : undefined);
  });
}
}
