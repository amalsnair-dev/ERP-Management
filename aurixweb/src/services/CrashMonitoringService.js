/**
 * Crash & Telemetry Monitoring Service for AurixWeb POS
 * Captures unhandled runtime errors, React ErrorBoundary crashes, and API telemetry.
 */

const MAX_STORED_ERRORS = 50;
const STORAGE_KEY = "aurix_crash_logs";

export const CrashMonitoringService = {
  /**
   * Initialize global window error handlers
   */
  init: (options = {}) => {
    if (typeof window === "undefined") return;

    // Window Uncaught Error Listener
    window.onerror = (message, source, lineno, colno, error) => {
      CrashMonitoringService.captureException(error || new Error(String(message)), {
        source,
        lineno,
        colno,
        type: "window.onerror",
      });
    };

    // Unhandled Promise Rejection Listener
    window.onunhandledrejection = (event) => {
      const reason = event.reason;
      CrashMonitoringService.captureException(
        reason instanceof Error ? reason : new Error(String(reason || "Unhandled Promise Rejection")),
        { type: "unhandledrejection" }
      );
    };

    console.log("🛡️ CrashMonitoringService initialized.");
  },

  /**
   * Capture and record structured exception telemetry
   */
  captureException: (error, context = {}) => {
    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const shopCode = localStorage.getItem("selectedShopCode") || "";

      const errorPayload = {
        id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        message: error?.message || String(error || "Unknown Error"),
        stack: error?.stack || null,
        url: window.location.href,
        shopCode,
        user: auth.username || "anonymous",
        userAgent: navigator.userAgent,
        context,
      };

      console.error("🔴 [CrashMonitoringService] Error Captured:", errorPayload);

      // Store in Local Cache for Inspection / Diagnostic View
      CrashMonitoringService.saveToLocalCache(errorPayload);
    } catch (e) {
      console.warn("Failed to capture error telemetry:", e);
    }
  },

  /**
   * Store error payload in local storage buffer for crash debugging
   */
  saveToLocalCache: (payload) => {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY);
      const logs = existingStr ? JSON.parse(existingStr) : [];
      logs.unshift(payload);
      if (logs.length > MAX_STORED_ERRORS) logs.length = MAX_STORED_ERRORS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (err) {
      // Storage quota or disabled fallback
    }
  },

  /**
   * Retrieve cached crash logs for admin inspection
   */
  getCrashLogs: () => {
    try {
      const existingStr = localStorage.getItem(STORAGE_KEY);
      return existingStr ? JSON.parse(existingStr) : [];
    } catch (e) {
      return [];
    }
  },

  /**
   * Clear local crash log cache
   */
  clearCrashLogs: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  },
};

export default CrashMonitoringService;
