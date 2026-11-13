import axiosInstance from "./axiosConfig.js";

const api = axiosInstance;
const queryCache = new Map();
const TTL_MS = 3000; // 3-second cache window for duplicate SELECT queries

/**
 * Service for executing dynamic SQL queries securely.
 * The backend validates queries against a regex blocklist and uses parameter binding.
 */
export const DynamicQueryService = {
  clearCache: () => queryCache.clear(),

  /**
   * Execute a query and return results based on the type.
   * @param {Object} request - { sql: string, params: object, tablename: string }
   * @param {string} type - 'list' (default), 'object' (single row), 'report' (keyed by table), 'check' (boolean)
   * @param {Object} auth - { username, password }
   * @param {string} shopcode - Optional shopcode
   */
  execute: (request, type = "list", auth, shopcode, year) => {
    const isSelect =
      typeof request?.sql === "string" &&
      request.sql.trim().toUpperCase().startsWith("SELECT");
    const cacheKey = isSelect
      ? JSON.stringify({ request, type, shopcode, year })
      : null;

    if (cacheKey && queryCache.has(cacheKey)) {
      const entry = queryCache.get(cacheKey);
      if (Date.now() - entry.timestamp < TTL_MS) {
        return Promise.resolve(entry.data);
      }
      queryCache.delete(cacheKey);
    }

    const endpoint = year ? "api/query/executeyear" : "api/query/execute";
    return api
      .post(endpoint, request, {
        params: {
          type,
          shopcode: shopcode || "",
          ...(year && { year }),
        },
        headers: auth
          ? { username: auth.username || "", password: auth.password || "" }
          : {},
      })
      .then((res) => {
        if (cacheKey) {
          queryCache.set(cacheKey, { timestamp: Date.now(), data: res });
        }
        return res;
      });
  },

  /**
   * Helper for fetching a single row (Map)
   */
  fetchSingle: (sql, params, auth, shopcode, year) =>
    DynamicQueryService.execute({ sql, params }, "object", auth, shopcode, year),

  /**
   * Helper for fetching a list of rows (Array)
   */
  fetchList: (sql, params, auth, shopcode, year) =>
    DynamicQueryService.execute({ sql, params }, "list", auth, shopcode, year),

  /**
   * Helper for fetching formatted report data
   */
  fetchReport: (sql, tablename, params, auth, shopcode) =>
    DynamicQueryService.execute({ sql, params, tablename }, "report", auth, shopcode),

  /**
   * Helper to check if a query is valid/safe
   */
  checkQuery: (sql, params, auth, shopcode) =>
    DynamicQueryService.execute({ sql, params }, "check", auth, shopcode),
};

export default DynamicQueryService;
