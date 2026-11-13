import React from "react";
import { PurchaseRowItem } from "../types/salesTypes";
import { tableTypography } from "../../../utils/tableTypography";
import { fmtAmt, fmtWt, getAmt, getWt } from "../../../utils/format";
import { Trash2 } from "lucide-react";

interface PurchaseItemsTableProps {
  items: PurchaseRowItem[];
  onRemoveRow?: (index: number) => void;
}

export const PurchaseItemsTable: React.FC<PurchaseItemsTableProps> = ({
  items,
  onRemoveRow,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex justify-between items-center bg-amber-50/40 dark:bg-amber-950/20">
        <h3 className={`text-amber-800 dark:text-amber-300 font-bold flex items-center gap-2 ${tableTypography.header}`}>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Purchase / Old Gold Deductions ({items.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-amber-100/40 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40">
              <th className={`px-3 py-2 text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>#</th>
              <th className={`px-3 py-2 text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Code</th>
              <th className={`px-3 py-2 text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Description</th>
              <th className={`px-3 py-2 text-right text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Gross Wt</th>
              <th className={`px-3 py-2 text-right text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Net Wt</th>
              <th className={`px-3 py-2 text-right text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Amount (₹)</th>
              <th className={`px-3 py-2 text-center text-slate-600 dark:text-slate-400 font-bold ${tableTypography.header}`}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {items.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                <td className={`px-3 py-2 font-mono text-slate-500 ${tableTypography.cellMono}`}>{idx + 1}</td>
                <td className={`px-3 py-2 font-bold text-slate-800 dark:text-slate-200 ${tableTypography.cellMono}`}>{row.itemCode}</td>
                <td className={`px-3 py-2 text-slate-700 dark:text-slate-300 ${tableTypography.cellText}`}>{row.itemDesc}</td>
                <td className={`px-3 py-2 text-right text-slate-800 dark:text-slate-200 ${tableTypography.cellMono}`}>{fmtWt(getWt(row.grossWt))}</td>
                <td className={`px-3 py-2 text-right font-bold text-slate-900 dark:text-slate-100 ${tableTypography.cellMono}`}>{fmtWt(getWt(row.netWt))}</td>
                <td className={`px-3 py-2 text-right font-bold text-amber-600 dark:text-amber-400 ${tableTypography.cellMono}`}>{fmtAmt(getAmt(row.amount))}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
