import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { OrderRepository } from "@/features/order/lib/order-repository";

export class ReportRepository {
  static async getRevenueByDate(fromDate?: Date, toDate?: Date) {
    const where: Record<string, unknown> = {
      status: "completed",
      paymentStatus: "paid",
    };

    if (fromDate || toDate) {
      const createdAt: Record<string, Date> = {};
      if (fromDate) createdAt.gte = fromDate;
      if (toDate) createdAt.lte = toDate;
      where.createdAt = createdAt;
    }


    const orders = await prisma.orders.findMany({
      where: where as Prisma.OrdersWhereInput,
      select: {
        id: true,
        orderCode: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });


    const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
    const byDate = new Map<string, { date: string; orderCount: number; revenue: number }>();
    for (const order of orders) {
      const vnDate = new Date(order.createdAt.getTime() + VN_OFFSET_MS);
      const dateKey = vnDate.toISOString().split("T")[0];
      const entry = byDate.get(dateKey) ?? { date: dateKey, orderCount: 0, revenue: 0 };
      entry.orderCount += 1;
      entry.revenue += Number(order.total);
      byDate.set(dateKey, entry);
    }

    return Array.from(byDate.values());
  }

  static async getOrdersForReport(filters: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: Record<string, unknown> = {};

    if (filters.search) {
      where.OR = [
        { orderCode: { contains: filters.search, mode: "insensitive" } },
        { receiverName: { contains: filters.search, mode: "insensitive" } },
        { receiverPhone: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.status && filters.status !== "all") {
      where.status = filters.status;
    }

    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.fromDate || filters.toDate) {
      const createdAt: Record<string, Date> = {};
      if (filters.fromDate) createdAt.gte = filters.fromDate;
      if (filters.toDate) createdAt.lte = filters.toDate;
      where.createdAt = createdAt;
    }

    return prisma.orders.findMany({
      where: where as Prisma.OrdersWhereInput,
      orderBy: { createdAt: "desc" },
      include: {
        orderDetails: true,
        user: { select: { id: true, name: true, email: true } },
        coupon: { select: { id: true, code: true } },
      },
    });
  }

  static async getBestSellingProducts(fromDate?: Date, toDate?: Date) {
    const orderWhere: Record<string, unknown> = { status: "completed", paymentStatus: "paid" };

    if (fromDate || toDate) {
      const createdAt: Record<string, Date> = {};
      if (fromDate) createdAt.gte = fromDate;
      if (toDate) createdAt.lte = toDate;
      orderWhere.createdAt = createdAt;
    }


    const completedOrders = await prisma.orders.findMany({
      where: orderWhere as Prisma.OrdersWhereInput,
      select: { id: true },
    });
    const orderIds = completedOrders.map((o) => o.id);

    if (orderIds.length === 0) return [];

    const topProducts = await prisma.orderDetail.groupBy({
      by: ["productId"],
      where: { orderId: { in: orderIds } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 20,
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
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    return topProducts
      .filter((tp) => tp.productId !== null && productMap.has(tp.productId))
      .map((tp) => ({
        productId: tp.productId!,
        productName: productMap.get(tp.productId!)!.name,
        totalSold: tp._sum.quantity ?? 0,
        totalRevenue: Number(tp._sum.totalPrice ?? 0),
      }));
  }

  static async getTopCustomers(fromDate?: Date, toDate?: Date) {
    const where: Record<string, unknown> = {
      status: "completed",
      paymentStatus: "paid",
    };

    if (fromDate || toDate) {
      const createdAt: Record<string, Date> = {};
      if (fromDate) createdAt.gte = fromDate;
      if (toDate) createdAt.lte = toDate;
      where.createdAt = createdAt;
    }

    const orders = await prisma.orders.findMany({
      where: where as Prisma.OrdersWhereInput,
      select: {
        userId: true,
        total: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const byUser = new Map<
      string,
      { userId: string; userName: string; userEmail: string; orderCount: number; totalSpent: number }
    >();
    for (const order of orders) {
      const entry = byUser.get(order.userId) ?? {
        userId: order.userId,
        userName: order.user.name ?? "",
        userEmail: order.user.email,
        orderCount: 0,
        totalSpent: 0,
      };
      entry.orderCount += 1;
      entry.totalSpent += Number(order.total);
      byUser.set(order.userId, entry);
    }

    return Array.from(byUser.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20);
  }

  static getLowStockProducts(threshold: number = 5) {
    return OrderRepository.getLowStockProducts(threshold);
  }

  static getPendingOrders() {
    return OrderRepository.findMany({ status: "pending" }, 1, 1000);
  }
}
