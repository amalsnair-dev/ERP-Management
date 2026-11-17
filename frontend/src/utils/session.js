export const MODULES = [
  {
    frame: "CASH MARKING",
    aliases: ["CASH MARKING"],
    path: "/cashmarking",
    label: "Cash Marking",
  },
  {
    frame: "DAILY VISITING CUSTOMER",
    aliases: ["DAILY VISITING CUSTOMER", "DAILY CUSTOMER"],
    path: "/dailycustomer",
    label: "Daily Customer",
  },
  {
    frame: "EASY TOTAL",
    aliases: ["EASY TOTAL"],
    path: "/easytotal",
    label: "Easy Total",
  },
  {
    frame: "ITEM DETAILS",
    aliases: ["ITEM DETAILS"],
    path: "/itemdetails",
    label: "Item Details",
  },
  {
    frame: "ITEM DETAILS ENTRY",
    aliases: ["ITEM DETAILS ENTRY"],
    path: "/itemdetailsentry",
    label: "Item Details Entry",
  },
  {
    frame: "SALES ENTRY",
    aliases: ["SALES ENTRY"],
    path: "/salesentry",
    label: "Sales Entry",
  },
  {
    frame: "GOLD HEATING DETAILS",
    aliases: ["GOLD HEATING DETAILS", "GOLD HEATING"],
    path: "/goldheating",
    label: "Gold Heating Details",
  },
  {
    frame: "RECEIPT GOLD HEATING DETAILS",
    aliases: ["RECEIPT GOLD HEATING DETAILS", "RECEIPT GOLD HEATING"],
    path: "/receiptgoldheating",
    label: "Receipt Gold Heating",
  },
];

export const normalizeFrameString = (str) =>
  String(str || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

export const getFrameForPath = (path) => {
  const normalizedPath = String(path || "").trim().toLowerCase();
  return MODULES.find((module) => module.path.toLowerCase() === normalizedPath)?.frame || null;
};

export const getCurrentUser = () => {
  try {
    const raw = sessionStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getCurrentShopCode = () =>
  sessionStorage.getItem("currentShopCode") || getCurrentUser()?.shopcode || "";

export const isAuthenticated = () =>
  sessionStorage.getItem("isLoggedIn") === "true" && !!getCurrentUser();

export const normalizeFrames = (frames) =>
  Array.isArray(frames)
    ? frames
        .map((frame) =>
          (typeof frame === "object" ? frame.framename : frame || "")
            .trim()
            .toUpperCase()
        )
        .filter(Boolean)
    : [];

export const getAllowedModulePaths = (user = getCurrentUser()) => {
  return MODULES.filter((module) => hasFrameAccess(module.frame, user)).map(
    (module) => module.path
  );
};

export const getPreferredModulePath = (user = getCurrentUser()) => {
  const allowedPaths = getAllowedModulePaths(user);
  const currentModule = sessionStorage.getItem("currentModule");

  if (currentModule && allowedPaths.includes(currentModule)) {
    return currentModule;
  }

  return allowedPaths[0] || null;
};

export const setCurrentShopCode = (shopcode) => {
  if (shopcode) {
    sessionStorage.setItem("currentShopCode", String(shopcode).trim().toUpperCase());
  }
};

export const getOriginalLoginUsername = () =>
  sessionStorage.getItem("originalLoginUsername") || "";

export const getOriginalLoginFrames = () => {
  try {
    const raw = sessionStorage.getItem("originalLoginFrames");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setAuthSession = (user) => {
  const normalizedFrames = normalizeFrames(user?.frames);
  const normalizedUsername = String(user?.username || "").trim().toUpperCase();
  const resolvedUserId =
    user?.userid ?? user?.user_id ?? user?.id ?? user?.userId ?? null;

  sessionStorage.setItem(
    "currentUser",
    JSON.stringify({
      ...user,
      id: resolvedUserId,
      userid: resolvedUserId,
      user_id: resolvedUserId,
      frames: normalizedFrames,
    })
  );
  sessionStorage.setItem("isLoggedIn", "true");
  sessionStorage.setItem("originalLoginUsername", normalizedUsername);
  sessionStorage.setItem("originalLoginFrames", JSON.stringify(normalizedFrames));
  setCurrentShopCode(user?.shopcode);
};

export const updateCurrentUser = (updates) => {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const resolvedUserId =
    updates?.userid ??
    updates?.user_id ??
    updates?.id ??
    updates?.userId ??
    currentUser.userid ??
    currentUser.user_id ??
    currentUser.id ??
    null;

  const nextUser = {
    ...currentUser,
    ...updates,
    id: resolvedUserId,
    userid: resolvedUserId,
    user_id: resolvedUserId,
  };
  sessionStorage.setItem("currentUser", JSON.stringify(nextUser));
  if (nextUser.shopcode) {
    setCurrentShopCode(nextUser.shopcode);
  }
  return nextUser;
};

export const clearAuthSession = ({ preserveCurrentModule = false } = {}) => {
  sessionStorage.removeItem("currentUser");
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("currentShopCode");
  sessionStorage.removeItem("originalLoginUsername");
  sessionStorage.removeItem("originalLoginFrames");
  if (!preserveCurrentModule) {
    sessionStorage.removeItem("currentModule");
  }
};

export const setCurrentModule = (path) => {
  if (path) {
    sessionStorage.setItem("currentModule", path);
  }
};

export const getCurrency = () => sessionStorage.getItem("currency") || "INR";
export const setCurrency = (currency) => sessionStorage.setItem("currency", currency);

export const getCountry = () => sessionStorage.getItem("country") || "India";
export const setCountry = (country) => sessionStorage.setItem("country", country);

export const getCountryCode = () => sessionStorage.getItem("countryCode") || "IN";
export const setCountryCode = (code) => sessionStorage.setItem("countryCode", code);

export const getCurrencySymbol = () => sessionStorage.getItem("currencySymbol") || "₹";
export const setCurrencySymbol = (symbol) => sessionStorage.setItem("currencySymbol", symbol);

export const getPhoneMaxLength = () => sessionStorage.getItem("phoneMaxLength") || "10";
export const setPhoneMaxLength = (val) => sessionStorage.setItem("phoneMaxLength", val);

export const getPhoneMinLength = () => sessionStorage.getItem("phoneMinLength") || "10";
export const setPhoneMinLength = (val) => sessionStorage.setItem("phoneMinLength", val);

export const getPhoneFixedLength = () => sessionStorage.getItem("phoneFixedLength") || "true";
export const setPhoneFixedLength = (val) => sessionStorage.setItem("phoneFixedLength", val);

export const getFlagEmoji = (countryCode = getCountryCode()) => {
  if (!countryCode) return "https://flagcdn.com/w40/in.png";
  const code = countryCode.toLowerCase();
  if (code === 'eu') return "https://flagcdn.com/w40/eu.png";
  return `https://flagcdn.com/w40/${code}.png`;
};




export const hasFrameAccess = (requiredFrame, user = getCurrentUser()) => {
  if (!requiredFrame) return true;
  const userFrames = normalizeFrames(user?.frames).map(normalizeFrameString);
  const reqNormalized = normalizeFrameString(requiredFrame);

  // Find matching module configuration from MODULES array
  const moduleConfig = MODULES.find(
    (m) =>
      normalizeFrameString(m.frame) === reqNormalized ||
      m.aliases?.some((a) => normalizeFrameString(a) === reqNormalized)
  );

  const targetFrames = moduleConfig
    ? [moduleConfig.frame, ...(moduleConfig.aliases || [])].map(normalizeFrameString)
    : [reqNormalized];

  return userFrames.some((uf) => targetFrames.includes(uf));
};


