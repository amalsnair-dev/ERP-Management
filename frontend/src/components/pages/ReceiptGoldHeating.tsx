import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ModulePageLayout from "../layout/ModulePageLayout";
import { useReceiptGoldHeatingState } from "../../features/goldheating/hooks/useReceiptGoldHeatingState";
import {
  Flame,
  Search,
  Save,
  CheckCircle,
  Printer,
  X,
  Edit3,
  Check,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";

const ReceiptGoldHeating: React.FC = () => {
  const navigate = useNavigate();
  const {
    headerData,
    gridRows,
    editingRowIndex,
    currentRow,
    updateCurrentRow,
    startEditRow,
    commitRowEdit,
    cancelRowEdit,
    isPickupOpen,
    setIsPickupOpen,
    pickupList,
    isPickupLoading,
    fetchPickupEstimates,
    loadEstimateDetails,
    buttonStates,
    popupState,
    showValidationMessage,
    closeValidationMessage,
    handleSave,
    handleConfirm,
    handlePrint,
    handleCancelOrClose,
    totals,
  } = useReceiptGoldHeatingState();

  const [pickupSearch, setPickupSearch] = useState("");
  const recGrossInputRef = useRef<HTMLInputElement>(null);
  const recStoneInputRef = useRef<HTMLInputElement>(null);
  const recRemarksInputRef = useRef<HTMLInputElement>(null);

  // Focus on gross weight when editing starts
  useEffect(() => {
    if (editingRowIndex !== null) {
      setTimeout(() => {
        recGrossInputRef.current?.focus();
        recGrossInputRef.current?.select();
      }, 50);
    }
  }, [editingRowIndex]);

  // Open estimate picker automatically if no estimate loaded
  const onOpenPickup = async () => {
    await fetchPickupEstimates();
    setPickupSearch("");
    setIsPickupOpen(true);
  };

  // Filtered estimates for pickup modal
  const filteredEstimates = pickupList.filter((item) => {
    const q = pickupSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.estno).toLowerCase().includes(q) ||
      String(item.cust_name).toLowerCase().includes(q) ||
      String(item.phone).toLowerCase().includes(q) ||
      String(item.sm_name).toLowerCase().includes(q)
    );
  });

  const onSelectEstimate = (estNo: string | number) => {
    setIsPickupOpen(false);
    loadEstimateDetails(estNo);
  };

  const handleCommitEdit = () => {
    const result = commitRowEdit();
    if (!result.success && result.message) {
      showValidationMessage(result.message, "Validation Message", "warning");
    }
  };

  return (
    <ModulePageLayout title="Receipt Gold Heating Details" navigate={navigate}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

        {/* ── 1. HEADER SECTION (Est No Picker, Date, Salesman, CRM, Phone, Name, Metal) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <Flame size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Heating Inward Receipt
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select an issued estimate to record and verify received heating weights
                </p>
              </div>
            </div>

            {/* Status & Metal Badges */}
            <div className="flex items-center gap-2">
              {headerData.estNo && (
                <span
                  className={`px-3 py-1 text-xs font-extrabold rounded-full ${
                    headerData.isConfirmed
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                  }`}
                >
                  {headerData.isConfirmed ? "Confirmed & Locked" : "Pending Receipt"}
                </span>
              )}
              {headerData.metalType && (
                <span
                  className={`px-3 py-1 text-xs font-extrabold rounded-full ${
                    headerData.metalType === "GOLD"
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                      : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {headerData.metalType}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Est No with Pickup Button */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Estimate No
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  placeholder="Click search to pick"
                  value={headerData.estNo ? `#${headerData.estNo}` : ""}
                  onClick={onOpenPickup}
                  className="w-full px-3 py-2 pr-10 text-sm font-extrabold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-amber-600 dark:text-amber-400 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={onOpenPickup}
                  className="absolute right-2 p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors cursor-pointer"
                  title="Pick Issued Estimate (Enter)"
                >
                  <Search size={14} />
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Issued Date
              </label>
              <input
                type="text"
                readOnly
                value={headerData.estDate || ""}
                placeholder="YYYY-MM-DD"
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
              />
            </div>

            {/* Salesman */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Salesman
              </label>
              <input
                type="text"
                readOnly
                value={headerData.salesmanName || ""}
                placeholder="Salesman"
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
              />
            </div>

            {/* Phone */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Phone
              </label>
              <input
                type="text"
                readOnly
                placeholder="Phone Number"
                value={headerData.phone || ""}
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
              />
            </div>

            {/* Cust ID */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Cust ID
              </label>
              <input
                type="text"
                readOnly
                placeholder="Cust ID"
                value={headerData.crmId || ""}
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium"
              />
            </div>

            {/* Customer Name */}
            <div className="lg:col-span-9">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Customer Name
              </label>
              <input
                type="text"
                readOnly
                placeholder="Customer Name"
                value={headerData.custName || ""}
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* ── 2. COMPARISON ITEM TABLE (Issued vs. Received) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">
                Heating Item Details (Comparison Grid)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click <span className="font-bold text-amber-500">Modify / Edit</span> on a row to update Received Gross and Stone weights.
              </p>
            </div>

            {!headerData.estNo && (
              <button
                type="button"
                onClick={onOpenPickup}
                className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Search size={14} /> Pick Estimate
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                {/* Master Grouping Headers */}
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700 text-xs font-bold uppercase">
                  <th colSpan={7} className="p-2.5 text-center border-r dark:border-slate-700 bg-slate-200/60 dark:bg-slate-800/80">
                    Issued Weight (Outward)
                  </th>
                  <th colSpan={5} className="p-2.5 text-center bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
                    Received Weight (Inward)
                  </th>
                </tr>

                {/* Column Titles */}
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b dark:border-slate-700 text-xs">
                  <th className="p-2.5 w-12 text-center">Sl</th>
                  <th className="p-2.5 min-w-[120px]">Item Code</th>
                  <th className="p-2.5 w-14 text-right">Qty</th>
                  <th className="p-2.5 w-20 text-right">GrWt</th>
                  <th className="p-2.5 w-20 text-right">StWt</th>
                  <th className="p-2.5 w-20 text-right">NtWt</th>
                  <th className="p-2.5 min-w-[120px] border-r dark:border-slate-700">Remarks</th>

                  <th className="p-2.5 w-24 text-right text-amber-700 dark:text-amber-300 font-bold bg-amber-50/50 dark:bg-amber-950/20">
                    Rec GrWt
                  </th>
                  <th className="p-2.5 w-20 text-right text-amber-700 dark:text-amber-300 font-bold bg-amber-50/50 dark:bg-amber-950/20">
                    Rec StWt
                  </th>
                  <th className="p-2.5 w-20 text-right text-amber-700 dark:text-amber-300 font-bold bg-amber-50/50 dark:bg-amber-950/20">
                    Rec NtWt
                  </th>
                  <th className="p-2.5 min-w-[130px] bg-amber-50/50 dark:bg-amber-950/20">
                    Rec Remarks
                  </th>
                  <th className="p-2.5 w-20 text-center bg-amber-50/50 dark:bg-amber-950/20">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {gridRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-12 text-slate-400 dark:text-slate-500">
                      No estimate loaded. Click &quot;Pick Estimate&quot; above to load an issued heating estimate.
                    </td>
                  </tr>
                ) : (
                  gridRows.map((row, index) => {
                    const isEditing = editingRowIndex === index;

                    if (isEditing) {
                      return (
                        <tr
                          key={index}
                          className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-300 dark:border-amber-700"
                        >
                          <td className="p-2 text-center font-bold">{row.slNo}</td>
                          <td className="p-2 font-bold">{row.itemCode}</td>
                          <td className="p-2 text-right">{row.qty}</td>
                          <td className="p-2 text-right text-slate-500">{row.grossWt.toFixed(3)}</td>
                          <td className="p-2 text-right text-slate-500">{row.stoneWt.toFixed(3)}</td>
                          <td className="p-2 text-right text-slate-500 border-r dark:border-slate-700">
                            {row.netWt.toFixed(3)}
                          </td>
                          <td className="p-2 text-slate-500 border-r dark:border-slate-700 truncate max-w-[120px]">
                            {row.remarks}
                          </td>

                          {/* Editable Received Inputs */}
                          <td className="p-1">
                            <input
                              ref={recGrossInputRef}
                              type="number"
                              step="0.001"
                              min="0"
                              placeholder="Rec GrWt"
                              value={currentRow.recGrossWt || ""}
                              onChange={(e) => updateCurrentRow("recGrossWt", e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  recStoneInputRef.current?.focus();
                                  recStoneInputRef.current?.select();
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs text-right font-bold border rounded-lg bg-white dark:bg-slate-800 border-amber-400 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              ref={recStoneInputRef}
                              type="number"
                              step="0.001"
                              min="0"
                              placeholder="Rec StWt"
                              value={currentRow.recStoneWt || ""}
                              onChange={(e) => updateCurrentRow("recStoneWt", e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  recRemarksInputRef.current?.focus();
                                  recRemarksInputRef.current?.select();
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs text-right border rounded-lg bg-white dark:bg-slate-800 border-amber-400 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              readOnly
                              value={currentRow.recNetWt.toFixed(3)}
                              className="w-full px-2 py-1.5 text-xs text-right font-extrabold border rounded-lg bg-amber-100/70 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              ref={recRemarksInputRef}
                              type="text"
                              placeholder="Remarks"
                              value={currentRow.recRemarks}
                              onChange={(e) => updateCurrentRow("recRemarks", e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleCommitEdit();
                                }
                              }}
                              className="w-full px-2 py-1.5 text-xs border rounded-lg bg-white dark:bg-slate-800 border-amber-400 focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={handleCommitEdit}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                                title="Commit Row (Enter)"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={cancelRowEdit}
                                className="p-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition"
                                title="Cancel Edit"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={index}
                        className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 text-center">{row.slNo}</td>
                        <td className="p-3 font-bold">{row.itemCode}</td>
                        <td className="p-3 text-right">{row.qty}</td>
                        <td className="p-3 text-right text-slate-500">{row.grossWt.toFixed(3)}</td>
                        <td className="p-3 text-right text-slate-500">{row.stoneWt.toFixed(3)}</td>
                        <td className="p-3 text-right text-slate-500">{row.netWt.toFixed(3)}</td>
                        <td className="p-3 text-slate-500 border-r dark:border-slate-700">{row.remarks}</td>

                        {/* Received Details */}
                        <td className="p-3 text-right font-extrabold text-slate-800 dark:text-slate-100 bg-amber-50/20 dark:bg-amber-950/10">
                          {row.recGrossWt.toFixed(3)}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 bg-amber-50/20 dark:bg-amber-950/10">
                          {row.recStoneWt.toFixed(3)}
                        </td>
                        <td className="p-3 text-right font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/10">
                          {row.recNetWt.toFixed(3)}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 bg-amber-50/20 dark:bg-amber-950/10 truncate max-w-[130px]">
                          {row.recRemarks || "-"}
                        </td>
                        <td className="p-3 text-center bg-amber-50/20 dark:bg-amber-950/10">
                          <button
                            disabled={headerData.isConfirmed}
                            onClick={() => startEditRow(index)}
                            className="p-1.5 text-amber-600 hover:bg-amber-500 hover:text-white dark:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-white rounded-lg transition disabled:opacity-30 cursor-pointer"
                            title="Modify Received Weights (F4)"
                          >
                            <Edit3 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 3. TOTALS BAR & ACTION CONTROLS ── */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-6">
          {/* Comparative Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center sm:text-left w-full lg:w-auto">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Qty</div>
              <div className="text-base font-extrabold">{totals.totalQty}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Issued GrWt</div>
              <div className="text-base font-extrabold text-slate-300">
                {totals.totalGrossWt.toFixed(3)} g
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-400">Rec GrWt</div>
              <div className="text-base font-extrabold text-amber-400">
                {totals.totalRecGrossWt.toFixed(3)} g
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-rose-400">Weight Loss</div>
              <div className="text-base font-extrabold text-rose-400">
                {Math.max(0, totals.totalGrossWt - totals.totalRecGrossWt).toFixed(3)} g
              </div>
            </div>
          </div>

          {/* Action Buttons (Save, Confirm, Print, Cancel/Close) */}
          <div className="flex flex-wrap gap-2.5 justify-end w-full lg:w-auto">
            {/* Save Button */}
            <button
              disabled={buttonStates.isSaveDisabled || headerData.isConfirmed}
              onClick={async () => {
                const res = await handleSave();
                showValidationMessage(
                  res.message,
                  res.success ? "Success" : "Validation Message",
                  res.success ? "success" : "warning"
                );
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Save size={16} /> Save Receipt
            </button>

            {/* Confirm Button */}
            <button
              disabled={buttonStates.isConfirmDisabled || headerData.isConfirmed || !headerData.estNo}
              onClick={async () => {
                const res = await handleConfirm();
                showValidationMessage(
                  res.message,
                  res.success ? "Success" : "Validation Message",
                  res.success ? "success" : "info"
                );
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <CheckCircle size={16} /> Confirm Receipt
            </button>

            {/* Print Button */}
            <button
              disabled={buttonStates.isPrintDisabled || !headerData.estNo}
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Printer size={16} /> Print Report
            </button>

            {/* Close / Cancel Button */}
            <button
              onClick={() => handleCancelOrClose(() => navigate("/easytotal"))}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <X size={16} /> {buttonStates.isCancelMode ? "Cancel" : "Close"}
            </button>
          </div>
        </div>

      </div>

      {/* ── 4. ESTIMATE PICKUP MODAL ── */}
      {isPickupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Flame size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Select Issued Heating Estimate
                </h3>
              </div>
              <button
                onClick={() => setIsPickupOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Filter */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by Est No, Customer Name, Phone, or Salesman..."
                  value={pickupSearch}
                  onChange={(e) => setPickupSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-y-auto p-4 flex-1">
              {isPickupLoading ? (
                <div className="py-12 text-center text-slate-400">Loading estimates...</div>
              ) : filteredEstimates.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No pending issued estimates found.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700">
                        <th className="p-2.5">Est No</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Salesman</th>
                        <th className="p-2.5">Cust ID</th>
                        <th className="p-2.5">Customer</th>
                        <th className="p-2.5">Phone</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEstimates.map((item, idx) => (
                        <tr
                          key={idx}
                          onClick={() => onSelectEstimate(item.estno)}
                          className="border-b dark:border-slate-800 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 cursor-pointer transition"
                        >
                          <td className="p-2.5 font-extrabold text-amber-600 dark:text-amber-400">
                            #{item.estno}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {String(item.entrydate || "").split("T")[0]}
                          </td>
                          <td className="p-2.5">{item.sm_name || "-"}</td>
                          <td className="p-2.5 text-slate-500">{item.cust_id}</td>
                          <td className="p-2.5 font-semibold">{item.cust_name || "-"}</td>
                          <td className="p-2.5 text-slate-500">{item.phone || "-"}</td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                                item.rec_flag
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                            >
                              {item.rec_flag ? "Confirmed" : "Pending"}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectEstimate(item.estno);
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto"
                            >
                              Select <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. VALIDATION MESSAGE MODAL ── */}
      {popupState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 text-center">
            <div
              className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                popupState.type === "success"
                  ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                  : popupState.type === "error"
                  ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                  : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
              }`}
            >
              <AlertCircle size={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {popupState.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {popupState.message}
              </p>
            </div>
            <button
              onClick={closeValidationMessage}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </ModulePageLayout>
  );
};

export default ReceiptGoldHeating;
