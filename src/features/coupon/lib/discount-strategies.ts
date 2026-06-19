import { DiscountType } from "@/app/generated/prisma/client";

export interface DiscountStrategy {







  calculate(orderValue: number, discountValue: number, maxDiscountValue?: number | null): number;
}

export class PercentDiscountStrategy implements DiscountStrategy {
  calculate(orderValue: number, discountValue: number, maxDiscountValue?: number | null): number {
    let discountAmount = (orderValue * discountValue) / 100;
    if (maxDiscountValue !== null && maxDiscountValue !== undefined && discountAmount > maxDiscountValue) {
      discountAmount = maxDiscountValue;
    }
    return discountAmount;
  }
}

export class AmountDiscountStrategy implements DiscountStrategy {
  calculate(orderValue: number, discountValue: number, maxDiscountValue?: number | null): number {
    if (discountValue < 0) {
      return 0;
    }
    return discountValue;
  }
}

export class DiscountStrategyFactory {
  private static strategies: Record<DiscountType, DiscountStrategy> = {
    [DiscountType.percent]: new PercentDiscountStrategy(),
    [DiscountType.amount]: new AmountDiscountStrategy(),
  };

  static getStrategy(type: DiscountType): DiscountStrategy {
    const strategy = this.strategies[type];
    if (!strategy) {
      throw new Error(`Unsupported discount type: ${type}`);
    }
    return strategy;
  }
}
