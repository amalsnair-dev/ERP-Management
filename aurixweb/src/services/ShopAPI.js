// src/services/ShopAPI.js
import axiosInstance, { axiosInstanceNoHeader } from "./axiosConfig";
import { logSystemDetails } from "./SystemDetailsApi";

const buildApiError = (error, fallbackMessage) => {
  const networkErrorCodes = ["ERR_NETWORK", "ECONNABORTED"];
  const isConnectionError =
    !error?.response &&
    (networkErrorCodes.includes(error?.code) ||
      /Network Error|ERR_CONNECTION_REFUSED|Failed to fetch/i.test(
        error?.message || ""
      ));

  const message = isConnectionError
    ? "Connection error. Please check whether the server is running and try again."
    : error?.response?.data?.message ||
    error?.response?.data ||
    error?.message ||
    fallbackMessage;

  const normalizedError = new Error(
    typeof message === "string" ? message : fallbackMessage
  );
  normalizedError.originalError = error;
  normalizedError.isConnectionError = isConnectionError;

  return normalizedError;
};

// 1. Fetch all shop codes
export const getShopCodes = async () => {
  try {
    const response = await axiosInstanceNoHeader.get("customer/getshopcode");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch shop codes:", error);
    return [];
  }
};

// 2. Fetch default shop code
export const getDefaultShopCode = async () => {
  try {
    const response = await axiosInstanceNoHeader.get("customer/getdefaultshopcode");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch default shop code:", error);
    throw buildApiError(error, "Failed to fetch default shop code");
  }
};

// 3. Fetch Customer Data by CustID
export const getCustData = async (custid) => {
  try {
    const response = await axiosInstance.get(`customer/getCustData/${custid}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch customer data:", error);
    return null;
  }
};

// 3b. Fetch CRM Customer by CustID
export const findCrmByCustId = async (custid) => {
  try {
    const response = await axiosInstance.get("customer/find-by-custid", {
      params: { custid },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to find CRM by custid:", error);
    return null;
  }
};

// 4. Fetch CRM Customer by Mobile
export const getCrmPhoneno = async (phoneno, shopcode = "") => {
  try {
    const response = await axiosInstance.get(`customer/crmphoneno/${phoneno}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch CRM phoneno:", error);
    return null;
  }
};

// 5. Create CRM Customer
export const createCrmCustomer = async (data, shopcode = "") => {
  try {
    const params = {};
    if (shopcode) {
      params.shopcode = shopcode;
    }
    const response = await axiosInstance.post("customer/create", data, {
      params,
    });
    logSystemDetails({
      framename: "CUSTOMER_CRM",
      operation: "CREATE_CRM_CUSTOMER",
      description: `Created CRM customer '${data?.custname || data?.name || ""}'`,
      shopcode: shopcode || "",
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create CRM customer:", error);
    return null;
  }
};

// 5b. Update CRM Customer
export const updateCrmCustomer = async (crmid, data, shopcode = "") => {
  try {
    const params = {};
    if (shopcode) {
      params.shopcode = shopcode;
    }
    const response = await axiosInstance.put(`customer/update/${crmid}`, data, {
      params,
    });
    logSystemDetails({
      framename: "CUSTOMER_CRM",
      operation: "UPDATE_CRM_CUSTOMER",
      description: `Updated CRM customer id #${crmid}`,
      shopcode: shopcode || "",
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update CRM customer:", error);
    return null;
  }
};

// 6. Fetch All Customers (no auth headers)
export const getAllCustomers = async (shopcode = "") => {
  try {
    const params = {};
    if (shopcode) {
      params.shopcode = shopcode;
    }
    const response = await axiosInstanceNoHeader.get("customer/all-customers", {
      params,
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Failed to fetch all customers:", error);
    return [];
  }
};

// 7. Check if a username exists
export const existsByUsername = async (username, shopcode = "") => {
  try {
    const params = { username };
    if (shopcode) {
      params.shopcode = shopcode;
    }
    const response = await axiosInstanceNoHeader.get("user/existsByUsername", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error(
      `Failed to check username "${username}"${shopcode ? ` for shop "${shopcode}"` : ""}:`,
      error
    );
    // If the server returns a 400 (Bad Request) or 401 (Unauthorized),
    // it indicates authentication/session is invalid or DB state changed.
    // We clear all session/auth data and force a redirect to the login page.
    if (error?.response?.status === 400 || error?.response?.status === 401) {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "/aurixapp/signin";
    }
    return false;
  }
};
