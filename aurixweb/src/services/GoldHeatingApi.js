import axiosInstance from "./axiosConfig";
import { logSystemDetails } from "./SystemDetailsApi";

/**
 * Format JS Date object or string into YYYY-MM-DD format
 * @param {Date|string} date
 * @returns {string}
 */
const formatDate = (date) => {
  if (!date) return new Date().toISOString().split("T")[0];
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

/**
 * Gold Heating API Service
 * Wraps backend endpoints in com.blogtec.aurixwebapi.heating.HeatingController
 */
const GoldHeatingAPI = (shopcode) => {
  return {
    /**
     * Save new heating record
     * Endpoint: POST /heating/add?shopcode=...
     */
    addHeating: async (data) => {
      const response = await axiosInstance.post("heating/add", data, {
        params: { shopcode },
      });
      logSystemDetails({
        framename: "GOLD HEATING DETAILS",
        operation: "SAVE_HEATING",
        description: `Saved gold heating record for estimate #${data?.estno || ""}`,
        shopcode: shopcode || "",
      });
      return response;
    },

    /**
     * Modify existing heating record
     * Endpoint: PUT /heating/update?estno=...&shopcode=...&row_id=...
     */
    updateHeating: async (estno, data, row_id) => {
      const resolvedRowId = row_id ?? data?.row_id ?? 1;
      const response = await axiosInstance.put("heating/update", data, {
        params: { estno, shopcode, row_id: resolvedRowId },
      });
      logSystemDetails({
        framename: "GOLD HEATING DETAILS",
        operation: "UPDATE_HEATING",
        description: `Updated gold heating record for estimate #${estno}`,
        shopcode: shopcode || "",
      });
      return response;
    },

    /**
     * Update issue flag status
     * Endpoint: PUT /heating/updateflag?estno=...&shopcode=...
     */
    updateFlag: async (estno) => {
      const response = await axiosInstance.put("heating/updateflag", null, {
        params: { estno, shopcode },
      });
      logSystemDetails({
        framename: "GOLD HEATING DETAILS",
        operation: "UPDATE_HEATING_FLAG",
        description: `Updated gold heating issue flag for estimate #${estno}`,
        shopcode: shopcode || "",
      });
      return response;
    },

    /**
     * Delete heating record
     * Endpoint: DELETE /heating/delete?estno=...&shopcode=...
     */
    deleteHeating: async (estno) => {
      const response = await axiosInstance.delete("heating/delete", {
        params: { estno, shopcode },
      });
      logSystemDetails({
        framename: "GOLD HEATING DETAILS",
        operation: "DELETE_HEATING",
        description: `Deleted gold heating record for estimate #${estno}`,
        shopcode: shopcode || "",
      });
      return response;
    },

    /**
     * Confirm heating receipt (sets rec_flag = true)
     * Endpoint: PUT /heating/confirm?estno=...&shopcode=...
     */
    confirmHeating: async (estno) => {
      const response = await axiosInstance.put("heating/confirm", null, {
        params: { estno, shopcode },
      });
      logSystemDetails({
        framename: "RECEIPT GOLD HEATING DETAILS",
        operation: "CONFIRM_HEATING_RECEIPT",
        description: `Confirmed gold heating receipt for estimate #${estno}`,
        shopcode: shopcode || "",
      });
      return response;
    },
  };
};

export { formatDate };
export default GoldHeatingAPI;
