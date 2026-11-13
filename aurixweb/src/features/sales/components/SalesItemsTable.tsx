import React from "react";
import { SalesRowItem } from "../types/salesTypes";
import { tableTypography } from "../../../utils/tableTypography";
import { fmtAmt, fmtWt, getAmt, getWt } from "../../../utils/format";
import { Trash2 } from "lucide-react";

interface SalesItemsTableProps {
  items: SalesRowItem[];
  onRemoveRow?: (index: number) => void;
}

export const SalesItemsTable: React.FC<SalesItemsTableProps> = ({
  items,
  onRemoveRow,
}) => {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
        <h3 className={`text-slate-800 dark:text-slate-200 font-bold flex items-center gap-2 ${tableTypography.header}`}>
          <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
          Sales Items Grid ({items.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
              <th className={`px-3 py-2.5 text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>#</th>
              <th className={`px-3 py-2.5 text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Code</th>
              <th className={`px-3 py-2.5 text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Description</th>
              <th className={`px-3 py-2.5 text-right text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Gross Wt</th>
              <th className={`px-3 py-2.5 text-right text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Stone Wt</th>
              <th className={`px-3 py-2.5 text-right text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Net Wt</th>
              <th className={`px-3 py-2.5 text-right text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Rate</th>
              <th className={`px-3 py-2.5 text-right text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Amount (₹)</th>
              <th className={`px-3 py-2.5 text-center text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-slate-400 text-xs font-medium">
                  No sales items added. Type item code or barcode above to begin.
                </td>
              </tr>
            ) : (
              items.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                  <td className={`px-3 py-2 font-mono text-slate-500 ${tableTypography.cellMono}`}>{idx + 1}</td>
                  <td className={`px-3 py-2 font-bold text-slate-800 dark:text-slate-200 ${tableTypography.cellMono}`}>{row.itemCode}</td>
                  <td className={`px-3 py-2 text-slate-700 dark:text-slate-300 ${tableTypography.cellText}`}>{row.itemDesc}</td>
                  <td className={`px-3 py-2 text-right text-slate-800 dark:text-slate-200 ${tableTypography.cellMono}`}>{fmtWt(getWt(row.grossWt))}</td>
                  <td className={`px-3 py-2 text-right text-slate-600 dark:text-slate-400 ${tableTypography.cellMono}`}>{fmtWt(getWt(row.stoneWt))}</td>
                  <td className={`px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100 ${tableTypography.cellMono}`}>{fmtWt(getWt(row.netWt))}</td>
                  <td className={`px-3 py-2 text-right text-slate-700 dark:text-slate-300 ${tableTypography.cellMono}`}>{fmtAmt(getAmt(row.rate))}</td>
                  <td className={`px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400 ${tableTypography.cellMono}`}>{fmtAmt(getAmt(row.amount))}</td>
                  <td className="px-3 py-2 text-center">
                    {onRemoveRow && (
                      <button
                        onClick={() => onRemoveRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
