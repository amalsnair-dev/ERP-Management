import axiosInstance from "./axiosConfig.js";

/**
 * Fetch EASY TOTAL details for a given shop code.
 * @param {string} shopcode - Shop code
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Array>} EasyTotalDto array
 */
export const fetchEasyTotalData = async (shopcode, username, password, extraParams = {}) => {
  try {
    const response = await axiosInstance.get("easytotal/geteasytotal", {
      params: { shopcode, ...extraParams },
      headers: {
        username: username || "",
        password: password || "",
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });
    return response.data || [];
  } catch (error) {
    if (error.response) {
      console.error(`[EasyTotalApi] Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error("[EasyTotalApi] No response received:", error.request);
    } else {
      console.error("[EasyTotalApi] Request setup error:", error.message);
    }
    return [];
  }
};
