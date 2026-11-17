import axiosInstance from "./axiosConfig.js";

export const getJewellerDetails = async () => {
  try {
    const response = await axiosInstance.get("api/jewellers");
    return response.data; // { jewellerDetails, centralLogo, footerLogo }
  } catch (error) {
    console.error("Error fetching jeweller details:", error);
    throw error;
  }
};
