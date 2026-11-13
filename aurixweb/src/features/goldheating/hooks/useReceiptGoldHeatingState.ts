import { useState, useEffect, useRef, useCallback } from "react";
import {
  ReceiptGoldHeatingHeaderState,
  ReceiptGoldHeatingRow,
  EstimatePickupItem,
} from "../type/ReceiptGoldHeatingTypes";
import DynamicQueryService from "../../../services/DynamicQueryApi";
import GoldHeatingAPI from "../../../services/GoldHeatingApi";
import { getCurrentShopCode } from "../../../utils/session";
import { getDefaultShopCode } from "../../../services/ShopAPI";

export const useReceiptGoldHeatingState = () => {
  // ── 1. Header Information ──
  const [headerData, setHeaderData] = useState<ReceiptGoldHeatingHeaderState>({
    estNo: "",
    estDate: new Date().toISOString().split("T")[0],
    salesmanName: "",
    crmId: "",
    phone: "",
    custName: "",
    metalType: "GOLD",
    isConfirmed: false,
  });

  // ── 2. Table Rows State ──
  const [gridRows, setGridRows] = useState<ReceiptGoldHeatingRow[]>([]);

  // ── 3. Active Edit Row State ──
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [currentRow, setCurrentRow] = useState<ReceiptGoldHeatingRow>({
    slNo: 1,
    itemCode: "",
    itemDesc: "",
    qty: 1,
    grossWt: 0,
    stoneWt: 0,
    netWt: 0,
    remarks: "",
    recGrossWt: 0,
    recStoneWt: 0,
    recNetWt: 0,
    recRemarks: "",
  });

  // ── 4. Estimate Pickup Dialog State ──
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [pickupList, setPickupList] = useState<EstimatePickupItem[]>([]);
  const [isPickupLoading, setIsPickupLoading] = useState(false);

  // ── 5. Button States ──
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(false);
  const [isPrintDisabled, setIsPrintDisabled] = useState(false);
  const [isCancelMode, setIsCancelMode] = useState(false);

  // Validation Popup Modal State
  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "warning" | "info" | "success" | "error";
  }>({
    isOpen: false,
    title: "Validation Message",
    message: "",
    type: "warning",
  });

  const showValidationMessage = (
    message: string,
    title = "Validation Message",
    type: "warning" | "info" | "success" | "error" = "warning"
  ) => {
    setPopupState({ isOpen: true, title, message, type });
  };

  const closeValidationMessage = () => {
    setPopupState((prev) => ({ ...prev, isOpen: false }));
  };

  // Helper to resolve active shop code
  const resolveActiveShopCode = () =>
    String(getCurrentShopCode() || "").trim().toUpperCase();

  // ── 6. Fetch Unconfirmed Issued Estimates for Pickup Modal ──
  const fetchPickupEstimates = useCallback(async () => {
    setIsPickupLoading(true);
    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const shopCode = resolveActiveShopCode() || (await getDefaultShopCode());

      const query = `
        SELECT estno, entry_date, sm_name, cust_id, cust_name, phone, rec_flag, gld_slv 
        FROM gold_heat_mstr 
        WHERE iss_flag = true 
        GROUP BY estno, entry_date, sm_name, cust_id, cust_name, phone, rec_flag, gld_slv 
        ORDER BY estno ASC
      `;

      const res = await DynamicQueryService.fetchList(query, {}, auth, shopCode);
      if (Array.isArray(res?.data)) {
        const mapped: EstimatePickupItem[] = res.data.map((item: any) => ({
          estno: item.estno || item.ESTNO,
          entrydate: item.entry_date || item.ENTRY_DATE || item.entrydate || item.ENTRYDATE,
          sm_name: item.sm_name || item.SM_NAME || "",
          cust_id: item.cust_id || item.CUST_ID || "",
          cust_name: item.cust_name || item.CUST_NAME || "",
          phone: item.phone || item.PHONE || "",
          rec_flag: Boolean(item.rec_flag === true || item.REC_FLAG === true || item.rec_flag === "true" || item.rec_flag === 1),
          gld_slv: item.gld_slv || item.GLD_SLV || "G",
        }));
        setPickupList(mapped);
      } else {
        setPickupList([]);
      }
    } catch (err) {
      console.warn("Failed to fetch pickup estimates:", err);
      setPickupList([]);
    } finally {
      setIsPickupLoading(false);
    }
  }, []);

  // ── 7. Load Estimate Details & Rows ──
  const loadEstimateDetails = async (selectedEstNo: string | number) => {
    if (!selectedEstNo) return;
    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const shopCode = resolveActiveShopCode() || (await getDefaultShopCode());

      const query = `SELECT * FROM gold_heat_mstr WHERE estno = ${Number(selectedEstNo)} ORDER BY row_id ASC`;
      const res = await DynamicQueryService.fetchList(query, {}, auth, shopCode);

      if (Array.isArray(res?.data) && res.data.length > 0) {
        const rows = res.data;
        const first = rows[0];

        const isRecConfirmed = Boolean(
          first.rec_flag === true ||
          first.REC_FLAG === true ||
          first.rec_flag === "true" ||
          first.rec_flag === 1
        );

        const metalTypeVal = (first.gld_slv || first.GLD_SLV || "G").toUpperCase() === "S" ? "SILVER" : "GOLD";

        setHeaderData({
          estNo: String(first.estno || first.ESTNO || selectedEstNo),
          estDate: String(first.entryDate || first.entry_date || first.entrydate || first.ENTRYDATE || "").split("T")[0],
          salesmanName: String(first.smName || first.sm_name || first.SM_NAME || ""),
          crmId: String(first.custId || first.cust_id || first.CUST_ID || ""),
          phone: String(first.phone || first.PHONE || ""),
          custName: String(first.custName || first.cust_name || first.CUST_NAME || ""),
          metalType: metalTypeVal,
          isConfirmed: isRecConfirmed,
        });

        // Map items
        const mappedRows: ReceiptGoldHeatingRow[] = rows.map((r: any, idx: number) => {
          const rawRowId =
            r.rowId !== undefined && r.rowId !== null && r.rowId !== ""
              ? Number(r.rowId)
              : r.row_id !== undefined && r.row_id !== null && r.row_id !== ""
              ? Number(r.row_id)
              : r.ROW_ID !== undefined && r.ROW_ID !== null && r.ROW_ID !== ""
              ? Number(r.ROW_ID)
              : null;
          const grwt = Number(r.grwt || r.GRWT || 0);
          const stwt = Number(r.stwt || r.STWT || 0);
          const ntwt = Number(r.ntwt || r.NTWT || 0);
          const recGrwt = Number(r.recGrwt !== undefined && r.recGrwt !== null ? r.recGrwt : r.rec_grwt !== undefined && r.rec_grwt !== null ? r.rec_grwt : grwt);
          const recStwt = Number(r.recStwt !== undefined && r.recStwt !== null ? r.recStwt : r.rec_stwt !== undefined && r.rec_stwt !== null ? r.rec_stwt : stwt);
          const recNtwt = Number(r.recNtwt !== undefined && r.recNtwt !== null ? r.recNtwt : r.rec_ntwt !== undefined && r.rec_ntwt !== null ? r.rec_ntwt : (recGrwt - recStwt));

          return {
            slNo: rawRowId !== null ? rawRowId : idx + 1,
            originalRowId: rawRowId,
            itemCode: String(r.itemCode || r.item_code || r.ITEMCODE || ""),
            itemDesc: String(r.itemCode || r.item_code || r.ITEMCODE || ""),
            qty: Number(r.qty || r.QTY || 1),
            grossWt: grwt,
            stoneWt: stwt,
            netWt: ntwt,
            remarks: String(r.remark || r.REMARK || ""),
            recGrossWt: recGrwt,
            recStoneWt: recStwt,
            recNetWt: recNtwt,
            recRemarks: String(r.recRemark || r.rec_remark || r.REC_REMARK || ""),
          };
        });

        setGridRows(mappedRows);
        setIsCancelMode(true);
        setIsSaveDisabled(isRecConfirmed);
        setIsConfirmDisabled(isRecConfirmed);

        if (isRecConfirmed) {
          showValidationMessage(
            "This Estimate is already confirmed and closed. Editing is disabled.",
            "Estimate Confirmed",
            "info"
          );
        }
      } else {
        showValidationMessage(`Estimate #${selectedEstNo} not found.`, "Not Found", "error");
      }
    } catch (err) {
      console.error("Failed to load estimate details:", err);
      showValidationMessage("Failed to load estimate details.", "Error", "error");
    }
  };

  // ── 8. Row Edit Handlers (F4 or Click Edit) ──
  const startEditRow = (index: number) => {
    if (headerData.isConfirmed) {
      showValidationMessage("Cannot modify a confirmed estimate.", "Estimate Confirmed", "warning");
      return;
    }
    const target = gridRows[index];
    if (!target) return;
    setEditingRowIndex(index);
    setCurrentRow({ ...target });
  };

  const updateCurrentRow = (field: keyof ReceiptGoldHeatingRow, value: any) => {
    setCurrentRow((prev) => {
      let updatedVal = value;
      if (field === "recGrossWt" || field === "recStoneWt") {
        const num = parseFloat(value);
        updatedVal = isNaN(num) ? 0 : Math.max(0, num);
      }

      const updated = { ...prev, [field]: updatedVal };

      if (field === "recGrossWt" || field === "recStoneWt") {
        const gross = field === "recGrossWt" ? Number(updatedVal) : prev.recGrossWt;
        const stone = field === "recStoneWt" ? Number(updatedVal) : prev.recStoneWt;
        const net = Math.max(0, gross - stone);
        updated.recNetWt = Number(net.toFixed(3));
      }

      return updated;
    });
  };

  const commitRowEdit = (): { success: boolean; message?: string } => {
    if (editingRowIndex === null) return { success: true };

    if (!currentRow.recGrossWt || currentRow.recGrossWt <= 0) {
      return { success: false, message: "Gross Weight Cannot Be Empty or Invalid." };
    }

    if (currentRow.recGrossWt > currentRow.grossWt) {
      return {
        success: false,
        message: "Receipt Weight Cannot Be Greater Than Issued Weight",
      };
    }

    if (currentRow.recGrossWt < currentRow.recStoneWt) {
      return {
        success: false,
        message: "Received Gross Weight Cannot Be Less Than Received Stone Weight",
      };
    }

    setGridRows((prev) => {
      const copy = [...prev];
      copy[editingRowIndex] = { ...currentRow };
      return copy;
    });

    setEditingRowIndex(null);
    setIsSaveDisabled(false);
    return { success: true };
  };

  const cancelRowEdit = () => {
    setEditingRowIndex(null);
  };

  // ── 9. Save Received Items (Matches Java validateReceivedGrossWeight & updateReceivedItem) ──
  const handleSave = async (): Promise<{ success: boolean; message: string }> => {
    if (!headerData.estNo) {
      return { success: false, message: "No Estimate selected to save." };
    }
    if (gridRows.length === 0) {
      return { success: false, message: "No item records to update." };
    }

    // If currently editing a row, commit it first
    let currentRows = [...gridRows];
    if (editingRowIndex !== null) {
      const commitRes = commitRowEdit();
      if (!commitRes.success) {
        return { success: false, message: commitRes.message || "Invalid row edit values." };
      }
      currentRows[editingRowIndex] = { ...currentRow };
    }

    // Java validateReceivedGrossWeight check across all rows
    for (let i = 0; i < currentRows.length; i++) {
      const row = currentRows[i];
      const recGrwt = Number(row.recGrossWt || 0);

      if (recGrwt <= 0) {
        return {
          success: false,
          message: `Received Gross Weight cannot be 0 or empty in row ${i + 1}`,
        };
      }

      if (recGrwt > row.grossWt) {
        return {
          success: false,
          message: `Receipt Weight Cannot Be Greater Than Issued Weight in row ${i + 1}`,
        };
      }

      if (recGrwt < Number(row.recStoneWt || 0)) {
        return {
          success: false,
          message: `Received Gross Weight Cannot Be Less Than Received Stone Weight in row ${i + 1}`,
        };
      }
    }

    try {
      const shopCode = resolveActiveShopCode();
      const userStr = sessionStorage.getItem("currentUser");
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userId =
        currentUser?.userid ??
        currentUser?.user_id ??
        currentUser?.id ??
        currentUser?.userId ??
        null;

      const api = GoldHeatingAPI(shopCode);

      // 1. Call Backend HeatingController endpoint (PUT /heating/update) for each row
      for (const row of currentRows) {
        const rowIdToUse = row.originalRowId ?? row.slNo ?? 1;
        const payload = {
          estno: Number(headerData.estNo),
          entryDate: headerData.estDate,
          smCode: headerData.salesmanCode || "",
          smName: headerData.salesmanName || "",
          gldSlv: headerData.metalType === "SILVER" ? "S" : "G",
          custId: headerData.crmId || "C000001",
          custName: headerData.custName || "",
          phone: headerData.phone || "",
          itemCode: row.itemCode,
          qty: row.qty || 1,
          grwt: row.grossWt,
          stwt: row.stoneWt,
          ntwt: row.netWt,
          remark: row.remarks || "",
          recGrwt: row.recGrossWt,
          recStwt: row.recStoneWt,
          recNtwt: row.recNetWt,
          recRemark: row.recRemarks || "",
          saveFlag: true,
          recFlag: false,
          issFlag: true,
          rowId: rowIdToUse,
          userId: userId,
          shopCode: shopCode,
        };

        await api.updateHeating(Number(headerData.estNo), payload, rowIdToUse);
      }

      // 2. Clear query cache
      (DynamicQueryService as any).clearCache();

      setIsSaveDisabled(true);
      return {
        success: true,
        message: `Receipt for Gold Heating Estimate #${headerData.estNo} updated successfully!`,
      };
    } catch (err: any) {
      console.error("Save Receipt Error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to update received items.";
      return { success: false, message: errorMsg };
    }
  };

  // ── 10. Confirm Estimate Entry (rec_flag = true) ──
  const handleConfirm = async (): Promise<{ success: boolean; message: string }> => {
    if (!headerData.estNo) {
      return { success: false, message: "Please pick an Estimate first." };
    }
    if (headerData.isConfirmed) {
      return { success: false, message: "This Estimate is Already Confirmed." };
    }

    try {
      const shopCode = resolveActiveShopCode();
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");

      // Check estimate status in database
      const checkSql = `SELECT estno, save_flag, rec_flag FROM gold_heat_mstr WHERE estno = ${Number(headerData.estNo)}`;
      const checkRes = await (DynamicQueryService as any).fetchList(checkSql, {}, auth, shopCode);

      if (Array.isArray(checkRes?.data) && checkRes.data.length > 0) {
        const first = checkRes.data[0];
        const isRec = Boolean(
          first.rec_flag === true ||
          first.REC_FLAG === true ||
          first.rec_flag === "true" ||
          first.rec_flag === 1
        );
        const isSaved = Boolean(
          first.save_flag === true ||
          first.SAVE_FLAG === true ||
          first.saveflag === true ||
          first.SAVEFLAG === true ||
          first.save_flag === "true" ||
          first.save_flag === 1
        );

        if (isRec) {
          return { success: false, message: "This Estimate is Already Confirmed." };
        }
        if (!isSaved) {
          return {
            success: false,
            message: "Estimate must be saved before confirmation.",
          };
        }
      }

      const api = GoldHeatingAPI(shopCode);
      const userStr = sessionStorage.getItem("currentUser");
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userId =
        currentUser?.userid ??
        currentUser?.user_id ??
        currentUser?.id ??
        currentUser?.userId ??
        null;
      const firstRow = gridRows[0] || currentRow;

      const payload = {
        estno: Number(headerData.estNo),
        entryDate: headerData.estDate,
        smCode: headerData.salesmanCode || "",
        smName: headerData.salesmanName || "",
        gldSlv: headerData.metalType === "SILVER" ? "S" : "G",
        custId: headerData.crmId || "C000001",
        custName: headerData.custName || "",
        phone: headerData.phone || "",
        itemCode: firstRow.itemCode,
        qty: firstRow.qty || 1,
        grwt: firstRow.grossWt,
        stwt: firstRow.stoneWt,
        ntwt: firstRow.netWt,
        remark: firstRow.remarks || "",
        recGrwt: firstRow.recGrossWt,
        recStwt: firstRow.recStoneWt,
        recNtwt: firstRow.recNetWt,
        recRemark: firstRow.recRemarks || "",
        saveFlag: true,
        recFlag: true,
        issFlag: true,
        rowId: firstRow.slNo || 1,
        userId: userId,
        shopCode: shopCode,
      };

      // Call backend PUT /heating/confirm endpoint (sets rec_flag = true in gold_heat_mstr)
      await api.confirmHeating(Number(headerData.estNo));

      (DynamicQueryService as any).clearCache();

      setHeaderData((prev) => ({ ...prev, isConfirmed: true }));
      setIsSaveDisabled(true);
      setIsConfirmDisabled(true);

      return {
        success: true,
        message: "Confirmation Successful.",
      };
    } catch (err: any) {
      console.error("Confirm Receipt Error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to confirm estimate.";
      return { success: false, message: errorMsg };
    }
  };

  // ── 11. Clear / Cancel / Close ──
  const handleCancelOrClose = (navigateFn: () => void) => {
    if (isCancelMode) {
      setHeaderData({
        estNo: "",
        estDate: new Date().toISOString().split("T")[0],
        salesmanName: "",
        crmId: "",
        phone: "",
        custName: "",
        metalType: "GOLD",
        isConfirmed: false,
      });
      setGridRows([]);
      setEditingRowIndex(null);
      setIsSaveDisabled(true);
      setIsConfirmDisabled(false);
      setIsPrintDisabled(false);
      setIsCancelMode(false);
    } else {
      navigateFn();
    }
  };

  // ── 12. Print Thermal Comparative Report ──
  const handlePrint = () => {
    if (!headerData.estNo || gridRows.length === 0) {
      showValidationMessage("Please pick and load an estimate first to print.", "Print Notice", "warning");
      return;
    }

    const padR = (str: string, len: number) => (str + " ".repeat(len)).substring(0, len);
    const padL = (str: string, len: number) => (" ".repeat(len) + str).slice(-len);

    let matter = "";
    matter += "                      GOLD HEATING DETAILS\n\n";
    matter += `Est No   : ${headerData.estNo}\n`;
    matter += `Date     : ${headerData.estDate}\n`;
    matter += `Salesman : ${headerData.salesmanName}\n`;
    matter += `Cust ID  : ${headerData.crmId}\n`;
    matter += `Name     : ${headerData.custName}\n`;
    matter += `Phone    : ${headerData.phone}\n`;
    matter += `Metal    : ${headerData.metalType}\n`;
    matter += `Status   : ${headerData.isConfirmed ? "CONFIRMED" : "PENDING RECEIPT"}\n\n`;

    const line = "-".repeat(80) + "\n";
    matter += line;
    matter +=
      padR("Description", 14) +
      padL("Qty", 4) +
      padL("GrWt", 8) +
      padL("StWt", 8) +
      padL("NtWt", 8) +
      padL("Rec_GrWt", 12) +
      padL("Rec_StWt", 12) +
      padL("Rec_NtWt", 12) +
      "\n";
    matter += line;

    let totQty = 0;
    let totGrWt = 0;
    let totStWt = 0;
    let totNtWt = 0;
    let totRecGrWt = 0;
    let totRecStWt = 0;
    let totRecNtWt = 0;

    gridRows.forEach((r) => {
      totQty += r.qty;
      totGrWt += r.grossWt;
      totStWt += r.stoneWt;
      totNtWt += r.netWt;
      totRecGrWt += r.recGrossWt;
      totRecStWt += r.recStoneWt;
      totRecNtWt += r.recNetWt;

      matter += `${r.itemCode} - ${r.itemDesc || ""}\n`;
      matter +=
        " ".repeat(14) +
        padL(String(r.qty), 4) +
        padL(r.grossWt.toFixed(3), 8) +
        padL(r.stoneWt.toFixed(3), 8) +
        padL(r.netWt.toFixed(3), 8) +
        padL(r.recGrossWt.toFixed(3), 12) +
        padL(r.recStoneWt.toFixed(3), 12) +
        padL(r.recNetWt.toFixed(3), 12) +
        "\n";

      if (r.recRemarks || r.remarks) {
        matter += `  Remark: ${r.recRemarks || r.remarks}\n`;
      }
      matter += line;
    });

    matter +=
      padR("Total", 14) +
      padL(String(totQty), 4) +
      padL(totGrWt.toFixed(3), 8) +
      padL(totStWt.toFixed(3), 8) +
      padL(totNtWt.toFixed(3), 8) +
      padL(totRecGrWt.toFixed(3), 12) +
      padL(totRecStWt.toFixed(3), 12) +
      padL(totRecNtWt.toFixed(3), 12) +
      "\n";
    matter += line + "\n";

    // Weight loss summary
    const weightLoss = Math.max(0, totGrWt - totRecGrWt);
    matter += `Weight Loss during Heating: ${weightLoss.toFixed(3)} g\n\n`;

    const printWin = window.open("", "_blank", "width=800,height=650");
    if (!printWin) {
      showValidationMessage("Pop-up blocked. Please allow popups for printing.", "Print Blocked", "warning");
      return;
    }

    printWin.document.open();
    printWin.document.write(`
      <html>
        <head>
          <title>Receipt Gold Heating - #${headerData.estNo}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; font-family: monospace; font-size: 12px; }
            }
            body { font-family: monospace; font-size: 13px; white-space: pre; padding: 20px; background: #fff; color: #000; }
          </style>
        </head>
        <body>${matter}</body>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </html>
    `);
    printWin.document.close();
  };

  // Totals calculations
  const totals = {
    totalQty: gridRows.reduce((sum, r) => sum + Number(r.qty), 0),
    totalGrossWt: gridRows.reduce((sum, r) => sum + Number(r.grossWt), 0),
    totalStoneWt: gridRows.reduce((sum, r) => sum + Number(r.stoneWt), 0),
    totalNetWt: gridRows.reduce((sum, r) => sum + Number(r.netWt), 0),
    totalRecGrossWt: gridRows.reduce((sum, r) => sum + Number(r.recGrossWt), 0),
    totalRecStoneWt: gridRows.reduce((sum, r) => sum + Number(r.recStoneWt), 0),
    totalRecNetWt: gridRows.reduce((sum, r) => sum + Number(r.recNetWt), 0),
  };

  return {
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
    buttonStates: {
      isSaveDisabled,
      isConfirmDisabled,
      isPrintDisabled,
      isCancelMode,
    },
    popupState,
    showValidationMessage,
    closeValidationMessage,
    handleSave,
    handleConfirm,
    handlePrint,
    handleCancelOrClose,
    totals,
  };
};
