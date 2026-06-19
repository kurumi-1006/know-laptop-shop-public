import fs from "fs";
import path from "path";

type Ward = {
  name: string;
  code: number;
  codename: string;
  division_type: string;
};

type District = {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  wards: Ward[];
};

type Province = {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code: number;
  districts: District[];
};

let cache: Province[] | null = null;
let provinceByCode: Map<number, Province> | null = null;
let districtByCode: Map<number, District> | null = null;
let wardByCode: Map<number, Ward> | null = null;

export function loadAddresses(): Province[] {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "src/data/addresses.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  cache = JSON.parse(raw) as Province[];
  provinceByCode = new Map();
  districtByCode = new Map();
  wardByCode = new Map();

  for (const province of cache) {
    provinceByCode.set(province.code, province);
    for (const district of province.districts) {
      districtByCode.set(district.code, district);
      for (const ward of district.wards) {
        wardByCode.set(ward.code, ward);
      }
    }
  }

  return cache;
}

export function getProvinces() {
  return loadAddresses().map(({ name, code, codename, division_type, phone_code }) => ({
    name,
    code,
    codename,
    division_type,
    phone_code,
  }));
}

export function getDistrictsByProvince(provinceCode: number) {
  loadAddresses();
  const province = provinceByCode?.get(provinceCode);
  if (!province) return [];
  return province.districts.map(({ name, code, codename, division_type }) => ({
    name,
    code,
    codename,
    division_type,
  }));
}

export function getWardsByDistrict(districtCode: number) {
  loadAddresses();
  const district = districtByCode?.get(districtCode);
  if (!district) return [];
  return district.wards.map(({ name, code, codename, division_type }) => ({
    name,
    code,
    codename,
    division_type,
  }));
}

export function getAddressNames(provinceCode: number, districtCode: number, wardCode: number) {
  loadAddresses();
  const province = provinceByCode?.get(provinceCode);
  const district = districtByCode?.get(districtCode);
  const ward = wardByCode?.get(wardCode);
  const isValidHierarchy =
    province?.districts.some(
      (item) =>
        item.code === districtCode &&
        item.wards.some((districtWard) => districtWard.code === wardCode),
    ) ?? false;

  return {
    provinceName: isValidHierarchy ? province?.name ?? "" : "",
    districtName: isValidHierarchy ? district?.name ?? "" : "",
    wardName: isValidHierarchy ? ward?.name ?? "" : "",
  };
}
