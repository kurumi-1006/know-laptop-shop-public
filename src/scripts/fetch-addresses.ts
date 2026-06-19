





interface ApiDivision {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  province_code?: number;
  district_code?: number;
  phone_code?: number;
}

const API = "https://provinces.open-api.vn/api";

async function main() {
  console.log("Fetching provinces...");
  const provincesRes = await fetch(`${API}/p/`);
  const provinces = await provincesRes.json();

  console.log("Fetching districts...");
  const districtsRes = await fetch(`${API}/d/`);
  const districts = await districtsRes.json();

  console.log("Fetching wards...");
  const wardsRes = await fetch(`${API}/w/`);
  const wards = await wardsRes.json();


  const data = provinces.map((p: ApiDivision) => {
    const provinceDistricts = districts
      .filter((d: ApiDivision) => d.province_code === p.code)
      .map((d: ApiDivision) => {
        const districtWards = wards
          .filter((w: ApiDivision) => w.district_code === d.code)
          .map((w: ApiDivision) => ({
            name: w.name,
            code: w.code,
            codename: w.codename,
            division_type: w.division_type,
          }));
        return {
          name: d.name,
          code: d.code,
          codename: d.codename,
          division_type: d.division_type,
          wards: districtWards,
        };
      });

    return {
      name: p.name,
      code: p.code,
      codename: p.codename,
      division_type: p.division_type,
      phone_code: p.phone_code,
      districts: provinceDistricts,
    };
  });

  const fs = await import("fs");
  const path = await import("path");

  const outPath = path.join(import.meta.dirname, "..", "data", "addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");

  console.log(`Written ${provinces.length} provinces to ${outPath}`);
  console.log(`Total districts: ${districts.length}, wards: ${wards.length}`);
}

main().catch(console.error);
