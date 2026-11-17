import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CashMarkingAPI from "../../../services/CashMarkingAPI";
import DiscountDetailsAPI from "../../../services/DiscountDetailsAPI";
import { logSystemDetails } from "../../../services/SystemDetailsApi";

import {
  existsByUsername,
  getShopCodes,
  getDefaultShopCode,
  getCustData,
} from "../../../services/ShopAPI";
import {
  Image,
  Search,
  Calculator,
  List,
  Coins,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Wallet,
  FileText,
  Scale,
} from "lucide-react";
import { FaSearchPlus } from "react-icons/fa";
import { handleShopSwitch } from "../../../utils/shopSwitch";
import { getCurrentShopCode } from "../../../utils/session";
import ModulePageLayout from "../../layout/ModulePageLayout";
import MessagePopup from "../../common/MessagePopup";
import ModernConfirmModal from "../../common/ModernConfirmModal";
import { fmtWt, fmtAmt } from "../../../utils/format";
import { useCurrencySymbol } from "../../../hooks/useCurrencySymbol";

const CashMarking = () => {
  const navigate = useNavigate();
  const currencySymbol = useCurrencySymbol();

  const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
  const username = currentUser.username || "";
  const password = currentUser.password || "";
  let roles = [];

  if (Array.isArray(currentUser.roles)) {
    roles = currentUser.roles.map((r) => (typeof r === "object" ? r.role : r));
  } else if (typeof currentUser.roles === "string") {
    roles = [currentUser.roles];
  }

  const userRole = roles[0] || "";

  // ---Cust.id table model---

  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [custTableData, setCustTableData] = useState([]);
  const [custId, setCustId] = useState("");

  // --- User & Form States ---

  const [shopcode, setShopcode] = useState("");
  const [shopcodes, setShopcodes] = useState([]);

  const [estNo, setEstNo] = useState("");
  const [estDate, setEstDate] = useState("");
  const [goldRate, setGoldRate] = useState("");
  const [custName, setCustName] = useState("");
  const [percentage, setPercentage] = useState("");
  const [dmdMinDisRate, setDmdMinDisRate] = useState("");
  const [dmdDisRate, setDmdDisRate] = useState("");
  const [radioSelection, setRadioSelection] = useState("rateva");
  const [isItemwiseChecked, setIsItemwiseChecked] = useState(false);

  const [isGiftLookupOpen, setIsGiftLookupOpen] = useState(false);
  const [giftLookupData, setGiftLookupData] = useState([]);
  const [giftNo, setGiftNo] = useState("");
  const [barcodeFlag, setBarcodeFlag] = useState(false);

  const [entryDetailsData, setEntryDetailsData] = useState([]);
  const [vaTableData, setVaTableData] = useState([]);
  const [totals, setTotals] = useState({
    previous: { taxable: "0.00", gst: "0.00", total: "0.00" },
    after: { taxable: "0.00", gst: "0.00", total: "0.00" },
    collected: { taxable: "0.00", gst: "0.00", total: "0.00" },
    totalGrossWt: "0.000",
  });
  const [isFormLocked, setIsFormLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canEditDiamond, setCanEditDiamond] = useState(false);
  const [message, setMessage] = useState(null);
  const [, setItslnoList] = useState([]);
  const [, _setTotalAmount] = useState(0);
  const [, _setTotalQty] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentModalImage, setCurrentModalImage] = useState("");
  const [discountamt, setdiscountamt] = useState("");
  const [roundingAmt, setRoundingAmt] = useState("");
  const [confirmManagerDiscount, setConfirmManagerDiscount] = useState({
    isOpen: false,
    message: "",
    data: null,
  });

  // --- Transaction Summary States ---
  const [salesAmt, setSalesAmt] = useState("");
  const [purAmt, setPurAmt] = useState("");
  const [crnAmt, setCrnAmt] = useState("");
  const [salesWt, setSalesWt] = useState("");
  const [purWt, setPurWt] = useState("");
  const [crnWt, setCrnWt] = useState("");

  // --- API Helpers ---
  const getAmt = (val) => Number(val) || 0;
  const getNo = (val) => Number(val) || 0;

  // --- API Instance ---
  const api = CashMarkingAPI(shopcode, username, password);

  // --- Helpers ---
  const formatCurrency = (num) => fmtAmt(num);
  const getEntryIcon = (name) => {
    switch (name?.toUpperCase()) {
      case "SALES":
        return (
          <ShoppingCart className="w-5 h-5 text-slate-700 dark:text-slate-700" />
        );
      case "PURCHASE":
        return (
          <Wallet className="w-5 h-5 text-slate-700 dark:text-slate-700" />
        );
      case "CR.NOTE":
      case "CREDIT NOTE":
        return (
          <FileText className="w-5 h-5 text-slate-700 dark:text-slate-700" />
        );
      default:
        return <List className="w-5 h-5 text-slate-700 dark:text-slate-700" />;
    }
  };
  const handleMessage = useCallback(
    (text, type = "info") => {
      setMessage({ text, type, open: true });
    },
    [setMessage],
  );

const handleGiftLookup = async () => {
  try {
    setLoading(true);

    const response = await api.getGiftLookup();

    setGiftLookupData(response?.data || []);
    setIsGiftLookupOpen(true);
  } catch (error) {
    handleMessage("Failed to load gift records.", "error");
  } finally {
    setLoading(false);
  }
};

  const computeTotals = (estimateData, afterAmt, generalData) => {
    if (!Array.isArray(estimateData) || estimateData.length === 0) return;

    const {
      estGamt,
      estTamt,
      afterVaAmt,
      afterStnch,
      totalItslnoList,
      totalGrossWt,
    } = estimateData.reduce(
      (acc, item) => {
        acc.estGamt += getAmt(item.est_gamt);
        acc.estTamt += getAmt(item.est_tamt);
        acc.afterVaAmt += getAmt(item.aftervaamt);
        acc.afterStnch += getAmt(item.afterstnch);
        acc.totalGrossWt += getAmt(item.est_wt || item.estwt);
        acc.totalItslnoList.push(getNo(item.itslno));
        return acc;
      },
      {
        estGamt: 0,
        estTamt: 0,
        afterVaAmt: 0,
        afterStnch: 0,
        totalItslnoList: [],
        totalGrossWt: 0,
      },
    );

    setItslnoList(totalItslnoList);

    const totalGstRate =
      getAmt(generalData.est_gstper) + getAmt(generalData.est_igstper);

    // Previous totals
    const prevTaxable = estTamt;
    const prevGst = (prevTaxable * totalGstRate) / 100;
    const prevTotal = prevTaxable + prevGst;

    // After totals
    const afterTaxable = estGamt + afterVaAmt + afterStnch;
    const afterGst = (afterTaxable * totalGstRate) / 100;
    const afterTotal = afterTaxable + afterGst;

    // Collected totals
    const collected = getAmt(afterAmt);
    const collectedGst = afterGst;
    const collectedTotal = collected + collectedGst;

    setdiscountamt(prevTaxable - afterTaxable);
    setTotals({
      previous: {
        taxable: formatCurrency(prevTaxable),
        gst: formatCurrency(prevGst),
        total: formatCurrency(prevTotal),
      },
      after: {
        taxable: formatCurrency(afterTaxable),
        gst: formatCurrency(afterGst),
        total: formatCurrency(afterTotal),
      },
      collected: {
        taxable: formatCurrency(collected),
        gst: formatCurrency(collectedGst),
        total: formatCurrency(collectedTotal),
      },
      totalGrossWt: fmtWt(totalGrossWt),
    });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const activeShopCode = shopcode || getCurrentShopCode();
        const userExists = await existsByUsername(
          username,
          activeShopCode || undefined,
        );
        if (!userExists) {
          navigate("/signin");
          return;
        }
      } catch {
        handleMessage("Failed to verify user session.", "error");
      }
    };

    if (username) {
      init();
    }
  }, [username, shopcode, navigate, handleMessage]);

  useEffect(() => {
    const init = async () => {
      try {
        const codes = await getShopCodes();
        setShopcodes(Array.isArray(codes) ? codes : []);
        const defaultCode =
          getCurrentShopCode() || (await getDefaultShopCode());
        setShopcode(defaultCode);
      } catch (error) {
        handleMessage(
          error.message || "Failed to fetch branch codes.",
          "error",
        );
      }
    };

    init();
  }, [handleMessage]);

  const handleShopCodeChange = async (event) => {
    const nextShopCode = event.target.value;
    const result = await handleShopSwitch({
      nextShopCode,
      username,
      currentModule: "/cashmarking",
      navigate,
      onSuccess: (shopCode) => setShopcode(shopCode),
    });

    if (!result.requiresSignin && !result.ok) {
      handleMessage(result.message || "Unable to switch branch.", "error");
    }
  };

  const handleRadioChange = (value) => {
    setRadioSelection(value);
    if (value === "percentage") {
      setDmdDisRate("");
      setIsItemwiseChecked(true);
    } else {
      setPercentage("");
      setIsItemwiseChecked(false);
    }
  };

  const proceedLoad = async (existingDiscountOverride = null) => {
    setLoading(true);
    try {
      const [
        discountRes,
        billedRes,
        generalDataRes,
        vaDataRes,
        entryDataRes,
        afterAmtRes,
        diamondFlagRes,
        maxDiamondAmtRes,
        getByEstNoRes,
      ] = await Promise.all([
        existingDiscountOverride
          ? Promise.resolve({ data: existingDiscountOverride })
          : DiscountDetailsAPI(shopcode, username, password)
              .findByEstNoMaxSlno(estNo)
              .catch(() => null),
        api.checkEstno(estNo),
        api.findByEstno(estNo),
        api.getTransactionUpdateVaamt(estNo, false),
        api.getTransactionSummary(estNo),
        api.getAfterAmount(estNo),
        api.checkDiamond(estNo),
        api.getMaximumDmdAmount(),
        api.getByEstno(estNo),
      ]);

      const discountData = existingDiscountOverride || discountRes?.data;

      if (
        !existingDiscountOverride &&
        discountData &&
        Number(discountData.roundoffamt) !== 0
      ) {
        setConfirmManagerDiscount({
          isOpen: true,
          message:
            "Discount already exists for this estimate. Do you want to modify it?",
          data: discountData,
        });
      }

      setDmdMinDisRate(maxDiamondAmtRes?.data);
      setCanEditDiamond(
        diamondFlagRes?.data && radioSelection !== "percentage",
      );

      if (billedRes?.data)
        return handleMessage("EstNo already billed.", "error");

      const generalData = generalDataRes?.data || {};

      if (!generalData.est_no) {
        return handleMessage("EstNo does not exist.", "error");
      } else {
        const vaData = vaDataRes?.data || [];
        const entryData = entryDataRes?.data || [];
        const estimateData = getByEstNoRes?.data || [];
        const afterAmt = afterAmtRes?.data?.amount || 0;

        setEstDate(generalData.est_dte || "");
        setGoldRate(generalData.est_grate || "");
        setCustName(generalData.est_cunm || "");
        setDmdDisRate(generalData.est_disrate || 0);
        setCustId(generalData.custid || "");

        setVaTableData(vaData);
        setEntryDetailsData(entryData);
        setItslnoList(vaData.map((item) => item.itslno));

        // Extract transaction summaries (Sales, Purchase, Cr.Note)
        const findEntry = (name) =>
          entryData.find((e) => e.name?.toUpperCase() === name.toUpperCase()) ||
          {};

        const sEntry = findEntry("SALES");
        setSalesAmt(sEntry.amount || 0);
        setSalesWt(sEntry.gdwt || sEntry.weight || sEntry.wt || 0);

        const pEntry = findEntry("PURCHASE");
        setPurAmt(pEntry.amount || 0);
        setPurWt(pEntry.gdwt || pEntry.weight || pEntry.wt || 0);

        const cEntry = findEntry("CR.NOTE");
        setCrnAmt(cEntry.amount || 0);
        setCrnWt(cEntry.gdwt || cEntry.weight || cEntry.wt || 0);

        computeTotals(estimateData, afterAmt, generalData);

        if (discountData && Number(discountData.roundoffamt) !== 0) {
          setRoundingAmt(discountData.roundoffamt ?? "");
        }

        setIsFormLocked(true);
      }
    } catch (error) {
      console.error("Failed to load estimate:", error);
      handleMessage("Failed to load estimate.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadEstimate = async () => {
    if (!shopcode) return handleMessage("Please select a branch.", "error");
    if (!estNo || estNo === "0")
      return handleMessage("Please enter a valid Est.No.", "error");

    await proceedLoad();
  };

  const handleReset = async () => {
    if (!estNo) return;
    try {
      await api.resetEstno(estNo);
      const [
        generalDataRes,
        vaDataRes,
        entryDataRes,
        afterAmtRes,
        getByEstNoRes,
      ] = await Promise.all([
        api.findByEstno(estNo),
        api.getTransactionUpdateVaamt(estNo, false),
        api.getTransactionSummary(estNo),
        api.getAfterAmount(estNo),
        api.getByEstno(estNo),
      ]);

      const generalData = generalDataRes?.data || {};
      const vaData = vaDataRes?.data || [];
      const entryData = entryDataRes?.data || [];
      const estimateData = getByEstNoRes?.data || [];
      const afterAmt = afterAmtRes?.data?.amount || 0;

      setEstDate(generalData.est_dte || "");
      setGoldRate(generalData.est_grate || "");
      setCustName(generalData.est_cunm || "");
      setDmdDisRate(generalData.est_disrate || "");
      setCustId(generalData.custid || "");

      setVaTableData(vaData);
      setEntryDetailsData(entryData);
      setItslnoList(vaData.map((item) => item.itslno));

      // Extract transaction summaries (Sales, Purchase, Cr.Note)
      const findEntry = (name) =>
        entryData.find((e) => e.name?.toUpperCase() === name.toUpperCase()) ||
        {};

      const sEntry = findEntry("SALES");
      setSalesAmt(sEntry.amount || 0);
      setSalesWt(sEntry.gdwt || sEntry.weight || sEntry.wt || 0);

      const pEntry = findEntry("PURCHASE");
      setPurAmt(pEntry.amount || 0);
      setPurWt(pEntry.gdwt || pEntry.weight || pEntry.wt || 0);

      const cEntry = findEntry("CR.NOTE");
      setCrnAmt(cEntry.amount || 0);
      setCrnWt(cEntry.gdwt || cEntry.weight || cEntry.wt || 0);

      computeTotals(estimateData, afterAmt, generalData);

      logSystemDetails({
        userid: currentUser?.userid || currentUser?.id || currentUser?.user_id,
        framename: "CASH MARKING",
        operation: "RESET_CASH_MARKING",
        description: `User reset cash marking for estimate #${estNo}`,
        shopcode: shopcode || getCurrentShopCode(),
      });
    } catch {
      handleMessage("Failed to reset estimate.", "error");
    }
  };

const handleSubmit = async () => {
  if (!isFormLocked) {
    handleMessage("Load an Estimate No. first.", "error");
    return;
  }

  try {
    await saveRoundingAmount();

    // 1. Update VA
    if (radioSelection === "percentage") {
      const payload = {
        estno: estNo,
        percentage: Number(percentage || 0),
        itslnos: vaTableData.map((item) => item.itslno),
      };

      await api.updateVaVaAmtAndDmdRatePercentage(payload);
    } else {
      const payload = vaTableData.map((item) => ({
        estno: estNo,
        afterva: Number(item.aftervaper) || 0,
        est_gamt: item.est_gamt,
        itslno: item.itslno,
        icode: item.esticode,
        actualVa: item.estvaper,
      }));

      await api.updateVaData(payload, isItemwiseChecked);
    }

    // 2. Update Diamond
    const diamondFlagRes = await api.checkDiamond(estNo);

    if (diamondFlagRes?.data) {
      await api.updateEstmstrDmdRate({
        estno: estNo,
        dmdrate: dmdDisRate,
      });

      await api.updateSaleEstStnChg({
        estno: estNo,
        dmdrate: dmdDisRate,
        value: radioSelection === "percentage",
      });
    }

    // 3. Refresh updated data
    const [
      updatedVa,
      generalData,
      afterData,
      getByEstNoRes,
    ] = await Promise.all([
      api.getTransactionUpdateVaamt(estNo, isItemwiseChecked),
      api.findByEstno(estNo),
      api.getAfterAmount(estNo),
      api.getByEstno(estNo),
    ]);

    setVaTableData(updatedVa?.data || []);

    computeTotals(
      getByEstNoRes?.data || [],
      afterData?.data?.amount,
      generalData?.data,
    );

    // 4. Update Gift + Barcode
    await api.updateGiftDetails({
      estNo: Number(estNo),
      giftNo: giftNo || "0",
      collAmt: 0,
      barcodeFlag: barcodeFlag,
    });

    // 5. Record System Access Log
    logSystemDetails({
      userid: currentUser?.userid || currentUser?.id || currentUser?.user_id,
      framename: "CASH MARKING",
      operation: "SAVE_CASH_MARKING",
      description: `User submitted cash marking for estimate #${estNo}`,
      shopcode: shopcode || getCurrentShopCode(),
    });

    // 6. Success
    handleMessage("Cash marking updated successfully!", "success");

  } catch (error) {
    console.error("Cash marking submit failed:", error);
    handleMessage("Failed to submit data.", "error");
  }
};

  const handleCancel = () => {
    setEstNo("");
    setCustId("");
    setEstDate("");
    setGoldRate("");
    setCustName("");
    setPercentage("");
    setDmdDisRate("");
    setdiscountamt("");
    setRoundingAmt("");
    setSalesAmt("");
    setPurAmt("");
    setCrnAmt("");
    setSalesWt("");
    setPurWt("");
    setCrnWt("");
    setRadioSelection("rateva");
    setIsItemwiseChecked(false);
    setEntryDetailsData([]);
    setVaTableData([]);
    setTotals({
      previous: { taxable: "0.00", gst: "0.00", total: "0.00" },
      after: { taxable: "0.00", gst: "0.00", total: "0.00" },
      collected: { taxable: "0.00", gst: "0.00", total: "0.00" },
      totalGrossWt: "0.000",
    });
    setIsFormLocked(false);
    setItslnoList([]);
    setMessage(null);
  };

  const handleDmdDisRateChange = (val) => {
    const value = Number(val);
    if (value > dmdMinDisRate) {
      handleMessage("Diamond rate exceeds maximum allowed", "error");
      return;
    }
    setDmdDisRate(value);
  };

  const handleroundingAmt = (val) => setRoundingAmt(val);

  const saveRoundingAmount = async () => {
    if (!estNo) return;
    const rAmt = Number(roundingAmt) || 0;
    if (rAmt === 0) return;

    const payload = {
      username: username,
      estno: estNo,
      discountamt: Number(discountamt) || 0,
      roundoffamt: rAmt,
      salesamt: Number(salesAmt) || 0,
      puramt: Number(purAmt) || 0,
      crnamt: Number(crnAmt) || 0,
      saleswt: Number(salesWt) || 0,
      purwt: Number(purWt) || 0,
      crnwt: Number(crnWt) || 0,
    };
    try {
      await DiscountDetailsAPI(shopcode, username, password).create(payload);
    } catch {
      handleMessage("Failed to save rounding amount.", "error");
    }
  };

  const handleItemwiseChange = async (e) => {
    const checked = e.target.checked;
    setIsItemwiseChecked(checked);
    if (estNo) {
      try {
        const response = await api.getTransactionUpdateVaamt(estNo, checked);
        setVaTableData(response?.data || []);
      } catch {
        handleMessage("Failed to update VA table.", "error");
      }
    }
  };

  const handleAfterVaInputChange = (e, index) => {
    let value = Number(e.target.value) || 0;
    setVaTableData((prev) => {
      const copy = [...prev];
      const maxVa = Number(copy[index].estvaper) || 0;

      if (value > maxVa) {
        handleMessage(
          `After.VA% cannot exceed VA% (${maxVa}). Resetting to maximum.`,
          "error",
        );
        value = maxVa; // Default to max VA
      }

      copy[index] = { ...copy[index], aftervaper: value };
      return copy;
    });
  };

  return (
    <ModulePageLayout title="Cash Marking" navigate={navigate}>
      <div className="w-full space-y-6 animate-fade-in-up">
        {loading && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                Processing...
              </p>
            </div>
          </div>
        )}
        {/* Branch & Header Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-4 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/5">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Branch
              </span>
              <select
                value={shopcode}
                onChange={handleShopCodeChange}
                disabled={
                  !(
                    userRole.includes("ROLE_SUPERUSER") ||
                    userRole.includes("ROLE_SUPERADMIN")
                  )
                }
                className="premium-input py-1 px-3 w-28 sm:w-32 font-bold text-sky-600 dark:text-sky-400 text-xs sm:text-sm"
              >
                {shopcodes.map((item) => (
                  <option key={item.Shopcode} value={item.Shopcode}>
                    {item.Shopcode}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Date
              </span>
              <input
                type="date"
                value={estDate}
                disabled
                className="premium-input py-1 px-3 w-32 sm:w-40 bg-slate-100/50 dark:bg-slate-800/30 font-mono text-xs sm:text-sm font-bold"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={loadEstimate}
              disabled={isFormLocked}
              className={`btn-primary flex-1 sm:flex-none text-xs sm:text-sm ${isFormLocked ? "bg-slate-100 dark:bg-slate-800 text-slate-400 shadow-none" : ""}`}
            >
              OK
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary sm:flex-none flex-1"
            >
              Cancel
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Form Details */}
          <div className="lg:col-span-12">
            <div className="app-card p-6 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">
                    Estimate No.
                  </label>
                  <input
                    type="text"
                    value={estNo}
                    onChange={(e) => setEstNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        loadEstimate();
                      }
                    }}
                    disabled={isFormLocked}
                    inputMode="numeric"
                    placeholder="Enter No."
                    className="premium-input font-black text-base md:text-lg py-2.5 text-sky-600 dark:text-sky-400 tracking-tight w-full sm:w-32"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">
                    Gold Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      value={goldRate}
                      readOnly
                      className="premium-input pl-7 bg-slate-100/30 dark:bg-slate-800/20 font-mono text-right w-full sm:w-32 text-sm md:text-base"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">
                    Customer ID
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={custId}
                      placeholder="Search ID"
                      readOnly
                      onClick={async () => {
                        if (!custId)
                          return handleMessage(
                            "No Customer ID loaded.",
                            "error",
                          );
                        try {
                          const response = await getCustData(custId);
                          if (response?.data) {
                            setCustTableData(response.data);
                            setIsCustModalOpen(true);
                          } else {
                            handleMessage("Customer not found.", "error");
                          }
                        } catch {
                          handleMessage(
                            "Failed to load customer records.",
                            "error",
                          );
                        }
                      }}
                      className="premium-input bg-slate-100/30 dark:bg-slate-800/20 cursor-pointer font-mono hover:border-sky-400 transition-colors w-full sm:w-40 text-sm md:text-base"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Search className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest px-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={custName}
                    readOnly
                    placeholder="Customer Name"
                    className="premium-input bg-slate-100/30 dark:bg-slate-800/20 font-bold w-full sm:w-48 text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <MessagePopup
          open={message?.open}
          title={message?.type === "error" ? "Error" : "Success"}
          message={message?.text}
          type={message?.type}
          onClose={() => setMessage(null)}
        />

        {/* Radio Selection Group */}
        <div className="app-card p-6 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-800/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-4 sm:gap-8">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="vaOptions"
                className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 border-slate-300 focus:ring-slate-400/30 cursor-pointer"
                checked={radioSelection === "percentage"}
                onChange={() => handleRadioChange("percentage")}
                disabled={isFormLocked}
              />
              <span className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-600 transition-colors uppercase tracking-wider">
                Percentage Wise
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="vaOptions"
                className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 border-slate-300 focus:ring-slate-400/30 cursor-pointer"
                checked={radioSelection === "rateva"}
                onChange={() => handleRadioChange("rateva")}
                disabled={isFormLocked}
              />
              <span className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 group-hover:text-sky-600 transition-colors uppercase tracking-wider">
                Rate / VA Wise
              </span>
            </label>

            {radioSelection === "percentage" && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300 mt-2 sm:mt-0">
                <span className="text-[10px] sm:text-sm font-bold text-slate-500 uppercase tracking-widest">
                  Global %
                </span>
                <input
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  disabled={!isFormLocked}
                  inputMode="decimal"
                  placeholder="%"
                  className="premium-input py-1 px-3 w-16 sm:w-20 text-center font-bold text-sky-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* After VA Calculation Table Section */}
        <div className="app-card p-6 shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-800/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                After VA Calculation
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-4 sm:mt-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                  DMD.Dis.Rate
                </span>
                <input
                  type="number"
                  value={dmdDisRate}
                  onChange={(e) => handleDmdDisRateChange(e.target.value)}
                  disabled={radioSelection !== "rateva" || !canEditDiamond}
                  inputMode="decimal"
                  className="premium-input py-1 px-3 w-28 font-mono text-sm"
                  placeholder="Rate"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isItemwiseChecked}
                    onChange={handleItemwiseChange}
                    disabled={radioSelection !== "rateva" || !canEditDiamond}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-sky-500 transition-colors duration-200" />
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-5" />
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-sky-600 transition-colors uppercase tracking-wider">
                  Item/Va Wise
                </span>
              </label>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-50/50 dark:bg-slate-900/50">
            <div className="overflow-x-auto relative max-h-[500px]">
              <table className="w-full text-sm md:text-base min-w-[1600px] lg:min-w-[2000px]">
                <thead className="sticky top-0 z-20 glass-header shadow-sm">
                  <tr className="modern-table-header">
                    <th className="px-4 py-3 text-center w-24">Image</th>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-right">VA%</th>
                    <th className="px-4 py-3 text-right w-[110px]">Aft.VA%</th>
                    <th className="px-4 py-3 text-left min-w-[180px]">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right">Qty</th>
                    <th className="px-4 py-3 text-right">Gross.Wt</th>
                    <th className="px-4 py-3 text-right">Stone.Wt</th>
                    <th className="px-4 py-3 text-right">Net.Wt</th>
                    <th className="px-4 py-3 text-right">St.Charge</th>
                    <th className="px-4 py-3 text-right">G.Rate</th>
                    <th className="px-4 py-3 text-right">G.Amount</th>
                    <th className="px-4 py-3 text-right font-bold text-emerald-100">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center">Slno</th>
                    <th className="px-4 py-3 text-left">Design</th>
                    <th className="px-4 py-3 text-left">Remarks</th>
                    <th className="px-4 py-3 text-center">Barcode</th>
                    <th className="px-4 py-3 text-center">Prev.Barcode</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                  {vaTableData.length > 0 ? (
                    vaTableData.map((row, index) => (
                      <tr
                        key={`${row.itslno}-${index}`}
                        className="hover:bg-sky-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-center">
                          {row.arra ? (
                            <img
                              src={`data:image/jpeg;base64,${row.arra}`}
                              alt="Item"
                              className="w-12 h-12 mx-auto object-cover rounded-md cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => {
                                setCurrentModalImage(
                                  `data:image/jpeg;base64,${row.arra}`,
                                );
                                setIsImageModalOpen(true);
                              }}
                            />
                          ) : (
                            <Image className="text-slate-300 text-xl mx-auto opacity-30" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm font-bold">
                          {row.esticode}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300 font-bold">
                          {fmtAmt(row.estvaper)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="premium-input py-1 px-2 w-full text-right text-sm font-bold"
                            value={row.aftervaper || ""}
                            inputMode="decimal"
                            disabled={
                              radioSelection === "percentage" || !isFormLocked
                            }
                            onChange={(e) => handleAfterVaInputChange(e, index)}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-medium max-w-[200px] truncate">
                          {row.estitemdesc}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {row.itemqty}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {fmtWt(row.estwt)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {fmtWt(row.est_stnwt)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {fmtWt(row.est_ntwt)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {fmtAmt(row.est_stnch)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {fmtAmt(row.est_rate)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {fmtAmt(row.est_gamt)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600 font-mono text-base">
                          {fmtAmt(row.esttotalamt)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold">
                          {row.itslno}
                        </td>
                        <td className="px-4 py-3 text-left text-sm font-medium truncate max-w-[120px]">
                          {row.description}
                        </td>
                        <td className="px-4 py-3 text-left text-sm font-medium truncate max-w-[120px]">
                          {row.remarks}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {row.barcode}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {row.prebarcode}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="18"
                        className="text-center py-12 text-slate-400 italic"
                      >
                        No estimate items loaded for this entry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Combined Entry Details & Final Totals Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 pb-20">
          <div className="md:col-span-5 lg:col-span-4">
            <div className="app-card p-4 lg:p-6 h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-slate-700/10 flex items-center justify-center">
                  <List className="w-5 h-5 text-slate-700 dark:text-slate-700" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                  Entry Details
                </h3>
              </div>
              <div className="space-y-2">
                {entryDetailsData.length > 0 ? (
                  <>
                    {entryDetailsData.map((row, idx) => (
                      <div
                        key={idx}
                        className="group relative overflow-hidden flex flex-row items-center gap-2 lg:gap-4 px-3 lg:px-4 py-3 lg:py-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 hover:border-slate-700 dark:hover:border-slate-700/50 hover:shadow-xl hover:shadow-slate-700/5 transition-all duration-300"
                      >
                        {/* Left Section: Type & Amount */}
                        <div className="flex flex-1 items-center gap-2 lg:gap-4">
                          <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-xl bg-slate-700 dark:bg-slate-700/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            {getEntryIcon(row.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[8px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] truncate">
                              {row.name}
                            </span>
                            <span
                              className={`text-xs md:text-sm lg:text-xl font-black font-mono tracking-tight truncate ${getAmt(row.amount) < 0 ? "text-rose-500" : "text-slate-900 dark:text-slate-100"}`}
                            >
                              {currencySymbol}
                              {fmtAmt(row.amount)}
                            </span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-8 lg:h-12 bg-slate-100 dark:bg-slate-700/50 mx-1 lg:mx-2" />

                        {/* Right Section: Gross Weight */}
                        <div className="flex flex-1 items-center gap-2 lg:gap-4">
                          <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-xl bg-slate-700 dark:bg-slate-700/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                            <Scale className="w-4 h-4 lg:w-5 lg:h-5 text-slate-700 dark:text-slate-700" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[8px] lg:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] truncate">
                              GROSS WT
                            </span>
                            <div className="flex items-baseline gap-0.5 lg:gap-1">
                              <span className="text-xs md:text-sm lg:text-xl font-black font-mono text-slate-900 dark:text-slate-100 truncate">
                                {fmtWt(row.gdwt || row.weight || row.wt)}
                              </span>
                              <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase">
                                g
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Display Accumulated Discount removed per user request */}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-500 italic text-sm">
                    Waiting for estimate...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-7 lg:col-span-8">
            <div className="app-card p-4 lg:p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg sm:text-xl">
                    Final Totals
                  </h3>
                </div>

                <div className="flex gap-4 w-full sm:w-auto">
                  <div className="space-y-1 w-full sm:w-auto">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1">
                      Discount
                    </span>
                    <input
                      type="text"
                      value={fmtAmt(discountamt)}
                      disabled
                      className="premium-input py-1 px-4 w-full sm:w-32 md:w-40 text-red-600 dark:text-red-400 font-black bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm sm:text-base md:text-lg text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3 mb-4">
                {/* Previous Totals Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-2 block">
                    Previous
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] lg:text-xs font-bold text-slate-400 dark:text-slate-600 uppercase">
                        Taxable
                      </span>
                      <span className="text-sm lg:text-base font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {currencySymbol}
                        {totals.previous.taxable}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] lg:text-xs font-bold text-slate-400 dark:text-slate-600 uppercase">
                        GST
                      </span>
                      <span className="text-sm lg:text-base font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {currencySymbol}
                        {totals.previous.gst}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/50">
                      <span className="text-[9px] lg:text-xs font-bold text-slate-500 uppercase block mb-0.5">
                        Total Amount
                      </span>
                      <div className="text-xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
                        {currencySymbol}
                        {totals.previous.total}
                      </div>
                    </div>
                  </div>
                </div>

                {/* After Totals Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-2 block">
                    After
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] lg:text-xs font-bold text-slate-400 dark:text-slate-600 uppercase">
                        Taxable
                      </span>
                      <span className="text-sm lg:text-base font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {currencySymbol}
                        {totals.after.taxable}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] lg:text-xs font-bold text-slate-400 dark:text-slate-600 uppercase">
                        GST
                      </span>
                      <span className="text-sm lg:text-base font-bold text-slate-700 dark:text-slate-300 font-mono">
                        {currencySymbol}
                        {totals.after.gst}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/50">
                      <span className="text-[9px] lg:text-xs font-bold text-slate-500 uppercase block mb-0.5">
                        Total Amount
                      </span>
                      <div className="text-xl lg:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
                        {currencySymbol}
                        {totals.after.total}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collected Totals Card */}
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/30 transition-all">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.3em] mb-2 block">
                    Collected
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] lg:text-xs font-bold text-emerald-600/50 uppercase">
                        Taxable
                      </span>
                      <span className="text-sm lg:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {currencySymbol}
                        {totals.collected.taxable}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-[9px] lg:text-xs font-bold text-emerald-600/50 uppercase">
                        GST
                      </span>
                      <span className="text-sm lg:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {currencySymbol}
                        {totals.collected.gst}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-emerald-500/20">
                      <span className="text-[9px] lg:text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase block mb-0.5">
                        Total Amount
                      </span>
                      <div className="text-xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-500 font-mono">
                        {currencySymbol}
                        {totals.collected.total}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission Buttons */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col w-full sm:w-auto">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1 mb-1">
                      Rounding Amount
                    </span>
                    <input
                      id="roundingAmtInput"
                      type="number"
                      step="0.00"
                      value={roundingAmt}
                      inputMode="decimal"
                      onChange={(e) => handleroundingAmt(e.target.value)}
                      placeholder="0.00"
                      className="premium-input py-2 px-4 w-full sm:w-32 md:w-40 text-sky-600 dark:text-sky-400 font-black bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm sm:text-lg text-center"
                    />
                  </div>
    <div className="flex flex-col w-full sm:w-auto">
  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-1 mb-1">
    Gift
  </span>

  <div className="relative group">
    <input
      type="text"
      value={giftNo}
      onChange={(e) => setGiftNo(e.target.value)}
      placeholder="Gift.No"
      className="premium-input py-2 px-4 pr-8 !w-28 text-sky-600 dark:text-sky-400 font-black bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-sm sm:text-lg text-center"
    />

<button
  type="button"
  className="absolute right-2 top-1/2 -translate-y-1/2"
  onClick={handleGiftLookup}
>
  <Search className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
</button>
  </div>
</div>

                  
                </div>

                <div className="flex flex-row items-center gap-3">
                  <label className="ml-auto flex items-center gap-3 cursor-pointer group">
                  <input
  type="checkbox"
  checked={barcodeFlag}
  onChange={(e) => setBarcodeFlag(e.target.checked)}
  className="w-4 h-4 sm:w-5 sm:h-5 accent-sky-600 cursor-pointer"
/>
                    <span className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider"></span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isFormLocked}
                    className="btn-primary sm:flex-none lg:px-10 hover:bg-sky-500 shadow-sky-500/20 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none sm:text-base flex-1"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!isFormLocked}
                    className="btn-secondary sm:flex-none flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 sm:text-base"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Customer History Modal */}
      {isCustModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
            <div className="bg-gradient-to-r from-slate-700 to-slate-700 text-white flex justify-between items-center px-8 py-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <FaSearchPlus className="text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight leading-none">
                    Customer History
                  </h2>
                  <p className="text-xs text-slate-700/70 mt-1 uppercase font-bold tracking-widest">
                    Transaction Records
                  </p>
                </div>
              </div>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all active:scale-90"
                onClick={() => setIsCustModalOpen(false)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-slate-900/50">
                <table className="w-full text-sm border-separate border-spacing-0">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 dark:bg-slate-800">
                      <th className="px-4 py-4 text-left font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        Date
                      </th>
                      <th className="px-4 py-4 text-left font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        ID
                      </th>
                      <th className="px-4 py-4 text-left font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        Branch
                      </th>
                      <th className="px-4 py-4 text-right font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        SL Wt
                      </th>
                      <th className="px-4 py-4 text-right font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        SL Amt
                      </th>
                      <th className="px-4 py-4 text-right font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        CR Wt
                      </th>
                      <th className="px-4 py-4 text-right font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        CR Amt
                      </th>
                      <th className="px-4 py-4 text-right font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        PU Wt
                      </th>
                      <th className="px-4 py-4 text-right font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        PU Amt
                      </th>
                      <th className="px-4 py-4 text-right font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {custTableData.length > 0 ? (
                      custTableData.map((row, index) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-700/30 dark:hover:bg-slate-700/10 transition-colors group"
                        >
                          <td className="px-4 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                            {row.date || "-"}
                          </td>
                          <td className="px-4 py-4 font-mono text-xs">
                            {row.custId || row.id || "-"}
                          </td>
                          <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-300">
                            {row.shopCode || "-"}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-slate-600">
                            {row.slWeight || "-"}
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600">
                            {row.slAmount || "-"}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-slate-600">
                            {row.crWeight || "-"}
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-rose-500">
                            {row.crAmount || "-"}
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-slate-600">
                            {row.puWeight || "-"}
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-sky-600">
                            {row.puAmount || "-"}
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-amber-600">
                            {row.creditAmount || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="10"
                          className="text-center py-24 text-slate-400 italic"
                        >
                          No historical records found for this customer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                className="btn-primary px-10 bg-slate-900 dark:bg-slate-700 font-black shadow-xl shadow-slate-700/20 hover:shadow-slate-700/40"
                onClick={() => setIsCustModalOpen(false)}
              >
                CLOSE PORTAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Lightbox Preview */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[110] p-6 sm:p-12 animate-in fade-in duration-500"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="relative w-full h-full flex items-center justify-center group"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn-danger absolute top-0 right-0 w-14 h-14 bg-white/5 hover:bg-rose-500 active:scale-90 shadow-2xl group-hover:scale-110"
              onClick={() => setIsImageModalOpen(false)}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={currentModalImage}
              alt="Item Preview"
              className="max-h-full max-w-full object-contain shadow-[0_0_100px_rgba(255,255,255,0.1)] rounded-3xl animate-in zoom-in duration-500 ring-1 ring-white/20"
            />
          </div>
        </div>
      )}

{/* Gift Lookup Modal */}
{isGiftLookupOpen && (
  <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 animate-in fade-in duration-300">
<div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-700 text-white flex justify-between items-center px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Search className="text-xl" />
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight leading-none">
              Gift Lookup
            </h2>

            <p className="text-xs text-slate-300 mt-1 uppercase font-bold tracking-widest">
              Gift Records
            </p>
          </div>
        </div>

        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all active:scale-90"
          onClick={() => setIsGiftLookupOpen(false)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8 bg-slate-50/50 dark:bg-slate-950/50">

        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-slate-900/50">

<table className="w-full max-w-md mx-auto text-sm border-separate border-spacing-0">            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 dark:bg-slate-800">

                <th className="px-3 py-2 text-left font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                  Gift Code
                </th>

                <th className="px-3 py-2 text-left font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px] border-b border-slate-100 dark:border-slate-800">
                  Gift Name
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

              {giftLookupData.length > 0 ? (
                giftLookupData.map((gift, index) => (
                  <tr
                    key={`${gift.giftCode}-${index}`}
                    onClick={() => {
                      setGiftNo(gift.giftCode);
                      setIsGiftLookupOpen(false);
                    }}
                    className="hover:bg-slate-700/30 dark:hover:bg-slate-700/10 transition-colors group cursor-pointer"
                  >

                    <td className="px-3 py-2 font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                      {gift.giftCode}
                    </td>

                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">
                      {gift.giftName}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="2"
                    className="text-center py-24 text-slate-400 italic"
                  >
                    No gift records found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">

        <button
          type="button"
          className="btn-primary px-10 bg-slate-900 dark:bg-slate-700 font-black shadow-xl shadow-slate-700/20 hover:shadow-slate-700/40"
          onClick={() => setIsGiftLookupOpen(false)}
        >
          CLOSE PORTAL
        </button>

      </div>

    </div>
  </div>
)}

      <ModernConfirmModal
        isOpen={confirmManagerDiscount.isOpen}
        title="Manager Discount"
        message={confirmManagerDiscount.message}
        onConfirm={() => {
          setConfirmManagerDiscount({
            ...confirmManagerDiscount,
            isOpen: false,
          });
          proceedLoad(confirmManagerDiscount.data);
          setTimeout(
            () => document.getElementById("roundingAmtInput")?.focus(),
            100,
          );
        }}
        onCancel={() => {
          setConfirmManagerDiscount({
            ...confirmManagerDiscount,
            isOpen: false,
          });
        }}
      />
    </ModulePageLayout>
  );
};

export default CashMarking;
