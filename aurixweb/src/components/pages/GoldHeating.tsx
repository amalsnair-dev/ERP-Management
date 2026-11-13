import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ModulePageLayout from "../layout/ModulePageLayout";
import { useGoldHeatingState } from "../../features/goldheating/hooks/UseGoldHeatingState";
import { EstimatePickupItem } from "../../features/goldheating/type/GoldHeatingTypes";
import DynamicQueryService from "../../services/DynamicQueryApi";
import { getCurrentShopCode } from "../../utils/session";
import {
  Flame,
  Plus,
  Trash2,
  Edit3,
  Save,
  PlusCircle,
  X,
  Printer,
  CheckCircle,
  Search,
  AlertCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

import GoldHeatingAPI from "../../services/GoldHeatingApi";

const GoldHeating: React.FC = () => {
  const navigate = useNavigate();
  const {
    headerData,
    setHeaderData,
    gridRows,
    setGridRows,
    currentRow,
    setCurrentRow,
    updateCurrentRow,
    isFormEnabled,
    setIsFormEnabled,
    editingRowIndex,
    buttonStates,
    isPickupOpen,
    setIsPickupOpen,
    pickupList,
    isPickupLoading,
    pickupTitle,
    pickupMode,
    fetchPickupEstimates,
    loadEstimateDetails,
    handlePhoneChange,
    triggerSalesmanLookup,
    validateAndSetSalesman,
    lastValidatedSalesmanCodeRef,
    triggerCustomerLookup,
    validateAndSetCustomer,
    triggerItemLookup,
    validateAndSetItemCode,
    handleAddRow,
    handleDeleteRow,
    handleEditRow,
    handleNew,
    handleSave,
    handlePrint,
    handleCancelOrClose,
    totals,
  } = useGoldHeatingState();

  const itemCodeInputRef = useRef<HTMLInputElement>(null);
  const salesmanInputRef = useRef<HTMLInputElement>(null);
  const crmIdInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const custNameInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const [pickupSearch, setPickupSearch] = useState("");

  // Validation / Confirmation Popup Modal State
  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "warning" | "info" | "success" | "error" | "confirm";
    onConfirm?: () => void;
    onClose?: () => void;
  }>({
    isOpen: false,
    title: "Validation Message",
    message: "",
    type: "warning",
  });

  const showValidationMessage = (
    message: string,
    title = "Validation Message",
    type: "warning" | "info" | "success" | "error" | "confirm" = "warning",
    onClose?: () => void,
    onConfirm?: () => void
  ) => {
    setPopupState({ isOpen: true, title, message, type, onClose, onConfirm });
  };

  const closeValidationMessage = () => {
    const cb = popupState.onClose;
    setPopupState((prev) => ({ ...prev, isOpen: false, onClose: undefined, onConfirm: undefined }));
    if (cb) {
      setTimeout(cb, 50);
    }
  };

  const checkMandatorySalesman = (): boolean => {
    if (!isFormEnabled) return true;
    const currentCode = (
      salesmanInputRef.current?.value ||
      headerData.salesmanCode ||
      lastValidatedSalesmanCodeRef.current ||
      ""
    ).trim();
    if (!currentCode) {
      showValidationMessage(
        "Salesman Code is a mandatory field. Please enter or select a valid Salesman Code.",
        "Validation Message",
        "warning",
        () => {
          salesmanInputRef.current?.focus();
          salesmanInputRef.current?.select();
        }
      );
      return false;
    }
    return true;
  };

  const onNewClick = async () => {
    await handleNew();
    setTimeout(() => {
      salesmanInputRef.current?.focus();
      salesmanInputRef.current?.select();
    }, 50);
  };

  const onAddRowClick = () => {
    if (!checkMandatorySalesman()) return;
    const result = handleAddRow();
    if (!result.success && result.message) {
      const isSalesmanErr = result.message.toLowerCase().includes("salesman");
      showValidationMessage(
        result.message,
        "Validation Message",
        "warning",
        isSalesmanErr
          ? () => {
              salesmanInputRef.current?.focus();
              salesmanInputRef.current?.select();
            }
          : undefined
      );
    } else {
      itemCodeInputRef.current?.focus();
    }
  };

  // ── Modify Button Action ──
  const onModifyClick = async () => {
    await fetchPickupEstimates("Select Estimate To Modify", "MODIFY");
    setPickupSearch("");
  };

  // ── Delete Button Action ──
  const onDeleteClick = async () => {
    if (!headerData.estNo) {
      await fetchPickupEstimates("Select Estimate To Delete", "DELETE");
      setPickupSearch("");
      return;
    }

    if (headerData.isConfirmed) {
      showValidationMessage("Confirmed Estimate cannot be Deleted.", "Warning", "warning");
      return;
    }

    showValidationMessage(
      `Delete this Entry (Est No: #${headerData.estNo})?`,
      "Delete Confirmation",
      "confirm",
      undefined,
      async () => {
        try {
          const shopCode = String(getCurrentShopCode() || "").trim().toUpperCase();
          const api = GoldHeatingAPI(shopCode);
          await api.deleteHeating(Number(headerData.estNo));

          handleCancelOrClose(() => {});
          showValidationMessage(
            `Estimate #${headerData.estNo} Deleted Successfully!`,
            "Information",
            "success"
          );
        } catch (e) {
          showValidationMessage("Unable To Delete Estimate.", "Error", "error");
        }
      }
    );
  };

  // ── Confirm Button Action ──
  const onConfirmClick = async () => {
    if (!headerData.estNo) {
      await fetchPickupEstimates("Select Estimate To Confirm", "CONFIRM");
      setPickupSearch("");
      return;
    }

    if (headerData.isConfirmed) {
      showValidationMessage("Already Confirmed Estimate.", "Warning", "warning");
      return;
    }

    showValidationMessage(
      `Confirm This Entry (Est No: #${headerData.estNo})?`,
      "Confirm Confirmation",
      "confirm",
      undefined,
      async () => {
        try {
          const shopCode = String(getCurrentShopCode() || "").trim().toUpperCase();
          const api = GoldHeatingAPI(shopCode);
          await api.updateFlag(Number(headerData.estNo));

          showValidationMessage(
            "Confirmation Successful.",
            "Information",
            "success",
            () => handleCancelOrClose(() => {})
          );
        } catch (e) {
          showValidationMessage("Unable To Confirm Estimate.", "Error", "error");
        }
      }
    );
  };

  // ── Print Button Action ──
  const onPrintClick = async () => {
    if (!headerData.estNo) {
      await fetchPickupEstimates("Select Estimate To Print", "PRINT");
      setPickupSearch("");
      return;
    }
    handlePrint();
  };

  // ── Handling Estimate Selection from Pickup Modal ──
  const onSelectPickupEstimate = async (item: EstimatePickupItem) => {
    setIsPickupOpen(false);

    if (pickupMode === "MODIFY") {
      if (item.iss_flag || item.rec_flag) {
        showValidationMessage("Confirmed Estimate cannot be Modified.", "Warning", "warning");
        return;
      }

      showValidationMessage(
        `Modify this Entry (Est No: #${item.estno})?`,
        "Modify Confirmation",
        "confirm",
        undefined,
        async () => {
          const loaded = await loadEstimateDetails(item.estno);
          if (loaded) {
            setIsFormEnabled(true);
            buttonStates.setIsNewDisabled(true);
            buttonStates.setIsSaveDisabled(false);
            buttonStates.setIsModifyDisabled(true);
            buttonStates.setIsConfirmDisabled(true);
            buttonStates.setIsDeleteDisabled(true);
            buttonStates.setIsPrintDisabled(true);
            buttonStates.setIsCancelMode(true);

            setTimeout(() => {
              salesmanInputRef.current?.focus();
              salesmanInputRef.current?.select();
            }, 100);
          } else {
            showValidationMessage(`Unable to load estimate #${item.estno}`, "Error", "error");
          }
        }
      );
    } else if (pickupMode === "DELETE") {
      if (item.iss_flag || item.rec_flag) {
        showValidationMessage("Confirmed Estimate cannot be Deleted.", "Warning", "warning");
        return;
      }

      showValidationMessage(
        `Delete this Entry (Est No: #${item.estno})?`,
        "Delete Confirmation",
        "confirm",
        undefined,
        async () => {
          try {
            const shopCode = String(getCurrentShopCode() || "").trim().toUpperCase();
            const api = GoldHeatingAPI(shopCode);
            await api.deleteHeating(Number(item.estno));

            handleCancelOrClose(() => {});
            showValidationMessage(
              `Estimate #${item.estno} Deleted Successfully!`,
              "Information",
              "success"
            );
          } catch (e) {
            showValidationMessage("Unable To Delete Estimate.", "Error", "error");
          }
        }
      );
    } else if (pickupMode === "CONFIRM") {
      if (item.iss_flag) {
        showValidationMessage("Already Confirmed Estimate.", "Warning", "warning");
        return;
      }

      showValidationMessage(
        `Confirm This Entry (Est No: #${item.estno})?`,
        "Confirm Confirmation",
        "confirm",
        undefined,
        async () => {
          try {
            const shopCode = String(getCurrentShopCode() || "").trim().toUpperCase();
            const api = GoldHeatingAPI(shopCode);
            await api.updateFlag(Number(item.estno));

            showValidationMessage(
              "Confirmation Successful.",
              "Information",
              "success",
              () => handleCancelOrClose(() => {})
            );
          } catch (e) {
            showValidationMessage("Unable To Confirm Estimate.", "Error", "error");
          }
        }
      );
    } else if (pickupMode === "PRINT") {
      const loaded = await loadEstimateDetails(item.estno);
      if (loaded) {
        setTimeout(() => handlePrint(item.estno), 100);
      }
    } else {
      // General view / load
      await loadEstimateDetails(item.estno);
    }
  };

  // Filtered pickup list
  const filteredPickupEstimates = pickupList.filter((item) => {
    const q = pickupSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(item.estno).toLowerCase().includes(q) ||
      String(item.cust_name || "").toLowerCase().includes(q) ||
      String(item.phone || "").toLowerCase().includes(q) ||
      String(item.sm_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <ModulePageLayout title="Gold Heating Details" navigate={navigate}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

        {/* ── 1. HEADER SECTION (Est No, Date, Salesman, Metal, CRM, Phone, Name) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">

            {/* Est No with Search Button */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Est No
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  disabled
                  value={headerData.estNo ? `#${headerData.estNo}` : ""}
                  placeholder="AUTO"
                  className="w-full px-3 py-2 pr-8 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-amber-600 dark:text-amber-400"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await fetchPickupEstimates("Select Estimate To View / Modify", "MODIFY");
                    setPickupSearch("");
                  }}
                  className="absolute right-1.5 p-1 text-slate-400 hover:text-amber-500 cursor-pointer"
                  title="Search / Pick Estimate"
                >
                  <Search size={14} />
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                disabled={!isFormEnabled}
                value={headerData.estDate}
                onChange={(e) =>
                  setHeaderData((p) => ({ ...p, estDate: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Salesman Code */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Salesman Code
              </label>
              <div className="relative flex items-center">
                <input
                  ref={salesmanInputRef}
                  type="text"
                  disabled={!isFormEnabled}
                  placeholder="Code"
                  value={headerData.salesmanCode}
                  onChange={(e) =>
                    setHeaderData((p) => ({
                      ...p,
                      salesmanCode: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      validateAndSetSalesman(headerData.salesmanCode, () => {
                        crmIdInputRef.current?.focus();
                      });
                    }
                  }}
                  onBlur={() => {
                    if (headerData.salesmanCode.trim()) {
                      validateAndSetSalesman(headerData.salesmanCode);
                    }
                  }}
                  className="w-full px-3 py-2 pr-9 text-sm font-bold uppercase bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  type="button"
                  disabled={!isFormEnabled}
                  onClick={() => validateAndSetSalesman(headerData.salesmanCode, () => crmIdInputRef.current?.focus())}
                  className="absolute right-2 p-1 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Search / Validate Salesman Code"
                >
                  <Search size={15} />
                </button>
              </div>
            </div>

            {/* Metal Type Dropdown */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Metal Type
              </label>
              <select
                disabled={!isFormEnabled || gridRows.length > 0}
                value={headerData.metalType}
                onChange={(e) =>
                  setHeaderData((p) => ({
                    ...p,
                    metalType: e.target.value as "GOLD" | "SILVER",
                  }))
                }
                className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="GOLD">GOLD</option>
                <option value="SILVER">SILVER</option>
              </select>
            </div>

            {/* Cust ID (Optional) */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Cust ID
              </label>
              <div className="relative flex items-center">
                <input
                  ref={crmIdInputRef}
                  type="text"
                  disabled={!isFormEnabled}
                  placeholder="Cust ID (Optional)"
                  value={headerData.crmId}
                  onFocus={(e) => {
                    if (!checkMandatorySalesman()) e.target.blur();
                  }}
                  onChange={(e) =>
                    setHeaderData((p) => ({ ...p, crmId: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      validateAndSetCustomer(headerData.crmId, () => {
                        phoneInputRef.current?.focus();
                      });
                    }
                  }}
                  className="w-full px-3 py-2 pr-9 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  type="button"
                  disabled={!isFormEnabled}
                  onClick={() => triggerCustomerLookup(() => phoneInputRef.current?.focus())}
                  className="absolute right-2 p-1 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Search / Lookup Customer"
                >
                  <Search size={15} />
                </button>
              </div>
            </div>

            {/* Phone (Optional - Auto-CRM fetch on 10 digits) */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Phone
              </label>
              <input
                ref={phoneInputRef}
                type="text"
                maxLength={10}
                disabled={!isFormEnabled}
                placeholder="10-digit Phone (Optional)"
                value={headerData.phone}
                onFocus={(e) => {
                  if (!checkMandatorySalesman()) e.target.blur();
                }}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    custNameInputRef.current?.focus();
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Customer Name (Optional) */}
            <div className="lg:col-span-8">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Name
              </label>
              <input
                ref={custNameInputRef}
                type="text"
                disabled={!isFormEnabled}
                placeholder="Customer Name (Optional)"
                value={headerData.custName}
                onFocus={(e) => {
                  if (!checkMandatorySalesman()) e.target.blur();
                }}
                onChange={(e) =>
                  setHeaderData((p) => ({ ...p, custName: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    itemCodeInputRef.current?.focus();
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

          </div>
        </div>

        {/* ── 2. ITEM GRID INPUT TABLE (SalesEntry Style Table Entry) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-100">
              Item Details
            </h3>
          </div>

          {/* Grid Table Display with Integrated Input Header Line */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b dark:border-slate-700">
                  <th className="p-2.5 w-16 text-center">Slno</th>
                  <th className="p-2.5 min-w-[140px]">Item code</th>
                  <th className="p-2.5 w-20 text-right">Qty</th>
                  <th className="p-2.5 w-24 text-right">Grwt</th>
                  <th className="p-2.5 w-24 text-right">StWt</th>
                  <th className="p-2.5 w-24 text-right">NtWt</th>
                  <th className="p-2.5 min-w-[150px]">Remarks</th>
                  <th className="p-2.5 w-20 text-center">Action</th>
                </tr>

                {/* Entry Input Controls Row inside Table Header */}
                <tr className="bg-amber-50/40 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40">
                  <td className="p-1 text-center font-bold text-xs text-slate-500">
                    {currentRow.slNo}
                  </td>
                  <td className="p-1">
                    <div className="relative flex items-center">
                      <input
                        ref={itemCodeInputRef}
                        disabled={!isFormEnabled}
                        type="text"
                        placeholder="Item Code"
                        value={currentRow.itemCode}
                        onFocus={(e) => {
                          if (!checkMandatorySalesman()) e.target.blur();
                        }}
                        onChange={(e) => updateCurrentRow("itemCode", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            validateAndSetItemCode(currentRow.itemCode, () => {
                              qtyInputRef.current?.focus();
                            });
                          }
                        }}
                        onBlur={() => {
                          if (currentRow.itemCode.trim()) {
                            validateAndSetItemCode(currentRow.itemCode);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 pr-7 text-xs border rounded-lg dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                      <button
                        type="button"
                        disabled={!isFormEnabled}
                        onClick={() => validateAndSetItemCode(currentRow.itemCode, () => qtyInputRef.current?.focus())}
                        className="absolute right-1.5 text-slate-400 hover:text-amber-500 cursor-pointer"
                        title="Search / Validate Item Code"
                      >
                        <Search size={13} />
                      </button>
                    </div>
                  </td>
                  <td className="p-1">
                    <input
                      ref={qtyInputRef}
                      disabled={!isFormEnabled}
                      type="number"
                      placeholder="Qty"
                      value={currentRow.qty || ""}
                      onChange={(e) => updateCurrentRow("qty", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-xs text-right border rounded-lg dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      disabled={!isFormEnabled}
                      type="number"
                      min="0.001"
                      step="0.001"
                      placeholder="GrWt"
                      value={currentRow.grossWt || ""}
                      onChange={(e) => updateCurrentRow("grossWt", parseFloat(e.target.value) || 0)}
                      onBlur={() => {
                        if (currentRow.grossWt <= 0 && isFormEnabled) {
                          showValidationMessage(
                            "Gross Weight must be greater than 0.",
                            "Validation Message",
                            "warning"
                          );
                        }
                      }}
                      className="w-full px-2 py-1.5 text-xs text-right border rounded-lg dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      disabled={!isFormEnabled}
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="StWt"
                      value={currentRow.stoneWt || ""}
                      onChange={(e) => updateCurrentRow("stoneWt", parseFloat(e.target.value) || 0)}
                      onBlur={() => {
                        if (currentRow.stoneWt > currentRow.grossWt) {
                          showValidationMessage(
                            "Stone Weight cannot exceed Gross Weight.",
                            "Validation Message",
                            "warning"
                          );
                        }
                      }}
                      className="w-full px-2 py-1.5 text-xs text-right border rounded-lg dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      disabled
                      type="number"
                      placeholder="NtWt"
                      value={currentRow.netWt || 0}
                      className="w-full px-2 py-1.5 text-xs text-right font-bold border rounded-lg bg-amber-100/60 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      disabled={!isFormEnabled}
                      type="text"
                      placeholder="Remarks"
                      value={currentRow.remarks}
                      onChange={(e) => updateCurrentRow("remarks", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onAddRowClick();
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border rounded-lg dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </td>
                  <td className="p-1 text-center">
                    <button
                      type="button"
                      disabled={!isFormEnabled}
                      onClick={onAddRowClick}
                      className="w-8 h-8 mx-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg flex items-center justify-center shadow-sm cursor-pointer transition border border-emerald-500 hover:scale-105 active:scale-95"
                      title={editingRowIndex !== null ? "Update Row" : "Add Row"}
                    >
                      <Plus size={16} />
                    </button>
                  </td>
                </tr>
              </thead>
              <tbody>
                {gridRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500">
                      No heating items added. Type item details above and tap + to add.
                    </td>
                  </tr>
                ) : (
                  gridRows.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="p-3 text-center">{row.slNo}</td>
                      <td className="p-3 font-bold">{row.itemCode}</td>
                      <td className="p-3 text-right">{row.qty}</td>
                      <td className="p-3 text-right">{Number(row.grossWt).toFixed(3)}</td>
                      <td className="p-3 text-right">{Number(row.stoneWt).toFixed(3)}</td>
                      <td className="p-3 text-right font-extrabold text-amber-600 dark:text-amber-400">
                        {Number(row.netWt).toFixed(3)}
                      </td>
                      <td className="p-3 text-slate-500">{row.remarks}</td>
                      <td className="p-3 text-center flex justify-center gap-2">
                        <button
                          disabled={!isFormEnabled}
                          onClick={() => handleEditRow(index)}
                          className="text-amber-500 hover:text-amber-700 p-1 rounded-md disabled:opacity-40"
                          title="Modify Row"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          disabled={!isFormEnabled}
                          onClick={() => handleDeleteRow(index)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-md disabled:opacity-40"
                          title="Delete Row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 3. TOTALS BAR & ACTION BUTTONS ── */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Totals Summary */}
          <div className="grid grid-cols-4 gap-4 sm:gap-8 text-center md:text-left w-full md:w-auto">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Qty</div>
              <div className="text-base font-extrabold">{totals.totalQty}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Grwt</div>
              <div className="text-base font-extrabold">{totals.totalGrossWt.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Stwt</div>
              <div className="text-base font-extrabold">{totals.totalStoneWt.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Ntwt</div>
              <div className="text-base font-extrabold text-amber-400">{totals.totalNetWt.toFixed(3)}</div>
            </div>
          </div>

          {/* Action Buttons Row (New, Save, Modify, Confirm, Delete, Print, Close) */}
          <div className="flex flex-wrap gap-2 justify-end w-full md:w-auto">
            {/* New Button */}
            <button
              disabled={buttonStates.isNewDisabled}
              onClick={onNewClick}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle size={16} /> New
            </button>

            {/* Save Button */}
            <button
              disabled={buttonStates.isSaveDisabled}
              onClick={async () => {
                if (!checkMandatorySalesman()) return;
                const res = await handleSave();
                if (res.success) {
                  showValidationMessage(
                    res.message,
                    "Success",
                    "success",
                    () => {
                      handlePrint();
                      handleCancelOrClose(() => {});
                    }
                  );
                } else {
                  showValidationMessage(res.message, "Validation Message", "warning");
                }
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save size={16} /> Save
            </button>

            {/* Modify Button (Opens Pickup Dialog matching Java Swing) */}
            <button
              disabled={buttonStates.isModifyDisabled}
              onClick={onModifyClick}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit3 size={16} /> Modify
            </button>

            {/* Confirm Button */}
            <button
              disabled={buttonStates.isConfirmDisabled}
              onClick={onConfirmClick}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle size={16} /> Confirm
            </button>

            {/* Delete Button */}
            <button
              disabled={buttonStates.isDeleteDisabled}
              onClick={onDeleteClick}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 size={16} /> Delete
            </button>

            {/* Print Button */}
            <button
              disabled={buttonStates.isPrintDisabled}
              onClick={onPrintClick}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer size={16} /> Print
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

      {/* ── 4. ESTIMATE PICKUP MODAL (Matching Java AspSearchTable) ── */}
      {isPickupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Flame size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {pickupTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsPickupOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
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
              ) : filteredPickupEstimates.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  No heating estimates found.
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
                        <th className="p-2.5 text-center">Iss Confirm</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPickupEstimates.map((item, idx) => (
                        <tr
                          key={idx}
                          onClick={() => onSelectPickupEstimate(item)}
                          className="border-b dark:border-slate-800 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 cursor-pointer transition"
                        >
                          <td className="p-2.5 font-extrabold text-amber-600 dark:text-amber-400">
                            #{item.estno}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {String(item.entrydate || "").split("T")[0]}
                          </td>
                          <td className="p-2.5">{item.sm_name || "-"}</td>
                          <td className="p-2.5 text-slate-500">{item.cust_id || "-"}</td>
                          <td className="p-2.5 font-semibold">{item.cust_name || "-"}</td>
                          <td className="p-2.5 text-slate-500">{item.phone || "-"}</td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                                item.iss_flag
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              }`}
                            >
                              {item.iss_flag ? "Confirmed" : "Pending"}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPickupEstimate(item);
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
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

      {/* ── 5. VALIDATION / CONFIRMATION MODAL ── */}
      {popupState.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              closeValidationMessage();
            }
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4 text-center">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              popupState.type === "success"
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                : popupState.type === "error"
                ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
                : popupState.type === "confirm"
                ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
            }`}>
              {popupState.type === "confirm" ? (
                <HelpCircle size={28} />
              ) : popupState.type === "success" ? (
                <CheckCircle size={28} />
              ) : (
                <AlertCircle size={28} />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {popupState.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {popupState.message}
              </p>
            </div>

            {popupState.type === "confirm" ? (
              <div className="flex gap-3">
                <button
                  autoFocus
                  onClick={() => {
                    const confirmFn = popupState.onConfirm;
                    closeValidationMessage();
                    if (confirmFn) confirmFn();
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-lg cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={closeValidationMessage}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                autoFocus
                onClick={closeValidationMessage}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </ModulePageLayout>
  );
};

export default GoldHeating;
