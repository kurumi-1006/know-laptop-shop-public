import prisma, { type PrismaTx } from "@/lib/prisma";
import { OrderStatus, PaymentStatus, PaymentMethod, UserRole } from "@/app/generated/prisma/enums";
import { DEFAULT_DAILY_REVENUE_DAYS, DEFAULT_LOW_STOCK_THRESHOLD, DEFAULT_RECENT_ORDERS_LIMIT, DEFAULT_TOP_PRODUCTS_LIMIT } from "./order-constants";

type CreateOrderData = {
  orderCode: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  discountTotal: number;
  total: number;
  receiverName: string;
  receiverPhone: string;
  street?: string | null;
  provinceName: string;
  districtName: string;
  wardName: string;
  note?: string | null;
  userId: string;
  couponId?: string | null;
};

type CreateOrderDetailData = {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName: string;
  productImage?: string | null;
  productBrand?: string | null;
  productId?: string | null;
};

type OrderFilters = { search?: string; status?: string; paymentStatus?: string };

interface DateFilter {
  from?: string;
  to?: string;
}

function addDateFilter(where: Record<string, unknown>, date?: DateFilter): Record<string, unknown> {
  if (!date?.from && !date?.to) return where;
  const createdAt: Record<string, unknown> = {};
  if (date.from) createdAt.gte = new Date(`${date.from}T00:00:00.000Z`);
  if (date.to) createdAt.lte = new Date(`${date.to}T23:59:59.999Z`);
  return { ...where, createdAt };
}

function buildCompletedWhere(date?: DateFilter) {
  return addDateFilter({ status: "completed" as const, paymentStatus: "paid" as const }, date);
}

function buildPendingWhere(date?: DateFilter) {
  return addDateFilter({ status: "pending" as const }, date);
}

export class OrderRepository {
  static async createOrder(
    tx: PrismaTx,
    orderData: CreateOrderData,
    orderDetails: CreateOrderDetailData[],
  ) {
    return tx.orders.create({
      data: {
        ...orderData,
        orderDetails: {
          create: orderDetails,
        },
      },
      include: { orderDetails: true },
    });
  }

  static async findByUserId(userId: string, page: number, pageSize: number) {
    return prisma.orders.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        orderDetails: true,
      },
    });
  }

  static async countByUserId(userId: string) {
    return prisma.orders.count({ where: { userId } });
  }

  static async findById(orderId: string) {
    return prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        orderDetails: true,
        user: { select: { id: true, name: true, email: true } },
        coupon: { select: { id: true, code: true, discountType: true, discountValue: true } },
      },
    });
  }

  static async findMany(
    filters: OrderFilters,
    page: number,
    pageSize: number,
  ) {
    const where = this.buildWhereClause(filters);

    return prisma.orders.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        orderDetails: true,
        user: { select: { id: true, name: true, email: true } },
        coupon: { select: { id: true, code: true } },
      },
    });
  }

  static async count(filters: OrderFilters) {
    const where = this.buildWhereClause(filters);
    return prisma.orders.count({ where });
  }

  private static buildWhereClause(filters: OrderFilters) {
    const { search, status, paymentStatus } = filters;
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { orderCode: { contains: search, mode: "insensitive" } },
        { receiverName: { contains: search, mode: "insensitive" } },
        { receiverPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== "all") {
      where.paymentStatus = paymentStatus;
    }

    return where;
  }

  static async updateStatus(tx: PrismaTx, orderId: string, status: OrderStatus, extra?: Record<string, unknown>) {
    return tx.orders.update({
      where: { id: orderId },
      data: { status, ...extra },
      include: {
        orderDetails: true,
        user: { select: { id: true, name: true, email: true } },
        coupon: { select: { id: true, code: true } },
      },
    });
  }

  static async getStats(date?: DateFilter) {
    const dateWhere = addDateFilter({}, date);
    const [totalRevenue, totalOrders, pendingOrders, totalCustomers, totalActiveProducts] =
      await Promise.all([
        prisma.orders.aggregate({
          where: buildCompletedWhere(date) as Record<string, unknown>,
          _sum: { total: true },
        }),
        prisma.orders.count({ where: dateWhere as Record<string, unknown> }),
        prisma.orders.count({ where: buildPendingWhere(date) as Record<string, unknown> }),
        prisma.user.count({ where: { banned: false, role: UserRole.customer } }),
        prisma.product.count({ where: { isDeleted: false, status: "active" } }),
      ]);

    return {
      totalRevenue: totalRevenue._sum?.total ?? 0,
      totalOrders,
      pendingOrders,
      totalCustomers,
      totalActiveProducts,
    };
  }

  static async getRecentOrders(limit: number = DEFAULT_RECENT_ORDERS_LIMIT, date?: DateFilter) {
    return prisma.orders.findMany({
      where: addDateFilter({}, date),
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async getTopProducts(limit: number = DEFAULT_TOP_PRODUCTS_LIMIT, date?: DateFilter) {

    const validOrders = await prisma.orders.findMany({
      where: buildCompletedWhere(date) as Record<string, unknown>,
      select: { id: true },
    });
    const validOrderIds = validOrders.map((o) => o.id);

    if (validOrderIds.length === 0) return [];

    const topProducts = await prisma.orderDetail.groupBy({
      by: ["productId"],
      where: { orderId: { in: validOrderIds } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    const productIds = topProducts
      .map((p) => p.productId)
      .filter((id): id is string => id !== null);

    if (productIds.length === 0) return [];

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        salePrice: true,
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { imageUrl: true },
        },
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    return topProducts
      .filter((tp) => tp.productId !== null && productMap.has(tp.productId))
      .map((tp) => ({
        product: productMap.get(tp.productId!)!,
        totalSold: tp._sum.quantity ?? 0,
      }));
  }

  static async getLowStockProducts(threshold: number = DEFAULT_LOW_STOCK_THRESHOLD) {
    return prisma.product.findMany({
      where: { isDeleted: false, status: "active", stock: { lt: threshold } },
      orderBy: { stock: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        price: true,
      },
    });
  }

  static async getDailyRevenue(days: number = DEFAULT_DAILY_REVENUE_DAYS, date?: DateFilter) {

    if (date?.from || date?.to) {
      const where = buildCompletedWhere(date);
      const orders = await prisma.orders.findMany({
        where,
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      });

      const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
      const dailyMap = new Map<string, number>();


      const fromDate = date.from ? new Date(`${date.from}T00:00:00.000Z`) : new Date(orders[0]?.createdAt ?? Date.now());
      const toDate = date.to ? new Date(`${date.to}T23:59:59.999Z`) : new Date();
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const vnDate = new Date(d.getTime() + VN_OFFSET_MS);
        const dateKey = vnDate.toISOString().split("T")[0];
        dailyMap.set(dateKey, 0);
      }

      for (const o of orders) {
        const vnDate = new Date(o.createdAt.getTime() + VN_OFFSET_MS);
        const day = vnDate.toISOString().split("T")[0];
        if (dailyMap.has(day)) {
          dailyMap.set(day, (dailyMap.get(day) ?? 0) + Number(o.total));
        }
      }

      return Array.from(dailyMap.entries())
        .map(([d, revenue]) => ({ date: d, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }


    const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
    const now = new Date();
    const startDate = new Date(now.getTime() - (days + 1) * 24 * 60 * 60 * 1000);

    const orders = await prisma.orders.findMany({
      where: {
        status: "completed",
        paymentStatus: "paid",
        createdAt: { gte: startDate },
      },
      select: { total: true, createdAt: true },
    });

    const dailyMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const vnNow = new Date(now.getTime() + VN_OFFSET_MS - i * 24 * 60 * 60 * 1000);
      const dateKey = vnNow.toISOString().split("T")[0];
      dailyMap.set(dateKey, 0);
    }

    for (const o of orders) {
      const vnDate = new Date(o.createdAt.getTime() + VN_OFFSET_MS);
      const day = vnDate.toISOString().split("T")[0];
      if (dailyMap.has(day)) {
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + Number(o.total));
      }
    }

    return Array.from(dailyMap.entries())
      .map(([d, revenue]) => ({ date: d, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  static async getOrderStatusBreakdown(date?: DateFilter) {
    const statuses: OrderStatus[] = ["pending", "confirmed", "shipping", "completed", "cancelled"];
    const groups = await prisma.orders.groupBy({
      by: ["status"],
      where: addDateFilter({}, date),
      _count: { id: true },
    });
    const countMap = new Map(groups.map((g) => [g.status, Number(g._count.id)]));
    return statuses.map((status) => ({ status, count: countMap.get(status) ?? 0 }));
  }

  static async getOrderStats(date?: DateFilter) {
    const statuses: OrderStatus[] = ["pending", "confirmed", "shipping", "completed", "cancelled"];
    const [total, ...statusCounts] = await Promise.all([
      prisma.orders.count({ where: addDateFilter({}, date) }),
      ...statuses.map((status) => prisma.orders.count({ where: addDateFilter({ status }, date) })),
    ]);

    const stats: Record<string, number> = { total };
    statuses.forEach((status, index) => {
      stats[status] = statusCounts[index];
    });

    return stats;
  }

  static async getRecentFeedbacks(limit: number = 5, date?: DateFilter) {
    return prisma.feedback.findMany({
      where: addDateFilter({ isVisible: true }, date),
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    });
  }
}
