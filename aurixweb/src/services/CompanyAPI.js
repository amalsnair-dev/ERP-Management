import axiosInstance from "./axiosConfig.js";

// ✅ Normalize axios errors for consumers
const unwrapError = (err) => {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const message = data?.message || err?.message || "Request failed";
  const normalized = new Error(message);
  normalized.status = status;
  normalized.data = data;
  return normalized;
};

// ✅ API wrapper
const companyApi = () => {
  const getHeaderAuth = () => {
    const userStr = sessionStorage.getItem("currentUser") || localStorage.getItem("currentUser");
    if (!userStr) {
      return null;
    }
    try {
      const user = JSON.parse(userStr);
      return {
        username: String(user?.username || "").trim().toUpperCase(),
        password: String(user?.password || "").trim(),
      };
    } catch {
      return null;
    }
  };

  // Returns headers only when authenticated.
  const authHeaders = () => {
    const auth = getHeaderAuth();
    if (!auth?.username || !auth?.password) return null;
    return { username: auth.username, password: auth.password };
  };

  return {
    /**
     * 🖼️ Fetch all company images
     * GET /company/images
     */
    getAllImages: async () => {
      try {
        const headers = authHeaders();
        if (!headers) return [];
        const { data } = await axiosInstance.get("company/images", {
          headers,
        });
        return data;
      } catch (error) {
        throw unwrapError(error);
      }
    },

    /**
     * 🏢 Fetch company details
     * GET /company/details
     */
    getCompanyDetails: async (shopcode) => {
      try {
        const headers = authHeaders();
        if (!headers) return [];
        const { data } = await axiosInstance.get("company/details", {
          params: { shopcode },
          headers,
        });
        return data;
      } catch (error) {
        throw unwrapError(error);
      }
    },
  };
};

export default companyApi;
