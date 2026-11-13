import React, { useState, useEffect } from "react";
import { Search, Check, RefreshCcw } from "lucide-react";
import MetadataAPI from "../../services/MetadataAPI";
import { getCurrency, setCurrency, setCountry, setCountryCode, setCurrencySymbol, setPhoneMaxLength, setPhoneMinLength, setPhoneFixedLength } from "../../utils/session";

const CurrencySelector = ({ onSelect }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(getCurrency());
  const [currencies, setCurrencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    setIsLoading(true);
    try {
      const data = await MetadataAPI.getCurrencies();

      // Remove duplicates by currency code to keep the UI clean
      const uniqueCurrencies = [];
      const seenCodes = new Set();

      for (const item of data) {
        if (!seenCodes.has(item.code)) {
          seenCodes.add(item.code);
          uniqueCurrencies.push(item);
        }
      }

      setCurrencies(uniqueCurrencies);

      // Handle Dynamic Default if session is empty
      if (!getCurrency()) {
        const defaultCountry = await MetadataAPI.getDefaultCountry();
        if (defaultCountry) {
          handleCurrencyChange(defaultCountry);
        }
      } else {
        // Ensure phone parameters are loaded for existing session
        const active = uniqueCurrencies.find(c => c.code === selectedCurrency);
        if (active) {
          setPhoneMaxLength(active.phoneMaxLength || "10");
          setPhoneMinLength(active.phoneMinLength || "10");
          setPhoneFixedLength(String(active.phoneFixedLength !== undefined ? active.phoneFixedLength : "true"));
        } else {
          const defaultCountry = await MetadataAPI.getDefaultCountry();
          if (defaultCountry) {
            setPhoneMaxLength(defaultCountry.phoneMaxLength || "10");
            setPhoneMinLength(defaultCountry.phoneMinLength || "10");
            setPhoneFixedLength(String(defaultCountry.phoneFixedLength !== undefined ? defaultCountry.phoneFixedLength : "true"));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
      // Fallback to local if backend fails
      setCurrencies([
        { code: "INR", name: "India", symbol: "₹", country: "IN" },
        { code: "USD", name: "United States", symbol: "$", country: "US" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = (curr) => {
    setSelectedCurrency(curr.code);
    setCurrency(curr.code);
    setCountry(curr.name);
    setCountryCode(curr.country); // Store ISO code (e.g., 'IN')
    setCurrencySymbol(curr.symbol); // Store symbol (e.g., '₹')
    setPhoneMaxLength(curr.phoneMaxLength || "10");
    setPhoneMinLength(curr.phoneMinLength || "10");
    setPhoneFixedLength(String(curr.phoneFixedLength !== undefined ? curr.phoneFixedLength : "true"));

    // Dispatch custom event to notify other components to re-render
    window.dispatchEvent(new Event('regionalSettingsChanged'));

    if (onSelect) onSelect(curr);
  };

  const filteredCurrencies = currencies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Currency & Region
        </p>
        {isLoading && <RefreshCcw size={12} className="animate-spin text-slate-700" />}
      </div>

      {/* Current Selection Preview */}
      {selectedCurrency && currencies.find(c => c.code === selectedCurrency) && (
        <div className="p-3 bg-slate-700/50 dark:bg-slate-700/10 border border-slate-700 dark:border-slate-700/30 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="w-10 h-7 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <img
              src={`https://flagcdn.com/w40/${(currencies.find(c => c.code === selectedCurrency)?.country || 'un').toLowerCase()}.png`}
              alt="selected"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://flagcdn.com/w40/un.png";
              }}
              className="w-7 h-5 object-cover rounded-sm"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-slate-700 dark:text-slate-700 truncate">
              {selectedCurrency}
              <span className="ml-1.5 opacity-60 font-bold">({currencies.find(c => c.code === selectedCurrency).symbol})</span>
            </div>
            <div className="text-[9px] text-slate-700/60 dark:text-slate-700/50 font-bold uppercase tracking-widest">Active Region</div>
          </div>
          <div className="px-2 py-0.5 bg-slate-700 dark:bg-slate-700/40 rounded-md text-[8px] font-black text-slate-700 dark:text-slate-700 uppercase">Selected</div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative group">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-700 transition-colors" />
        <input
          type="text"
          placeholder="Search 149+ countries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-700/20 focus:border-slate-700 transition-all shadow-sm"
        />
      </div>

      {/* Grid Container with Scrolling */}
      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredCurrencies.map((curr) => (
          <button
            key={curr.code + curr.country}
            onClick={() => handleCurrencyChange(curr)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${selectedCurrency === curr.code
              ? 'bg-slate-700 border-slate-700 dark:bg-slate-700/20 dark:border-slate-700 text-slate-700 dark:text-slate-700'
              : 'bg-white border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-700 dark:hover:border-slate-700'
              }`}
          >
            <div className="flex-shrink-0 w-8 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-inner">
              <img
                src={`https://flagcdn.com/w40/${(curr.country || 'un').toLowerCase()}.png`}
                alt={curr.country}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://flagcdn.com/w40/un.png";
                }}
                className="w-6 h-4 object-cover rounded-sm shadow-sm"
              />
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                {curr.code}
                <span className="text-[10px] text-slate-700 font-bold">({curr.symbol})</span>
              </div>
            </div>
            {selectedCurrency === curr.code && (
              <Check size={12} className="shrink-0 text-slate-700" />
            )}
          </button>
        ))}
      </div>

      {filteredCurrencies.length === 0 && !isLoading && (
        <div className="text-center py-8 text-slate-400 text-xs">
          No results found for "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
