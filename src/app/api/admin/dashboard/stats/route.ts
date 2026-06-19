import { auth } from "@/features/auth/lib/auth";
import { OrderRepository } from "@/features/order/lib/order-repository";
import { isStaff } from "@/lib/roles";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user || !isStaff(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const date = from || to ? { from, to } : undefined;

    const [
      stats,
      topProducts,
      lowStockProducts,
      recentOrders,
      dailyRevenue,
      orderStatusBreakdown,
      recentFeedbacks,
    ] = await Promise.all([
      OrderRepository.getStats(date),
      OrderRepository.getTopProducts(undefined, date),
      OrderRepository.getLowStockProducts(),
      OrderRepository.getRecentOrders(10, date),
      OrderRepository.getDailyRevenue(7, date),
      OrderRepository.getOrderStatusBreakdown(date),
      OrderRepository.getRecentFeedbacks(5, date),
    ]);

    return NextResponse.json({
      stats: {
        ...stats,
        totalRevenue: Number(stats.totalRevenue),
      },
      topProducts: topProducts.map((tp) => ({
        ...tp,
        product: {
          ...tp.product,
          price: Number(tp.product.price),
          salePrice: tp.product.salePrice ? Number(tp.product.salePrice) : null,
        },
      })),
      lowStockProducts: lowStockProducts.map((p) => ({
        ...p,
        price: Number(p.price),
      })),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
        user: o.user,
      })),
      dailyRevenue: dailyRevenue.map((d) => ({
        date: d.date,
        revenue: Number(d.revenue),
      })),
      orderStatusBreakdown,
      recentFeedbacks: recentFeedbacks.map((f) => ({
        id: f.id,
        rating: f.rating,
        content: f.content,
        createdAt: f.createdAt.toISOString(),
        user: { name: f.user.name, email: f.user.email },
        product: { id: f.product.id, name: f.product.name, slug: f.product.slug },
      })),
    });
  } catch (error) {
    console.error("Dashboard stats failed", error);
    return NextResponse.json({ error: "Unable to fetch dashboard data." }, { status: 500 });
  }
}
