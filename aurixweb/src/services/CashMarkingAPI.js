import axiosInstance from "./axiosConfig.js";

// ✅ CashMarkingAPI functions
const CashMarkingAPI = (shopcode, username, password) => {
  const headers = {
    username: String(username || "").trim(),
    password: String(password || "").trim(),
    "Content-Type": "application/json",
  };

  const params = {
    shopcode: shopcode?.trim() || "",
  };

  return {
    // 🟩 GET Endpoints
    getAllData: () =>
      axiosInstance.get("cashmark/findall", { headers, params }),

    findByEstno: (id) =>
      axiosInstance.get(`cashmark/get/${encodeURIComponent(id)}`, {
        headers,
        params,
      }),

    getByEstno: (id) =>
      axiosInstance.get(`cashmark/getestno/${encodeURIComponent(id)}`, {
        headers,
        params,
      }),

    checkEstno: (id) =>
      axiosInstance.get(`cashmark/getcheckestno/${encodeURIComponent(id)}`, {
        headers,
        params,
      }),

    checkDiamond: (estno) =>
      axiosInstance.get("cashmark/checkdiamond", {
        headers,
        params: { ...params, estno },
      }),

    getMaximumDmdAmount: () =>
      axiosInstance.get("cashmark/getmaximumdmdamountfromsetdiscount", {
        headers,
        params,
      }),

    getTransactionSummary: (id) =>
      axiosInstance.get(`cashmark/getsum/${encodeURIComponent(id)}`, {
        headers,
        params,
      }),

    getTransactionUpdateVaamt: (id, vastatus) =>
      axiosInstance.get(`cashmark/getvadata/${encodeURIComponent(id)}`, {
        headers,
        params: { ...params, vastatus: Boolean(vastatus) },
      }),

    getAfterAmount: (id) =>
      axiosInstance.get(`cashmark/getafteramt/${encodeURIComponent(id)}`, {
        headers,
        params,
      }),

    getDmdDiscount: () =>
      axiosInstance.get("cashmark/getdmddiscount", { headers, params }),

    getVaCalculationStatus: () =>
      axiosInstance.get("cashmark/getvacalculationStatus", {
        headers,
        params,
      }),

getGiftLookup: () =>
  axiosInstance.get("giftmaster/lookup", {
    headers,
    params,
  }),

    // 🟨 POST Endpoints

    updateGiftDetails: (payload) =>
  axiosInstance.put("cashmark/updategiftdetails", payload, {
    headers,
    params,
  }),
    updateVaData: (payload, vastatus) =>
      axiosInstance.post("cashmark/updatevadata", payload, {
        headers,
        params: { ...params, vastatus },
      }),

    updateEstmstrDmdRate: (payload) =>
      axiosInstance.post("cashmark/updateestmstrdmdrate", payload, {
        headers,
        params,
      }),

    updateVaVaAmtAndDmdRatePercentage: (payload) =>
      axiosInstance.post("cashmark/updatevavaamtanddmdratepercentage", payload, {
        headers,
        params,
      }),

    updateSaleEstStnChg: (payload) =>
      axiosInstance.post("cashmark/updatesaleeststnchg", payload, {
        headers,
        params,
      }),

    // 🟦 PUT Endpoint
    resetEstno: (estno) =>
      axiosInstance.put("cashmark/resetestno", null, {
        headers,
        params: { ...params, estno },
      }),
  };
};

export default CashMarkingAPI;
