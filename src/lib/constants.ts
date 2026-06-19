



export const MAX_ADDRESSES = 10;
export const STREET_MAX_LENGTH = 200;
export const PHONE_MAX_LENGTH = 20;
export const PHONE_MIN_LENGTH = 8;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;
export const SEARCH_MAX_LENGTH = 100;
export const BAN_REASON_MAX_LENGTH = 200;





export const PAGE_SIZE_MIN = 5;
export const PAGE_SIZE_MAX = 50;
export const PAGE_SIZE_DEFAULT = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;





export const FEATURED_PRODUCT_COUNT = 6;
export const PRICE_LOCALE = "vi-VN";





export const ROUTES = {
  home: "/",
  login: "/login",
  profile: "/profile",
  address: "/address",
  cart: "/cart",
  wishlist: "/wishlist",
  checkout: "/checkout",
  orders: "/orders",
  dashboard: "/dashboard",
  dashboardUsers: "/dashboard/users",
  dashboardStaff: "/dashboard/staff",
  terms: "/terms",
  privacy: "/privacy",
  categories: "/products",
  products: "/products",
} as const;

export const CUSTOMER_ROUTES = [
  ROUTES.profile,
  ROUTES.address,
  ROUTES.cart,
  ROUTES.wishlist,
  ROUTES.checkout,
  ROUTES.orders,
] as const;

export const AUTH_ROUTES = [ROUTES.login] as const;
