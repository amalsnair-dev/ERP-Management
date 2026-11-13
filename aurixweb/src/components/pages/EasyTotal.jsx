import { useState, useEffect, useCallback } from "react";
import { fetchEasyTotalData } from "../../services/easyTotalApi";
import {
  existsByUsername,
  getShopCodes,
  getDefaultShopCode,
} from "../../services/ShopAPI";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { handleShopSwitch } from "../../utils/shopSwitch";
import { getCurrentShopCode } from "../../utils/session";
import { useCurrencySymbol } from "../../hooks/useCurrencySymbol";
import ModulePageLayout from "../layout/ModulePageLayout";
import { fmtWt, fmtAmt } from "../../utils/format";
  const EasyTotal = () => {
  const [tableData, setTableData] = useState([]);
  const currencySymbol = useCurrencySymbol();
  const [shopcodes, setShopcodes] = useState([]);
  const [selectedShopCode, setSelectedShopCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // background refresh
  const [message, setMessage] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const navigate = useNavigate();

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
  const username = currentUser.username || "";
  const password = currentUser.password || "";

  const roles = Array.isArray(currentUser.roles)
    ? currentUser.roles.map((r) => (typeof r === "object" ? r.role : r))
    : typeof currentUser.roles === "string"
    ? [currentUser.roles]
    : [];
  const userRole = roles[0] || "";

  const handleMessage = useCallback((text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const activeShopCode = selectedShopCode || getCurrentShopCode();
        const userExists = await existsByUsername(
          username,
          activeShopCode || undefined
        );
        if (!userExists) return navigate("/signin");

        const codes = await getShopCodes();
        if (Array.isArray(codes)) setShopcodes(codes);

        const defaultCode = getCurrentShopCode() || await getDefaultShopCode();
        if (defaultCode) setSelectedShopCode(defaultCode);
      } catch (error) {
        handleMessage(error.message || "Failed to initialize data.", "error");
      }
    };

    if (username && password) init();
  }, [username, password, navigate, handleMessage]); // Removed selectedShopCode to prevent infinite loop

  const loadEasyTotalData = useCallback(async (shopCode, silent = false) => {
    try {
      setIsRefreshing(silent);
      setIsLoading(!silent);
      
      const data = await fetchEasyTotalData(shopCode, username, password, { _t: Date.now() });

      let processedData = [];
      if (Array.isArray(data) && data.length > 0) {
        const groupedData = data.reduce((acc, item) => {
          const category = item.categry || item.category || "Unknown";
          if (!acc[category]) acc[category] = { category };
          const head = (item.head || "").toLowerCase();
          acc[category][`${head}Weight`] = item.wt || 0;
          acc[category][`${head}Amount`] = item.amount || 0;
          return acc;
        }, {});
        processedData = Object.values(groupedData);
      } else {
        // Default zero rows when no data
        processedData = [
          {
            category: "Gold",
            goldWeight: 0,
            goldAmount: 0,
            silverWeight: 0,
            silverAmount: 0,
            platinumWeight: 0,
            platinumAmount: 0,
          },
          {
            category: "Silver",
            goldWeight: 0,
            goldAmount: 0,
            silverWeight: 0,
            silverAmount: 0,
            platinumWeight: 0,
            platinumAmount: 0,
          },
          {
            category: "Platinum",
            goldWeight: 0,
            goldAmount: 0,
            silverWeight: 0,
            silverAmount: 0,
            platinumWeight: 0,
            platinumAmount: 0,
          },
        ];
        if (!silent) {
          handleMessage(
            `No data found for ${shopCode}. Showing default values.`,
            "info"
          );
        }
      }

      setTableData(processedData);
      setLastUpdated(new Date());
    } catch {
      if (!silent) {
        handleMessage("Unable to load Easy Total data.", "error");
      }
      // Keep existing data on background error
      if (!silent) setTableData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [username, password, handleMessage]);

  useEffect(() => {
    if (selectedShopCode && username && password) {
      loadEasyTotalData(selectedShopCode);
    }
  }, [selectedShopCode, username, password, loadEasyTotalData]);

  // Auto-update polling (every 15 seconds)
  useEffect(() => {
    let intervalId;
    if (selectedShopCode && username && password) {
      intervalId = setInterval(() => {
        loadEasyTotalData(selectedShopCode, true);
      }, 15000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedShopCode, username, password, loadEasyTotalData]);
  const handleShopCodeChange = async (event) => {
    const nextShopCode = event.target.value;
    const result = await handleShopSwitch({
      nextShopCode,
      username,
      currentModule: "/easytotal",
      navigate,
      onSuccess: (shopCode) => setSelectedShopCode(shopCode),
    });

    if (!result.requiresSignin && !result.ok) {
      handleMessage(result.message || "Unable to switch shop code.", "error");
    }
  };

  return (
    <ModulePageLayout title="Easy Total" navigate={navigate}>
      <div className="w-full space-y-6 animate-fade-in-up">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Branch</span>
            <select
              value={selectedShopCode}
              onChange={handleShopCodeChange}
              disabled={!(userRole.includes("ROLE_SUPERUSER") || userRole.includes("ROLE_SUPERADMIN"))}
              className="premium-input py-1 px-3 w-32 font-bold text-sky-600 dark:text-sky-400"
            >
              {shopcodes.map((shop, idx) => (
                <option key={idx} value={shop.Shopcode}>{shop.Shopcode}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-2">
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Last Sync</span>
              <span className="text-[10px] text-slate-500 font-mono font-bold">
                {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            
            <button
              onClick={() => loadEasyTotalData(selectedShopCode)}
              disabled={isLoading || isRefreshing}
              className={`p-2 rounded-xl transition-all duration-300 ${
                isLoading || isRefreshing 
                  ? "bg-slate-100 text-slate-400 animate-spin" 
                  : "bg-sky-50 text-sky-600 hover:bg-sky-100 active:scale-95"
              }`}
              title="Manual Refresh"
            >
              <RotateCcw size={14} />
            </button>

            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-500 shadow-sm ${
              (isLoading || isRefreshing) 
                ? "bg-amber-100 text-amber-600 animate-pulse scale-105" 
                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
            }`}>
              {(isLoading || isRefreshing) ? "Syncing..." : "Live"}
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="app-card overflow-hidden relative shadow-2xl ring-1 ring-slate-200/50 dark:ring-slate-800/50">
          {isLoading && !isRefreshing && (
            <div className="absolute inset-0 z-30 flex items-center justify-center glass-card bg-white/20 dark:bg-slate-900/20 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest">Updating Totals</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-20 glass-header shadow-sm">
                <tr className="modern-table-header">
                  <th rowSpan={2} className="px-6 py-4 text-left font-black uppercase tracking-widest text-[10px] border-r border-slate-200/50 dark:border-slate-700/50">Category</th>
                  <th colSpan={2} className="px-6 py-4 text-center font-black uppercase tracking-widest text-[10px] border-r border-slate-200/50 dark:border-slate-700/50 bg-amber-500/5">Gold Totals</th>
                  <th colSpan={2} className="px-6 py-4 text-center font-black uppercase tracking-widest text-[10px] border-r border-slate-200/50 dark:border-slate-700/50 bg-slate-500/5">Silver Totals</th>
                  <th colSpan={2} className="px-6 py-4 text-center font-black uppercase tracking-widest text-[10px] bg-sky-500/5">Platinum Totals</th>
                </tr>
                <tr className="modern-table-header bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="px-6 py-2 text-center text-[9px] font-bold border-r border-slate-200/50 dark:border-slate-700/50">Weight (g)</th>
                  <th className="px-6 py-2 text-center text-[9px] font-bold border-r border-slate-200/50 dark:border-slate-700/50">Amount ({currencySymbol})</th>
                  <th className="px-6 py-2 text-center text-[9px] font-bold border-r border-slate-200/50 dark:border-slate-700/50">Weight (g)</th>
                  <th className="px-6 py-2 text-center text-[9px] font-bold border-r border-slate-200/50 dark:border-slate-700/50">Amount ({currencySymbol})</th>
                  <th className="px-6 py-2 text-center text-[9px] font-bold border-r border-slate-200/50 dark:border-slate-700/50">Weight (g)</th>
                  <th className="px-6 py-2 text-center text-[9px] font-bold">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tableData.map((row) => (
                  <tr key={row.category} className="modern-table-row group">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-150 ${
                          row.category === "Gold" ? "bg-amber-400" : row.category === "Silver" ? "bg-slate-400" : "bg-sky-400"
                        }`} />
                        {row.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/[0.02] border-r border-slate-100 dark:border-slate-800/50">
                      {fmtWt(row.goldWeight)}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-amber-700 dark:text-amber-200 bg-amber-500/[0.04] border-r border-slate-100 dark:border-slate-800/50">
                      {fmtAmt(row.goldAmount)}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-500/[0.02] border-r border-slate-100 dark:border-slate-800/50">
                      {fmtWt(row.silverWeight)}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-500/[0.04] border-r border-slate-100 dark:border-slate-800/50">
                      {fmtAmt(row.silverAmount)}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/[0.02] border-r border-slate-100 dark:border-slate-800/50">
                      {fmtWt(row.platinumWeight)}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-sky-700 dark:text-sky-200 bg-sky-500/[0.04]">
                      {fmtAmt(row.platinumAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message Notifications */}
        {message && (
          <div className="flex justify-center">
            <div className={`px-6 py-3 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 animate-bounce ${
              message.type === "error" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            }`}>
              <div className={`w-2 h-2 rounded-full animate-ping ${
                message.type === "error" ? "bg-rose-500" : "bg-emerald-500"
              }`} />
              {message.text}
            </div>
          </div>
        )}
      </div>
    </ModulePageLayout>
  );
};

export default EasyTotal;






