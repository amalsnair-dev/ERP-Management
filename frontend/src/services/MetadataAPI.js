import axiosInstance, { axiosInstanceNoHeader } from "./axiosConfig";

const MetadataAPI = {
    getCurrencies: async () => {
        try {
            const response = await axiosInstanceNoHeader.get("api/metadata/currencies");
            return response.data;
        } catch (error) {
            console.error("Error fetching currencies:", error);
            throw error;
        }
    },
    getDefaultCountry: async () => {
        try {
            const response = await axiosInstanceNoHeader.get("api/metadata/default");
            return response.data;
        } catch (error) {
            console.error("Error fetching default country:", error);
            return null;
        }
    }
};

export default MetadataAPI;
