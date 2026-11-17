import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CreditCard, Search, Plus, Trash2, Save, X, 
  Calendar, User, Receipt, History, Calculator
} from "lucide-react";
import ModulePageLayout from "../../layout/ModulePageLayout";
import MessagePopup from "../../common/MessagePopup";
import { fmtWt, fmtAmt, limitDecimals } from "../../../utils/format";
import { getCurrentShopCode } from "../../../utils/session";
import DynamicQueryService from "../../../services/DynamicQueryApi";
import { tableTypography } from "../../../utils/tableTypography";

const hasExistingCrnReference = (item) =>
  [item.alreadyReturnedEst, item.invoiceNo].some(
    (value) => value !== null && value !== undefined && String(value).trim() !== ""
  );

const CreditSales = ({ 
  isEmbedded = false, 
  isFormEnabled: externalFormEnabled = false,
  initialData = {}, 
  externalGrid, 
  setExternalGrid,
  onCustomerUpdate,
  goldSlv = "GOLD",  // "GOLD" or "SILVER" — passed from parent SalesEntry
}) => {
  const navigate = useNavigate();
  const saleBillRef = React.useRef(null);
  const pendingBillContinuationRef = React.useRef(null);
  const pendingCustomerMismatchRef = React.useRef(false);
  const originalBillCustomerRef = React.useRef(null);
  const isFetchingOriginalBillRef = React.useRef(false);
  const selectedCustomerRef = React.useRef(initialData || {});
  const {
    custId: initialCustId,
    custName: initialCustName,
    address1: initialAddress1,
    pin: initialPin,
    phone: initialPhone,
  } = initialData || {};
  
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
  const username = currentUser.username || "";
  const password = currentUser.password || "";
  const shopCode = getCurrentShopCode() || "";

  const runRawQuery = useCallback(
    (sql, params = {}, year = null) =>
      DynamicQueryService.fetchList(
        sql,
        params,
        { username, password },
        shopCode,
        year
      ),
    [username, password, shopCode]
  );
  
  const [message, setMessage] = useState(null);
  const [localFormEnabled, setLocalFormEnabled] = useState(false);
  const isFormEnabled = isEmbedded ? externalFormEnabled : localFormEnabled;
  const setIsFormEnabled = isEmbedded ? () => {} : setLocalFormEnabled;
  
  useEffect(() => {
    if (isEmbedded && isFormEnabled && saleBillRef.current) {
      setTimeout(() => saleBillRef.current?.focus(), 100);
    }
  }, [isEmbedded, isFormEnabled]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [clickedRowIndex, setClickedRowIndex] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [originalBillInvoiceNo, setOriginalBillInvoiceNo] = useState("");

  // --- Header States ---
  const [headerData, setHeaderData] = useState({
    billNo: "New",
    billDate: new Date().toISOString().split("T")[0],
    shopCode: getCurrentShopCode() || "",
    custId: "",
    custName: "",
    gstPer: "3.00",
    igstPer: "0.00",
    applyIgst: false,
    originalSaleBill: "",
    finYear: "2026",
    saleDate: new Date().toISOString().split("T")[0],
  });

  // --- Complete Transaction Grid Architecture ---
  const transactionEmpty = {
    itemCode: "", itemDesc: "", cntr: "", qty: "1",
    grossWt: "0.000", stoneWt: "0.000", netWt: "0.000",
    vaPer: "0.00", vaAmt: "0.00", stnChg: "0.00", goldAmt: "0.00",
    taxableAmt: "0.00", taxAmt: "0.00", rowTotal: "0.00",
    sman: "", sBillNo: "", sDate: "", slno: 1, trSlno: "", barcode: "",
    // The Missing Headers added here:
    aVa: "0.00", aVaAmt: "0.00", aStnch: "0.00", 
    invoiceNo: "", finYearRow: "2026", stnCost: "0.00", purCost: "0.00"
  };
  const [internalGrid, setInternalGrid] = useState([]);
  const transactionGrid = externalGrid || internalGrid;
  const setTransactionGrid = setExternalGrid || setInternalGrid;

  // Sync header saleDate with sDate from transaction grid (for Modify Mode & Fetched Bills)
  useEffect(() => {
    if (transactionGrid && transactionGrid.length > 0) {
      const rowDate = transactionGrid[0].sDate;
      if (rowDate) {
        const formattedDate = String(rowDate).split("T")[0];
        setHeaderData((prev) => {
          if (prev.saleDate !== formattedDate) {
            return { ...prev, saleDate: formattedDate };
          }
          return prev;
        });
      }
    }
  }, [transactionGrid]);

  // Sync with initialData if provided (for embedded mode)
  useEffect(() => {
    if (!isEmbedded) return;

    const updatedCustomer = { ...selectedCustomerRef.current };
    [
      ["custId", initialCustId],
      ["custName", initialCustName],
      ["address1", initialAddress1],
      ["pin", initialPin],
      ["phone", initialPhone],
    ].forEach(([field, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        updatedCustomer[field] = value;
      }
    });
    selectedCustomerRef.current = updatedCustomer;

    if (initialCustId || initialCustName) {
      setHeaderData(prev => ({
        ...prev,
        custId: initialCustId || prev.custId,
        custName: initialCustName || prev.custName
      }));
    }
  }, [
    isEmbedded,
    initialCustId,
    initialCustName,
    initialAddress1,
    initialPin,
    initialPhone,
  ]);



  const handleMessage = (text, type = "info") => setMessage({ text, type, open: true });

  const performCreditNoteCheck = async (row) => {
    // Rule 1: No Diamond Items
    const dmdSql = `select item_code from itemmaster where item_code='${row.itemCode}' and counter in(select code from countermaster where dmd_flag='true')`;
    const dmdRes = await runRawQuery(dmdSql);
    if (dmdRes.data && dmdRes.data.length > 0) {
      handleMessage("Cannot Modify Data, Diamond Item Not Allowed", "error");
      return false;
    }

    // Rule 2: No Barcode Items (Default is "0000000000" or similar)
    if (row.barcode && row.barcode !== "0000000000" && row.barcode !== "0" && String(row.barcode).trim() !== "") {
      handleMessage("Cannot Modify Data, Barcode Item", "error");
      return false;
    }

    // Rule 3: Quantity Check (must be > 1 as per your code)
    if (Number(row.qty) <= 1) {
      handleMessage("Cannot Modify Data, Please Check Quantity", "error");
      return false;
    }

    return true;
  };

  const handleRowAction = async (index) => {
    const row = transactionGrid[index];
    
    // Perform checking BEFORE opening the action modal
    const canEdit = await performCreditNoteCheck(row);
    if (!canEdit) return;

    setClickedRowIndex(index);
    setIsActionModalOpen(true);
  };


  const handleDeleteRow = () => {
    if (clickedRowIndex !== null) {
      const newGrid = transactionGrid.filter((_, i) => i !== clickedRowIndex);
      setTransactionGrid(newGrid);
      setIsActionModalOpen(false);
      setClickedRowIndex(null);
    }
  };

  // Keyboard shortcut for modal: ESCAPE to Select All
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        const selectableItems = billItems.filter(item => !hasExistingCrnReference(item));
        if (selectableItems.length === 0) return;

        const allSelected = selectableItems.every(item => item.selected);
        const newItems = billItems.map(item => ({
          ...item,
          selected: hasExistingCrnReference(item) ? false : !allSelected
        }));
        setBillItems(newItems);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, billItems]);

  const handleCancel = () => {
    setIsFormEnabled(false);
    setHeaderData({
      billNo: "New",
      billDate: new Date().toISOString().split("T")[0],
      shopCode: getCurrentShopCode() || "",
      custId: "",
      custName: "",
      gstPer: "3.00",
      igstPer: "0.00",
      applyIgst: false,
      originalSaleBill: "",
      finYear: "2026",
      saleDate: new Date().toISOString().split("T")[0],
    });
    setTransactionGrid([]);
    setBillItems([]);
    setOriginalBillInvoiceNo("");
    setIsModalOpen(false);
  };

  const calculateRow = (row) => {
    const gold = Number(row.goldAmt || 0);
    const va = Number(row.vaAmt || 0);
    const stone = Number(row.stnChg || 0);
    const taxable = gold + va + stone;
    const taxRate = headerData.applyIgst ? Number(headerData.igstPer) : Number(headerData.gstPer);
    const taxAmt = (taxable * taxRate) / 100;
    return {
      ...row,
      netWt: fmtWt(Number(row.grossWt) - Number(row.stoneWt)),
      taxableAmt: fmtAmt(taxable),
      taxAmt: fmtAmt(taxAmt),
      rowTotal: fmtAmt(taxable + taxAmt)
    };
  };



  const handleMessageClose = () => {
    setMessage(null);
    const continuation = pendingBillContinuationRef.current;
    pendingBillContinuationRef.current = null;
    if (continuation) void continuation();
  };

  const fetchOriginalBill = async () => {
    if (!headerData.finYear) return handleMessage("Please Choose The Year", "error");
    const billNo = String(headerData.originalSaleBill ?? "").trim();
    if (!billNo) return handleMessage("Please enter a Sale Bill No", "error");
    if (!/^\d+$/.test(billNo)) return handleMessage("Invalid Bill No", "error");
    if (isFetchingOriginalBillRef.current) return;

    const companyYear = sessionStorage.getItem("companyYear") || "2026";
    const isSameYear = String(headerData.finYear).trim() === String(companyYear).trim();
    const queryYear = isSameYear ? null : headerData.finYear;
    isFetchingOriginalBillRef.current = true;
    pendingCustomerMismatchRef.current = false;
    originalBillCustomerRef.current = null;

    try {
      // Clear old items if we are fetching a new bill
      setTransactionGrid([]); 
      setBillItems([]);
      const checkSql = `Select count(*) as cnt from sbilltran where bill_no=${billNo}`;
      const checkRes = await runRawQuery(checkSql, {}, queryYear);
      const count = checkRes.data?.[0]?.cnt || checkRes.data?.[0]?.CNT || 0;

      if (Number(count) === 0) {
        isFetchingOriginalBillRef.current = false;
        return handleMessage("Invalid Bill No", "error");
      }

      const masterSql = `
        SELECT
          bill_no,
          custid,
          est_cunm,
          est_add1,
          est_add2,
          est_add3,
          est_pin,
          est_phone,
          est_dte,
          invoiceno,
          gold_slv
        FROM sbillmstr
        WHERE bill_no = ${billNo}
      `;
      const masterRes = await runRawQuery(masterSql, {}, queryYear);
      const masterData = masterRes.data?.[0] || {};
      setOriginalBillInvoiceNo(masterData.invoiceno ?? masterData.INVOICENO ?? "");

      const originalCustomerName = String(masterData.est_cunm ?? masterData.EST_CUNM ?? "").trim();
      const originalAddress1 = String(masterData.est_add1 ?? masterData.EST_ADD1 ?? "").trim();
      const originalPin = String(masterData.est_pin ?? masterData.EST_PIN ?? "").trim();
      const originalPhone = String(masterData.est_phone ?? masterData.EST_PHONE ?? "").trim();
      const originalCustomer = {
        custId: masterData.custid ?? masterData.CUSTID ?? "",
        custName: masterData.est_cunm ?? masterData.EST_CUNM ?? "",
        address1: masterData.est_add1 ?? masterData.EST_ADD1 ?? "",
        pin: masterData.est_pin ?? masterData.EST_PIN ?? "",
        phone: masterData.est_phone ?? masterData.EST_PHONE ?? "",
      };
      const selectedCustomer = {
        ...selectedCustomerRef.current,
        ...Object.fromEntries(
          ["custName", "address1", "pin", "phone"]
            .filter((field) => {
              const value = initialData?.[field];
              return value !== undefined && value !== null && String(value).trim() !== "";
            })
            .map((field) => [field, initialData[field]])
        ),
      };
      const selectedCustomerName = String(selectedCustomer.custName ?? "").trim();
      const selectedAddress1 = String(selectedCustomer.address1 ?? "").trim();
      const selectedPin = String(selectedCustomer.pin ?? "").trim();
      const selectedPhone = String(selectedCustomer.phone ?? "").trim();
      const isCustomerDifferent =
        originalCustomerName.toUpperCase() !== selectedCustomerName.toUpperCase() ||
        originalAddress1.toUpperCase() !== selectedAddress1.toUpperCase() ||
        originalPin !== selectedPin ||
        originalPhone !== selectedPhone;
      pendingCustomerMismatchRef.current = isCustomerDifferent;
      originalBillCustomerRef.current = originalCustomer;

      const continueFetchingBill = async () => {
        try {
          // Match Java logic: fetch items from sbilltran with a check for existing returns in crnest
          const sql = `
            SELECT s.*,
              (SELECT DISTINCT est_no FROM crnest c
               WHERE c.esttrslno = s.it_slno
               AND c.estsinvoiceno = (SELECT invoiceno FROM sbillmstr m WHERE m.bill_no = s.bill_no)
              ) as already_returned_est
            FROM sbilltran s
            WHERE s.bill_no=${billNo}
            ORDER BY s.it_slno
          `;
          const response = await runRawQuery(sql, {}, queryYear);

      // --- Metal Type Validation ---
      const billGoldSlv = masterData.gold_slv || masterData.GOLD_SLV || "";
      const billMetalType = String(billGoldSlv).trim().toUpperCase() === "S" ? "SILVER" : "GOLD";
      const sessionMetalType = String(goldSlv || "GOLD").trim().toUpperCase();
      if (billMetalType !== sessionMetalType) {
        return handleMessage(
          `Bill No ${headerData.originalSaleBill} is a ${billMetalType} bill. Cannot use it in a ${sessionMetalType} Credit Note.`,
          "error"
        );
      }

      // Format and update header Sale Date from fetched sale bill date (est_dte)
      const rawSaleDte = masterData.est_dte || masterData.EST_DTE || masterData.est_date || masterData.bill_date || masterData.billdate || "";
      if (rawSaleDte) {
        const formattedSaleDate = String(rawSaleDte).split("T")[0];
        setHeaderData((prev) => ({
          ...prev,
          saleDate: formattedSaleDate,
        }));
      }

      if (response.data && response.data.length > 0) {
        const mappedItems = response.data.map((item, idx) => {
          // Helper to find value regardless of common name variations
          const getVal = (prefixes) => {
            for (let p of prefixes) {
              if (item[p] !== undefined && item[p] !== null) return item[p];
              if (item[p.toUpperCase()] !== undefined && item[p.toUpperCase()] !== null) return item[p.toUpperCase()];
            }
            return 0;
          };

          const vamt = Number(getVal(["est_vamt", "vamt", "v_amt"]));
          const stnch = Number(getVal(["est_stnch", "stnch", "stn_chg"]));
          const tamt = Number(getVal(["est_tamt", "tamt", "total_amt"]));
          const gstamt = Number(getVal(["est_gstamt", "gstamt", "gst_amt"]));
          const igstamt = Number(getVal(["est_igstamt", "igstamt", "igst_amt"]));
          const othtax = Number(getVal(["est_othtaxamt", "othtaxamt", "oth_tax"]));

          return {
            slno: idx + 1,
            itemCode: getVal(["est_icode", "icode", "item_code"]),
            itemDesc: getVal(["est_itdesc", "itdesc", "item_desc"]),
            cntr: getVal(["est_cntr", "cntr", "counter"]),
            qty: Number(getVal(["est_qty", "qty", "quantity"])),
            grossWt: getVal(["est_wt", "wt", "gross_wt", "estwt"]),
            stoneWt: getVal(["est_stnwt", "stnwt", "stone_wt", "stn_wt", "eststnwt"]),
            netWt: getVal(["est_ntwt", "ntwt", "net_wt", "estntwt"]),
            vaPer: getVal(["est_vaper", "vaper", "va_per", "va_percent", "estvaper"]),
            vaAmt: vamt,
            stnChg: getVal(["est_stnch", "stnch", "stn_chg", "eststnch"]),
            // Java Calculation: v.add(fun.customFormat("####0.00", (rs.getDouble("est_tamt") - rs.getDouble("est_vamt") - rs.getDouble("est_stnch"))));
            goldAmt: tamt - vamt - stnch,
            taxableAmt: tamt,
            amount: tamt,
            // Java Calculation: v.add(fun.customFormat("####0.00", (rs.getDouble("est_gstamt") + rs.getDouble("est_igstamt") + rs.getDouble("est_othtaxamt"))));
            taxAmt: gstamt + igstamt + othtax,
            total: item.totalamount || 0,
            sman: item.sm || "", // Java: v.add(rs.getString("sm"));
            sBillNo: headerData.originalSaleBill,
            sDate: masterData.est_dte || "",
            barcode: item.est_barcode || "",
            trSlno: item.it_slno || "",
            aVa: item.afterva || 0,
            aVaAmt: item.aftervaamt || 0,
            aStnch: item.actual_stnch || 0,
            invoiceNo: getVal(["crn_invoiceno"]),
            finYearRow: headerData.finYear,
            stnCost: item.stonecost || 0,
            purCost: item.purcost || 0,
            alreadyReturnedEst: item.already_returned_est ?? item.ALREADY_RETURNED_EST ?? "",
            selected: false,
            mode: isSameYear ? "SAME_YEAR" : "DIFF_YEAR"
          };
        });
        setBillItems(mappedItems);
        setIsModalOpen(true);
      } else {
        handleMessage("No items found for this bill", "warning");
      }
        } catch (err) {
          console.error("Fetch failed", err);
          handleMessage("Error fetching bill data", "error");
        } finally {
          isFetchingOriginalBillRef.current = false;
        }
      };

      await continueFetchingBill();
    } catch (err) {
      console.error("Fetch failed", err);
      handleMessage("Error fetching bill data", "error");
      isFetchingOriginalBillRef.current = false;
    }
  };

  const handleAddSelectedItems = () => {
    const selected = billItems.filter(i => i.selected);
    if (selected.length === 0) return handleMessage("Please select at least one item", "warning");

    const addSelectedItems = () => {
    const newGridRows = selected.map(item => ({
      ...transactionEmpty,
      itemCode: item.itemCode,
      itemDesc: item.itemDesc,
      cntr: item.cntr,
      qty: item.qty,
      grossWt: fmtWt(item.grossWt),
      stoneWt: fmtWt(item.stoneWt),
      netWt: fmtWt(item.netWt),
      vaPer: fmtAmt(item.vaPer),
      vaAmt: fmtAmt(item.vaAmt),
      stnChg: fmtAmt(item.stnChg),
      goldAmt: fmtAmt(item.goldAmt),
      taxableAmt: fmtAmt(item.taxableAmt),
      taxAmt: fmtAmt(item.taxAmt),
      amount: fmtAmt(item.total),
      rowTotal: fmtAmt(item.total),
      sman: item.sman,
      sBillNo: item.sBillNo,
      sDate: item.sDate,
      barcode: item.barcode,
      trSlno: item.trSlno,
      aVa: fmtAmt(item.aVa),
      aVaAmt: fmtAmt(item.aVaAmt),
      aStnch: fmtAmt(item.aStnch),
      invoiceNo: item.invoiceNo,
      finYearRow: item.finYearRow,
      stnCost: fmtAmt(item.stnCost),
      purCost: fmtAmt(item.purCost)
    }));
    
    if (selected.length > 0 && selected[0].sDate) {
      const formattedDate = String(selected[0].sDate).split("T")[0];
      setHeaderData(prev => ({
        ...prev,
        saleDate: formattedDate
      }));
    }

    setTransactionGrid([...transactionGrid, ...newGridRows]);
    setIsModalOpen(false);
    };

    if (pendingCustomerMismatchRef.current) {
      pendingBillContinuationRef.current = () => {
        const originalCustomer = originalBillCustomerRef.current;
        if (originalCustomer) {
          selectedCustomerRef.current = originalCustomer;
          onCustomerUpdate?.(originalCustomer);
        }
        pendingCustomerMismatchRef.current = false;
        originalBillCustomerRef.current = null;
        addSelectedItems();
      };
      handleMessage(
        "The original sale bill customer details differ from the selected customer. Click OK to continue.",
        "warning"
      );
      return;
    }

    addSelectedItems();
  };



  const columnWidths = [
    "72px",   // Item
    "180px",  // Item Desc
    "50px",   // Cntr
    "40px",   // Qty
    "68px",   // Gross Wt.
    "68px",   // Stone Wt.
    "68px",   // Net Wt.
    "72px",   // VA(%)
    "92px",   // VA Amt
    "92px",   // Stn. Chg
    "98px",   // Gold Amt
    "98px",   // Amount
    "92px",   // Tax.Amt
    "108px",  // Total
    "72px",   // SMan
    "52px",   // SBill No
    "98px",   // SDate
    "50px",   // Slno
    "52px",   // Tr.Slno
    "110px",  // Barcode
    "80px",   // A.VA
    "72px",   // A.VA.Amt
    "92px",   // A.Stnch
    "150px",  // Invoice.No
    "72px",   // Fin.Year
    "92px",   // Stn.Cost
    "92px"    // Pur.Cost
  ];

  const renderContent = () => (
    <div className={`w-full space-y-3 animate-fade-in-up ${isEmbedded ? '' : 'pb-20'}`}>

      {!isEmbedded && (
        <div className="flex items-center justify-between p-3 glass-card rounded-xl shadow-xl border-b-2 border-purple-500 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Credit Note No: {headerData.billNo}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {!isFormEnabled ? (
              <button onClick={() => { setIsFormEnabled(true); setTimeout(() => saleBillRef.current?.focus(), 100); }} className="px-4 py-1.5 bg-purple-600 text-white rounded-lg font-bold text-[10px] uppercase hover:bg-purple-500 transition-all shadow-md active:scale-95 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleCancel} className="btn-secondary py-1.5 text-slate-500 text-[10px] uppercase"><X className="w-3.5 h-3.5" /> Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="glass-card p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/50">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1">Sale Bill.No</label>
            <div className="flex items-center gap-1">
              <input ref={saleBillRef} disabled={!isFormEnabled} className={`w-20 h-7 bg-[#eef5f0] dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded px-2 text-xs font-bold focus:ring-1 focus:ring-purple-500 outline-none shadow-inner text-center ${!isFormEnabled ? 'opacity-50 cursor-not-allowed' : ''}`} value={headerData.originalSaleBill} onChange={e => setHeaderData({...headerData, originalSaleBill: e.target.value})} onKeyDown={e => e.key === 'Enter' && fetchOriginalBill()} />
              <button disabled={!isFormEnabled} onClick={fetchOriginalBill} className={`h-7 px-3 bg-slate-800 text-white text-[10px] font-bold rounded hover:bg-slate-700 transition-all active:scale-95 shadow-sm uppercase ${!isFormEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}>OK</button>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto pl-4 border-l border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Fin.Year :</label>
              <select disabled={!isFormEnabled} className={`h-7 bg-[#eef5f0] dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded px-2 text-xs font-bold focus:ring-1 focus:ring-purple-500 outline-none shadow-sm ${!isFormEnabled ? 'opacity-50' : ''}`} value={headerData.finYear} onChange={e => setHeaderData({...headerData, finYear: e.target.value})}>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase whitespace-nowrap">Sale Date :</label>
              <input type="date" disabled={true} className="h-7 bg-[#eef5f0] dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded px-2 text-xs font-bold focus:ring-1 focus:ring-purple-500 outline-none shadow-sm opacity-60 cursor-not-allowed" value={headerData.saleDate} onChange={e => setHeaderData({...headerData, saleDate: e.target.value})} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-300 dark:border-slate-700">
          <table className="w-full text-sm border-collapse min-w-[2390px]">
            <colgroup>
              {columnWidths.map((width, idx) => (
                <col key={`col-${idx}`} style={{ width }} />
              ))}
            </colgroup>
            <thead>
              <tr className="modern-table-header">
                {["Item", "Item Desc", "Cntr", "Qty", "Gross Wt.", "Stone Wt.", "Net Wt.", "VA(%)", "VA Amt", "Stn. Chg", "Gold Amt", "Amount", "Tax.Amt", "Total", "SMan", "SBill No", "SDate", "Slno", "Tr.Slno", "Barcode", "A.VA", "A.VA.Amt", "A.Stnch", "Invoice.No", "Fin.Year", "Stn.Cost", "Pur.Cost"].map((h) => (
                  <th
                    key={h}
                    className={`p-1.5 border-r border-white/10 dark:border-slate-800/50 text-white whitespace-nowrap ${tableTypography.header} ${
                      ["Item", "Item Desc", "Cntr", "SMan", "SBill No", "Barcode", "Invoice.No", "Fin.Year"].includes(h)
                        ? "text-left"
                        : h === "SDate"
                        ? "text-center"
                        : "text-right"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>

            </thead>
            <tbody className="bg-white dark:bg-slate-900/40">
              {transactionGrid.map((row, idx) => (
                <tr 
                  key={idx} 
                  onDoubleClick={() => handleRowAction(idx)}
                  className="modern-table-row transition-all duration-200 cursor-pointer select-none"
                  title="Double click to Edit or Delete"
                >
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-left ${tableTypography.cellMono}`}>{row.itemCode}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 font-sans truncate max-w-[150px] text-left ${tableTypography.cellText}`}>{row.itemDesc}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-left ${tableTypography.cellText}`}>{row.cntr}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}>{row.qty}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}>{fmtWt(row.grossWt)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right text-rose-500 ${tableTypography.cellMono}`}>{fmtWt(row.stoneWt)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right bg-slate-50/20 ${tableTypography.cellMono}`}>{fmtWt(row.netWt)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right opacity-60 ${tableTypography.cellMono}`}>{fmtAmt(row.vaPer)}%</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}>{fmtAmt(row.vaAmt)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}>{fmtAmt(row.stnChg)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}>{fmtAmt(row.goldAmt)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}>{fmtAmt(row.taxableAmt)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right text-slate-700 ${tableTypography.cellAmount}`}>{fmtAmt(row.taxAmt)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right text-slate-600 ${tableTypography.cellAmount}`}>{fmtAmt(row.rowTotal)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-left uppercase ${tableTypography.cellText}`}>{row.sman}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-left ${tableTypography.cellText}`}>{row.sBillNo}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-center ${tableTypography.cellText}`}>{row.sDate ? String(row.sDate).split("T")[0].split("-").reverse().join("-") : ""}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right opacity-40 ${tableTypography.cellMono}`}>{idx + 1}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}>{row.trSlno}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-left text-slate-400 ${tableTypography.cellText}`}>{row.barcode}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}>{fmtAmt(row.aVa)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}>{fmtAmt(row.aVaAmt)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}>{fmtAmt(row.aStnch)}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-left ${tableTypography.cellText}`}>{row.invoiceNo}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-left ${tableTypography.cellText}`}>{row.finYearRow}</td>
                  <td className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}>{fmtAmt(row.stnCost)}</td>
                  <td className={`border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}>{fmtAmt(row.purCost)}</td>
                </tr>
              ))}
              {transactionGrid.length === 0 && !isFormEnabled && (
                <tr>
                  <td colSpan={27} className="p-8 text-center text-slate-400 font-sans text-xs italic">
                    No credit note entries yet. Click "New" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      <MessagePopup open={message?.open} message={message?.text} type={message?.type} onClose={handleMessageClose} />
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-6">
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Item Details</h3>
                <div className="flex gap-4 text-[10px] font-bold">
                  <span className="text-slate-500 uppercase">Bill No: <span className="text-purple-600">{headerData.originalSaleBill}</span></span>
                  <span className="text-slate-500 uppercase">Invoice No: <span className="text-purple-600">{originalBillInvoiceNo}</span></span>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-x-auto max-h-[60vh]">
              <table className="w-full text-[10px] border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    {["Slno", "I.Code", "Item Name", "Qty", "Gross Wt", "Stone Wt", "Net Wt", "VA", "Stn Chg", "Amount", "Select", "Est.No", "CRN Invoice"].map(h => (
                      <th key={h} className={`p-2 text-left text-slate-500 dark:text-slate-400 ${tableTypography.header}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {billItems.map((item, idx) => (
                    <tr key={idx} className={`hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors ${item.selected ? 'bg-purple-50/50 dark:bg-purple-900/20' : ''}`}>
                      <td className={`p-2 ${tableTypography.cellMono}`}>{item.slno}</td>
                      <td className={`p-2 text-purple-600 ${tableTypography.cellMono}`}>{item.itemCode}</td>
                      <td className={`p-2 ${tableTypography.cellText}`}>{item.itemDesc}</td>
                      <td className={`p-2 ${tableTypography.cellMono}`}>{item.qty}</td>
                      <td className={`p-2 ${tableTypography.cellMono}`}>{fmtWt(item.grossWt)}</td>
                      <td className={`p-2 text-rose-500 ${tableTypography.cellMono}`}>{fmtWt(item.stoneWt)}</td>
                      <td className={`p-2 ${tableTypography.cellMono}`}>{fmtWt(item.netWt)}</td>
                      <td className={`p-2 ${tableTypography.cellMono}`}>{fmtAmt(item.vaPer)}</td>
                      <td className={`p-2 ${tableTypography.cellAmount}`}>{fmtAmt(item.stnChg)}</td>
                      <td className={`p-2 ${tableTypography.cellAmount}`}>{fmtAmt(item.amount)}</td>
                      <td className="p-2 text-center">
                        <input 
                          type="checkbox" 
                          className={`w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 ${hasExistingCrnReference(item) ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}`}
                          checked={item.selected} 
                          disabled={hasExistingCrnReference(item)}
                          onChange={() => { 
                            if (hasExistingCrnReference(item)) return;
                            const newItems = [...billItems]; 
                            newItems[idx].selected = !newItems[idx].selected; 
                            setBillItems(newItems); 
                          }} 
                        />
                      </td>
                      <td className={`p-2 text-rose-600 ${tableTypography.cellMono}`}>{item.alreadyReturnedEst}</td>
                      <td className={`p-2 opacity-50 ${tableTypography.cellText}`}>{item.invoiceNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  const selectableItems = billItems.filter(item => !hasExistingCrnReference(item));
                  if (selectableItems.length === 0) return;
                  const allSelected = selectableItems.every(item => item.selected);
                  setBillItems(billItems.map(item => ({
                    ...item,
                    selected: hasExistingCrnReference(item) ? false : !allSelected
                  })));
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-600 transition-all flex items-center gap-2 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Select All
              </button>
              <div className="flex gap-2">
                <button onClick={handleAddSelectedItems} className="btn-success uppercase hover:bg-emerald-500"><Save className="w-4 h-4" /> OK</button>
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase hover:bg-slate-300 transition-all flex items-center gap-2"><X className="w-4 h-4" /> Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row Action Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Delete Item</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this item from the credit note?</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteRow}
                className="btn-secondary justify-between px-5 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/40 w-full flex items-center"
              >
                <span>Delete Item</span>
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="mt-2 px-5 py-2 text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-200 transition-all text-sm w-full text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="w-full">
        {renderContent()}
      </div>
    );
  }

  return (
    <ModulePageLayout title="Credit Note" navigate={navigate} backPath="/salesentry">
      {renderContent()}
    </ModulePageLayout>
  );
};

export default React.memo(CreditSales);
