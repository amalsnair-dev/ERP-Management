import axiosInstance from "./axiosConfig.js";
import { logSystemDetails } from "./SystemDetailsApi.js";

const api = axiosInstance;

export const SalesService = {
  saveEntry: async (data, auth) => {
    const response = await api.post("salesentry/save", data, {
      params: { shopcode: data.shopcode },
      headers: auth
        ? { username: auth.username || "", password: auth.password || "" }
        : {},
    });

    const estNo = data?.estno || data?.estNo || data?.estimateNo || "";
    logSystemDetails({
      userid: auth?.userid || auth?.id || null,
      framename: "SALES_ENTRY",
      operation: "SAVE_ESTIMATE",
      description: `User created sale estimate #${estNo}`,
      shopcode: data?.shopcode || "",
    });

    return response;
  },

  saveGeneralDetails: (data, auth) =>
    api.post("salesentry/saveGeneral", data, {
      params: { shopcode: data.shopcode },
      headers: auth
        ? { username: auth.username || "", password: auth.password || "" }
        : {},
    }),

  saveSalesDetails: (data, auth) =>
    api.post("salesentry/saveSales", data, {
      params: { shopcode: data.shopcode },
      headers: auth
        ? { username: auth.username || "", password: auth.password || "" }
        : {},
    }),

  saveSmanDetails: (data, auth) =>
    api.post("salesentry/saveSman", data, {
      params: { shopcode: data.shopcode },
      headers: auth
        ? { username: auth.username || "", password: auth.password || "" }
        : {},
    }),

  saveStoneDetails: (data, auth) =>
    api.post("salesentry/saveStone", data, {
      params: { shopcode: data.shopcode },
      headers: auth
        ? { username: auth.username || "", password: auth.password || "" }
        : {},
    }),

  getEntry: (estNo, shopcode) =>
    api.get(`api/sales-entries/${estNo}`, { params: { shopcode } }),

  getSalesmanDetails: (estNo, shopcode) =>
    api.get(`api/items/salesman/${estNo}`, { params: { shopcode } }),

  search: (query) => api.get("api/sales-entries/search", { params: { query } }),

  checkDeleteStatus: (estNo, shopcode) =>
    api.get(`saleschecking/check-estimate/${estNo}`, { params: { shopcode } }),

  deleteEntry: async (estNo, shopcode) => {
    const response = await api.delete(`salesdelete/delete/${estNo}`, { params: { shopcode } });
    logSystemDetails({
      framename: "SALES_ENTRY",
      operation: "DELETE_ESTIMATE",
      description: `User deleted sale estimate #${estNo}`,
      shopcode: shopcode || "",
    });
    return response;
  },

  updateEntry: async (estNo, data) => {
    const response = await api.put(`api/sales-entries/${estNo}`, data, {
      params: { shopcode: data.shopcode },
    });
    logSystemDetails({
      framename: "SALES_ENTRY",
      operation: "UPDATE_ESTIMATE",
      description: `User updated sale estimate #${estNo}`,
      shopcode: data?.shopcode || "",
    });
    return response;
  },

  getNextCustId: () => api.get("api/sales-entries/next-custid"),

  getBarcodeDetails: (payload, shopcode) => {
    const auth = JSON.parse(sessionStorage.getItem("currentUser")) || {};
    return api.post(
      "/api/sales/barcode/scan",
      payload,
      {
        params: { shopcode },
        headers: {
          username: auth.username || "",
          password: auth.password || ""
        }
      }
    );
  },



checkBarcodeStoneWeight: (barcode, shopcode) => {
  const auth = JSON.parse(
    sessionStorage.getItem("currentUser") || "{}"
  );

  const sql = `
    SELECT CASE
      WHEN NOT EXISTS (
        SELECT 1
        FROM barcodeandstone b
        WHERE b.barcode = m.barcode
      ) THEN TRUE
      WHEN ROUND(COALESCE(m.stoneweight, 0)::numeric, 3) =
        ROUND(
          COALESCE(
            SUM(
              CASE
                WHEN s.s_unit = 'C' THEN b.stonewt * 0.2
                ELSE b.stonewt
              END
            ),
            0
          )::numeric,
          3
        ) THEN TRUE
      ELSE FALSE
    END AS weights_same
    FROM mainstock m
    LEFT JOIN barcodeandstone b ON b.barcode = m.barcode
    LEFT JOIN stonemaster s ON s.s_code = b.stonecode
    WHERE m.barcode = :barcode
    GROUP BY m.barcode, m.stoneweight
  `;

  return api.post(
    "/api/query/execute?type=object",
    {
      sql,
      params: { barcode: barcode.trim() },
    },
    {
      params: { shopcode },
      headers: {
        username: auth.username || "",
        password: auth.password || "",
      },
    }
  );
},


  getItems: (metalType, shopcode) =>
    api.get("api/items", { params: { metalType, shopcode } }),

  getItemByCode: (itemCode, shopcode) =>
    api.get(`api/items/${itemCode}`, { params: { shopcode } }),

  getTodayGoldRate: (shopcode) =>
    api.get("api/items/gold-rate/today", { params: { shopcode } }),

  getGoldRateByItemCode: (itemCode, shopcode) =>
    api.get(`api/items/${itemCode}/gold-rate`, { params: { shopcode } }),

  getCategoryTaxRate: (itemCode, shopcode) =>
    api.get(`api/category/tax-rate/${itemCode}`, { params: { shopcode } }),

  getNextEstNo: (shopcode) =>
    api.get("api/estno/next", { params: { shopcode } }),

  getEstNosByMetalType: (metalType, shopcode) =>
    api.get(`saleschecking/estenochecking/${metalType}`, {
      params: shopcode ? { shopcode } : {},
    }),

  getStones: (shopcode) => api.get("api/stones", { params: { shopcode } }),

  getStoneByCode: (code, shopcode) => api.get(`api/stones/${code}`, { params: { shopcode } }),

  checkStoneByCode: (code, shopcode) =>
    api.get(`saleschecking/stone/${code}`, { params: { shopcode } }),


  searchEstimatesByMetal: (metalType, shopcode) =>
    api.get("api/sales-entries/search/metal", {
      params: { metalType, shopcode },
    }),

  getPrintReport: (estNo, shopcode, printType = "T") =>
    api.get(`salesprint/report/${estNo}`, {
      params: { type: printType, shopcode },
    }),

  /** ======================== CAREOF API ======================== **/
  getAllCareOf: (shopcode) =>
    api.get("careof/all", { params: { shopcode } }),

  checkCareOfCode: (careofcode, shopcode) =>
    api.get("careof/check", { params: { careofcode, shopcode } }),

  /** ======================== SALESMAN API ======================== **/
  getAllSalesmen: (shopcode) =>
    api.get("salesmanmaster/findBySalesMan", { params: { shopcode } }),

  existsBySalesmanCode: (smcode, shopcode) =>
    api.get("salesmanmaster/existsBySmCode", { params: { smcode, shopcode } }),

  checkDiamondItem: (itemCode, shopcode) =>
    api.get(`saleschecking/dmditemcheck/${itemCode}`, { params: { shopcode } }),

  checkItemCode: (itemCode, metalType, shopcode) =>
    api.get(`saleschecking/itemcheck/${itemCode}`, { params: { metalType, shopcode } }),

  getBarWtDiffLimit: (itemCode, shopcode) =>
    api.get(`saleschecking/barWtDiffLimit/${itemCode}`, { params: { shopcode } }),

  getBarcodeQty: (barcode, shopcode) =>
    api.get("saleschecking/getQty", { params: { barcode, shopcode } }),

  checkBarcodeTransfer: (barcode, shopcode) =>
    api.get(`saleschecking/stocktransfercheck/transfer/${barcode}`, { params: { shopcode } }),

  checkBarcodeReceive: (barcode, shopcode) =>
    api.get(`saleschecking/stocktransfercheck/receive/${barcode}`, { params: { shopcode } }),
  savePurchaseDetails: async (data, auth, shopcode) => {
    const response = await api.post("salesentry/savePurchase", data, {
      params: { shopcode: shopcode || data.shopcode },
      headers: auth
        ? { username: auth.username || "", password: auth.password || "" }
        : {},
    });
    logSystemDetails({
      framename: "SALES_ENTRY",
      operation: "SAVE_PURCHASE_DETAILS",
      description: `User saved purchase details for estimate #${data?.estno || data?.estNo || ""}`,
      shopcode: shopcode || data?.shopcode || "",
    });
    return response;
  },

  saveAdvanceDetails: async (data, auth, shopcode) => {
    const response = await api.post("salesentry/saveAdvance", data, {
      params: { shopcode: shopcode || data.shopcode },
      headers: auth
        ? { username: auth.username || "", password: auth.password || "" }
        : {},
    });
    logSystemDetails({
      framename: "SALES_ENTRY",
      operation: "SAVE_ADVANCE_DETAILS",
      description: `User saved advance details for estimate #${data?.estno || data?.estNo || ""}`,
      shopcode: shopcode || data?.shopcode || "",
    });
    return response;
  },

  saveCreditNoteDetails: async (data, auth, shopcode) => {
    const response = await api.post("salesentry/saveCreditNote", data, {
      params: { shopcode: shopcode || data.shopcode },
      headers: auth
        ? { username: auth.username || "", password: auth.password || "" }
        : {},
    });
    logSystemDetails({
      framename: "SALES_ENTRY",
      operation: "SAVE_CREDIT_NOTE_DETAILS",
      description: `User saved credit note details for estimate #${data?.estno || data?.estNo || ""}`,
      shopcode: shopcode || data?.shopcode || "",
    });
    return response;
  },
};

export default api;
