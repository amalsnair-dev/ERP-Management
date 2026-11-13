import axiosInstance from "./axiosConfig.js";
import DynamicQueryService from "./DynamicQueryApi.js";

export const getBarcodeDetails = async (barcode, shopcode, username, password) => {
  try {
    const response = await axiosInstance.get(
      `barcodeapi/data/${encodeURIComponent(barcode)}`,
      {
        params: { shopcode },
        headers: {
          username: String(username || ""),
          password: String(password || ""),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching barcode details:", error);
    return { ItemDetails: [], StoneDetails: [] };
  }
};

export const getImageByDesignCode = async (dcode, dsgnName, shopcode, username, password) => {
  try {
    const normalizedDcode = String(dcode || "").trim();
    const normalizedDesignName = String(dsgnName || "").trim();

    if (!normalizedDcode || !normalizedDesignName) {
      return { src: null, found: false };
    }

    const response = await axiosInstance.get("image/view", {
      params: {
        shopcode,
        dcode: normalizedDcode,
        dsgnName: normalizedDesignName,
      },
      headers: { username, password },
      responseType: "arraybuffer",
    });

    if (!response.data || response.data.byteLength === 0) {
      return { src: null, found: false };
    }

    const contentType = response.headers["content-type"] || "image/jpeg";
    const blob = new Blob([response.data], { type: contentType });
    return { src: URL.createObjectURL(blob), found: true };
  } catch (error) {
    if (error.response && [403, 404].includes(error.response.status)) {
      return { src: null, found: false };
    }
    return { src: null, found: false };
  }
};

export const getImageByBarcode = async (barcode, shopcode, username, password) => {
  try {
    const response = await axiosInstance.get(
      `barcodeapi/getImagebyBarcode/${encodeURIComponent(barcode)}`,
      {
        params: { shopcode },
        headers: { username, password },
        responseType: "arraybuffer",
      }
    );

    if (!response.data || response.data.byteLength === 0) {
      return { src: null, found: false, source: "barcode" };
    }

    const blob = new Blob([response.data], { type: "image/jpeg" });
    return { src: URL.createObjectURL(blob), found: true, source: "barcode" };
  } catch (error) {
    if (error.response && error.response.status === 403) {
      return { src: null, found: false, source: "barcode" };
    }
    return { src: null, found: false, source: "barcode" };
  }
};

export const isBarcodeImageFromServerEnabled = async (shopcode, username, password) => {
  try {
    const sql =
      "SELECT s.details FROM setdiscount s WHERE s.details = 'BARCODE IMAGE FROM SERVER' AND s.flag = true";
    const auth = { username, password };
    const params = {};

    const checkResponse = await DynamicQueryService.checkQuery(
      sql,
      params,
      auth,
      shopcode
    );

    return checkResponse.data === true;
  } catch (error) {
    console.error("Error checking barcode image source:", error);
    return false;
  }
};

export const getServerBarcodeImage = async (barcode, shopcode, username, password) => {
  try {
    const response = await axiosInstance.get("image/barimage", {
      params: { barcode, shopcode },
      headers: { username, password },
      responseType: "arraybuffer",
    });

    if (!response.data || response.data.byteLength === 0) {
      return { src: null, found: false, source: "server" };
    }

    const contentType = response.headers["content-type"] || "image/jpeg";
    const blob = new Blob([response.data], { type: contentType });
    return { src: URL.createObjectURL(blob), found: true, source: "server" };
  } catch (error) {
    if (error.response && [403, 404].includes(error.response.status)) {
      return { src: null, found: false, source: "server" };
    }
    console.error("Error fetching server barcode image:", error);
    return { src: null, found: false, source: "server" };
  }
};

export const getConfiguredImageByBarcode = async (barcode, shopcode, username, password) => {
  const useServerBarcodeImage = await isBarcodeImageFromServerEnabled(
    shopcode,
    username,
    password
  );

  if (useServerBarcodeImage) {
    const result = await getServerBarcodeImage(barcode, shopcode, username, password);
    return { ...result, configuredFromServer: true };
  }

  const result = await getImageByBarcode(barcode, shopcode, username, password);
  return { ...result, configuredFromServer: false };
};
