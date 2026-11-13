import axiosInstance from "./axiosConfig";
import { logSystemDetails } from "./SystemDetailsApi";

/** ======================== UTILITIES ======================== **/

/**
 * Format any JS date to yyyy-MM-dd
 * @param {Date|string} date
 * @returns {string|null}
 */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

/** ======================== DailyCustomerAPI ======================== **/

const DailyCustomerAPI = (shopcode, username, password) => {
  const headers = {
    username: String(username || "").trim(),
    password: String(password || "").trim(),
    "Content-Type": "application/json",
  };

  return {
    /** ======================== CRUD ======================== **/
    create: async (data) => {
      const response = await axiosInstance.post("dailycustomer/create", data, { params: { shopcode }, headers });
      logSystemDetails({
        framename: "DAILY VISITING CUSTOMER",
        operation: "CREATE_CUSTOMER",
        description: `Created daily customer record for '${data?.custname || data?.name || ""}'`,
        shopcode: shopcode || "",
      });
      return response;
    },

    updateBySlno: async (slno, data) => {
      const response = await axiosInstance.put("dailycustomer/update", data, {
        params: { slno, shopcode },
        headers,
      });
      logSystemDetails({
        framename: "DAILY VISITING CUSTOMER",
        operation: "UPDATE_CUSTOMER",
        description: `Updated daily customer record slno #${slno}`,
        shopcode: shopcode || "",
      });
      return response;
    },

    updateByDateEntry: async (entryno, date, data) => {
      const response = await axiosInstance.put("dailycustomer/updateByDateEntry", data, {
        params: { entryno, date: formatDate(date), shopcode },
        headers,
      });
      logSystemDetails({
        framename: "DAILY VISITING CUSTOMER",
        operation: "UPDATE_CUSTOMER",
        description: `Updated daily customer record entry #${entryno}`,
        shopcode: shopcode || "",
      });
      return response;
    },

    updateCustomer: async (entryno, date, data) => {
      const response = await axiosInstance.put(`dailycustomer/updateByDateEntry/${entryno}/${date}`, data, {
        params: { shopcode },
        headers,
      });
      logSystemDetails({
        framename: "DAILY VISITING CUSTOMER",
        operation: "UPDATE_CUSTOMER",
        description: `Updated daily customer record entry #${entryno}`,
        shopcode: shopcode || "",
      });
      return response;
    },

    fetchAll: () =>
      axiosInstance.get("dailycustomer/find-all", { headers }),

    /** ======================== FINDERS ======================== **/
    findBySmcode: (smcode) =>
      axiosInstance.get("dailycustomer/findBySmcode", {
        params: { smcode, shopcode },
        headers,
      }),

    findByPhoneNo: (phoneno) =>
      axiosInstance.get("dailycustomer/findByPhoneNo", {
        params: { phoneno, shopcode },
        headers,
      }),

    findByDate: (date) =>
      axiosInstance.get("dailycustomer/findByDate", {
        params: { date: formatDate(date), shopcode },
        headers,
      }),

    findByMax: () =>
      axiosInstance.get("dailycustomer/findByMax", { headers }),

    /** ======================== DELETE ======================== **/
    deleteBySlno: async (slno) => {
      const response = await axiosInstance.delete("dailycustomer/delete", {
        params: { slno, shopcode },
        headers,
      });
      logSystemDetails({
        framename: "DAILY VISITING CUSTOMER",
        operation: "DELETE_CUSTOMER",
        description: `Deleted daily customer record slno #${slno}`,
        shopcode: shopcode || "",
      });
      return response;
    },

    deleteByDateAndEntryNo: async (entryno, date) => {getCustData
      const response = await axiosInstance.delete("dailycustomer/deleteByDateAndEntryNo", {
        params: { entryno, date: formatDate(date), shopcode },
        headers,
      });
      logSystemDetails({
        framename: "DAILY VISITING CUSTOMER",
        operation: "DELETE_CUSTOMER",
        description: `Deleted daily customer record entry #${entryno}`,
        shopcode: shopcode || "",
      });
      return response;
    },

    /** ======================== REPORTS ======================== **/
    reportSmcodeWise: (smcode) =>
      axiosInstance.get("dailycustomer/report/smcodewise", {
        params: { smcode, shopcode },
        headers,
      }),

    reportFromToDate: (fromdate, todate) =>
      axiosInstance.get("dailycustomer/report/fromtodatewise", {
        params: {
          fromdate: formatDate(fromdate),
          todate: formatDate(todate),
          shopcode,
        },
        headers,
      }),

    reportFromToDatePdf: (fromdate, todate) =>
      axiosInstance.get("dailycustomer/report/fromtodatewise/pdf", {
        params: {
          fromdate: formatDate(fromdate),
          todate: formatDate(todate),
          shopcode,
        },
        headers,
      }),

    /** ======================== SALESMAN API ======================== **/
    salesman: {
      /** Get all salesmen */
      findAll: () =>
        axiosInstance.get("salesmanmaster/findBySalesMan", { params: { shopcode }, headers }),

      /** Check if salesman exists by code */
      existsBySmCode: (smcode) =>
        axiosInstance.get("salesmanmaster/existsBySmCode", {
          params: { smcode, shopcode },
          headers,
        }),
    },
  };
};

export default DailyCustomerAPI;
