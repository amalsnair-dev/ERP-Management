import React from "react";
import { SalesHeaderState } from "../types/salesTypes";
import { tableTypography } from "../../../utils/tableTypography";

interface SalesHeaderSectionProps {
  headerData: SalesHeaderState;
  onUpdateField: (field: keyof SalesHeaderState, value: any) => void;
  isEstNoLocked?: boolean;
  isMetalLocked?: boolean;
  headerRefs?: React.RefObject<any>;
}

export const SalesHeaderSection: React.FC<SalesHeaderSectionProps> = ({
  headerData,
  onUpdateField,
  isEstNoLocked = false,
  isMetalLocked = false,
}) => {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 items-center">
        {/* Metal Dropdown */}
        <div className="col-span-2 sm:col-span-2">
          <label className={`block text-slate-600 dark:text-slate-400 mb-1 ${tableTypography.header}`}>
            Metal Type
          </label>
          <select
            value={headerData.goldSlv || "GOLD"}
            disabled={isMetalLocked}
            onChange={(e) => onUpdateField("goldSlv", e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-60 cursor-pointer"
          >
            <option value="GOLD">GOLD 916</option>
            <option value="SILVER">SILVER</option>
            <option value="GOLD22K">GOLD 22K</option>
            <option value="GOLD18K">GOLD 18K</option>
          </select>
        </div>

        {/* Est No */}
        <div className="col-span-2 sm:col-span-2">
          <label className={`block text-slate-600 dark:text-slate-400 mb-1 ${tableTypography.header}`}>
            Estimate No
          </label>
          <input
            type="text"
            value={headerData.estNo || ""}
            disabled={isEstNoLocked}
            onChange={(e) => onUpdateField("estNo", e.target.value)}
            placeholder="EST NO"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-60"
          />
        </div>

        {/* Date */}
        <div className="col-span-2 sm:col-span-2">
          <label className={`block text-slate-600 dark:text-slate-400 mb-1 ${tableTypography.header}`}>
            Date
          </label>
          <input
            type="date"
            value={headerData.estDate || ""}
            onChange={(e) => onUpdateField("estDate", e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Gold Rate */}
        <div className="col-span-2 sm:col-span-2">
          <label className={`block text-amber-600 dark:text-amber-400 font-bold mb-1 ${tableTypography.header}`}>
            Metal Rate (₹)
          </label>
          <input
            type="number"
            value={headerData.gRate || ""}
            onChange={(e) => onUpdateField("gRate", Number(e.target.value))}
            placeholder="RATE"
            className="w-full bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Salesman */}
        <div className="col-span-2 sm:col-span-2">
          <label className={`block text-slate-600 dark:text-slate-400 mb-1 ${tableTypography.header}`}>
            Salesman
          </label>
          <input
            type="text"
            value={headerData.salesman || ""}
            onChange={(e) => onUpdateField("salesman", e.target.value.toUpperCase())}
            placeholder="CODE"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Customer Name */}
        <div className="col-span-4 sm:col-span-2">
          <label className={`block text-slate-600 dark:text-slate-400 mb-1 ${tableTypography.header}`}>
            Customer Name
          </label>
          <input
            type="text"
            value={headerData.custName || ""}
            onChange={(e) => onUpdateField("custName", e.target.value)}
            placeholder="NAME"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Phone */}
        <div className="col-span-4 sm:col-span-2">
          <label className={`block text-slate-600 dark:text-slate-400 mb-1 ${tableTypography.header}`}>
            Mobile Phone
          </label>
          <input
            type="text"
            maxLength={10}
            value={headerData.phone || ""}
            onChange={(e) => onUpdateField("phone", e.target.value)}
            placeholder="PHONE (10 Digits)"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
