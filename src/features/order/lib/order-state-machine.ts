import { OrderStatus } from "@/app/generated/prisma/enums";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransition(current: OrderStatus, next: OrderStatus): boolean {
  return transitions[current]?.includes(next) ?? false;
}

export function getAllowedTransitions(current: OrderStatus): OrderStatus[] {
  return transitions[current] ?? [];
}
