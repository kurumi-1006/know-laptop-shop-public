import { isAdmin } from "@/lib/roles";

export type DashboardWidget =
  | "stats"
  | "recent-orders"
  | "top-products"
  | "low-stock-products"
  | "team"
  | "revenue-chart"
  | "order-status"
  | "recent-feedbacks";

class DashboardBuilder {
  private readonly widgets: DashboardWidget[] = [];

  add(widget: DashboardWidget) {
    if (!this.widgets.includes(widget)) this.widgets.push(widget);
    return this;
  }

  addOperationalOverview() {
    return this
      .add("stats")
      .add("revenue-chart")
      .add("recent-orders")
      .add("order-status")
      .add("top-products")
      .add("low-stock-products")
      .add("recent-feedbacks");
  }

  addTeamManagement() {
    return this.add("team");
  }

  build() {
    return Object.freeze([...this.widgets]);
  }
}

export class DashboardFacade {
  getWidgets(role?: string | null) {
    const builder = new DashboardBuilder().addOperationalOverview();
    if (isAdmin(role)) builder.addTeamManagement();
    return builder.build();
  }
}
