import axiosInstance, { axiosInstanceNoHeader } from "./axiosConfig";

/**
 * Get or generate a persistent device MAC address for this browser/laptop/tablet/phone
 */
export const getDeviceMacId = () => {
  if (typeof window === "undefined") return "AA-BB-CC-DD-EE-FF";

  let mac =
    localStorage.getItem("deviceMacId") ||
    localStorage.getItem("macId") ||
    sessionStorage.getItem("deviceMacId") ||
    sessionStorage.getItem("macId");

  if (!mac) {
    // Generate a persistent 6-octet MAC address string for this client device instance
    const hexDigits = "0123456789ABCDEF";
    const octets = [];
    for (let i = 0; i < 6; i++) {
      const octet =
        hexDigits[Math.floor(Math.random() * 16)] +
        hexDigits[Math.floor(Math.random() * 16)];
      octets.push(octet);
    }
    // Set locally administered unicast flag on 1st octet
    const firstOctetInt = (parseInt(octets[0], 16) | 0x02) & 0xfe;
    octets[0] = firstOctetInt.toString(16).toUpperCase().padStart(2, "0");
    mac = octets.join("-");
    localStorage.setItem("deviceMacId", mac);
  }

  return mac;
};

/**
 * Store custom device MAC address in local storage
 * @param {string} macId 
 */
export const setDeviceMacId = (macId) => {
  if (macId) {
    localStorage.setItem("deviceMacId", macId);
  }
};

/**
 * Get or generate device hostname / identifier (supports Laptop, Tablet, Mobile Phone, Desktop)
 */
export const getLaptopName = () => {
  if (typeof window === "undefined") return "DESKTOP-DEVICE";

  let name =
    localStorage.getItem("laptopName") ||
    localStorage.getItem("deviceName") ||
    sessionStorage.getItem("laptopName");

  if (!name) {
    const ua = navigator.userAgent || "";
    const isMobile = /Mobile|Android|iPhone|iPod/i.test(ua) && !/Tablet|iPad/i.test(ua);
    const isTablet = /Tablet|iPad/i.test(ua) || (ua.includes("Android") && !ua.includes("Mobile"));

    let deviceCategory = "LAPTOP";
    if (isTablet) deviceCategory = "TAB";
    else if (isMobile) deviceCategory = "PHONE";

    let platform = "DEVICE";
    if (ua.includes("Win")) platform = "WIN";
    else if (ua.includes("Mac") && !ua.includes("iPhone") && !ua.includes("iPad")) platform = "MAC";
    else if (ua.includes("iPad")) platform = "IPAD";
    else if (ua.includes("iPhone")) platform = "IPHONE";
    else if (ua.includes("Android")) platform = "ANDROID";
    else if (ua.includes("Linux")) platform = "LINUX";

    const randomId = Math.floor(1000 + Math.random() * 9000);
    name = `${platform}-${deviceCategory}-${randomId}`;
    localStorage.setItem("laptopName", name);
  }

  return name;
};

/**
 * Set custom laptop/device name
 * @param {string} name 
 */
export const setLaptopName = (name) => {
  if (name) {
    localStorage.setItem("laptopName", name);
  }
};

/**
 * Retrieve client/laptop IP address from environment, storage or window
 */
export const getClientIp = () => {
  if (typeof window === "undefined") return "127.0.0.1";

  const cachedIp =
    localStorage.getItem("clientIp") ||
    localStorage.getItem("ipAddress") ||
    sessionStorage.getItem("clientIp");

  if (cachedIp) return cachedIp;

  // Environment variable host or window hostname if IP-like
  const envHost = import.meta.env.VITE_API_HOST;
  if (envHost && envHost.trim() !== "") {
    localStorage.setItem("clientIp", envHost.trim());
    return envHost.trim();
  }

  const hostname = window.location?.hostname;
  if (hostname && (hostname.includes(".") || hostname !== "localhost")) {
    return hostname;
  }

  return "192.168.1.7";
};

/**
 * Set custom client IP address
 * @param {string} ip 
 */
export const setClientIp = (ip) => {
  if (ip) {
    localStorage.setItem("clientIp", ip);
  }
};

/**
 * Capture detailed browser, OS, and device category (Laptop, Tablet, Phone) identification
 */
export const getBrowserDeviceInfo = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "Unknown Device";
  }

  const ua = navigator.userAgent;
  let browser = "WebBrowser";
  let deviceCategory = "Laptop";

  const isMobile = /Mobile|Android|iPhone|iPod/i.test(ua) && !/Tablet|iPad/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua) || (ua.includes("Android") && !ua.includes("Mobile"));

  if (isTablet) deviceCategory = "Tablet";
  else if (isMobile) deviceCategory = "Phone";

  let os = "Desktop";
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac") && !ua.includes("iPhone") && !ua.includes("iPad")) os = "macOS";
  else if (ua.includes("iPad")) os = "iPadOS";
  else if (ua.includes("iPhone")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Linux")) os = "Linux";

  // Browser Detection
  if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";

  return `${browser} on ${os} (${deviceCategory})`;
};

/**
 * Record system access/operation log
 * 
 * @param {Object} logData
 * @param {number|string} [logData.userid] - User ID performing action
 * @param {string} [logData.username] - Username performing action
 * @param {string} logData.framename - Name of module/frame (e.g. "SALES_ENTRY", "SIGNIN", "CASH MARKING")
 * @param {string} logData.operation - Operation performed (e.g. "SAVE_ESTIMATE", "LOGIN", "SAVE_CASH_MARKING")
 * @param {string} logData.description - Detailed description of action
 * @param {string} [logData.shopcode] - Current shop code
 * @param {string} [logData.macId] - Device MAC Address
 * @param {string} [logData.laptopName] - Laptop / Device Name
 * @param {string} [logData.clientIp] - Client / Laptop IP Address
 * @param {boolean} [useNoHeader=false] - Use instance without auth headers if required
 * 
 * @returns {Promise<Object>} Response data { status: "success", message: "..." }
 */
export const logSystemDetails = async (logData = {}, useNoHeader = false) => {
  try {
    const userStr = sessionStorage.getItem("currentUser");
    const currentUser = userStr ? JSON.parse(userStr) : {};

    const shopcode =
      logData.shopcode ||
      sessionStorage.getItem("currentShopCode") ||
      currentUser?.shopcode ||
      "";

    const resolvedUserId =
      logData.userid ??
      currentUser?.userid ??
      currentUser?.id ??
      currentUser?.user_id ??
      0;

    const username =
      logData.username ||
      currentUser?.username ||
      sessionStorage.getItem("originalLoginUsername") ||
      "ANONYMOUS";

    const macId = logData.macId || getDeviceMacId();
    const deviceName = logData.laptopName || getLaptopName();
    const clientIp = logData.clientIp || getClientIp();
    const deviceInfo = getBrowserDeviceInfo();

    const rawDesc = String(logData.description || "").trim();

    // Enrich description with [AURIX WEB], Username, User ID, MAC ID, Device Name (Laptop/Tab/Phone), Client IP, and Browser Info
    let description = rawDesc;
    if (!description.toUpperCase().startsWith("[AURIX WEB]")) {
      description = `[AURIX WEB] [User: ${username} (ID: ${resolvedUserId})] [MAC: ${macId}] [Device: ${deviceName} | IP: ${clientIp}] [Client: ${deviceInfo}] - ${rawDesc}`.trim();
    }

    const payload = {
      userid: Number(resolvedUserId) || 0,
      username: String(username).toUpperCase(),
      framename: String(logData.framename || "SYSTEM").toUpperCase(),
      operation: String(logData.operation || "LOG").toUpperCase(),
      description: description,
      shopcode: String(shopcode || ""),
      macId: macId,
      laptopName: deviceName,
      deviceName: deviceName,
      clientIp: clientIp,
      ipAddress: clientIp,
      ip: clientIp,
      deviceInfo: deviceInfo,
    };

    const headers = {
      "Content-Type": "application/json",
      "X-Device-MAC": macId,
      "X-Client-IP": clientIp,
      "X-Laptop-Name": deviceName,
      "X-Device-Name": deviceName,
    };

    const client = useNoHeader ? axiosInstanceNoHeader : axiosInstance;
    const response = await client.post("systemdetails/log", payload, { headers });

    return response.data;
  } catch (error) {
    console.error("❌ Failed to log system details:", error?.response?.data || error?.message || error);
    // Non-blocking fallback so logging errors don't stop main application workflows
    return {
      status: "error",
      message: error?.response?.data?.message || error?.message || "Failed to record system details log",
    };
  }
};

const SystemDetailsApi = {
  logSystemDetails,
  getDeviceMacId,
  setDeviceMacId,
  getLaptopName,
  setLaptopName,
  getClientIp,
  setClientIp,
  getBrowserDeviceInfo,
};

export default SystemDetailsApi;
