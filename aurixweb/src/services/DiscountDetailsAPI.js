// DiscountDetailsAPI.js
// Aligned with DiscountDetailsController.java
// Usage: const api = DiscountDetailsAPI(shopcode, username, password);

import axiosInstance, { axiosInstanceNoHeader } from "./axiosConfig.js";

export const getIdleTimeoutMinutes = async () => {
  try {
    const response = await axiosInstanceNoHeader.get("setdiscount/timeout");
    const raw = response?.data;
    // Normalize the payload to a numeric minutes value.
    const normalize = (payload) => {
      if (payload == null) return null;
      if (typeof payload === "number") return payload;
      if (typeof payload === "string") {
        const trimmed = payload.trim();
        return trimmed === "" ? null : Number(trimmed);
      }
      if (Array.isArray(payload) && payload.length > 0) {
        return normalize(payload[0]);
      }
      if (typeof payload === "object") {
        // Look for common keys that may hold the timeout value.
        return (
          normalize(payload.value) ??
          normalize(payload.timeout) ??
          normalize(payload.minutes) ??
          normalize(payload.data) ??
          normalize(payload.result) ??
          null
        );
      }
      return null;
    };
    const minutes = normalize(raw);
    // Return a numeric value in all cases – fall back to 0 for any missing/invalid data
    return typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0 ? minutes : 0;
  } catch (err) {
    console.error("Failed to fetch idle timeout minutes:", err);
    // On any error, treat timeout as 0 (no timeout)
    return 0;
  }
};

const createHeaders = (username, password) => ({
  username: String(username || "").trim(),
  password: String(password || "").trim(),
  "Content-Type": "application/json",
});

const createParams = (shopcode) => ({
  shopcode: String(shopcode || "").trim(),
});

const DiscountDetailsAPI = (shopcode, username, password) => {
  const headers = createHeaders(username, password);
  const params = createParams(shopcode);

  return {
    // ---------- CREATE ----------
    // POST /discountdetails/create
    create: (payload) =>
      axiosInstance.post("discountdetails/create", payload, { headers, params }),

    // ---------- DELETE ----------
    // DELETE /discountdetails/deleteByReset
    deleteByReset: () =>
      axiosInstance.delete("discountdetails/deleteByReset", { headers, params }),

    // ---------- FIND ALL ----------
    // GET /discountdetails/findByAll
    findByAll: () =>
      axiosInstance.get("discountdetails/findByAll", { headers, params }),

    // ---------- FIND BY ESTNO ----------
    // GET /discountdetails/findByEstNo
    findByEstNo: (estno) =>
      axiosInstance.get("discountdetails/findByEstNo", {
        headers,
        params: { ...params, estno },
      }),

    // ---------- FIND BY ESTNO → MAX SLNO ----------
    // GET /discountdetails/findByEstNoMaxSlno
    findByEstNoMaxSlno: (estno) =>
      axiosInstance.get("discountdetails/findByEstNoMaxSlno", {
        headers,
        params: { ...params, estno },
      }),

    // ---------- FIND BY ESTNO AND USERNAME ----------
    // GET /discountdetails/findByEstNoAndUser
    findByEstNoAndUser: (estno, targetUser) =>
      axiosInstance.get("discountdetails/findByEstNoAndUser", {
        headers,
        params: { ...params, estno, username: targetUser },
      }),

    // ---------- REPORTS ----------
    // GET /discountdetails/report/discountdetails (Returns JSON Map)
    getReportData: () =>
      axiosInstance.get("discountdetails/report/discountdetails", {
        headers,
        params,
      }),

    // GET /discountdetails/report/discountdetails/pdf (Returns Base64 JSON)
    getReportPdf: () =>
      axiosInstance.get("discountdetails/report/discountdetails/pdf", {
        headers,
        params,
      }),

    // ---------- Convenience helper (client-side) ----------
    getPdfBlobFromBase64: (pdfBase64, contentType = "application/pdf") => {
      if (!pdfBase64) return null;
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: contentType });
    },
  };
};

export default DiscountDetailsAPI;
