import { useQuery } from "@tanstack/react-query";
import { SalesService } from "../services/SalesEntryApi";
import { getCrmPhoneno } from "../services/ShopAPI";

/**
 * Custom Query Hook for Estimate Details
 * Provides smart caching, automatic background revalidation, and retry resilience.
 */
export const useEstimateDetails = (estNo: string, shopCode: string) => {
  return useQuery({
    queryKey: ["estimateDetails", estNo, shopCode],
    queryFn: async () => {
      if (!estNo || estNo === "New") return null;
      const response = await SalesService.getEntry(estNo, shopCode);
      return response?.data || null;
    },
    enabled: !!estNo && estNo !== "New",
    staleTime: 5 * 60 * 1000, // 5 minutes cache stale time
    gcTime: 10 * 60 * 1000,    // 10 minutes garbage collection window
    retry: 2,
  });
};

/**
 * Custom Query Hook for Salesman Master Lookup
 */
export const useSalesmanList = (estNo: string, shopCode: string) => {
  return useQuery({
    queryKey: ["salesmanList", estNo, shopCode],
    queryFn: async () => {
      if (!estNo) return [];
      const response = await SalesService.getSalesmanDetails(estNo, shopCode);
      return response?.data || [];
    },
    enabled: !!estNo && estNo !== "New",
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Custom Query Hook for CRM Customer Profile by Phone
 */
export const useCustomerByPhone = (phone: string, shopCode: string) => {
  const cleanPhone = String(phone || "").trim();
  return useQuery({
    queryKey: ["customerByPhone", cleanPhone, shopCode],
    queryFn: async () => {
      if (!cleanPhone || cleanPhone.length < 10) return null;
      return await getCrmPhoneno(cleanPhone, shopCode);
    },
    enabled: !!cleanPhone && cleanPhone.length >= 10,
    staleTime: 5 * 60 * 1000,
  });
};
