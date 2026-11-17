import { useState, useEffect, useRef } from "react";
import {
  GoldHeatingHeaderState,
  GoldHeatingRow,
  ActionStatus,
} from "../type/GoldHeatingTypes";
import { getCrmPhoneno, getDefaultShopCode, findCrmByCustId } from "../../../services/ShopAPI";
import DynamicQueryService from "../../../services/DynamicQueryApi";
import { SalesService } from "../../../services/SalesEntryApi";
import { getCurrentShopCode } from "../../../utils/session";
import { useLookup, lookupConfigs } from "../../../components/common/LookupContext";
import GoldHeatingAPI from "../../../services/GoldHeatingApi";

export const useGoldHeatingState = () => {
  const { showLookup } = useLookup();

  // ── 1. Header Form State ──
  const [headerData, setHeaderData] = useState<GoldHeatingHeaderState>({
    estNo: "",
    estDate: new Date().toISOString().split("T")[0],
    salesmanCode: "",
    salesmanName: "",
    crmId: "",
    phone: "",
    custName: "",
    metalType: "GOLD",
    isConfirmed: false,
  });

  // ── 2. Grid Rows State ──
  const [gridRows, setGridRows] = useState<GoldHeatingRow[]>([]);

  // ── 3. Current Row Form Input State ──
  const [currentRow, setCurrentRow] = useState<GoldHeatingRow>({
    slNo: 1,
    itemCode: "",
    itemDesc: "",
    qty: 1,
    grossWt: 0,
    stoneWt: 0,
    netWt: 0,
    remarks: "",
  });

  // ── 4. Estimate Pickup Dialog State ──
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [pickupList, setPickupList] = useState<EstimatePickupItem[]>([]);
  const [isPickupLoading, setIsPickupLoading] = useState(false);
  const [pickupTitle, setPickupTitle] = useState("Select Estimate");
  const [pickupMode, setPickupMode] = useState<"MODIFY" | "DELETE" | "CONFIRM" | "PRINT" | "VIEW">("MODIFY");

  // ── 5. Form Controls & Button States ──
  const [isFormEnabled, setIsFormEnabled] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [actionStatus, setActionStatus] = useState<ActionStatus>("NONE");

  const [isNewDisabled, setIsNewDisabled] = useState(false);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isModifyDisabled, setIsModifyDisabled] = useState(false);
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(false);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
  const [isPrintDisabled, setIsPrintDisabled] = useState(false);
  const [isCancelMode, setIsCancelMode] = useState(false);

  const phoneDebounceRef = useRef<any>(null);

  // Helper to resolve active shop code
  const resolveActiveShopCode = () =>
    String(getCurrentShopCode() || "").trim().toUpperCase();

  // ── Fetch Server Date from goldrate table ──
  const fetchServerDate = async (shopCode: string) => {
    if (!shopCode) return new Date().toISOString().split("T")[0];
    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const res = await DynamicQueryService.fetchList(
        "SELECT today FROM goldrate",
        {},
        auth,
        shopCode
      );
      if (Array.isArray(res?.data) && res.data.length > 0) {
        const todayVal = res.data[0].today || res.data[0].TODAY;
        if (todayVal) return String(todayVal).split("T")[0];
      }
    } catch (err) {
      console.warn("Failed to fetch server date from goldrate", err);
    }
    return new Date().toISOString().split("T")[0];
  };

  // ── Init Shop Code & Date ──
  useEffect(() => {
    const initFrame = async () => {
      const shopCode = resolveActiveShopCode() || (await getDefaultShopCode());
      const serverDate = await fetchServerDate(shopCode);
      setHeaderData((prev) => ({
        ...prev,
        estDate: serverDate,
      }));
    };
    initFrame();
  }, []);

  // ── Auto-calculate Net Weight (grossWt - stoneWt) ──
  const calculateNetWt = (gross: number, stone: number): number => {
    const net = gross - stone;
    return net > 0 ? Number(net.toFixed(3)) : 0;
  };

  // Update current input row fields dynamically
  const updateCurrentRow = (field: keyof GoldHeatingRow, value: any) => {
    setCurrentRow((prev) => {
      let updatedVal = value;
      if (field === "grossWt" || field === "stoneWt" || field === "qty") {
        const num = parseFloat(value);
        updatedVal = isNaN(num) ? 0 : Math.max(0, num);
      }

      const updated = { ...prev, [field]: updatedVal };

      if (field === "grossWt" || field === "stoneWt") {
        const gross = field === "grossWt" ? Number(updatedVal) : prev.grossWt;
        const stone = field === "stoneWt" ? Number(updatedVal) : prev.stoneWt;
        updated.netWt = calculateNetWt(gross, stone);
      }
      return updated;
    });
  };

  // ── 6. CRM Phone Lookup ──
  const handlePhoneChange = (newPhone: string) => {
    setHeaderData((prev) => ({ ...prev, phone: newPhone }));

    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);

    if (newPhone.trim().length === 10) {
      phoneDebounceRef.current = setTimeout(async () => {
        try {
          const shopCode = resolveActiveShopCode();
          const crmRes = await getCrmPhoneno(newPhone.trim(), shopCode);
          if (crmRes && crmRes.custid) {
            setHeaderData((prev) => ({
              ...prev,
              crmId: String(crmRes.custid || crmRes.id || ""),
              custName: String(crmRes.name || crmRes.custname || ""),
            }));
          }
        } catch (err) {
          console.warn("CRM Lookup by phone failed", err);
        }
      }, 400);
    }
  };

  const lastValidatedSalesmanCodeRef = useRef<string>("");

  // ── 7. Salesman Lookup Modal & Validation ──
  const triggerSalesmanLookup = (onSuccess?: () => void) => {
    if (!isFormEnabled) return;
    const shopCode = resolveActiveShopCode();
    showLookup(
      lookupConfigs.salesman((selected: any) => {
        const code = String(selected.salesman_code || selected.smCode || selected.code || "").toUpperCase();
        const name = String(selected.salesman_name || selected.smName || selected.name || "");
        lastValidatedSalesmanCodeRef.current = code;
        setHeaderData((prev) => ({
          ...prev,
          salesmanCode: code,
          salesmanName: name,
        }));
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 50);
      }, shopCode)
    );
  };

  const validateAndSetSalesman = async (input: string, onSuccess?: () => void) => {
    if (!isFormEnabled) return;
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) {
      triggerSalesmanLookup(onSuccess);
      return;
    }

    if (trimmed && trimmed === lastValidatedSalesmanCodeRef.current) {
      if (onSuccess) onSuccess();
      return;
    }

    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const shopCode = resolveActiveShopCode();

      // 1. Fetch salesmen list from API
      let list: any[] = [];
      try {
        const apiRes = await SalesService.getAllSalesmen(shopCode);
        if (Array.isArray(apiRes?.data)) list = apiRes.data;
        else if (Array.isArray(apiRes)) list = apiRes;
      } catch (e) {
        // Fallback query
        const safeInput = trimmed.replace(/'/g, "''");
        const query = `SELECT salesman_code, salesman_name FROM salesmanmaster WHERE salesman_code='${safeInput}' OR UPPER(salesman_name)=UPPER('${safeInput}')`;
        const res = await DynamicQueryService.fetchList(query, {}, auth, shopCode);
        if (Array.isArray(res?.data)) list = res.data;
      }

      // 2. Flexible property matching for salesman code / name
      const match = list.find((s: any) => {
        const code = String(s.salesman_code || s.smcode || s.sm_code || s.code || s.SALESMAN_CODE || "").trim().toUpperCase();
        const name = String(s.salesman_name || s.smname || s.sm_name || s.name || s.SALESMAN_NAME || "").trim().toUpperCase();
        return code === trimmed || name === trimmed;
      });

      if (match) {
        const matchedCode = String(match.salesman_code || match.smcode || match.sm_code || match.code || match.SALESMAN_CODE || trimmed).toUpperCase();
        const matchedName = String(match.salesman_name || match.smname || match.sm_name || match.name || match.SALESMAN_NAME || matchedCode);
        lastValidatedSalesmanCodeRef.current = matchedCode;
        setHeaderData((prev) => ({
          ...prev,
          salesmanCode: matchedCode,
          salesmanName: matchedName,
        }));
        if (onSuccess) onSuccess();
      } else {
        lastValidatedSalesmanCodeRef.current = "";
        setHeaderData((prev) => ({ ...prev, salesmanCode: "", salesmanName: "" }));
        triggerSalesmanLookup(onSuccess);
      }
    } catch (err) {
      console.warn("Salesman validation failed", err);
      lastValidatedSalesmanCodeRef.current = "";
      setHeaderData((prev) => ({ ...prev, salesmanCode: "", salesmanName: "" }));
      triggerSalesmanLookup(onSuccess);
    }
  };

  // ── Customer ID Lookup & Validation ──
  const triggerCustomerLookup = (onSuccess?: () => void) => {
    if (!isFormEnabled) return;
    const shopCode = resolveActiveShopCode();
    showLookup(
      lookupConfigs.customer((selected: any) => {
        setHeaderData((prev) => ({
          ...prev,
          crmId: String(selected.code || selected.crmid || selected.code || ""),
          custName: String(selected.name || selected.custName || ""),
          phone: String(selected.mob || selected.phone || prev.phone),
        }));
        if (onSuccess) onSuccess();
      }, shopCode)
    );
  };

  const validateAndSetCustomer = async (inputCrmId: string, onSuccess?: () => void) => {
    if (!isFormEnabled) return;
    const trimmed = inputCrmId.trim();
    if (!trimmed) {
      if (onSuccess) onSuccess();
      return;
    }

    try {
      const crmRes = await findCrmByCustId(trimmed);
      if (crmRes && (crmRes.custid || crmRes.name || crmRes.code)) {
        setHeaderData((prev) => ({
          ...prev,
          crmId: String(crmRes.custid || crmRes.code || trimmed),
          custName: String(crmRes.name || crmRes.custname || ""),
          phone: String(crmRes.mob || crmRes.phone || prev.phone),
        }));
        if (onSuccess) onSuccess();
      } else {
        setHeaderData((prev) => ({ ...prev, crmId: "", custName: "" }));
        triggerCustomerLookup(onSuccess);
      }
    } catch (err) {
      console.warn("Customer validation failed", err);
      setHeaderData((prev) => ({ ...prev, crmId: "", custName: "" }));
      triggerCustomerLookup(onSuccess);
    }
  };

  const lastValidatedItemCodeRef = useRef<string>("");

  // ── 8. Item Code Lookup Modal & Validation ──
  const triggerItemLookup = (onSuccess?: () => void) => {
    if (!isFormEnabled) return;
    const shopCode = resolveActiveShopCode();
    showLookup(
      lookupConfigs.itemdetails((selected: any) => {
        const code = String(selected.itemCode || selected.item_code || selected.code || "").toUpperCase();
        const desc = String(selected.itemDesc || selected.item_desc || selected.name || "");
        lastValidatedItemCodeRef.current = code;
        setCurrentRow((prev) => ({
          ...prev,
          itemCode: code,
          itemDesc: desc,
        }));
        if (onSuccess) onSuccess();
      }, headerData.metalType || "GOLD", shopCode)
    );
  };

  const validateAndSetItemCode = async (input: string, onSuccess?: () => void) => {
    if (!isFormEnabled) return;
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) {
      triggerItemLookup(onSuccess);
      return;
    }

    if (trimmed === lastValidatedItemCodeRef.current && currentRow.itemDesc) {
      if (onSuccess) onSuccess();
      return;
    }

    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const shopCode = resolveActiveShopCode();
      const metalType = headerData.metalType || "GOLD";
      const safeInput = trimmed.replace(/'/g, "''");
      const query = `SELECT item_code, item_desc FROM itemmaster WHERE (item_code='${safeInput}' OR UPPER(item_desc)=UPPER('${safeInput}')) AND (metal_type='${metalType}' OR metal_type IS NULL OR '${metalType}'='GOLD')`;
      const res = await DynamicQueryService.fetchList(query, {}, auth, shopCode);

      if (Array.isArray(res?.data) && res.data.length > 0) {
        const match = res.data[0];
        const matchedCode = String(match.item_code || match.ITEM_CODE || trimmed).toUpperCase();
        const matchedDesc = String(match.item_desc || match.ITEM_DESC || matchedCode);
        lastValidatedItemCodeRef.current = matchedCode;
        setCurrentRow((prev) => ({
          ...prev,
          itemCode: matchedCode,
          itemDesc: matchedDesc,
        }));
        if (onSuccess) onSuccess();
      } else {
        lastValidatedItemCodeRef.current = "";
        setCurrentRow((prev) => ({ ...prev, itemCode: "", itemDesc: "" }));
        triggerItemLookup(onSuccess);
      }
    } catch (err) {
      console.warn("Item Code validation failed", err);
      lastValidatedItemCodeRef.current = "";
      setCurrentRow((prev) => ({ ...prev, itemCode: "", itemDesc: "" }));
      triggerItemLookup(onSuccess);
    }
  };

  // ── 9. Add or Modify Row with Java Validations ──
  const handleAddRow = (): { success: boolean; message?: string } => {
    if (!headerData.salesmanCode.trim()) {
      return { success: false, message: "Salesman Code is a mandatory field. Please enter or select a valid Salesman Code." };
    }
    if (!currentRow.itemCode.trim()) {
      return { success: false, message: "Please enter an Item Code." };
    }
    if (currentRow.grossWt <= 0) {
      return { success: false, message: "Gross Weight must be greater than 0." };
    }
    if (currentRow.stoneWt < 0) {
      return { success: false, message: "Invalid Stone Weight." };
    }
    if (currentRow.stoneWt > currentRow.grossWt) {
      return { success: false, message: "Stone Weight cannot exceed Gross Weight." };
    }

    if (editingRowIndex !== null) {
      // Modify Existing Row (F4)
      setGridRows((prev) => {
        const copy = [...prev];
        copy[editingRowIndex] = { ...currentRow };
        return copy;
      });
      setEditingRowIndex(null);
    } else {
      // Add New Row
      const newRow: GoldHeatingRow = {
        ...currentRow,
        slNo: gridRows.length + 1,
      };
      setGridRows((prev) => [...prev, newRow]);
    }

    // Reset input row
    setCurrentRow({
      slNo: gridRows.length + 2,
      itemCode: "",
      itemDesc: "",
      qty: 1,
      grossWt: 0,
      stoneWt: 0,
      netWt: 0,
      remarks: "",
    });

    return { success: true };
  };

  // Delete Row (F3)
  const handleDeleteRow = (index: number) => {
    setGridRows((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, slNo: i + 1 }))
    );
  };

  // Edit Row (F4)
  const handleEditRow = (index: number) => {
    setCurrentRow({ ...gridRows[index] });
    setEditingRowIndex(index);
  };

  // ── 10. Fetch Next Estimate Number ──
  const fetchNextEstNo = async () => {
    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const shopCode = resolveActiveShopCode();
      const res = await DynamicQueryService.fetchList(
        "SELECT COALESCE(MAX(estno)+1, 1) AS next_estno FROM gold_heat_mstr",
        {},
        auth,
        shopCode
      );
      if (Array.isArray(res?.data) && res.data.length > 0) {
        return String(res.data[0].next_estno || res.data[0].NEXT_ESTNO || "1");
      }
    } catch (err) {
      console.warn("Failed to fetch next estno", err);
    }
    return "1";
  };

  // ── 11. Fetch Estimates for Pickup Modal ──
  const fetchPickupEstimates = async (title: string, mode: "MODIFY" | "DELETE" | "CONFIRM" | "PRINT" | "VIEW") => {
    setPickupTitle(title);
    setPickupMode(mode);
    setIsPickupOpen(true);
    setIsPickupLoading(true);

    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const shopCode = resolveActiveShopCode() || (await getDefaultShopCode());

      const query = `
        SELECT estno, entry_date, sm_code, cust_id, cust_name, phone, iss_flag, rec_flag, gld_slv 
        FROM gold_heat_mstr 
        GROUP BY estno, entry_date, sm_code, cust_id, cust_name, phone, iss_flag, rec_flag, gld_slv 
        ORDER BY estno ASC
      `;

      const res = await DynamicQueryService.fetchList(query, {}, auth, shopCode);
      if (Array.isArray(res?.data)) {
        const mapped: EstimatePickupItem[] = res.data.map((item: any) => ({
          estno: item.estno || item.ESTNO,
          entry_date: item.entry_date || item.ENTRYDATE,
          sm_code: item.sm_code || item.SM_CODE || "",
          cust_id: item.cust_id || item.CUST_ID || "",
          cust_name: item.cust_name || item.CUST_NAME || "",
          phone: item.phone || item.PHONE || "",
          iss_flag: Boolean(item.iss_flag === true || item.ISS_FLAG === true || item.iss_flag === "true" || item.iss_flag === 1),
          rec_flag: Boolean(item.rec_flag === true || item.REC_FLAG === true || item.rec_flag === "true" || item.rec_flag === 1),
          gld_slv: item.gld_slv || item.GLD_SLV || "G",
        }));
        setPickupList(mapped);
      } else {
        setPickupList([]);
      }
    } catch (err) {
      console.warn("Failed to fetch pickup estimates", err);
      setPickupList([]);
    } finally {
      setIsPickupLoading(false);
    }
  };

  // ── 12. Load Estimate Details (setDatas in Java) ──
  const loadEstimateDetails = async (selectedEstNo: string | number): Promise<boolean> => {
    if (!selectedEstNo) return false;
    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const shopCode = resolveActiveShopCode() || (await getDefaultShopCode());

      const query = `SELECT * FROM gold_heat_mstr WHERE estno = ${Number(selectedEstNo)} ORDER BY row_id ASC`;
      const res = await DynamicQueryService.fetchList(query, {}, auth, shopCode);

      if (Array.isArray(res?.data) && res.data.length > 0) {
        const rows = res.data;
        const first = rows[0];

        const isIssConfirmed = Boolean(
          first.iss_flag === true ||
          first.ISS_FLAG === true ||
          first.iss_flag === "true" ||
          first.iss_flag === 1
        );

        const metalTypeVal = (first.gld_slv || first.GLD_SLV || "G").toUpperCase() === "S" ? "SILVER" : "GOLD";

        setHeaderData({
          estNo: String(first.estno || first.ESTNO || selectedEstNo),
          estDate: String(first.entryDate || first.entry_date || first.ENTRYDATE || "").split("T")[0],
          salesmanCode: String(first.smCode || first.sm_code || first.SMCODE || ""),
          salesmanName: String(first.smName || first.sm_name || first.SM_NAME || ""),
          crmId: String(first.custId || first.cust_id || first.CUST_ID || ""),
          phone: String(first.phone || first.PHONE || ""),
          custName: String(first.custName || first.cust_name || first.CUST_NAME || ""),
          metalType: metalTypeVal,
          isConfirmed: isIssConfirmed,
        });

        lastValidatedSalesmanCodeRef.current = String(first.smCode || first.sm_code || first.SMCODE || "").toUpperCase();

        const mappedRows: GoldHeatingRow[] = rows.map((r: any, idx: number) => ({
          slNo: Number(r.rowId || r.row_id || r.ROW_ID || idx + 1),
          itemCode: String(r.itemCode || r.item_code || r.ITEMCODE || ""),
          itemDesc: String(r.itemCode || r.item_code || r.ITEMCODE || ""),
          qty: Number(r.qty || r.QTY || 1),
          grossWt: Number(r.grwt || r.GRWT || 0),
          stoneWt: Number(r.stwt || r.STWT || 0),
          netWt: Number(r.ntwt || r.NTWT || 0),
          remarks: String(r.remark || r.REMARK || ""),
        }));

        setGridRows(mappedRows);
        return true;
      }
    } catch (err) {
      console.error("Failed to load estimate details:", err);
    }
    return false;
  };

  // ── 13. Action Handlers (New, Save, Modify, Delete, Confirm, Print) ──
  const handleNew = async () => {
    const nextEstNo = await fetchNextEstNo();
    const shopCode = resolveActiveShopCode() || (await getDefaultShopCode());
    const serverDate = await fetchServerDate(shopCode);

    setHeaderData({
      estNo: nextEstNo,
      estDate: serverDate,
      salesmanCode: "",
      salesmanName: "",
      crmId: "",
      phone: "",
      custName: "",
      metalType: "GOLD",
      isConfirmed: false,
    });
    setGridRows([]);
    setCurrentRow({
      slNo: 1,
      itemCode: "",
      itemDesc: "",
      qty: 1,
      grossWt: 0,
      stoneWt: 0,
      netWt: 0,
      remarks: "",
    });
    setIsFormEnabled(true);
    setIsNewDisabled(true);
    setIsSaveDisabled(false);
    setIsModifyDisabled(true);
    setIsConfirmDisabled(true);
    setIsDeleteDisabled(true);
    setIsPrintDisabled(true);
    setIsCancelMode(true);
    setActionStatus("NEW");
  };

  const handleCancelOrClose = (navigateFn: () => void) => {
    if (isCancelMode) {
      setIsFormEnabled(false);
      setIsNewDisabled(false);
      setIsSaveDisabled(true);
      setIsModifyDisabled(false);
      setIsConfirmDisabled(false);
      setIsDeleteDisabled(false);
      setIsPrintDisabled(false);
      setIsCancelMode(false);
      setActionStatus("NONE");
      setHeaderData({
        estNo: "",
        estDate: new Date().toISOString().split("T")[0],
        salesmanCode: "",
        salesmanName: "",
        crmId: "",
        phone: "",
        custName: "",
        metalType: "GOLD",
        isConfirmed: false,
      });
      setCurrentRow({
        slNo: 1,
        itemCode: "",
        itemDesc: "",
        qty: 1,
        grossWt: 0,
        stoneWt: 0,
        netWt: 0,
        remarks: "",
      });
      setGridRows([]);
      setEditingRowIndex(null);
    } else {
      navigateFn();
    }
  };

  // ── Save (Handles both NEW and MODIFY via delete + addHeating) ──
  const handleSave = async (): Promise<{ success: boolean; message: string }> => {
    if (!headerData.salesmanCode.trim()) {
      return { success: false, message: "Please Select a Salesman." };
    }

    let itemsToSave = [...gridRows];
    if (editingRowIndex !== null && currentRow.itemCode.trim() && currentRow.grossWt > 0) {
      itemsToSave[editingRowIndex] = { ...currentRow };
    } else if (currentRow.itemCode.trim() && currentRow.grossWt > 0 && itemsToSave.length === 0) {
      itemsToSave.push({ ...currentRow, slNo: 1 });
    }

    if (itemsToSave.length === 0) {
      return { success: false, message: "No Item Details Found." };
    }

    try {
      const shopCode = resolveActiveShopCode();
      const userStr = sessionStorage.getItem("currentUser");
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userId = currentUser?.userid ?? currentUser?.user_id ?? currentUser?.id ?? currentUser?.userId ?? 0;
      const estNoVal = Number(headerData.estNo);
      const api = GoldHeatingAPI(shopCode);

      // 1. Delete existing records for this estimate (exact match with Java Swing insertToDB)
      try {
        await api.deleteHeating(estNoVal);
      } catch (e) {
        // If estimate is new, ignore 404
      }

      // 2. Insert updated line items via POST /heating/add
      const goldSlv = headerData.metalType === "SILVER" ? "S" : "G";

      for (let i = 0; i < itemsToSave.length; i++) {
        const row = itemsToSave[i];
        const payload = {
          estno: estNoVal,
          rowId: i + 1,
          entryDate: headerData.estDate,
          smCode: headerData.salesmanCode,
          smName: headerData.salesmanName,
          gldSlv: goldSlv,
          custId: headerData.crmId || "",
          custName: headerData.custName || "",
          phone: headerData.phone || "",
          itemCode: row.itemCode,
          qty: Number(row.qty || 1),
          grwt: Number(row.grossWt || 0),
          stwt: Number(row.stoneWt || 0),
          ntwt: Number(row.netWt || 0),
          remark: row.remarks || "",
          recGrwt: 0,
          recStwt: Number(row.stoneWt || 0),
          recNtwt: 0,
          recRemark: "",
          recFlag: false,
          issFlag: false,
          userId: userId,
          shopCode: shopCode,
        };
        await api.addHeating(payload);
      }

      setIsFormEnabled(false);
      setIsNewDisabled(false);
      setIsSaveDisabled(true);
      setIsModifyDisabled(false);
      setIsConfirmDisabled(false);
      setIsDeleteDisabled(false);
      setIsPrintDisabled(false);
      setIsCancelMode(false);
      setActionStatus("NONE");
      setEditingRowIndex(null);
      lastValidatedSalesmanCodeRef.current = "";
      lastValidatedItemCodeRef.current = "";

      return {
        success: true,
        message: `Gold Heating Record (Est No: ${estNoVal}) Saved Successfully!`,
      };
    } catch (err: any) {
      console.error("Save Heating Error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Unable To Save.";
      return { success: false, message: errorMsg };
    }
  };

  // ── Print Report (Thermal / Matrix) ──
  const handlePrint = (customEstNo?: string | number) => {
    const targetEstNo = customEstNo || headerData.estNo;
    if (!targetEstNo || gridRows.length === 0) {
      return { success: false, message: "Please select an Estimate to print." };
    }

    const padR = (str: string, len: number) => (str + " ".repeat(len)).substring(0, len);
    const padL = (str: string, len: number) => (" ".repeat(len) + str).slice(-len);

    let matter = "";
    matter += "                 GOLD HEATING DETAILS\n\n";
    matter += `Est No   : ${targetEstNo}\n`;
    matter += `Date     : ${headerData.estDate}\n`;
    matter += `Salesman : ${headerData.salesmanName || headerData.salesmanCode}\n`;
    matter += `Cust ID  : ${headerData.crmId || "-"}\n`;
    matter += `Name     : ${headerData.custName || "-"}\n`;
    matter += `Phone    : ${headerData.phone || "-"}\n\n`;

    const line = "-".repeat(50) + "\n";
    matter += line;
    matter +=
      padR("Description", 14) +
      padL("Qty", 5) +
      padL("GrWt", 10) +
      padL("StWt", 10) +
      padL("NtWt", 10) +
      "\n";
    matter += line;

    let totQty = 0;
    let totGrWt = 0;
    let totStWt = 0;
    let totNtWt = 0;

    gridRows.forEach((r) => {
      totQty += r.qty;
      totGrWt += r.grossWt;
      totStWt += r.stoneWt;
      totNtWt += r.netWt;

      matter += `${r.itemCode} ${r.itemDesc ? "- " + r.itemDesc : ""}\n`;
      matter +=
        " ".repeat(14) +
        padL(String(r.qty), 5) +
        padL(r.grossWt.toFixed(3), 10) +
        padL(r.stoneWt.toFixed(3), 10) +
        padL(r.netWt.toFixed(3), 10) +
        "\n";

      if (r.remarks) {
        matter += `  Remark: ${r.remarks}\n`;
      }
      matter += line;
    });

    matter +=
      padR("Total", 14) +
      padL(String(totQty), 5) +
      padL(totGrWt.toFixed(3), 10) +
      padL(totStWt.toFixed(3), 10) +
      padL(totNtWt.toFixed(3), 10) +
      "\n";
    matter += line;

    const printWin = window.open("", "_blank", "width=700,height=600");
    if (!printWin) {
      return { success: false, message: "Pop-up blocked. Please allow popups for printing." };
    }

    printWin.document.open();
    printWin.document.write(`
      <html>
        <head>
          <title>Gold Heating Details - #${targetEstNo}</title>
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

    return { success: true, message: "Print dialog opened." };
  };

  // Totals Summary
  const totalQty = gridRows.reduce((sum, r) => sum + Number(r.qty), 0);
  const totalGrossWt = gridRows.reduce((sum, r) => sum + Number(r.grossWt), 0);
  const totalStoneWt = gridRows.reduce((sum, r) => sum + Number(r.stoneWt), 0);
  const totalNetWt = gridRows.reduce((sum, r) => sum + Number(r.netWt), 0);

  return {
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
    buttonStates: {
      isNewDisabled,
      setIsNewDisabled,
      isSaveDisabled,
      setIsSaveDisabled,
      isModifyDisabled,
      setIsModifyDisabled,
      isConfirmDisabled,
      setIsConfirmDisabled,
      isDeleteDisabled,
      setIsDeleteDisabled,
      isPrintDisabled,
      setIsPrintDisabled,
      isCancelMode,
      setIsCancelMode,
    },
    actionStatus,
    setActionStatus,
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
    totals: { totalQty, totalGrossWt, totalStoneWt, totalNetWt },
  };
};