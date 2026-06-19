import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import {
  DiscountType,
  Gender,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ProductStatus,
  UserRole,
} from "../app/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

const connectionUrl = new URL(databaseUrl);
if (connectionUrl.searchParams.get("sslmode") === "require") {
  connectionUrl.searchParams.set("sslmode", "verify-full");
}

const adapter = new PrismaPg({
  connectionString: connectionUrl.toString(),
});

const prisma = new PrismaClient({ adapter });

const customers = [
  {
    id: "seed-customer-minh",
    name: "Nguyễn Hoàng Minh",
    email: "minh.customer@know.test",
    phone: "0901234567",
    gender: Gender.male,
    birthDate: new Date("1998-04-12T00:00:00.000Z"),
    address: {
      street: "12 Nguyễn Huệ",
      provinceCode: 79,
      provinceName: "Hồ Chí Minh",
      districtCode: 760,
      districtName: "Quận 1",
      wardCode: 26734,
      wardName: "Bến Nghé",
    },
  },
  {
    id: "seed-customer-lan",
    name: "Trần Ngọc Lan",
    email: "lan.customer@know.test",
    phone: "0912345678",
    gender: Gender.female,
    birthDate: new Date("2000-09-21T00:00:00.000Z"),
    address: {
      street: "88 Lê Lợi",
      provinceCode: 79,
      provinceName: "Hồ Chí Minh",
      districtCode: 760,
      districtName: "Quận 1",
      wardCode: 26740,
      wardName: "Bến Thành",
    },
  },
  {
    id: "seed-customer-khoa",
    name: "Lê Anh Khoa",
    email: "khoa.customer@know.test",
    phone: "0923456789",
    gender: Gender.male,
    birthDate: new Date("1996-01-08T00:00:00.000Z"),
    address: {
      street: "25 Võ Văn Tần",
      provinceCode: 79,
      provinceName: "Hồ Chí Minh",
      districtCode: 770,
      districtName: "Quận 3",
      wardCode: 27142,
      wardName: "Phường 6",
    },
  },
  {
    id: "seed-customer-thao",
    name: "Phạm Thu Thảo",
    email: "thao.customer@know.test",
    phone: "0934567890",
    gender: Gender.female,
    birthDate: new Date("2001-11-30T00:00:00.000Z"),
    address: {
      street: "40 Nguyễn Văn Linh",
      provinceCode: 48,
      provinceName: "Đà Nẵng",
      districtCode: 490,
      districtName: "Hải Châu",
      wardCode: 20195,
      wardName: "Thạch Thang",
    },
  },
  {
    id: "seed-customer-nam",
    name: "Đỗ Quang Nam",
    email: "nam.customer@know.test",
    phone: "0945678901",
    gender: Gender.male,
    birthDate: new Date("1999-06-15T00:00:00.000Z"),
    address: {
      street: "101 Trần Phú",
      provinceCode: 1,
      provinceName: "Hà Nội",
      districtCode: 1,
      districtName: "Ba Đình",
      wardCode: 1,
      wardName: "Phúc Xá",
    },
  },
  {
    id: "seed-customer-huong",
    name: "Vũ Mai Hương",
    email: "huong.customer@know.test",
    phone: "0956789012",
    gender: Gender.female,
    birthDate: new Date("2002-02-14T00:00:00.000Z"),
    address: {
      street: "55 Nguyễn Chí Thanh",
      provinceCode: 1,
      provinceName: "Hà Nội",
      districtCode: 6,
      districtName: "Đống Đa",
      wardCode: 157,
      wardName: "Láng Thượng",
    },
  },
  {
    id: "seed-customer-tuan",
    name: "Nguyễn Anh Tuấn",
    email: "tuan.customer@know.test",
    phone: "0967890123",
    gender: Gender.male,
    birthDate: new Date("1997-08-22T00:00:00.000Z"),
    address: {
      street: "78 Lý Tự Trọng",
      provinceCode: 48,
      provinceName: "Đà Nẵng",
      districtCode: 492,
      districtName: "Thanh Khê",
      wardCode: 20213,
      wardName: "Tân Chính",
    },
  },
  {
    id: "seed-customer-linh",
    name: "Huỳnh Khánh Linh",
    email: "linh.customer@know.test",
    phone: "0978901234",
    gender: Gender.female,
    birthDate: new Date("2003-03-30T00:00:00.000Z"),
    address: {
      street: "16 Nguyễn Trãi",
      provinceCode: 79,
      provinceName: "Hồ Chí Minh",
      districtCode: 775,
      districtName: "Quận 5",
      wardCode: 27320,
      wardName: "Phường 7",
    },
  },
  {
    id: "seed-customer-hai",
    name: "Trần Minh Hải",
    email: "hai.customer@know.test",
    phone: "0989012345",
    gender: Gender.male,
    birthDate: new Date("1995-12-05T00:00:00.000Z"),
    address: {
      street: "200 Điện Biên Phủ",
      provinceCode: 79,
      provinceName: "Hồ Chí Minh",
      districtCode: 766,
      districtName: "Quận Bình Thạnh",
      wardCode: 27049,
      wardName: "Phường 15",
    },
  },
  {
    id: "seed-customer-nga",
    name: "Lê Thị Nga",
    email: "nga.customer@know.test",
    phone: "0990123456",
    gender: Gender.female,
    birthDate: new Date("2000-07-18T00:00:00.000Z"),
    address: {
      street: "33 Hai Bà Trưng",
      provinceCode: 1,
      provinceName: "Hà Nội",
      districtCode: 2,
      districtName: "Hoàn Kiếm",
      wardCode: 42,
      wardName: "Tràng Tiền",
    },
  },
];

const staffAccount = {
  id: "seed-staff-an",
  name: "Phan Văn An",
  email: "an.staff@know.test",
  phone: "0888123456",
  gender: Gender.male,
  birthDate: new Date("1994-05-20T00:00:00.000Z"),
  role: UserRole.staff,
  address: {
    street: "50 Nguyễn Đình Chiểu",
    provinceCode: 79,
    provinceName: "Hồ Chí Minh",
    districtCode: 770,
    districtName: "Quận 3",
    wardCode: 27148,
    wardName: "Phường 8",
  },
};

const adminAccount = {
  id: "seed-admin-linh",
  name: "Trần Quỳnh Anh",
  email: "admin@know.test",
  phone: "0777123456",
  gender: Gender.female,
  birthDate: new Date("1993-01-10T00:00:00.000Z"),
  role: UserRole.admin,
  address: {
    street: "10 Tôn Đức Thắng",
    provinceCode: 79,
    provinceName: "Hồ Chí Minh",
    districtCode: 760,
    districtName: "Quận 1",
    wardCode: 26734,
    wardName: "Bến Nghé",
  },
};

interface CatalogItem {
  name: string;
  slug: string;
  category: "gaming" | "business" | "ultrabook" | "student" | "creator";
  brand: string;
  price: number;
  salePrice: number | null;
  stock: number;
  cpu: string;
  ram: string;
  storage: string;
  display: string;
  gpu?: string;
  battery?: string;
  weight?: string;
  os?: string;
  description?: string;
}

const catalog: CatalogItem[] = [

  {
    name: "ASUS ROG Strix G16",
    slug: "asus-rog-strix-g16",
    category: "gaming",
    brand: "asus",
    price: 45990000,
    salePrice: 42990000,
    stock: 18,
    cpu: "Intel Core i9-14900HX",
    ram: "32 GB DDR5",
    storage: "1 TB SSD NVMe",
    display: '16" 2.5K 240Hz IPS',
  },
  {
    name: "Lenovo Legion 5 16IRX9",
    slug: "lenovo-legion-5-16irx9",
    category: "gaming",
    brand: "lenovo",
    price: 39990000,
    salePrice: 37490000,
    stock: 21,
    cpu: "Intel Core i7-14650HX",
    ram: "16 GB DDR5",
    storage: "1 TB SSD NVMe",
    display: '16" WQXGA 165Hz IPS',
  },
  {
    name: "HP Victus 16",
    slug: "hp-victus-16",
    category: "gaming",
    brand: "hp",
    price: 31990000,
    salePrice: 29490000,
    stock: 23,
    cpu: "AMD Ryzen 7 8845HS",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '16.1" FHD 144Hz IPS',
  },
  {
    name: "Acer Nitro V 15",
    slug: "acer-nitro-v-15",
    category: "gaming",
    brand: "acer",
    price: 24990000,
    salePrice: 22990000,
    stock: 32,
    cpu: "Intel Core i5-13420H",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD 144Hz IPS',
  },
  {
    name: "MSI Katana 15 B13V",
    slug: "msi-katana-15-b13v",
    category: "gaming",
    brand: "msi",
    price: 28990000,
    salePrice: 26990000,
    stock: 15,
    cpu: "Intel Core i7-13620H",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD 144Hz IPS',
  },
  {
    name: "Dell G15 5530",
    slug: "dell-g15-5530",
    category: "gaming",
    brand: "dell",
    price: 35990000,
    salePrice: 32990000,
    stock: 10,
    cpu: "Intel Core i7-13650HX",
    ram: "16 GB DDR5",
    storage: "1 TB SSD NVMe",
    display: '15.6" FHD 165Hz IPS',
  },


  {
    name: "MacBook Air 13 M4",
    slug: "macbook-air-13-m4",
    category: "ultrabook",
    brand: "apple",
    price: 27990000,
    salePrice: 26490000,
    stock: 24,
    cpu: "Apple M4 10-core",
    ram: "16 GB Unified",
    storage: "256 GB SSD",
    display: '13.6" Liquid Retina',
  },
  {
    name: "Dell XPS 13 9350",
    slug: "dell-xps-13-9350",
    category: "ultrabook",
    brand: "dell",
    price: 42990000,
    salePrice: 39990000,
    stock: 15,
    cpu: "Intel Core Ultra 7 256V",
    ram: "16 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '13.4" FHD+ IPS',
  },
  {
    name: "ASUS Zenbook 14 OLED",
    slug: "asus-zenbook-14-oled",
    category: "ultrabook",
    brand: "asus",
    price: 28990000,
    salePrice: 26990000,
    stock: 27,
    cpu: "Intel Core Ultra 7 155H",
    ram: "16 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '14" 3K OLED 120Hz',
  },
  {
    name: "HP Spectre x360 14",
    slug: "hp-spectre-x360-14",
    category: "ultrabook",
    brand: "hp",
    price: 41990000,
    salePrice: 38990000,
    stock: 13,
    cpu: "Intel Core Ultra 7 155H",
    ram: "32 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '14" 2.8K OLED Touch',
  },
  {
    name: "LG Gram 16 2024",
    slug: "lg-gram-16-2024",
    category: "ultrabook",
    brand: "lg",
    price: 38990000,
    salePrice: 35990000,
    stock: 9,
    cpu: "Intel Core Ultra 7 155H",
    ram: "16 GB LPDDR5x",
    storage: "512 GB SSD NVMe",
    display: '16" WQXGA IPS',
  },


  {
    name: "Lenovo ThinkPad E14 Gen 6",
    slug: "lenovo-thinkpad-e14-gen-6",
    category: "business",
    brand: "lenovo",
    price: 25990000,
    salePrice: 23990000,
    stock: 30,
    cpu: "Intel Core Ultra 5 125U",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '14" WUXGA IPS',
  },
  {
    name: "Dell Latitude 5450",
    slug: "dell-latitude-5450",
    category: "business",
    brand: "dell",
    price: 33990000,
    salePrice: 31490000,
    stock: 20,
    cpu: "Intel Core Ultra 7 165U",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '14" FHD+ IPS',
  },
  {
    name: "HP EliteBook 840 G11",
    slug: "hp-elitebook-840-g11",
    category: "business",
    brand: "hp",
    price: 36990000,
    salePrice: 34490000,
    stock: 14,
    cpu: "Intel Core Ultra 7 165U",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '14" WUXGA IPS',
  },
  {
    name: "ASUS ExpertBook B5",
    slug: "asus-expertbook-b5",
    category: "business",
    brand: "asus",
    price: 29990000,
    salePrice: 27990000,
    stock: 17,
    cpu: "Intel Core Ultra 7 155H",
    ram: "16 GB DDR5",
    storage: "1 TB SSD NVMe",
    display: '14" WQXGA IPS',
  },


  {
    name: "Dell Inspiron 14 5440",
    slug: "dell-inspiron-14-5440",
    category: "student",
    brand: "dell",
    price: 18990000,
    salePrice: 17490000,
    stock: 35,
    cpu: "Intel Core 7 150U",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '14" FHD+ IPS',
  },
  {
    name: "Acer Swift Go 14 AI",
    slug: "acer-swift-go-14-ai",
    category: "student",
    brand: "acer",
    price: 23990000,
    salePrice: 21990000,
    stock: 29,
    cpu: "Intel Core Ultra 5 125H",
    ram: "16 GB LPDDR5x",
    storage: "512 GB SSD NVMe",
    display: '14" 2.8K OLED',
  },
  {
    name: "Lenovo IdeaPad Slim 5",
    slug: "lenovo-ideapad-slim-5",
    category: "student",
    brand: "lenovo",
    price: 16990000,
    salePrice: 15490000,
    stock: 40,
    cpu: "AMD Ryzen 7 7730U",
    ram: "16 GB DDR4",
    storage: "512 GB SSD NVMe",
    display: '14" FHD IPS',
  },
  {
    name: "HP Pavilion 15",
    slug: "hp-pavilion-15",
    category: "student",
    brand: "hp",
    price: 17990000,
    salePrice: 16490000,
    stock: 33,
    cpu: "Intel Core i5-1335U",
    ram: "8 GB DDR4",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD IPS',
  },


  {
    name: "MacBook Pro 14 M4 Pro",
    slug: "macbook-pro-14-m4-pro",
    category: "creator",
    brand: "apple",
    price: 49990000,
    salePrice: 47490000,
    stock: 12,
    cpu: "Apple M4 Pro 12-core",
    ram: "24 GB Unified",
    storage: "512 GB SSD",
    display: '14.2" Liquid Retina XDR',
  },
  {
    name: "ASUS ProArt Studiobook 16",
    slug: "asus-proart-studiobook-16",
    category: "creator",
    brand: "asus",
    price: 54990000,
    salePrice: 51990000,
    stock: 6,
    cpu: "Intel Core i9-13980HX",
    ram: "32 GB DDR5",
    storage: "1 TB SSD NVMe",
    display: '16" 3.2K OLED 120Hz',
  },
  {
    name: "Lenovo Yoga Pro 9i 16",
    slug: "lenovo-yoga-pro-9i-16",
    category: "creator",
    brand: "lenovo",
    price: 46990000,
    salePrice: 43990000,
    stock: 8,
    cpu: "Intel Core Ultra 9 185H",
    ram: "32 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '16" 3.2K Mini LED 165Hz',
  },
  {
    name: "Dell XPS 16 9640",
    slug: "dell-xps-16-9640",
    category: "creator",
    brand: "dell",
    price: 52990000,
    salePrice: 49990000,
    stock: 7,
    cpu: "Intel Core Ultra 9 185H",
    ram: "32 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '16.3" 4K+ OLED Touch',
  },
  {
    name: "HP ZBook Power G10",
    slug: "hp-zbook-power-g10",
    category: "creator",
    brand: "hp",
    price: 48990000,
    salePrice: 45990000,
    stock: 10,
    cpu: "Intel Core i7-13700H",
    ram: "32 GB DDR5",
    storage: "1 TB SSD NVMe",
    display: '15.6" QHD 120Hz IPS',
  },
  {
    name: "Lenovo LOQ 15IRX9",
    slug: "lenovo-loq-15irx9",
    category: "gaming",
    brand: "lenovo",
    price: 26990000,
    salePrice: 24990000,
    stock: 25,
    cpu: "Intel Core i7-13650HX",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD 144Hz IPS',
  },
  {
    name: "ASUS ExpertBook B9 OLED",
    slug: "asus-expertbook-b9-oled",
    category: "business",
    brand: "asus",
    price: 49990000,
    salePrice: 47990000,
    stock: 8,
    cpu: "Intel Core i7-1355U",
    ram: "32 GB LPDDR5",
    storage: "1 TB SSD NVMe",
    display: '14" WQXGA OLED',
  },
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 12",
    slug: "lenovo-thinkpad-x1-carbon-gen-12",
    category: "business",
    brand: "lenovo",
    price: 54990000,
    salePrice: 51990000,
    stock: 12,
    cpu: "Intel Core Ultra 7 155H",
    ram: "32 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '14" 2.8K OLED 120Hz',
  },
  {
    name: "Lenovo ThinkBook 14 G6+",
    slug: "lenovo-thinkbook-14-g6-plus",
    category: "student",
    brand: "lenovo",
    price: 21990000,
    salePrice: 19990000,
    stock: 30,
    cpu: "Intel Core i5-13500H",
    ram: "16 GB LPDDR5",
    storage: "512 GB SSD NVMe",
    display: '14" 2.5K 90Hz IPS',
  },
  {
    name: "Dell Inspiron 16 5640",
    slug: "dell-inspiron-16-5640",
    category: "student",
    brand: "dell",
    price: 21990000,
    salePrice: 19990000,
    stock: 15,
    cpu: "Intel Core 5 120U",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '16" FHD+ IPS',
  },
  {
    name: "Dell Latitude 7440",
    slug: "dell-latitude-7440",
    category: "business",
    brand: "dell",
    price: 35990000,
    salePrice: 33490000,
    stock: 12,
    cpu: "Intel Core i7-1365U",
    ram: "16 GB LPDDR5",
    storage: "512 GB SSD NVMe",
    display: '14" FHD+ IPS',
  },
  {
    name: "Dell XPS 14 9440",
    slug: "dell-xps-14-9440",
    category: "ultrabook",
    brand: "dell",
    price: 49990000,
    salePrice: 46990000,
    stock: 8,
    cpu: "Intel Core Ultra 7 155H",
    ram: "16 GB LPDDR5X",
    storage: "1 TB SSD NVMe",
    display: '14.5" 3.2K OLED Touch 120Hz',
  },
  {
    name: "Dell Precision 5480",
    slug: "dell-precision-5480",
    category: "creator",
    brand: "dell",
    price: 59990000,
    salePrice: 56990000,
    stock: 6,
    cpu: "Intel Core i9-13900H",
    ram: "32 GB LPDDR5",
    storage: "1 TB SSD NVMe",
    display: '14" QHD+ IPS Touch',
  },
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 11",
    slug: "lenovo-thinkpad-x1-carbon-gen-11",
    category: "business",
    brand: "lenovo",
    price: 47990000,
    salePrice: 44990000,
    stock: 10,
    cpu: "Intel Core i7-1355U",
    ram: "16 GB LPDDR5",
    storage: "512 GB SSD NVMe",
    display: '14" WUXGA IPS',
  },
  {
    name: "Lenovo ThinkPad P16 Gen 2",
    slug: "lenovo-thinkpad-p16-gen-2",
    category: "creator",
    brand: "lenovo",
    price: 64990000,
    salePrice: 61990000,
    stock: 5,
    cpu: "Intel Core i9-13980HX",
    ram: "64 GB DDR5",
    storage: "2 TB SSD NVMe",
    display: '16" WQXGA IPS 165Hz',
  },
  {
    name: "Lenovo ThinkPad T14 Gen 5",
    slug: "lenovo-thinkpad-t14-gen-5",
    category: "business",
    brand: "lenovo",
    price: 28990000,
    salePrice: 26990000,
    stock: 20,
    cpu: "AMD Ryzen 7 PRO 8840U",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '14" WUXGA IPS',
  },

  {
    name: "ASUS TUF Gaming A15 FA507NVR",
    slug: "asus-tuf-gaming-a15-fa507nvr",
    category: "gaming",
    brand: "asus",
    price: 29990000,
    salePrice: 27990000,
    stock: 24,
    cpu: "AMD Ryzen 7 7435HS",
    ram: "16 GB DDR5 4800MHz",
    storage: "512 GB SSD NVMe PCIe 4.0",
    display: '15.6" FHD IPS 144Hz',
    gpu: "NVIDIA GeForce RTX 4060 8GB GDDR6",
    battery: "90 Wh",
    weight: "2.20 kg",
    os: "Windows 11 Home",
  },
  {
    name: "Acer Predator Helios Neo 16 PHN16-72",
    slug: "acer-predator-helios-neo-16-phn16-72",
    category: "gaming",
    brand: "acer",
    price: 41990000,
    salePrice: 38990000,
    stock: 12,
    cpu: "Intel Core i9-14900HX",
    ram: "32 GB DDR5 5600MHz",
    storage: "1 TB SSD NVMe PCIe 4.0",
    display: '16" WQXGA IPS 240Hz',
    gpu: "NVIDIA GeForce RTX 4070 8GB GDDR6",
    battery: "90 Wh",
    weight: "2.80 kg",
    os: "Windows 11 Home",
  },
  {
    name: "MSI Cyborg 15 A13VE",
    slug: "msi-cyborg-15-a13ve",
    category: "gaming",
    brand: "msi",
    price: 25990000,
    salePrice: 23990000,
    stock: 19,
    cpu: "Intel Core i7-13620H",
    ram: "16 GB DDR5 5200MHz",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD IPS 144Hz',
    gpu: "NVIDIA GeForce RTX 4050 6GB GDDR6",
    battery: "53.5 Wh",
    weight: "1.98 kg",
    os: "Windows 11 Home",
  },
  {
    name: "Gigabyte G5 KF5",
    slug: "gigabyte-g5-kf5",
    category: "gaming",
    brand: "gigabyte",
    price: 25990000,
    salePrice: 23490000,
    stock: 16,
    cpu: "Intel Core i7-13620H",
    ram: "16 GB DDR5",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD IPS 144Hz',
    gpu: "NVIDIA GeForce RTX 4060 8GB GDDR6",
    battery: "54 Wh",
    weight: "2.08 kg",
    os: "Windows 11 Home",
  },
  {
    name: "Razer Blade 14 2024",
    slug: "razer-blade-14-2024",
    category: "gaming",
    brand: "razer",
    price: 79990000,
    salePrice: 75990000,
    stock: 4,
    cpu: "AMD Ryzen 9 8945HS",
    ram: "32 GB DDR5",
    storage: "1 TB SSD NVMe",
    display: '14" QHD+ IPS 240Hz',
    gpu: "NVIDIA GeForce RTX 4070 8GB GDDR6",
    battery: "68.1 Wh",
    weight: "1.84 kg",
    os: "Windows 11 Home",
  },


  {
    name: "ASUS Vivobook 15 X1504VA",
    slug: "asus-vivobook-15-x1504va",
    category: "student",
    brand: "asus",
    price: 15990000,
    salePrice: 13990000,
    stock: 42,
    cpu: "Intel Core i5-1335U",
    ram: "16 GB DDR4",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD IPS 60Hz',
    gpu: "Intel Iris Xe Graphics",
    battery: "42 Wh",
    weight: "1.70 kg",
    os: "Windows 11 Home",
  },
  {
    name: "Acer Aspire 5 A515-58M",
    slug: "acer-aspire-5-a515-58m",
    category: "student",
    brand: "acer",
    price: 15490000,
    salePrice: 13490000,
    stock: 38,
    cpu: "Intel Core i5-1335U",
    ram: "8 GB LPDDR5",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD IPS',
    gpu: "Intel Iris Xe Graphics",
    battery: "50 Wh",
    weight: "1.78 kg",
    os: "Windows 11 Home",
  },
  {
    name: "HP 15 fd0234TU",
    slug: "hp-15-fd0234tu",
    category: "student",
    brand: "hp",
    price: 13990000,
    salePrice: 12490000,
    stock: 45,
    cpu: "Intel Core i5-1334U",
    ram: "8 GB DDR4",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD IPS',
    gpu: "Intel Iris Xe Graphics",
    battery: "41 Wh",
    weight: "1.59 kg",
    os: "Windows 11 Home",
  },
  {
    name: "Lenovo IdeaPad Slim 3 15ABR8",
    slug: "lenovo-ideapad-slim-3-15abr8",
    category: "student",
    brand: "lenovo",
    price: 14990000,
    salePrice: 12990000,
    stock: 36,
    cpu: "AMD Ryzen 5 7530U",
    ram: "16 GB DDR4",
    storage: "512 GB SSD NVMe",
    display: '15.6" FHD IPS',
    gpu: "AMD Radeon Graphics",
    battery: "47 Wh",
    weight: "1.62 kg",
    os: "Windows 11 Home",
  },
  {
    name: "MSI Modern 14 C13M",
    slug: "msi-modern-14-c13m",
    category: "student",
    brand: "msi",
    price: 16490000,
    salePrice: 14490000,
    stock: 27,
    cpu: "Intel Core i5-1335U",
    ram: "16 GB DDR4",
    storage: "512 GB SSD NVMe",
    display: '14" FHD IPS',
    gpu: "Intel Iris Xe Graphics",
    battery: "39.3 Wh",
    weight: "1.40 kg",
    os: "Windows 11 Home",
  },


  {
    name: "MacBook Air 15 M3",
    slug: "macbook-air-15-m3",
    category: "ultrabook",
    brand: "apple",
    price: 32990000,
    salePrice: 30490000,
    stock: 20,
    cpu: "Apple M3 8-core",
    ram: "16 GB Unified Memory",
    storage: "256 GB SSD",
    display: '15.3" Liquid Retina 500 nits',
    gpu: "Apple M3 10-core GPU",
    battery: "Lên đến 18 giờ",
    weight: "1.51 kg",
    os: "macOS",
  },
  {
    name: "Microsoft Surface Laptop 7 13.8",
    slug: "microsoft-surface-laptop-7-13",
    category: "ultrabook",
    brand: "microsoft",
    price: 38990000,
    salePrice: 36990000,
    stock: 9,
    cpu: "Qualcomm Snapdragon X Elite X1E-80-100",
    ram: "16 GB LPDDR5x",
    storage: "512 GB SSD",
    display: '13.8" PixelSense Flow 120Hz Touch',
    gpu: "Qualcomm Adreno GPU",
    battery: "Lên đến 20 giờ",
    weight: "1.34 kg",
    os: "Windows 11 Home ARM",
  },
  {
    name: "Samsung Galaxy Book4 Pro 14",
    slug: "samsung-galaxy-book4-pro-14",
    category: "ultrabook",
    brand: "samsung",
    price: 35990000,
    salePrice: 33490000,
    stock: 11,
    cpu: "Intel Core Ultra 7 155H",
    ram: "16 GB LPDDR5x",
    storage: "512 GB SSD NVMe",
    display: '14" 3K Dynamic AMOLED 2X 120Hz Touch',
    gpu: "Intel Arc Graphics",
    battery: "63 Wh",
    weight: "1.23 kg",
    os: "Windows 11 Home",
  },
  {
    name: "Lenovo Yoga Slim 7x 14Q8X9",
    slug: "lenovo-yoga-slim-7x-14q8x9",
    category: "ultrabook",
    brand: "lenovo",
    price: 34990000,
    salePrice: 32490000,
    stock: 14,
    cpu: "Qualcomm Snapdragon X Elite X1E-78-100",
    ram: "32 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '14.5" 3K OLED 90Hz Touch',
    gpu: "Qualcomm Adreno GPU",
    battery: "70 Wh",
    weight: "1.28 kg",
    os: "Windows 11 Home ARM",
  },
  {
    name: "ASUS Zenbook S 14 UX5406",
    slug: "asus-zenbook-s-14-ux5406",
    category: "ultrabook",
    brand: "asus",
    price: 39990000,
    salePrice: 37490000,
    stock: 13,
    cpu: "Intel Core Ultra 7 258V",
    ram: "32 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '14" 3K OLED 120Hz',
    gpu: "Intel Arc 140V Graphics",
    battery: "72 Wh",
    weight: "1.20 kg",
    os: "Windows 11 Home",
  },


  {
    name: "MacBook Pro 16 M4 Max",
    slug: "macbook-pro-16-m4-max",
    category: "creator",
    brand: "apple",
    price: 89990000,
    salePrice: 86990000,
    stock: 3,
    cpu: "Apple M4 Max 16-core",
    ram: "48 GB Unified Memory",
    storage: "1 TB SSD",
    display: '16.2" Liquid Retina XDR ProMotion',
    gpu: "Apple M4 Max 40-core GPU",
    battery: "Lên đến 24 giờ",
    weight: "2.15 kg",
    os: "macOS",
  },
  {
    name: "Acer Swift X 14 SFX14-72G",
    slug: "acer-swift-x-14-sfx14-72g",
    category: "creator",
    brand: "acer",
    price: 36990000,
    salePrice: 34490000,
    stock: 10,
    cpu: "Intel Core Ultra 7 155H",
    ram: "32 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '14.5" 2.8K OLED 120Hz',
    gpu: "NVIDIA GeForce RTX 4050 6GB GDDR6",
    battery: "76 Wh",
    weight: "1.55 kg",
    os: "Windows 11 Home",
  },
  {
    name: "MSI Creator Z17 HX Studio",
    slug: "msi-creator-z17-hx-studio",
    category: "creator",
    brand: "msi",
    price: 74990000,
    salePrice: 70990000,
    stock: 4,
    cpu: "Intel Core i9-13980HX",
    ram: "64 GB DDR5",
    storage: "2 TB SSD NVMe",
    display: '17" QHD+ IPS 165Hz Touch',
    gpu: "NVIDIA GeForce RTX 4070 8GB GDDR6",
    battery: "90 Wh",
    weight: "2.49 kg",
    os: "Windows 11 Pro",
  },
  {
    name: "Dell Precision 5690",
    slug: "dell-precision-5690",
    category: "creator",
    brand: "dell",
    price: 82990000,
    salePrice: 78990000,
    stock: 5,
    cpu: "Intel Core Ultra 9 185H",
    ram: "64 GB LPDDR5x",
    storage: "2 TB SSD NVMe",
    display: '16" 4K OLED Touch',
    gpu: "NVIDIA RTX 2000 Ada 8GB",
    battery: "99.5 Wh",
    weight: "2.03 kg",
    os: "Windows 11 Pro",
  },
  {
    name: "HP OmniBook Ultra Flip 14",
    slug: "hp-omnibook-ultra-flip-14",
    category: "business",
    brand: "hp",
    price: 41990000,
    salePrice: 39490000,
    stock: 8,
    cpu: "Intel Core Ultra 7 258V",
    ram: "32 GB LPDDR5x",
    storage: "1 TB SSD NVMe",
    display: '14" 2.8K OLED 120Hz Touch',
    gpu: "Intel Arc 140V Graphics",
    battery: "64 Wh",
    weight: "1.34 kg",
    os: "Windows 11 Home",
  },
];

const productImagesMap: Record<string, string[]> = {

  "asus-rog-strix-g16": [
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
  ],
  "lenovo-legion-5-16irx9": [
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
  ],
  "hp-victus-16": [
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
  ],
  "acer-nitro-v-15": [
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
  ],
  "msi-katana-15-b13v": [
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
  ],
  "dell-g15-5530": [
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
  ],
  "lenovo-loq-15irx9": [
    "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
  ],


  "macbook-air-13-m4": [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1200&q=80"
  ],
  "macbook-pro-14-m4-pro": [
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=80"
  ],


  "lenovo-thinkpad-e14-gen-6": [
    "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "lenovo-thinkpad-x1-carbon-gen-12": [
    "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "lenovo-thinkpad-x1-carbon-gen-11": [
    "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "lenovo-thinkpad-p16-gen-2": [
    "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "lenovo-thinkpad-t14-gen-5": [
    "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],


  "dell-latitude-5450": [
    "https://images.unsplash.com/photo-1593642702909-dec73df255d7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "dell-latitude-7440": [
    "https://images.unsplash.com/photo-1593642702909-dec73df255d7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "hp-elitebook-840-g11": [
    "https://images.unsplash.com/photo-1593642702909-dec73df255d7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "asus-expertbook-b5": [
    "https://images.unsplash.com/photo-1593642702909-dec73df255d7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "asus-expertbook-b9-oled": [
    "https://images.unsplash.com/photo-1593642702909-dec73df255d7?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],


  "dell-xps-13-9350": [
    "https://images.unsplash.com/photo-1584433305355-9cb73387fc61?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "dell-xps-14-9440": [
    "https://images.unsplash.com/photo-1584433305355-9cb73387fc61?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "dell-xps-16-9640": [
    "https://images.unsplash.com/photo-1584433305355-9cb73387fc61?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "dell-precision-5480": [
    "https://images.unsplash.com/photo-1584433305355-9cb73387fc61?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "asus-zenbook-14-oled": [
    "https://images.unsplash.com/photo-1584433305355-9cb73387fc61?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "hp-spectre-x360-14": [
    "https://images.unsplash.com/photo-1584433305355-9cb73387fc61?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "lg-gram-16-2024": [
    "https://audiolab.vn/attachments/lg-gram-2024-audio-lab-jpg.6197",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "asus-proart-studiobook-16": [
    "https://images.unsplash.com/photo-1584433305355-9cb73387fc61?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "lenovo-yoga-pro-9i-16": [
    "https://images.unsplash.com/photo-1584433305355-9cb73387fc61?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "hp-zbook-power-g10": [
    "https://images.unsplash.com/photo-1584433305355-9cb73387fc61?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],


  "dell-inspiron-14-5440": [
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "dell-inspiron-16-5640": [
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "hp-pavilion-15": [
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "lenovo-ideapad-slim-5": [
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "lenovo-thinkbook-14-g6-plus": [
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ],
  "acer-swift-go-14-ai": [
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=80"
  ]
};

function getProductImages(slug: string, brand: string, category: string): string[] {
  const mappedImages = productImagesMap[slug];
  const s = slug.toLowerCase();
  const b = brand.toLowerCase();
  const c = category.toLowerCase();
  const seed = [...slug].reduce((total, char) => total + char.charCodeAt(0), mappedImages?.length ?? 0);
  const selectPair = (images: string[]) => [
    images[seed % images.length],
    images[(seed + 1) % images.length],
  ];

  if (s.includes("macbook") || b === "apple") {
    return selectPair([
      "/images/products/macbook-01.jpg",
      "/images/products/macbook-02.jpg",
      "/images/products/ultrabook-01.jpg",
    ]);
  }
  if (c === "gaming" || s.includes("strix") || s.includes("legion") || s.includes("loq") || s.includes("katana") || s.includes("nitro")) {
    return selectPair([
      "/images/products/gaming-01.jpg",
      "/images/products/gaming-02.jpg",
      "/images/products/gaming-03.jpg",
    ]);
  }
  if (s.includes("thinkpad") || (b === "lenovo" && c === "business")) {
    return selectPair([
      "/images/products/business-01.jpg",
      "/images/products/business-02.jpg",
      "/images/products/laptop-01.jpg",
    ]);
  }
  if (c === "ultrabook" || c === "creator" || s.includes("xps") || s.includes("zenbook") || s.includes("spectre") || s.includes("gram")) {
    return selectPair([
      "/images/products/ultrabook-01.jpg",
      "/images/products/creator-01.jpg",
      "/images/products/business-02.jpg",
    ]);
  }
  return selectPair([
    "/images/products/laptop-01.jpg",
    "/images/products/student-01.jpg",
    "/images/products/business-01.jpg",
  ]);
}

const feedbackTemplates = [
  "Hiệu năng tuyệt vời, build chắc chắn, pin dùng được cả ngày.",
  "Máy chạy mượt, màn hình đẹp, tản nhiệt tốt. Rất đáng tiền.",
  "Giao hàng nhanh, đóng gói cẩn thận. Máy đúng như mô tả.",
  "Dùng được 3 tháng rồi, chưa có vấn đề gì. Pin còn tốt.",
  "Màn hình OLED quá đẹp, màu sắc chính xác. Phù hợp designer.",
  "Hơi nặng một chút nhưng hiệu năng bù lại. Gaming chiến tốt.",
  "Ổn với tầm giá, build tốt, bàn phím gõ êm. Hài lòng.",
  "Mua cho con học, máy nhẹ, pin lâu, cấu hình vừa đủ dùng.",
  "Chạy AutoCAD và Revit mượt, tản nhiệt ổn, ít nóng.",
  "Fan hơi ồn khi chạy nặng, nhưng hiệu năng rất ấn tượng.",
  "Thiết kế sang trọng, mỏng nhẹ, phù hợp mang đi làm.",
  "Touchpad và bàn phím ngon, ngang MacBook. Pin 8 tiếng.",
  "Máy đẹp, cấu hình mạnh, chạy nhiều tab Chrome không lag.",
  "Laptop gaming tốt nhất tầm giá. Tản nhiệt làm rất tốt.",
  "Ổ SSD nhanh, boot Win 11 chỉ 5 giây. Cảm giác dùng mượt.",
];

async function seedUsers() {

  const admin = await prisma.user.upsert({
    where: { email: adminAccount.email },
    update: {
      name: adminAccount.name,
      emailVerified: true,
      role: adminAccount.role,
    },
    create: {
      id: adminAccount.id,
      name: adminAccount.name,
      email: adminAccount.email,
      emailVerified: true,
      role: adminAccount.role,
    },
  });
  const adminProfile = await prisma.profile.upsert({
    where: { userId: admin.id },
    update: { phone: adminAccount.phone, gender: adminAccount.gender, birthDate: adminAccount.birthDate },
    create: { userId: admin.id, phone: adminAccount.phone, gender: adminAccount.gender, birthDate: adminAccount.birthDate },
  });
  await prisma.address.deleteMany({ where: { profileId: adminProfile.id } });
  await prisma.address.create({
    data: { ...adminAccount.address, profileId: adminProfile.id, type: "home", isDefault: true },
  });


  const staff = await prisma.user.upsert({
    where: { email: staffAccount.email },
    update: {
      name: staffAccount.name,
      emailVerified: true,
      role: staffAccount.role,
    },
    create: {
      id: staffAccount.id,
      name: staffAccount.name,
      email: staffAccount.email,
      emailVerified: true,
      role: staffAccount.role,
    },
  });
  const staffProfile = await prisma.profile.upsert({
    where: { userId: staff.id },
    update: { phone: staffAccount.phone, gender: staffAccount.gender, birthDate: staffAccount.birthDate },
    create: { userId: staff.id, phone: staffAccount.phone, gender: staffAccount.gender, birthDate: staffAccount.birthDate },
  });
  await prisma.address.deleteMany({ where: { profileId: staffProfile.id } });
  await prisma.address.create({
    data: { ...staffAccount.address, profileId: staffProfile.id, type: "home", isDefault: true },
  });


  for (const customer of customers) {
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      update: {
        name: customer.name,
        emailVerified: true,
        role: UserRole.customer,
        banned: false,
        banReason: null,
        banExpires: null,
      },
      create: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        emailVerified: true,
        role: UserRole.customer,
      },
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: { phone: customer.phone, gender: customer.gender, birthDate: customer.birthDate },
      create: { userId: user.id, phone: customer.phone, gender: customer.gender, birthDate: customer.birthDate },
    });

    await prisma.address.deleteMany({ where: { profileId: profile.id } });
    await prisma.address.createMany({
      data: [
        { ...customer.address, profileId: profile.id, type: "home", isDefault: true },
        { ...customer.address, profileId: profile.id, street: `${customer.address.street}, Văn phòng`, type: "work", isDefault: false },
      ],
    });
  }
}

async function seedCatalog() {
  const categories = await Promise.all(
    [
      ["Gaming", "gaming", "Laptop hiệu năng cao cho game thủ."],
      ["Business", "business", "Laptop bền bỉ cho doanh nhân."],
      ["Ultrabook", "ultrabook", "Laptop mỏng nhẹ, cao cấp."],
      ["Student", "student", "Laptop thiết thực cho sinh viên."],
      ["Creator", "creator", "Laptop mạnh mẽ cho sáng tạo nội dung."],
    ].map(([name, slug, description]) =>
      prisma.category.upsert({
        where: { slug },
        update: { name, description, isActive: true },
        create: { name, slug, description, isActive: true },
      }),
    ),
  );

  const brands = await Promise.all(
    [
      "Apple",
      "Dell",
      "ASUS",
      "Lenovo",
      "HP",
      "Acer",
      "MSI",
      "LG",
      "Gigabyte",
      "Razer",
      "Microsoft",
      "Samsung",
    ].map((name) =>
      prisma.brand.upsert({
        where: { slug: name.toLowerCase() },
        update: { name, logo: null, isActive: true },
        create: {
          name,
          slug: name.toLowerCase(),
          logo: null,
          description: `${name} chính hãng tại Know.`,
          isActive: true,
        },
      }),
    ),
  );

  const categoryIds = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  const brandIds = Object.fromEntries(brands.map((b) => [b.slug, b.id]));

  const attributes = await Promise.all(
    [
      ["Processor", "Performance", null, 1],
      ["Memory", "Performance", null, 2],
      ["Storage", "Performance", null, 3],
      ["Display", "Display", null, 4],
      ["GPU", "Performance", null, 5],
      ["Battery", "Mobility", null, 6],
      ["Weight", "Mobility", null, 7],
      ["Operating System", "Software", null, 8],
    ].map(([name, groupName, unit, displayOrder]) =>
      prisma.specAttribute.upsert({
        where: { name_groupName: { name: String(name), groupName: String(groupName) } },
        update: { unit: unit ? String(unit) : null, displayOrder: Number(displayOrder), isActive: true },
        create: { name: String(name), groupName: String(groupName), unit: unit ? String(unit) : null, displayOrder: Number(displayOrder) },
      }),
    ),
  );

  const attributeIds = Object.fromEntries(attributes.map((a) => [a.name, a.id]));

  for (const item of catalog) {
    let gpu = item.gpu ?? "Intel Graphics";
    const name = item.name.toLowerCase();
    if (!item.gpu && (name.includes("strix") || name.includes("legion") || name.includes("loq") || name.includes("katana") || name.includes("yoga pro") || name.includes("studiobook"))) {
      gpu = "NVIDIA GeForce RTX 4060 8GB GDDR6";
    } else if (!item.gpu && (name.includes("victus") || name.includes("zbook") || name.includes("power g10"))) {
      gpu = "NVIDIA GeForce RTX 4050 6GB GDDR6";
    } else if (!item.gpu && name.includes("nitro v 15")) {
      gpu = "NVIDIA GeForce RTX 2050 4GB GDDR6";
    } else if (!item.gpu && name.includes("g15")) {
      gpu = "NVIDIA GeForce RTX 3050 6GB GDDR6";
    } else if (!item.gpu && name.includes("xps 16")) {
      gpu = "NVIDIA GeForce RTX 4070 8GB GDDR6";
    } else if (!item.gpu && (name.includes("precision 5480") || name.includes("p16 gen 2"))) {
      gpu = "NVIDIA RTX A1000 6GB GDDR6";
    } else if (!item.gpu && name.includes("macbook air")) {
      gpu = "Apple M4 10-core GPU";
    } else if (!item.gpu && name.includes("macbook pro")) {
      gpu = "Apple M4 Pro 16-core GPU";
    } else if (!item.gpu && (name.includes("xps 13") || name.includes("zenbook") || name.includes("spectre") || name.includes("gram") || name.includes("xps 14"))) {
      gpu = "Intel Arc Graphics";
    } else if (!item.gpu && (name.includes("slim 5") || name.includes("t14 gen 5"))) {
      gpu = "AMD Radeon Graphics";
    }

    const mobilityDefaults = {
      gaming: { battery: "60-90 Wh", weight: "2.20 kg", os: "Windows 11 Home" },
      business: { battery: "Lên đến 12 giờ", weight: "1.45 kg", os: "Windows 11 Pro" },
      ultrabook: { battery: "Lên đến 15 giờ", weight: "1.30 kg", os: "Windows 11 Home" },
      student: { battery: "Lên đến 9 giờ", weight: "1.60 kg", os: "Windows 11 Home" },
      creator: { battery: "70-99 Wh", weight: "2.00 kg", os: "Windows 11 Pro" },
    }[item.category];
    const description =
      item.description ??
      `${item.name} trang bị ${item.cpu}, ${item.ram} RAM, ${item.storage} và ${gpu}. ` +
        `Màn hình ${item.display}, phù hợp cho nhu cầu ${
          item.category === "gaming"
            ? "chơi game và làm việc hiệu năng cao"
            : item.category === "creator"
              ? "đồ họa, dựng phim và sáng tạo nội dung"
              : item.category === "business"
                ? "doanh nghiệp và công việc văn phòng"
                : item.category === "ultrabook"
                  ? "di chuyển thường xuyên và làm việc linh hoạt"
                  : "học tập, văn phòng và sử dụng hằng ngày"
        }. Bảo hành chính hãng.`;

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description,
        price: item.price,
        salePrice: item.salePrice,
        stock: item.stock,
        status: ProductStatus.active,
        isDeleted: false,
        categoryId: categoryIds[item.category],
        brandId: brandIds[item.brand],
      },
      create: {
        name: item.name,
        slug: item.slug,
        description,
        price: item.price,
        salePrice: item.salePrice,
        stock: item.stock,
        status: ProductStatus.active,
        categoryId: categoryIds[item.category],
        brandId: brandIds[item.brand],
      },
    });

    const images = getProductImages(item.slug, item.brand, item.category);
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: [
        { productId: product.id, imageUrl: images[0], isPrimary: true, displayOrder: 0 },
        { productId: product.id, imageUrl: images[1], isPrimary: false, displayOrder: 1 },
      ],
    });

    const specs = [
      [attributeIds.Processor, item.cpu as string],
      [attributeIds.Memory, item.ram as string],
      [attributeIds.Storage, item.storage as string],
      [attributeIds.Display, item.display as string],
      [attributeIds.GPU, gpu],
      [attributeIds.Battery, item.battery ?? mobilityDefaults.battery],
      [attributeIds.Weight, item.weight ?? mobilityDefaults.weight],
      [attributeIds["Operating System"], item.os ?? mobilityDefaults.os],
    ] as const;

    for (const [attributeId, value] of specs) {
      await prisma.productSpec.upsert({
        where: { productId_attributeId: { productId: product.id, attributeId } },
        update: { value },
        create: { productId: product.id, attributeId, value },
      });
    }
  }
}

async function seedCommerce() {
  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const coupons = await Promise.all([
    prisma.coupon.upsert({
      where: { code: "WELCOME10" },
      update: {},
      create: {
        code: "WELCOME10", name: "Giảm 10% chào mừng", discountType: DiscountType.percent,
        discountValue: 10, minOrderValue: 10000000, maxDiscountValue: 2000000,
        quantity: 500, usedCount: 47, startDate: now, endDate: nextYear,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "LAPTOP1M" },
      update: {},
      create: {
        code: "LAPTOP1M", name: "Giảm 1 triệu", discountType: DiscountType.amount,
        discountValue: 1000000, minOrderValue: 20000000, maxDiscountValue: null,
        quantity: 200, usedCount: 32, startDate: now, endDate: nextYear,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "GAMING15" },
      update: {},
      create: {
        code: "GAMING15", name: "Giảm 15% gaming", discountType: DiscountType.percent,
        discountValue: 15, minOrderValue: 25000000, maxDiscountValue: 4000000,
        quantity: 100, usedCount: 15, startDate: now, endDate: nextYear,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "STUDENT5" },
      update: {},
      create: {
        code: "STUDENT5", name: "Giảm 5% sinh viên", discountType: DiscountType.percent,
        discountValue: 5, minOrderValue: 10000000, maxDiscountValue: 1000000,
        quantity: 1000, usedCount: 73, startDate: now, endDate: nextYear,
      },
    }),
    prisma.coupon.upsert({
      where: { code: "FREESHIP" },
      update: {},
      create: {
        code: "FREESHIP", name: "Miễn phí vận chuyển", discountType: DiscountType.amount,
        discountValue: 50000, minOrderValue: 5000000, maxDiscountValue: null,
        quantity: 2000, usedCount: 128, startDate: now, endDate: nextYear,
      },
    }),
  ]);

  const users = await prisma.user.findMany({
    where: { email: { endsWith: "@know.test" }, role: UserRole.customer },
    orderBy: { email: "asc" },
  });
  const products = await prisma.product.findMany({
    where: { slug: { in: catalog.map((item) => item.slug as string) } },
    include: { brand: true, images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { id: "asc" },
  });

  for (const [couponIndex, coupon] of coupons.entries()) {
    const eligibleProducts = products.filter((_, productIndex) => {
      if (coupon.code === "GAMING15") {
        return catalog.find((item) => item.slug === products[productIndex].slug)?.category === "gaming";
      }
      if (coupon.code === "STUDENT5") {
        return catalog.find((item) => item.slug === products[productIndex].slug)?.category === "student";
      }
      return productIndex % coupons.length === couponIndex;
    });

    for (const product of eligibleProducts.slice(0, 12)) {
      await prisma.productCoupon.upsert({
        where: {
          productId_couponId: {
            productId: product.id,
            couponId: coupon.id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          couponId: coupon.id,
        },
      });
    }
  }

  for (const [userIndex, user] of users.entries()) {
    const selected = [
      products[(userIndex * 3) % products.length],
      products[(userIndex * 3 + 1) % products.length],
      products[(userIndex * 3 + 2) % products.length],
    ];


    const cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cartItem.createMany({
      data: selected.slice(0, 2).map((product, index) => ({
        cartId: cart.id, productId: product.id, quantity: index + 1,
      })),
    });


    for (const product of selected) {
      await prisma.wishlist.upsert({
        where: { userId_productId: { userId: user.id, productId: product.id } },
        update: {},
        create: { userId: user.id, productId: product.id },
      });
    }


    for (const [productIndex, product] of selected.slice(0, 2).entries()) {
      const fbIndex = (userIndex * 3 + productIndex) % feedbackTemplates.length;
      await prisma.feedback.upsert({
        where: { userId_productId: { userId: user.id, productId: product.id } },
        update: {
          rating: [4, 5, 3, 5, 4, 5, 4, 3, 5, 4][(userIndex + productIndex) % 10],
          content: feedbackTemplates[fbIndex],
          isVisible: true,
        },
        create: {
          userId: user.id, productId: product.id,
          rating: [4, 5, 3, 5, 4, 5, 4, 3, 5, 4][(userIndex + productIndex) % 10],
          content: feedbackTemplates[fbIndex],
          isVisible: true,
        },
      });
    }


    for (let orderIndex = 0; orderIndex < 3; orderIndex += 1) {
      const product = selected[orderIndex % selected.length];
      const quantity = orderIndex + 1;
      const unitPrice = Number(product.salePrice ?? product.price);
      const subtotal = unitPrice * quantity;
      const coupon = coupons[(userIndex + orderIndex) % coupons.length];
      const discountTotal = orderIndex === 0 ? 1000000 : orderIndex === 1 ? 50000 : 0;
      const shippingFee = subtotal >= 20000000 ? 0 : 30000;
      const total = subtotal + shippingFee - discountTotal;
      const orderCode = `SEED-${userIndex + 1}-${orderIndex + 1}`;
      const statusValues = [OrderStatus.completed, OrderStatus.shipping, OrderStatus.confirmed, OrderStatus.pending];
      const status = statusValues[(userIndex + orderIndex) % 4];

      await prisma.orders.upsert({
        where: { orderCode },
        update: {
          status,
          paymentStatus: status === OrderStatus.completed ? PaymentStatus.paid : PaymentStatus.unpaid,
          orderDetails: {
            deleteMany: {},
            create: {
              productId: product.id, productName: product.name, productBrand: product.brand.name,
              productImage: product.images[0]?.imageUrl, quantity, unitPrice, totalPrice: subtotal,
            },
          },
        },
        create: {
          orderCode, userId: user.id, couponId: coupon.id, status,
          paymentStatus: status === OrderStatus.completed ? PaymentStatus.paid : PaymentStatus.unpaid,
          paymentMethod: [PaymentMethod.cod, PaymentMethod.stripe][orderIndex % 2],
          subtotal, shippingFee, discountTotal, total,
          receiverName: user.name ?? "Khách hàng",
          receiverPhone: customers[userIndex]?.phone ?? "0900000000",
          street: customers[userIndex]?.address.street,
          provinceName: customers[userIndex]?.address.provinceName ?? "Hồ Chí Minh",
          districtName: customers[userIndex]?.address.districtName ?? "Quận 1",
          wardName: customers[userIndex]?.address.wardName ?? "Bến Nghé",
          note: orderIndex === 2 ? "Gọi trước khi giao." : null,
          orderDetails: {
            create: {
              productId: product.id, productName: product.name, productBrand: product.brand.name,
              productImage: product.images[0]?.imageUrl, quantity, unitPrice, totalPrice: subtotal,
            },
          },
        },
      });
    }
  }
}

async function seedRecommendationHistory() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: "@know.test" }, role: UserRole.customer },
    orderBy: { email: "asc" },
    select: { id: true },
  });
  const products = await prisma.product.findMany({
    where: {
      slug: { in: catalog.map((item) => item.slug) },
      status: ProductStatus.active,
      isDeleted: false,
    },
    select: {
      id: true,
      slug: true,
      category: { select: { slug: true } },
    },
  });
  const productsByCategory = new Map<string, typeof products>();

  for (const product of products) {
    const categoryProducts = productsByCategory.get(product.category.slug) ?? [];
    categoryProducts.push(product);
    productsByCategory.set(product.category.slug, categoryProducts);
  }

  const behaviorProfiles = [
    { category: "gaming", searches: ["laptop gaming RTX 4060 dưới 30 triệu", "laptop gaming tản nhiệt tốt"] },
    { category: "ultrabook", searches: ["laptop mỏng nhẹ pin lâu", "ultrabook dưới 35 triệu"] },
    { category: "business", searches: ["laptop văn phòng bền pin lâu", "ThinkPad cho công việc"] },
    { category: "student", searches: ["laptop sinh viên dưới 15 triệu", "laptop học tập RAM 16GB"] },
    { category: "creator", searches: ["laptop đồ họa render RTX", "laptop Adobe RAM 32GB"] },
  ] as const;

  await prisma.productView.deleteMany({
    where: { userId: { in: users.map((user) => user.id) } },
  });
  await prisma.searchHistory.deleteMany({
    where: { userId: { in: users.map((user) => user.id) } },
  });

  const now = Date.now();
  for (const [userIndex, user] of users.entries()) {
    const profile = behaviorProfiles[userIndex % behaviorProfiles.length];
    const preferredProducts = productsByCategory.get(profile.category) ?? [];

    await prisma.searchHistory.createMany({
      data: profile.searches.map((keyword, searchIndex) => ({
        userId: user.id,
        sessionId: null,
        keyword,
        createdAt: new Date(now - (userIndex * 3 + searchIndex + 1) * 60 * 60 * 1000),
      })),
    });

    await prisma.productView.createMany({
      data: preferredProducts.slice(0, 5).map((product, productIndex) => ({
        userId: user.id,
        sessionId: null,
        productId: product.id,
        createdAt: new Date(now - (userIndex * 8 + productIndex + 1) * 60 * 60 * 1000),
      })),
    });
  }
}

export async function main() {
  if (process.argv.includes("--recommendations-only")) {
    await seedRecommendationHistory();
    const [productViews, searchHistories] = await Promise.all([
      prisma.productView.count({
        where: { userId: { in: customers.map((customer) => customer.id) } },
      }),
      prisma.searchHistory.count({
        where: { userId: { in: customers.map((customer) => customer.id) } },
      }),
    ]);
    console.log({ seedProductViews: productViews, seedSearchHistories: searchHistories });
    return;
  }

  await seedUsers();
  await seedCatalog();
  await seedCommerce();
  await seedRecommendationHistory();

  const [
    users,
    categories,
    brands,
    products,
    productImages,
    coupons,
    orders,
    feedbacks,
    productViews,
    searchHistories,
  ] = await Promise.all([
    prisma.user.count({ where: { email: { endsWith: "@know.test" } } }),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.product.count(),
    prisma.productImage.count({
      where: { product: { slug: { in: catalog.map((item) => item.slug) } } },
    }),
    prisma.coupon.count(),
    prisma.orders.count({ where: { orderCode: { startsWith: "SEED-" } } }),
    prisma.feedback.count({ where: { user: { email: { endsWith: "@know.test" } } } }),
    prisma.productView.count({ where: { userId: { in: customers.map((customer) => customer.id) } } }),
    prisma.searchHistory.count({ where: { userId: { in: customers.map((customer) => customer.id) } } }),
  ]);

  console.log({
    seedUsers: users,
    categories,
    brands,
    products,
    productImages,
    coupons,
    seedOrders: orders,
    seedFeedbacks: feedbacks,
    seedProductViews: productViews,
    seedSearchHistories: searchHistories,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
