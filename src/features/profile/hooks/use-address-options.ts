import { apiClient } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const optionsSchema = z.array(
  z.object({
    name: z.string(),
    code: z.number(),
  }),
);

async function getOptions(url: string) {
  const { data } = await apiClient.get(url);
  return optionsSchema.parse(data);
}

export function useProvinces() {
  return useQuery({
    queryKey: ["address-options", "provinces"],
    queryFn: () => getOptions("/api/address/provinces"),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useDistricts(provinceCode: number) {
  return useQuery({
    queryKey: ["address-options", "districts", provinceCode],
    queryFn: () =>
      getOptions(`/api/address/districts?province_code=${provinceCode}`),
    enabled: provinceCode > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useWards(districtCode: number) {
  return useQuery({
    queryKey: ["address-options", "wards", districtCode],
    queryFn: () =>
      getOptions(`/api/address/wards?district_code=${districtCode}`),
    enabled: districtCode > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
