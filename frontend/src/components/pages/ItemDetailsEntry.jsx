import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Barcode,
  Trash2,
  Plus,
  Printer,
  X,
  Search,
  Calculator,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Save,
  Clock,
  User,
  TrendingUp,
  Box,
  Hash,
  Diamond,
  Sparkles,
  Camera
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModulePageLayout from "../layout/ModulePageLayout";
import DynamicQueryService from "../../services/DynamicQueryApi";
import { getConfiguredImageByBarcode } from "../../services/BarcodeAPI";
import { getCurrentShopCode } from "../../utils/session";
import { useCurrencySymbol } from "../../hooks/useCurrencySymbol";
import MessagePopup from "../common/MessagePopup";
import BarcodeScanner from "../common/BarcodeScanner";

const ItemDetailsEntry = () => {
  const navigate = useNavigate();
  const shopCode = getCurrentShopCode();
  const currencySymbol = useCurrencySymbol();
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
  const { username, password } = currentUser;

  // Global States
  const [goldRate, setGoldRate] = useState(0);
  const [gstPer, setGstPer] = useState(0);
  const [metalType] = useState("GOLD"); // Options: GOLD, SILVER
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);


  // Entry States
  const [barcodeInput, setBarcodeInput] = useState("");
  const [imageSrc, setImageSrc] = useState(null);

  // Table States
  const [saleRows, setSaleRows] = useState([]);
  const [stoneRows, setStoneRows] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

  // Notification States
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("Access Message");
  const [popupType, setPopupType] = useState("info");

  // Totals States
  const [totals, setTotals] = useState({
    grossWt: 0,
    stoneWt: 0,
    netWt: 0,
    vaAmt: 0,
    stnChg: 0,
    goldAmt: 0,
    amount: 0,
    qty: 0,
    gstAmt: 0,
    grandTotal: 0
  });

  const [isScannerEnabled, setIsScannerEnabled] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const barcodeRef = useRef(null);

  // Initial Data Fetch: Rates and Tax
  const fetchRatesAndTax = useCallback(async () => {
    try {
      const query = "SELECT GLD_RTE, TAX, DIAMONDTAX, ast, rate FROM Goldrate JOIN goldratemaster ON code = 'slv'";
      const result = await DynamicQueryService.fetchList(query, {}, { username, password }, shopCode);

      if (result?.data?.length > 0) {
        const data = result.data[0];
        // Swing logic: SILVER uses index 5 (rate), GOLD uses index 1 (GLD_RTE)
        setGoldRate(metalType === "SILVER" ? (data.rate || 0) : (data.GLD_RTE || 0));
        setGstPer(data.TAX || 0);
      }
    } catch (error) {
      console.error("Failed to fetch rates:", error);
      handleMessage("Failed to fetch rates", "error");
    }
  }, [metalType, username, password, shopCode]);

  useEffect(() => {
    fetchRatesAndTax();
    barcodeRef.current?.focus();
  }, [metalType, fetchRatesAndTax]);

  // Check if Barcode Scanner should be enabled
  useEffect(() => {
    const checkScannerEnabled = async () => {
      if (!shopCode) return;
      try {
        const query = "SELECT * FROM setdiscount WHERE details = 'BARCODE CAMERA' AND flag = true";
        const result = await DynamicQueryService.fetchList(query, {}, { username, password }, shopCode);
        setIsScannerEnabled(Array.isArray(result?.data) && result.data.length > 0);
      } catch (error) {
        console.error("Failed to check scanner availability", error);
        setIsScannerEnabled(false);
      }
    };
    checkScannerEnabled();
  }, [shopCode, username, password]);

  const handleMessage = (text, type = "info") => {
    setPopupMessage(text);
    setPopupType(type);
    setPopupTitle(type === "success" ? "Success" : type === "error" ? "Error" : "Info");
  };

  // Barcode Handler
  const handleBarcodeEnter = async (e) => {
    if (e.key === "Enter") {
      const code = barcodeInput.padStart(10, '0');
      setBarcodeInput(code);
      processBarcode(code);
    }
  };

  const handleScan = (scannedBarcode) => {
    setShowScanner(false);
    if (scannedBarcode) {
      const code = scannedBarcode.padStart(10, '0');
      setBarcodeInput(code);
      processBarcode(code);
    }
  };

  const processBarcode = async (barcode) => {
    try {
      // Check if already in table
      if (saleRows.some(row => row.barcode === barcode)) {
        handleMessage("Barcode already added!", "error");
        setBarcodeInput("");
        return;
      }

      // Fetch Main Stock Details
      const stockQuery = `SELECT * FROM mainstock WHERE barcode = '${barcode}'`;
      const stockResult = await DynamicQueryService.fetchList(stockQuery, {}, { username, password }, shopCode);

      if (!stockResult?.data || stockResult.data.length === 0) {
        handleMessage("Invalid Barcode!", "error");
        setBarcodeInput("");
        return;
      }

      const stock = stockResult.data[0];
      const itemCode = stock.ITEMCODE || stock.itemcode;

      // Mandatory Tax Check (Swing logic from addToSalesTable)
      const taxQuery = `SELECT a.unit FROM categorymaster AS a JOIN itemmaster AS b ON a.categ_code = b.item_categ WHERE b.item_code = '${itemCode}'`;
      const taxResult = await DynamicQueryService.fetchList(taxQuery, {}, { username, password }, shopCode);
      const itemTax = taxResult?.data?.[0]?.unit || 0;

      const getSpecificRate = async (code) => {
        try {
          const query = `select coalesce(sum(rate),0) as rate from goldratemaster g where code in (select unit from itemmaster where item_code='${code}')`;
          const result = await DynamicQueryService.fetchList(query, {}, { username, password }, shopCode);
          if (result?.data?.[0]) {
            return parseFloat(result.data[0].rate || 0);
          }
        } catch (e) {
          console.error("Error fetching specific rate:", e);
        }
        return goldRate;
      };

      const itemRate = await getSpecificRate(itemCode);

      // If it's the first item, set the global Gold Rate and GST percentage (Swing parity)
      if (saleRows.length === 0) {
        setGoldRate(itemRate);
        setGstPer(itemTax);
      } else {
        if (itemTax !== gstPer) {
          handleMessage("Tax % Is Different, Unable To Enter This Data", "error");
          setBarcodeInput("");
          return;
        }
      }

      // Fetch Item Details
      const itemQuery = `SELECT item_desc, bill_type, item_categ, catg_type FROM itemmaster WHERE item_code = '${itemCode}'`;
      const itemResult = await DynamicQueryService.fetchList(itemQuery, {}, { username, password }, shopCode);
      const itemInfo = itemResult?.data?.[0] || {};

      // Fetch Stone Details
      const stoneQuery = `SELECT * FROM barcodeandstone WHERE barcode = '${barcode}'`;
      const stoneResult = await DynamicQueryService.fetchList(stoneQuery, {}, { username, password }, shopCode);
      const rawStones = stoneResult?.data || [];

      // Normalize Stone Details with metadata and specific calculation logic (Swing parity)
      const stones = await Promise.all(rawStones.map(async (s, idx) => {
        const stoneCode = s.stonecode || s.stone_code || s.stn_typ;
        const metaQuery = `SELECT s_unit, s_type, s_dtype FROM stonemaster WHERE s_code = '${stoneCode}'`;
        const metaResult = await DynamicQueryService.fetchList(metaQuery, {}, { username, password }, shopCode);
        const meta = metaResult?.data?.[0] || {};

        const unit = (meta.s_unit || "P").trim();
        const nos = parseFloat(s.nos || s.qty || s.stn_nos || 0);
        const wt = parseFloat(s.stonewt || s.grmwt || s.stn_qty || 0);
        const rate = parseFloat(s.rate || s.stn_rate || 0);

        let amount = 0;
        if (unit === "P") {
          amount = nos * rate;
        } else {
          amount = wt * rate;
        }

        return {
          slno: idx + 1,
          code: stoneCode,
          name: meta.s_dtype || stoneCode,
          qty: nos,
          wt: wt,
          rate: rate,
          amount: amount,
          unit: unit,
          type: meta.s_type || "",
          dtype: meta.s_dtype || ""
        };
      }));

      // Check Sold Flag
      let isSold = stock.itemsold === true || stock.itemsold === "true";
      if (!isSold) {
        const soldCheckQuery = `SELECT est_barcode FROM sbilltran WHERE est_barcode = '${barcode}'`;
        const soldCheckResult = await DynamicQueryService.fetchList(soldCheckQuery, {}, { username, password }, shopCode);
        if (soldCheckResult?.data?.length > 0) isSold = true;
      }

      if (isSold) handleMessage("Item already sold!", "info");

      if (stock.rfid === 'PRVB') {
        handleMessage("Previous Barcode Cannot Be Entered", "error");
        setBarcodeInput("");
        return;
      }

      // Normalize Item Details
      const grossWt = parseFloat(stock.GROSSWEIGHT || stock.grossweight || 0);
      const stoneWt = parseFloat(stock.STONEWEIGHT || stock.stoneweight || 0);
      const wastage = parseFloat(stock.WASTAGE || 0);
      const makingCharge = parseFloat(stock.MAKINGCHARGE || stock.makingcharge || 0);
      const stoneCharge = parseFloat(stock.STONECHARGE || stock.stonecharge || 0);
      const valueAddition = parseFloat(stock.VALUEADDITION || stock.valueaddition || 0);

      // --- Handle 'ot_itwt' (Other Item Weight) Splitting Logic ---
      const othItWt = parseFloat(stock.ot_itwt || 0);
      const othItCode = stock.ot_itcode || "";

      let finalRowsToAdd = [];

      if (othItWt > 0) {
        // Main Item (Reduced Weight)
        const mainGrWt = grossWt - othItWt;
        const mainItem = {
          barcode: barcode,
          itemCode: itemCode,
          itemDesc: itemInfo.item_desc || "",
          counter: stock.COUNTER_CODE || stock.counter_code || "",
          qty: parseFloat(stock.NUM || stock.qty || 1),
          grossWt: mainGrWt,
          stoneWt: stoneWt,
          netWt: mainGrWt - stoneWt,
          vaPer: valueAddition,
          mkChg: makingCharge,
          stnChg: stoneCharge,
          wastage: wastage,
          rate: itemRate,
          barDate: stock.bar_date || stock.BAR_DATE || "",
          billType: itemInfo.bill_type || "",
          sold: isSold,
          rfid: stock.rfid || "",
          itemTax: itemTax
        };
        calculateRow(mainItem, stones, { wastage: wastage });
        finalRowsToAdd.push(mainItem);

        // Other Item Component (Weight = othItWt, Qty = 0)
        const otherItemRate = await getSpecificRate(othItCode);
        const otherItem = {
          barcode: barcode,
          itemCode: othItCode,
          itemDesc: "Other Component",
          counter: stock.COUNTER_CODE || stock.counter_code || "",
          qty: 0,
          grossWt: othItWt,
          stoneWt: 0,
          netWt: othItWt,
          vaPer: valueAddition, // Inherit VA% from main item
          mkChg: 0,
          stnChg: 0,
          wastage: 0,
          rate: otherItemRate,
          barDate: stock.bar_date || stock.BAR_DATE || "",
          billType: "",
          sold: isSold,
          rfid: stock.rfid || "",
          itemTax: itemTax
        };

        const otherDescResult = await DynamicQueryService.fetchList(`SELECT item_desc FROM itemmaster WHERE item_code = '${othItCode}'`, {}, { username, password }, shopCode);
        if (otherDescResult?.data?.[0]) otherItem.itemDesc = otherDescResult.data[0].item_desc;

        calculateRow(otherItem, [], { wastage: 0 });
        finalRowsToAdd.push(otherItem);
      } else {
        const item = {
          barcode: barcode,
          itemCode: itemCode,
          itemDesc: itemInfo.item_desc || "",
          counter: stock.COUNTER_CODE || stock.counter_code || "",
          qty: parseFloat(stock.NUM || stock.qty || 1),
          grossWt: grossWt,
          stoneWt: stoneWt,
          netWt: grossWt - stoneWt,
          vaPer: valueAddition,
          mkChg: makingCharge,
          stnChg: stoneCharge,
          wastage: wastage,
          rate: itemRate,
          barDate: stock.bar_date || stock.BAR_DATE || "",
          billType: itemInfo.bill_type || "",
          sold: isSold,
          rfid: stock.rfid || "",
          itemTax: itemTax
        };

        if (item.billType === 'P') {
          const pAmt = parseFloat(stock.p_amt || 0);
          item.amount = (pAmt / (100 + itemTax)) * 100;
        }

        calculateRow(item, stones, { wastage: wastage });
        finalRowsToAdd.push(item);
      }

      setSaleRows(prev => [...prev, ...finalRowsToAdd]);
      setStoneRows(stones);

      const barcodeImgResult = await getConfiguredImageByBarcode(barcode, shopCode, username, password);
      if (!barcodeImgResult.found || !barcodeImgResult.src) {
        setImageSrc(null);
        if (barcodeImgResult.configuredFromServer) {
          handleMessage("Barcode image is not available from the server", "info");
        }
      } else {
        setImageSrc(barcodeImgResult.src);
      }

      setBarcodeInput("");

    } catch (error) {
      console.error("Error processing barcode:", error);
      handleMessage("Failed to fetch barcode details", "error");
    }
  };

  const _displayStoneDetails = async (estno, itslno) => {
    try {
      const query = `SELECT * FROM stoneest WHERE est_no = ${estno} AND it_slno = ${itslno}`;
      const result = await DynamicQueryService.fetchList(query, {}, { username, password }, shopCode);
      const rows = result?.data || [];

      const stones = await Promise.all(rows.map(async (rset, idx) => {
        const stnTyp = rset.stn_typ;
        const metaQuery = `SELECT s_unit, s_dtype, s_type FROM stonemaster WHERE s_code = '${stnTyp}'`;
        const metaResult = await DynamicQueryService.fetchList(metaQuery, {}, { username, password }, shopCode);
        const meta = metaResult?.data?.[0] || {};

        const unit = (meta.s_unit || "").trim();
        const nos = parseFloat(rset.stn_nos || 0);
        const qty = parseFloat(rset.stn_qty || 0);
        const rate = parseFloat(rset.stn_rate || 0);

        let stnamt = 0;
        if (unit === "P") {
          stnamt = nos * rate;
        } else {
          stnamt = qty * rate;
        }

        return {
          slno: idx + 1,
          code: stnTyp,
          unit: unit,
          qty: nos,
          wt: qty,
          rate: rate,
          amount: stnamt,
          type: rset.s_type || meta.s_type || "",
          name: meta.s_dtype || stnTyp
        };
      }));

      setStoneRows(stones);
    } catch (error) {
      console.error("Error fetching stone details:", error);
    }
  };

  const _getSlno = () => {
    return saleRows.length + 1;
  };

  const calculateRow = useCallback((item) => {
    const goldRte = item.rate > 0 ? item.rate : goldRate;
    const grossWt = item.grossWt;
    const stnWt = item.stoneWt;
    const netWt = grossWt - stnWt;

    let vaAmt = 0;
    let vaper = item.vaPer || 0;
    let wastage = item.wastage || 0;
    let mkchg = item.mkChg || 0;
    let stnchg = item.stnChg || 0;
    let goldAmt = 0;

    const isBillTypeP = item.billType === 'P';

    if (isBillTypeP) {
      item.wastage = 0;
      item.mkChg = 0;
      item.vaPer = 0;
      item.vaAmt = 0;
      item.stnChg = 0;
      item.goldAmt = 0;
      // Note: amount is already set from p_amt in processBarcode for type P
    } else {
      goldAmt = netWt * goldRte;

      // Swing Logic: if wastage or mkchg is present, vaamt = mkchg
      if (wastage !== 0 || mkchg !== 0) {
        vaAmt = mkchg;
        vaper = (goldRte * netWt) !== 0 ? (vaAmt * 100) / (goldRte * netWt) : 0;
      } else if (vaper !== 0) {
        vaAmt = (netWt * goldRte * vaper) / 100;
      } else if (vaAmt > 0) {
        vaper = (goldRte * netWt) !== 0 ? (vaAmt * 100) / (goldRte * netWt) : 0;
      }

      item.netWt = netWt;
      item.vaPer = vaper;
      item.vaAmt = vaAmt;
      item.goldAmt = goldAmt;
      item.amount = goldAmt + stnchg + vaAmt;
    }
  }, [goldRate]);

  useEffect(() => {
    const newTotals = saleRows.reduce((acc, row) => {
      acc.grossWt += row.grossWt || 0;
      acc.stoneWt += row.stoneWt || 0;
      acc.netWt += row.netWt || 0;
      acc.vaAmt += row.vaAmt || 0;
      acc.stnChg += row.stnChg || 0;
      acc.goldAmt += row.goldAmt || 0;
      acc.amount += row.amount || 0;
      acc.qty += row.qty || 0;
      return acc;
    }, { grossWt: 0, stoneWt: 0, netWt: 0, vaAmt: 0, stnChg: 0, goldAmt: 0, amount: 0, qty: 0 });

    const gstAmt = (newTotals.amount * gstPer / 100);
    const grandTotal = newTotals.amount + gstAmt;
    setTotals({ ...newTotals, gstAmt, grandTotal });
  }, [saleRows, gstPer]);

  const removeRow = (index) => {
    setSaleRows(prev => prev.filter((_, i) => i !== index));
    if (selectedRowIndex === index) {
      setStoneRows([]);
      setSelectedRowIndex(-1);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // F12: Bulk VA Update (Swing parity: ADDING to existing VA%)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F12") {
        e.preventDefault();
        const newVal = prompt("Enter additional VA% to add to all items:");
        if (newVal !== null && !isNaN(parseFloat(newVal))) {
          const addVa = parseFloat(newVal);
          setSaleRows(prev => prev.map(row => {
            if (row.vaPer > 0 || row.itemCode === "RFGL") { // Only update if it has VA or is specific code as per Java logic
              const updated = { ...row, vaPer: row.vaPer + addVa };
              calculateRow(updated, [], {});
              return updated;
            }
            return row;
          }));

        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [calculateRow]);

  // Recalculate all rows when global gold rate changes
  useEffect(() => {
    if (saleRows.length > 0) {
      setSaleRows(prev => prev.map(row => {
        const updated = { ...row };
        // Force update the rate if it was tracking the global rate
        if (updated.rate === 0 || updated.rate === undefined) updated.rate = goldRate;
        calculateRow(updated, [], {});
        return updated;
      }));
    }
  }, [calculateRow, goldRate, saleRows.length]);

  const handleCancel = () => {
    setSaleRows([]);
    setStoneRows([]);
    setBarcodeInput("");
    setImageSrc(null);
    setTotals({
      grossWt: 0, stoneWt: 0, netWt: 0, vaAmt: 0, stnChg: 0, goldAmt: 0, amount: 0, qty: 0, gstAmt: 0, grandTotal: 0
    });
  };

  return (
    <ModulePageLayout title="ITEM DETAILS ENTRY" navigate={navigate}>
      <>
        <div className="flex flex-col min-h-screen lg:h-screen bg-slate-50 dark:bg-slate-950 p-2 sm:p-4 gap-4 overflow-y-auto lg:overflow-hidden print:p-0 print:bg-white">

          {/* Print Only Section */}
          <div className="hidden print:block text-black p-8 font-serif">
            <div className="text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-3xl font-bold uppercase tracking-widest">Estimate Entry</h1>
              <p className="text-sm mt-1">Date: {new Date(date).toLocaleDateString()}</p>
            </div>

            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-2">Item / Barcode</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Gross</th>
                  <th className="text-right py-2">Net</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {saleRows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2">
                      <div className="font-bold">{row.itemCode}</div>
                      <div className="text-xs">{row.barcode} - {row.itemDesc}</div>
                    </td>
                    <td className="text-right py-2">{row.qty}</td>
                    <td className="text-right py-2">{row.grossWt.toFixed(3)}</td>
                    <td className="text-right py-2 font-bold">{row.netWt.toFixed(3)}</td>
                    <td className="text-right py-2">{currencySymbol}{row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end gap-12">
              <div className="space-y-1">
                <div className="flex justify-between gap-8"><span>Total Qty:</span> <span>{totals.qty}</span></div>
                <div className="flex justify-between gap-8"><span>Total Gross:</span> <span>{totals.grossWt.toFixed(3)}g</span></div>
                <div className="flex justify-between gap-8"><span>Total Net:</span> <span>{totals.netWt.toFixed(3)}g</span></div>
              </div>
              <div className="space-y-1 border-l-2 border-black pl-8">
                <div className="flex justify-between gap-8"><span>Total Gold:</span> <span>{currencySymbol}{(totals.goldAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between gap-8"><span>Sub Total:</span> <span>{currencySymbol}{(totals.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between gap-8"><span>GST ({gstPer}%):</span> <span>{currencySymbol}{(totals.gstAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between gap-8 font-bold text-xl border-t border-black pt-2">
                  <span>Grand Total:</span>
                  <span>{currencySymbol}{(totals.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="mt-20 flex justify-between px-10">
              <div className="text-center"><div className="border-t border-black w-32 mb-1"></div>Customer Signature</div>
              <div className="text-center"><div className="border-t border-black w-32 mb-1"></div>Authorized Signatory</div>
            </div>
          </div>

          {/* Screen Only Section */}
          {/* Screen Only Section */}
          <div className="print:hidden flex flex-col lg:h-[calc(100vh-150px)] h-auto gap-3 p-3 lg:overflow-hidden relative z-0">
            
            {/* Subtle Animated Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-slate-700/10 dark:bg-slate-700/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/10 dark:bg-sky-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            {/* Header Controls: Glassmorphism Style */}
            <div className="glass-card rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-80 md:w-96 max-w-[400px] group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Barcode className="w-5 h-5 text-slate-700 group-focus-within:text-slate-700 transition-colors" />
                  </div>
                  <input
                    ref={barcodeRef}
                    type="text"
                    value={barcodeInput || ""}
                    onChange={(e) => setBarcodeInput(e.target.value.toUpperCase())}
                    onKeyDown={handleBarcodeEnter}
                    placeholder="SCAN BARCODE OR ENTER CODE"
                    className="w-full pl-10 pr-12 py-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-700/30 outline-none transition-all placeholder:text-slate-400 shadow-inner"
                  />
                  {isScannerEnabled && (
                    <button
                      onClick={() => setShowScanner(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-700 hover:bg-slate-700 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                      title="Scan using Camera"
                    >
                      <Camera size={18} />
                    </button>
                  )}
                </div>
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/10 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Items</span>
                  <span className="text-sm font-black">{saleRows.length}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-1">
                  <div className="px-3 py-1.5 flex items-center gap-2">
                    <TrendingUp size={14} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rate</span>
                  </div>
                  <div className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-black rounded-lg text-sm border border-amber-100 dark:border-amber-500/20 shadow-sm">
                    {currencySymbol}{goldRate || 0}
                  </div>
                </div>

                <div className="flex items-center bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-1">
                  <div className="px-3 py-1.5 flex items-center gap-2">
                    <Clock size={14} className="text-sky-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Date</span>
                  </div>
                  <input
                    type="date"
                    value={date || ""}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 rounded-lg px-2 py-1 text-xs outline-none font-bold shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Middle Section: Main Table */}
            <div className="flex-grow flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden min-h-[250px]">
              <div className="flex-grow overflow-x-auto overflow-y-auto custom-scrollbar relative">
                {saleRows.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 px-4">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                      <Barcode size={40} className="text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em]">Ready for Scan</h3>
                    <p className="text-xs text-slate-400 mt-2">Scan a barcode to add items to the estimate</p>
                  </div>
                )}
                <table className={`w-full text-left text-[11px] border-collapse ${saleRows.length > 0 ? 'min-w-[1400px]' : 'min-w-full'}`}>
                  <thead className="sticky top-0 z-20">
                    <tr className="modern-table-header">
                      <th className="p-3 pl-4 text-[10px] font-bold uppercase tracking-wider opacity-90 rounded-tl-xl">Barcode</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider opacity-90">Item</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider opacity-90">Description</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-center opacity-90">Cntr</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-center opacity-90">Qty</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right opacity-90">Gross</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right opacity-90">Stone</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right text-emerald-400">Net Wt</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right opacity-90">Tax%</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right opacity-90">VA%</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right opacity-90">MkRate</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right opacity-90">VA Amt</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right opacity-90">StnChg</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right opacity-90">GoldAmt</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right pr-4 text-emerald-400">Total</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-center opacity-90">Date</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-center opacity-90">Sold</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-center opacity-90 rounded-tr-xl">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {saleRows.map((row, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedRowIndex(idx)}
                        className={`transition-all duration-200 cursor-pointer select-none group ${selectedRowIndex === idx
                          ? "bg-slate-700/80 dark:bg-slate-700/10 shadow-[inset_4px_0_0_0_rgb(99,102,241)]"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                          }`}
                      >
                        <td className="px-3 py-3 pl-4 font-mono text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-slate-700 transition-colors">{row.barcode}</td>
                        <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200">{row.itemCode}</td>
                        <td className="px-3 py-3 text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={row.itemDesc}>{row.itemDesc}</td>
                        <td className="px-3 py-3 text-center text-slate-500 dark:text-slate-400">{row.counter}</td>
                        <td className="px-3 py-3 text-center font-bold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30">{row.qty}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-600 dark:text-slate-400">{row.grossWt.toFixed(3)}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-400">{row.stoneWt.toFixed(3)}</td>
                        <td className="px-3 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-500/5">{row.netWt.toFixed(3)}</td>
                        <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">{row.itemTax}%</td>
                        <td className="px-3 py-3 text-right text-slate-700 font-bold">{row.vaPer.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right text-slate-400 font-mono">{row.mkChg.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{(row.vaAmt || 0).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right text-slate-400 font-mono">{row.stnChg.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{(row.goldAmt || 0).toLocaleString()}</td>
                        <td className="px-3 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 pr-4 text-sm bg-emerald-50/30 dark:bg-emerald-500/5">{currencySymbol}{(row.amount || 0).toLocaleString()}</td>
                        <td className="px-3 py-3 text-center text-[9px] text-slate-400">
                          {row.barDate ? new Date(row.barDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input type="checkbox" checked={row.sold} readOnly className="rounded border-slate-300 text-slate-700 focus:ring-slate-700" />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); removeRow(idx); }}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Table Footer Totals */}
              <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 pl-2">
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Gross Wt</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200 font-mono">{totals.grossWt.toFixed(3)}<span className="text-[9px] text-slate-400 ml-0.5">g</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70">Net Wt</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{totals.netWt.toFixed(3)}<span className="text-[9px] text-emerald-500/50 ml-0.5">g</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Qty</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200">{totals.qty}<span className="text-[9px] text-slate-400 ml-0.5">pcs</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center mr-2">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Sub Total</span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 font-mono">
                      <span className="text-sm text-slate-400 mr-1">{currencySymbol}</span>
                      {totals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lower Section: Three Columns (Stones, Image, Summary) */}
            <div className="flex flex-col lg:flex-row gap-3 h-auto lg:h-[180px] shrink-0">
              
              {/* Stones Pane */}
              <div className="lg:w-1/3 glass-card rounded-2xl flex flex-col overflow-hidden border border-slate-200/60 dark:border-slate-700/50">
                <div className="bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200/60 dark:border-slate-700/50 flex justify-between items-center backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Diamond size={14} className="text-slate-700" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">Stone Details</span>
                  </div>
                  <span className="text-[9px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full text-slate-500">{stoneRows.length} Items</span>
                </div>
                <div className="flex-grow overflow-auto custom-scrollbar bg-white/40 dark:bg-slate-900/40">
                  <table className="w-full text-left text-[11px] border-collapse min-w-[350px]">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/90 shadow-sm">
                      <tr>
                        <th className="p-2 pl-4 text-[9px] font-bold text-slate-400 uppercase">Code</th>
                        <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-right">Nos</th>
                        <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-right">Weight</th>
                        <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-right">Rate</th>
                        <th className="p-2 text-[9px] font-bold text-slate-400 uppercase text-right pr-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                      {stoneRows.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center opacity-30">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No Stones</span>
                          </td>
                        </tr>
                      ) : (
                        stoneRows.map((stone, idx) => (
                          <tr key={idx} className="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="px-3 py-2 pl-4">
                              <div className="font-bold text-slate-700 dark:text-slate-700">{stone.code}</div>
                              <div className="text-[9px] text-slate-400 truncate max-w-[100px]">{stone.name}</div>
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-slate-600 dark:text-slate-300">{stone.qty}</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-500">{stone.wt.toFixed(3)}</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-400 text-[10px]">{stone.rate.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right pr-4 font-black text-slate-700 dark:text-slate-200">{currencySymbol}{stone.amount.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Image Preview Pane */}
              <div className="lg:w-1/4 glass-card rounded-2xl flex flex-col overflow-hidden border border-slate-200/60 dark:border-slate-700/50 p-2">
                <div className="flex-grow bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center relative overflow-hidden group">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt="Item Preview"
                      className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center opacity-20">
                      <ImageIcon size={32} className="text-slate-400 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">No Image</span>
                    </div>
                  )}
                  {selectedRowIndex !== -1 && saleRows[selectedRowIndex] && (
                    <div className="absolute bottom-2 inset-x-2 bg-black/60 backdrop-blur-md rounded-lg p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="text-[10px] font-bold text-white truncate">{saleRows[selectedRowIndex].itemCode}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Summary Pane - Premium Card */}
              <div className="lg:w-[41.66%] glass-card rounded-2xl border border-slate-200/60 dark:border-slate-700/50 flex flex-col overflow-hidden relative">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl -z-10"></div>
                
                <div className="flex-grow flex flex-col p-4 justify-between relative z-10">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex justify-between items-center bg-white/40 dark:bg-slate-900/40 px-2 py-1.5 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Gold Amt</span>
                      <span className="text-xs font-black font-mono">{currencySymbol}{(totals.goldAmt || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/40 dark:bg-slate-900/40 px-2 py-1.5 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">VA Amt</span>
                      <span className="text-xs font-black font-mono">{currencySymbol}{(totals.vaAmt || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/40 dark:bg-slate-900/40 px-2 py-1.5 rounded-lg">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">GST %</span>
                        <input
                          type="number"
                          value={gstPer || 0}
                          onChange={(e) => setGstPer(parseFloat(e.target.value) || 0)}
                          className="w-12 text-[10px] font-black text-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1 text-center outline-none"
                        />
                      </div>
                      <span className="text-xs font-black font-mono text-slate-400">{currencySymbol}{(totals.gstAmt || 0).toLocaleString('en-IN', { minimumFractionDigits: 1 })}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/40 dark:bg-slate-900/40 px-2 py-1.5 rounded-lg border-b border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Amt</span>
                      <span className="text-xs font-black font-mono">{currencySymbol}{(totals.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Grand Total Area */}
                  <div className="mt-3 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-xl p-3 flex justify-between items-center shadow-lg shadow-emerald-500/20 text-white">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-100" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-50">Grand Total</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-emerald-100">{currencySymbol}</span>
                      <span className="text-2xl font-black tracking-tighter drop-shadow-sm">
                        {(totals.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex bg-slate-100/50 dark:bg-slate-800/50 border-t border-slate-200/60 dark:border-slate-700/50 shrink-0">
                  <button
                    onClick={handlePrint}
                    className="flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-700 hover:bg-slate-700 dark:hover:bg-slate-700/10 transition-colors flex items-center justify-center gap-2 border-r border-slate-200/60 dark:border-slate-700/50"
                  >
                    <Printer size={14} /> Print
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={14} /> Clear
                  </button>
                </div>
              </div>
              
            </div>
          </div>
        </div>


        <MessagePopup
          open={!!popupMessage}
          title={popupTitle}
          message={popupMessage}
          type={popupType}
          onClose={() => setPopupMessage("")}
        />

        {showScanner && (
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </>
    </ModulePageLayout>
  );
};

export default ItemDetailsEntry;
