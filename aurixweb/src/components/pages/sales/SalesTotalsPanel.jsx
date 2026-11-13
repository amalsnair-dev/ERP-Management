import React from "react";
import { fmtAmt, fmtWt, getAmt, getWt } from "../../../utils/format";
import { useCurrencySymbol } from "../../../hooks/useCurrencySymbol";
import { tableTypography } from "../../../utils/tableTypography";

/**
 * @param {object} props
 * @param {any[]} [props.salesGrid]
 * @param {object} [props.headerData]
 * @param {any[]} [props.purchaseGrid]
 * @param {any[]} [props.creditNoteGrid]
 * @param {any[]} [props.advanceGrid]
 */
const SalesTotalsPanel = ({ salesGrid = [], headerData = {}, purchaseGrid = [], creditNoteGrid = [], advanceGrid = [] }) => {
  const currencySymbol = useCurrencySymbol();

  // 1. Sales Totals
  const salesGrossWt = salesGrid.reduce((sum, item) => sum + getWt(item.grossWt), 0);
  const salesAmount = salesGrid.reduce((sum, item) => sum + getAmt(item.amount), 0);

  // 2. Purchase Totals
  const purchaseGrossWt = purchaseGrid.reduce((sum, item) => sum + getWt(item.grossWt), 0);
  const purchaseAmount = purchaseGrid.reduce((sum, item) => sum + getAmt(item.amount), 0);

  // 3. Credit Note Totals
  const creditNoteGrossWt = creditNoteGrid.reduce((sum, item) => sum + getWt(item.grossWt), 0);
  const creditNoteAmount = creditNoteGrid.reduce((sum, item) => sum + getAmt(item.amount), 0);

  // 4. GST/IGST Calculations
  const isIgst = !!headerData.applyIgst;
  const taxRate = isIgst ? getAmt(headerData.igstPer) : getAmt(headerData.gstPer);
  const taxAmount = (salesAmount * taxRate) / 100;

  const advanceAmount = advanceGrid.reduce(
  (sum, item) => sum + getAmt(item.balAmt ?? item.advAmt),
  0
);

  // 5. Grand Total: Sales + Tax - Deductions
  const grandTotal = (salesAmount + taxAmount) - purchaseAmount - creditNoteAmount - advanceAmount;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 items-stretch py-1">
      {/* Grid containing the individual table summaries */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3.5">

        {/* Sales Table Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-3 sm:p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-violet-600"></span>
              <span className={`text-slate-700 dark:text-slate-400 ${tableTypography.header}`}>
                Sales Details
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className={`text-slate-400 ${tableTypography.header}`}>Gross Wt</span>
              <span className={`text-slate-700 dark:text-slate-200 ${tableTypography.cellMono}`}>
                {fmtWt(salesGrossWt)} <span className="text-[10px] font-bold text-slate-400">gm</span>
              </span>
            </div>
          </div>
          <div className="flex justify-between items-baseline mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
            <span className={`text-slate-400 ${tableTypography.header}`}>Total Amount</span>
            <span className={`text-sky-600 dark:text-violet-400 ${tableTypography.cellAmount}`}>
              {currencySymbol}{fmtAmt(salesAmount)}
            </span>
          </div>
        </div>

        {/* Purchase Table Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-3 sm:p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className={`text-slate-500 dark:text-slate-400 ${tableTypography.header}`}>
                Purchase Note
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className={`text-slate-400 ${tableTypography.header}`}>Gross Wt</span>
              <span className={`text-slat-700 dark:text-slate-200 ${tableTypography.cellMono}`}>
                {fmtWt(purchaseGrossWt)} <span className="text-[10px] font-bold text-slate-400">gm</span>
              </span>
            </div>
          </div>
          <div className="flex justify-between items-baseline mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
            <span className={`text-slate-400 ${tableTypography.header}`}>Total Amount</span>
            <span className={`text-sky-600 dark:text-amber-400 ${tableTypography.cellAmount}`}>
              {currencySymbol}{fmtAmt(purchaseAmount)}
            </span>
          </div>
        </div>

        {/* Credit Note Table Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-3 sm:p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className={`text-slate-500 dark:text-slate-400 ${tableTypography.header}`}>
                Credit Note
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className={`text-slate-400 ${tableTypography.header}`}>Gross Wt</span>
              <span className={`text-slate-700 dark:text-slate-200 ${tableTypography.cellMono}`}>
                {fmtWt(creditNoteGrossWt)} <span className="text-[10px] font-bold text-slate-400">gm</span>
              </span>
            </div>
          </div>
          <div className="flex justify-between items-baseline mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
            <span className={`text-slate-400 ${tableTypography.header}`}>Total Amount</span>
            <span className={`text-sky-600 dark:text-rose-400 ${tableTypography.cellAmount}`}>
              {currencySymbol}{fmtAmt(creditNoteAmount)}
            </span>
          </div>
        </div>

      </div>

      {/* Tax, Deductions & Grand Total Card */}
      <div className="w-full lg:w-96 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/15 border border-emerald-400/30 dark:border-emerald-500/30 p-4 flex flex-col justify-between shadow-xs">
        <div className="space-y-1">
          {/* Tax Details — IGST if applyIgst is checked, else GST */}
          <div className="flex justify-between items-center">
            <span className={`text-slate-500 dark:text-slate-400 ${tableTypography.cellText}`}>{isIgst ? "IGST" : "GST"} ({taxRate}%)</span>
            <span className={`text-slate-700 dark:text-slate-300 ${tableTypography.cellAmount}`}>
              + {currencySymbol}{fmtAmt(taxAmount)}
            </span>
          </div>

          {/* Advance Deduction (shown if present) */}
          {advanceAmount > 0 && (
            <div className="flex justify-between items-center pt-0.5">
              <span className={`text-slate-500 dark:text-slate-400 ${tableTypography.cellText}`}>Advance</span>
              <span className={`text-rose-600 dark:text-rose-400 ${tableTypography.cellAmount}`}>
                - {currencySymbol}{fmtAmt(advanceAmount)}
              </span>
            </div>
          )}

          

          {/* Total Deductions (only shown if present) */}
          {(purchaseAmount > 0 || creditNoteAmount > 0 || advanceAmount > 0) && (
            <div className="flex justify-between items-center pt-0.5">
              <span className={`text-rose-600 dark:text-rose-400 ${tableTypography.cellText}`}>Deductions</span>
              <span className={`text-rose-600 dark:text-rose-400 ${tableTypography.cellAmount}`}>
                - {currencySymbol}{fmtAmt(purchaseAmount + creditNoteAmount + advanceAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between">
          <span className={`text-emerald-800 dark:text-emerald-400 ${tableTypography.header}`}>
            Grand Total
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-emerald-600/80 dark:text-emerald-400/80 ${tableTypography.cellAmount}`}>
              {currencySymbol}
            </span>
            <span className={`text-emerald-700 dark:text-emerald-300 text-xl ${tableTypography.cellAmount}`}>
              {fmtAmt(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SalesTotalsPanel);
