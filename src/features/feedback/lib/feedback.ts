import prisma, { type PrismaTx } from '@/lib/prisma';

interface CreateFeedbackInput {
  userId: string;
  productId: string;
  rating: number;
  content?: string | null;
}

interface UpdateFeedbackInput {
  rating?: number;
  content?: string | null;
}





export class FeedbackRepository {



  static async getProductFeedbacks(productId: string) {
    return prisma.feedback.findMany({
      where: {
        productId,
        isVisible: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }




  static async getPaginatedProductFeedbacks(productId: string, page: number, pageSize: number, tx: PrismaTx = prisma) {
    return tx.feedback.findMany({
      where: {
        productId,
        isVisible: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }




  static async countProductFeedbacks(productId: string, tx: PrismaTx = prisma) {
    return tx.feedback.count({
      where: {
        productId,
        isVisible: true,
      },
    });
  }




  static async getUserFeedbacks(userId: string) {
    return prisma.feedback.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }




  static async getFeedbackById(feedbackId: string) {
    return prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
  }




  static async upsertFeedback(data: CreateFeedbackInput) {
    const { userId, productId, rating, content = null } = data;

    return prisma.feedback.upsert({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      update: {
        rating,
        content,
        isVisible: true,
      },
      create: {
        userId,
        productId,
        rating,
        content,
      },
    });
  }




  static async updateFeedback(feedbackId: string, data: UpdateFeedbackInput) {
    return prisma.feedback.update({
      where: { id: feedbackId },
      data,
    });
  }




  static async deleteFeedback(feedbackId: string) {
    return prisma.feedback.delete({
      where: { id: feedbackId },
    });
  }




  static async updateVisibility(feedbackId: string, isVisible: boolean) {
    return prisma.feedback.update({
      where: { id: feedbackId },
      data: { isVisible },
    });
  }




  static async getProductRatingsOnly(productId: string) {
    return prisma.feedback.findMany({
      where: {
        productId,
        isVisible: true,
      },
      select: { rating: true },
    });
  }




  static async findMany(params: { page: number; pageSize: number; search: string; rating: string; status: string }, tx: PrismaTx = prisma) {
    const { page, pageSize, search, rating, status } = params;
    const where = this.buildWhereClause({ search, rating, status });

    return tx.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    });
  }




  static async count(params: { search: string; rating: string; status: string }, tx: PrismaTx = prisma) {
    const { search, rating, status } = params;
    const where = this.buildWhereClause({ search, rating, status });
    return tx.feedback.count({ where });
  }

  static async getStats() {
    const [total, visible, hidden, avgResult] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { isVisible: true } }),
      prisma.feedback.count({ where: { isVisible: false } }),
      prisma.feedback.aggregate({ _avg: { rating: true } }),
    ]);

    return {
      total,
      visible,
      hidden,
      averageRating: avgResult._avg.rating ? Math.round(avgResult._avg.rating * 10) / 10 : 0,
    };
  }

  private static buildWhereClause(filters: { search: string; rating: string; status: string }) {
    const { search, rating, status } = filters;
    return {
      ...(search && {
        OR: [
          { content: { contains: search, mode: "insensitive" as const } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { product: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
      ...(rating !== "all" && { rating: parseInt(rating) }),
      ...(status === "visible" && { isVisible: true }),
      ...(status === "hidden" && { isVisible: false }),
    };
  }




  static async getProductRatingStatsDb(productId: string, tx: PrismaTx = prisma) {
    const stats = await tx.feedback.aggregate({
      where: { productId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const breakdownData = await tx.feedback.groupBy({
      by: ['rating'],
      where: { productId, isVisible: true },
      _count: { rating: true },
    });

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    breakdownData.forEach((group: { rating: number; _count: { rating: number } }) => {
      if (group.rating >= 1 && group.rating <= 5) {
        breakdown[group.rating] = group._count.rating;
      }
    });

    return {
      averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
      totalCount: stats._count.rating || 0,
      breakdown,
    };
  }
}




async function upsertFeedbackWithValidation(data: CreateFeedbackInput) {
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Số sao đánh giá phải nằm trong khoảng từ 1 đến 5.');
  }


  const productExists = await prisma.product.findUnique({
    where: { id: data.productId },
  });

  if (!productExists) {
    throw new Error(`Product with ID ${data.productId} does not exist.`);
  }


  const hasPurchased = await prisma.orders.findFirst({
    where: {
      userId: data.userId,
      status: 'completed',
      orderDetails: {
        some: { productId: data.productId }
      }
    }
  });

  if (!hasPurchased) {
    throw new Error('Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua hàng thành công.');
  }

  return FeedbackRepository.upsertFeedback(data);
}




async function updateCustomerFeedback(feedbackId: string, userId: string, data: UpdateFeedbackInput) {
  const feedback = await FeedbackRepository.getFeedbackById(feedbackId);

  if (!feedback) {
    throw new Error(`Feedback with ID ${feedbackId} does not exist.`);
  }

  if (feedback.userId !== userId) {
    throw new Error('Bạn không có quyền chỉnh sửa phản hồi này.');
  }

  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    throw new Error('Số sao đánh giá phải nằm trong khoảng từ 1 đến 5.');
  }

  return FeedbackRepository.updateFeedback(feedbackId, data);
}




async function deleteCustomerFeedback(feedbackId: string, userId: string) {
  const feedback = await FeedbackRepository.getFeedbackById(feedbackId);

  if (!feedback) {
    throw new Error(`Feedback with ID ${feedbackId} does not exist.`);
  }

  if (feedback.userId !== userId) {
    throw new Error('Bạn không có quyền xóa phản hồi này.');
  }

  return FeedbackRepository.deleteFeedback(feedbackId);
}




async function getProductRatingStats(productId: string) {
  return FeedbackRepository.getProductRatingStatsDb(productId);
}





export class FeedbackFacade {



  static async getProductFeedbacks(productId: string) {
    return FeedbackRepository.getProductFeedbacks(productId);
  }




  static async getPaginatedProductFeedbacks(productId: string, page: number, pageSize: number) {
    const [data, total] = await Promise.all([
      FeedbackRepository.getPaginatedProductFeedbacks(productId, page, pageSize),
      FeedbackRepository.countProductFeedbacks(productId),
    ]);
    return { data, total };
  }




  static async getUserFeedbacks(userId: string) {
    return FeedbackRepository.getUserFeedbacks(userId);
  }




  static async upsert(data: CreateFeedbackInput) {
    return upsertFeedbackWithValidation(data);
  }




  static async update(feedbackId: string, userId: string, data: UpdateFeedbackInput) {
    return updateCustomerFeedback(feedbackId, userId, data);
  }




  static async delete(feedbackId: string, userId: string) {
    return deleteCustomerFeedback(feedbackId, userId);
  }




  static async setVisibility(feedbackId: string, isVisible: boolean) {
    return FeedbackRepository.updateVisibility(feedbackId, isVisible);
  }




  static async getStats(productId: string) {
    return getProductRatingStats(productId);
  }




  static async getFeedbacksList(params: { page: number; pageSize: number; search: string; rating: string; status: string }) {
    const [data, total, stats] = await Promise.all([
      FeedbackRepository.findMany(params),
      FeedbackRepository.count(params),
      FeedbackRepository.getStats(),
    ]);
    return { data, total, stats };
  }
}
