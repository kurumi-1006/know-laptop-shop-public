import {
  LaptopIcon,
  LayoutGridIcon,
  PackageIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
  adminOnly?: boolean;
  matchPrefix?: boolean;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
  {
    items: [
      {
        title: 'Tổng quan',
        path: '/dashboard',
        icon: <LayoutGridIcon />,
      },
    ],
  },
  {
    label: 'Tổ chức',
    items: [
      {
        title: 'Khách hàng',
        path: '/dashboard/users',
        icon: <UsersIcon />,
      },
      {
        title: 'Nhân viên & vai trò',
        path: '/dashboard/staff',
        adminOnly: true,
        icon: <SettingsIcon />,
      },
    ],
  },
  {
    label: 'Quản lý cửa hàng',
    items: [
      {
        title: 'Sản phẩm',
        adminOnly: true,
        icon: <LaptopIcon />,
        subItems: [
          { title: 'Thông tin', path: '/dashboard/products' },
          { title: 'Danh mục', path: '/dashboard/categories' },
          { title: 'Thương hiệu', path: '/dashboard/brands' },
          { title: 'Phản hồi', path: '/dashboard/feedbacks' },
          { title: 'Mã giảm giá', path: '/dashboard/vouchers' },
        ],
      },
      {
        title: 'Đơn hàng',
        path: '/dashboard/orders',
        icon: <PackageIcon />,
        matchPrefix: true,
      },
    ],
  },
];

export const navLinks: SidebarNavItem[] = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) => (item.subItems?.length ? [item, ...item.subItems] : [item])),
  ),
];
