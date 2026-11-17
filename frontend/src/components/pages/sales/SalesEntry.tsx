import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { validateEstimateSubmission } from "../../../utils/billingSchemas";
import { SalesService } from "../../../services/SalesEntryApi";
import {
  getDefaultShopCode,
  getCrmPhoneno,
  getCustData,
  findCrmByCustId,
  createCrmCustomer,
  updateCrmCustomer,
} from "../../../services/ShopAPI";
import { useLookup, lookupConfigs } from "../../common/LookupContext";
import ModulePageLayout from "../../layout/ModulePageLayout";
import MessagePopup from "../../common/MessagePopup";
import ModernConfirmModal from "../../common/ModernConfirmModal";
import {
  getCurrentShopCode,
  getPhoneMinLength,
  getPhoneMaxLength,
  getPhoneFixedLength,
} from "../../../utils/session";
import { HeaderData, SalesRow, StoneRow } from "../../../models/SalesRow";
import {
  getAmt,
  getNo,
  getQty,
  getWt,
  fmtAmt,
  fmtNo,
  fmtQty,
  fmtWt,
  toNum,
  limitDecimals,
} from "../../../utils/format";
import {
  calculateRowSalesTotals,
  calculateStoneTotals,
  calculateAddDed as sharedCalculateAddDed,
  calculateStoneAmount,
} from "../../../utils/SharedBillingCalculator";
import {
  Gem,
  Users,
  UserCheck,
  User,
  Search,
  Trash2,
  Printer,
  Save,
  PlusCircle,
  X,
  Edit3,
  Plus,
  ChevronDown,
  Sliders,
  FileText,
  CreditCard,
  ShoppingBag,
  Camera,
} from "lucide-react";
import CreditSales from "./CreditSales";
import Purchase from "./Purchase";
import Advance from "./Advance";
import SalesTotalsPanel from "./SalesTotalsPanel";
import DynamicQueryService from "../../../services/DynamicQueryApi";
import BarcodeScanner from "../../common/BarcodeScanner";
import { tableTypography } from "../../../utils/tableTypography";

const SalesEntry = () => {
  const navigate = useNavigate();
  const { showLookup } = useLookup();

  const headerRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const salesRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const barcodeRef = useRef<HTMLInputElement | null>(null);
  const stoneRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const stoneTableRef = useRef<HTMLDivElement | null>(null);
  const newBtnRef = useRef<HTMLButtonElement | null>(null);
  const plusBtnRef = useRef<HTMLButtonElement | null>(null);
  const stonePlusBtnRef = useRef<HTMLButtonElement | null>(null);
  const isValidatingItemRef = useRef(false);
  const isValidatingStoneRef = useRef(false);
  const isValidatingSalesmanRef = useRef(false);
  // Auto-CRM-fetch refs
  const phoneDebounceRef = useRef<any>(null); // debounce timer
  const lastFetchedPhoneRef = useRef(""); // tracks last fetched phone to avoid duplicate calls

  // Feature Flags - Toggle these to enable/disable features globally
  const featureFlags = {
    canModify: true,
    canDelete: true,
    canPrint: true,
  };

  const [isStonecodeEnable, seIsStonecodeEnable] = useState(false);
  const lastValidatedItemCodeRef = useRef("");

  // State
  const [isFormEnabled, setIsFormEnabled] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [creditNoteGrid, setCreditNoteGrid] = useState<any[]>([]);
  const [purchaseGrid, setPurchaseGrid] = useState<any[]>([]);
  const [isNewDisabled, setIsNewDisabled] = useState(false);
  const [isModifyDisabled, setIsModifyDisabled] = useState(false);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isCancelDisabled, setIsCancelDisabled] = useState(true);
  const [isEstNoLocked, setIsEstNoLocked] = useState(false);
  const [actionStatus, setActionStatus] = useState("NONE");
  const [isSalesmanFocused, setIsSalesmanFocused] = useState(false);
  interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
    onCancel?: (() => void) | null;
    isDestructive?: boolean;
  }
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    isDestructive: false,
  });
  const pieceModalRef = useRef<any>(null);
  const lastAttemptedEstNoRef = useRef<string>("");
  const isProcessingEstNoRef = useRef<boolean>(false);
  const estNoDebounceTimerRef = useRef<any>(null);
  const [activeTab, setActiveTab] = useState("SALES");
  const [showAdvance, setShowAdvance] = useState(false);
  const [advanceGrid, setAdvanceGrid] = useState<any[]>([]);
  const [isDirectCreditNote, setIsDirectCreditNote] = useState(false);

  const [barWtDiffLimit, setBarWtDiffLimit] = useState(0);
  const [headerData, setHeaderData] = useState<HeaderData>({
    estNo: "",
    estDate: new Date().toISOString().split("T")[0],
    gRate: "",
    goldSlv: "GOLD",
    gstPer: "3.00",
    igstPer: "0.00",
    applyIgst: false,
    custId: "",
    custName: "",
    phone: "",
    address1: "",
    address2: "",
    place: "",
    pincode: "",
    email: "",
    aadhar: "",
    pan: "",
    gstNo: "",
    careOf: "",
    salesman: "",
    salesmanName: "",
    shopCode: "", // Will be loaded from API
    rateFix: false, // Rate Fix Checkbox default false
    printEstimate: false, // true => E, false => T
    barFlag: false, // Barcode flag checkbox (manual only)
  });

  const isGridEnabled =
    isFormEnabled && !!(headerData.careOf && headerData.careOf.trim() !== "");

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const salesEmpty = {
    barcode: "",
    itemCode: "",
    itemDesc: "",
    cntr: "",
    actualWt: "0.000",
    noded: "0",
    wtAdd: "0.000",
    wtDed: "0.000",
    qty: "1",
    grossWt: "0.000",
    stoneWt: "0.000",
    netWt: "0.000",
    vaPer: "0.00",
    mkRate: "0.00",
    vaAmt: "0.00",
    stnChg: "0.00",
    goldAmt: "0.00",
    amount: "0.00",
    estRate: "0.00",
    slNo: "1",
    sMan: "",
    isDiamond: false,
    origQty: "0",
    billType: "G", // Default to Gold/General
    wastage: "0.000",
  };
  const [salesRow, setSalesRow] = useState<SalesRow>(salesEmpty);

  const [salesGrid, setSalesGrid] = useState<SalesRow[]>([]);

  const clearSalesFields = () => {
    setSalesRow(salesEmpty);
    lastValidatedItemCodeRef.current = "";
    setStoneGrid([]);
  };

  const stoneEmpty = {
    sNo: "1",
    stoneCode: "",
    color: "",
    qty: "0",
    wt: "0.000",
    rate: "0.00",
    amount: "0.00",
    dtype: "Y", // Deductible flag (Column 8 in Java)
  };
  const [stoneRow, setStoneRow] = useState<StoneRow>(stoneEmpty);

  const [stoneGrid, setStoneGrid] = useState<StoneRow[]>([]);

  const salesmanEmpty = {
    smCode: "",
    smName: "",
  };
  const [salesmanRow, setSalesmanRow] = useState(salesmanEmpty);
  const [salesmanGrid, setSalesmanGrid] = useState<any[]>([]);
  const [availableEstNos, setAvailableEstNos] = useState<any[]>([]);

  // Row Action State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [clickedRowIndex, setClickedRowIndex] = useState<number | null>(null);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null); // Track which row is being edited

  const [showScanner, setShowScanner] = useState(false);
  const [isScannerEnabled, setIsScannerEnabled] = useState(false);

  // Salesman Action States
  const [isSmanActionModalOpen, setIsSmanActionModalOpen] = useState(false);
  const [clickedSmanIndex, setClickedSmanIndex] = useState<number | null>(null);

  const [isMetalLocked, setIsMetalLocked] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);

  const [lastTapIndex, setLastTapIndex] = useState<number | null>(null);
  const [lastInputTap, setLastInputTap] = useState({ field: null, time: 0 }); // New state for input double-tap
  const [isManualVaPerEdit, setIsManualVaPerEdit] = useState(false);
  const isDummyBarcode =
    (salesRow.barcode || "").trim() === "0000000000" ||
    !(salesRow.barcode || "").trim();

  const getAvailableSalesmanCodes = () =>
    (salesmanGrid || [])
      .map((sm) =>
        String(sm?.smCode || sm?.salesmancode || "")
          .trim()
          .toUpperCase(),
      )
      .filter(Boolean);

  const resolveSelectedSalesman = (preferred = "") => {
    const availableCodes = getAvailableSalesmanCodes();
    const preferredCode = String(preferred || "")
      .trim()
      .toUpperCase();
    const headerCode = String(headerData.salesman || "")
      .trim()
      .toUpperCase();

    if (
      preferredCode &&
      (availableCodes.length === 0 || availableCodes.includes(preferredCode))
    ) {
      return preferredCode;
    }
    if (
      headerCode &&
      (availableCodes.length === 0 || availableCodes.includes(headerCode))
    ) {
      return headerCode;
    }
    return availableCodes[availableCodes.length - 1] || "";
  };

  // Keep selected salesman defaulted to the LAST added salesman
  useEffect(() => {
    const availableCodes = getAvailableSalesmanCodes();
    if (availableCodes.length === 0) return;
    const lastSalesmanCode = availableCodes[availableCodes.length - 1];
    setSalesRow((prev) => ({ ...prev, sMan: lastSalesmanCode }));
  }, [salesmanGrid]);

  const calculateAddDed = (row) => {
    const { updatedRow, errorMsg } = sharedCalculateAddDed(row, barWtDiffLimit);

    if (errorMsg) {
      showPopupMessage(errorMsg, "Warning");
    }

    // 2. Recalculate Totals (Ensures correct billing on weight change)
    const finalGross = getWt(updatedRow.grossWt);
    const finalStone = getWt(updatedRow.stoneWt);
    const finalNet = finalGross - finalStone;

    const goldRate = getAmt(headerData.gRate);
    const vaPer = getAmt(updatedRow.vaPer);
    const stnChg = getAmt(updatedRow.stnChg);

    const goldAmt = finalNet * goldRate;
    const vaAmt = goldAmt * (vaPer / 100);
    const totalTaxable = goldAmt + vaAmt + stnChg;

    updatedRow.netWt = fmtWt(finalNet);
    updatedRow.goldAmt = fmtAmt(goldAmt);
    updatedRow.vaAmt = fmtAmt(vaAmt);
    updatedRow.amount = fmtAmt(totalTaxable);

    return updatedRow;
  };

  const handleFieldFocus = (
    e: React.FocusEvent<HTMLInputElement>,
    customFn?: () => void,
  ) => {
    const target = e.target;
    if (target && target.select && !target.readOnly) {
      setTimeout(() => {
        target.select();
      }, 0);
    }
    if (customFn) {
      customFn();
    }
  };

  const shouldRestoreBarcodeFocus = () =>
    document.activeElement === salesRefs.current["barcode"];

  // Piece Modal States
  const [isPieceModalOpen, setIsPieceModalOpen] = useState(false);
  const [pieceAmountInput, setPieceAmountInput] = useState("");

  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("Sales Entry");
  const [popupType, setPopupType] = useState("info");
  const [popupCloseCallback, setPopupCloseCallback] = useState<(() => void) | null>(null);
  const [pendingPrintAfterEstSelect, setPendingPrintAfterEstSelect] =
    useState(false);
  const [pendingPrintType, setPendingPrintType] = useState("T");

  const showPopupMessage = (
    message,
    title = "Sales Entry",
    type = "info",
    focusElement?: any,
    onCloseCallback?: () => void,
  ) => {
    // Capture currently focused element so we can return to it when popup closes
    if (focusElement !== undefined) {
      setLastField(focusElement);
    } else if (
      document.activeElement &&
      document.activeElement.tagName !== "BODY"
    ) {
      setLastField(document.activeElement);
    }
    setPopupTitle(title);
    setPopupMessage(String(message || "").trim());
    setPopupType(type);
    if (onCloseCallback) {
      setPopupCloseCallback(() => onCloseCallback);
    } else {
      setPopupCloseCallback(null);
    }
  };
  const [lastField, setLastField] = useState<any>(null);
  const [editingStoneIndex, setEditingStoneIndex] = useState<number | null>(
    null,
  );
  const [isScrolled, setIsScrolled] = useState(false);

  const resolveActiveShopCode = () =>
    String(getCurrentShopCode() || headerData.shopCode || "")
      .trim()
      .toUpperCase();

  // Effects
  useEffect(() => {
    // Focus New button on mount
    if (newBtnRef.current) {
      newBtnRef.current.focus();
    }

    const handleScroll = () => {
      // Set to true if scrolled more than 50px
      const shouldBeScrolled = window.scrollY > 50;
      if (shouldBeScrolled !== isScrolled) {
        setIsScrolled(shouldBeScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isScrolled]);

  // Synchronize stonecode enablement state with row's item code presence
  useEffect(() => {
    seIsStonecodeEnable(!!salesRow.itemCode);
  }, [salesRow.itemCode]);

  // Effect to calculate Stone Amount
  useEffect(() => {
    const newAmount = calculateStoneAmount(stoneRow);
    if (stoneRow.amount !== newAmount) {
      setStoneRow((prev) => ({ ...prev, amount: newAmount }));
    }
  }, [stoneRow.qty, stoneRow.wt, stoneRow.rate, stoneRow.color]);

  // Calculate stone totals using the shared utility

  // Synchronize stone totals into sales row
  useEffect(() => {
    if (stoneGrid.length === 0) return;

    const { totalWt, totalAmt } = calculateStoneTotals(stoneGrid);
    setSalesRow((prev) => ({
      ...prev,
      stoneWt: fmtWt(totalWt),
      stnChg: fmtAmt(totalAmt),
    }));
  }, [stoneGrid]);

  // Calculations - matches Java calculateRowSalesTotals logic exactly
  useEffect(() => {
    const calculated = calculateRowSalesTotals(
      salesRow,
      headerData,
      isManualVaPerEdit,
    );

    // 6. Update State
    setSalesRow((prev) => {
      const updates: any = {};

      // Note: We do NOT update prev.stoneWt here to prevent an infinite calculation feedback loop on diamond items.
      // Physical stoneWt is determined solely by the stoneGrid totals.

      const newNetWt = fmtWt(calculated.goldWt);
      if (fmtWt(prev.netWt) !== newNetWt) updates.netWt = newNetWt;

      const newGoldAmt = fmtAmt(calculated.goldAmt);
      if (fmtAmt(prev.goldAmt) !== newGoldAmt) updates.goldAmt = newGoldAmt;

      const newVaAmt = fmtAmt(calculated.vaAmt);
      if (toNum(prev.vaAmt || 0) !== getAmt(newVaAmt)) {
        updates.vaAmt = newVaAmt;
      } else if (prev.vaAmt === "" && getAmt(newVaAmt) !== 0) {
        updates.vaAmt = newVaAmt;
      }

      const newVaPer = isManualVaPerEdit
        ? prev.vaPer
        : fmtAmt(calculated.finalVaPer);
      if (toNum(prev.vaPer || 0) !== getAmt(newVaPer)) {
        updates.vaPer = newVaPer;
      } else if (prev.vaPer === "" && getAmt(newVaPer) !== 0) {
        updates.vaPer = newVaPer;
      }

      const newAmount = fmtAmt(calculated.totalAmount);
      if (toNum(prev.amount || 0) !== getAmt(newAmount))
        updates.amount = newAmount;

      if (Object.keys(updates).length > 0) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  }, [
    salesRow.grossWt,
    salesRow.stoneWt,
    salesRow.actualWt,
    salesRow.wastage,
    salesRow.mkRate,
    salesRow.vaPer,
    salesRow.stnChg,
    salesRow.vaAmt,
    headerData.gRate,
    salesRow.baseGrossWt,
    salesRow.itemDesc,
    isManualVaPerEdit,
  ]);

  const validateMakingCharge = () => {
    const mkchg = getAmt(salesRow.mkRate);
    const goldRte = getAmt(headerData.gRate);

    if (mkchg > 0 && mkchg < goldRte) {
      showPopupMessage(
        "Making Charge less than Gold Rate.",
        "Warning",
        "error",
      );

      salesRefs.current["mkRate"]?.focus();

      return false;
    }

    return true;
  };

  // Switch away from Credit Note tab and clear grid if Barcode mode is turned on
  useEffect(() => {
    if (headerData.barFlag) {
      if (activeTab === "CREDIT_NOTE") {
        setActiveTab("SALES");
      }
      if (creditNoteGrid.length > 0) {
        setCreditNoteGrid([]);
      }
    }
  }, [headerData.barFlag, activeTab, creditNoteGrid.length]);

  // Fetch server date from goldrate table (matches Java setServerDate)
  const fetchServerDate = async (activeShopCode: string) => {
    if (!activeShopCode) return new Date().toISOString().split("T")[0];
    try {
      const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
      const res = await DynamicQueryService.fetchList(
        "SELECT today FROM goldrate",
        {},
        auth,
        activeShopCode,
      );
      if (Array.isArray(res?.data) && res.data.length > 0) {
        const todayVal = res.data[0].today || res.data[0].TODAY;
        if (todayVal) {
          return String(todayVal).split("T")[0];
        }
      }
    } catch (err) {
      console.warn("Failed to fetch server date from goldrate", err);
    }
    return new Date().toISOString().split("T")[0];
  };

  // Initialize Shop Code
  useEffect(() => {
    const fetchShopCode = async () => {
      try {
        const code = resolveActiveShopCode() || (await getDefaultShopCode());

        if (code) {
          const upperCode = String(code).trim().toUpperCase();
          setHeaderData((prev) => ({
            ...prev,
            shopCode: upperCode,
            estDate: new Date().toISOString().split("T")[0], // Show System Date on frame open
          }));
        }
      } catch (err: any) {
        console.error("Failed to fetch default shop code", err);
      }
    };
    fetchShopCode();
  }, []);

  // Keep Sales Entry shop code in sync with current switched shop code.
  useEffect(() => {
    const syncShopCodeFromSession = () => {
      const sessionShopCode = String(getCurrentShopCode() || "")
        .trim()
        .toUpperCase();
      if (!sessionShopCode) return;
      setHeaderData((prev) =>
        prev.shopCode === sessionShopCode
          ? prev
          : { ...prev, shopCode: sessionShopCode },
      );
    };

    syncShopCodeFromSession();
    window.addEventListener("focus", syncShopCodeFromSession);
    return () => window.removeEventListener("focus", syncShopCodeFromSession);
  }, []);

  // Check if Barcode Scanner should be enabled
  useEffect(() => {
    const checkScannerEnabled = async () => {
      const activeShopCode = resolveActiveShopCode();
      if (!activeShopCode) return;
      const currentUser =
        JSON.parse(sessionStorage.getItem("currentUser") || "{}") || {};
      const username = currentUser.username || "";
      const password = currentUser.password || "";
      // Don't fire if credentials are missing — backend will return 400
      if (!username || !password) return;
      try {
        const query =
          "SELECT * FROM setdiscount WHERE details = 'BARCODE CAMERA' AND flag = true";
        const result = await DynamicQueryService.fetchList(
          query,
          {},
          { username, password },
          activeShopCode,
        );
        setIsScannerEnabled(
          Array.isArray(result?.data) && result.data.length > 0,
        );
      } catch (error: any) {
        console.error("Failed to check scanner availability", error);
        setIsScannerEnabled(false);
      }
    };
    checkScannerEnabled();
  }, [headerData.shopCode]);

  // Sync Salesman from header to sales row only if input row is empty.
  useEffect(() => {
    const headerCode = String(headerData.salesman || "")
      .trim()
      .toUpperCase();
    if (!headerCode) return;
    setSalesRow((prev) => {
      const currentCode = String(prev.sMan || "")
        .trim()
        .toUpperCase();
      if (currentCode) return prev;
      return { ...prev, sMan: headerCode };
    });
  }, [headerData.salesman]);

  useEffect(() => {
    const qty = getQty(stoneRow.qty);
    const wt = getWt(stoneRow.wt);
    const rate = getAmt(stoneRow.rate);
    const amt = wt > 0 ? wt * rate : qty * rate;
    setStoneRow((prev) => ({ ...prev, amount: fmtAmt(amt) }));
  }, [stoneRow.qty, stoneRow.wt, stoneRow.rate]);

  // Check if estimate is already billed (sbillmstr, pbillmstr, crn_billmstr)
  const checkEstimateIsBilled = async (estNo) => {
    const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
    const shopCode = resolveActiveShopCode();
    try {
      const [salesRes, purchaseRes, crnRes] = await Promise.all([
        DynamicQueryService.fetchList(
          `SELECT * FROM sbillmstr WHERE est_no = :estNo`,
          { estNo: Number(estNo) },
          auth,
          shopCode,
        ),
        DynamicQueryService.fetchList(
          `SELECT * FROM pbillmstr WHERE est_no = :estNo`,
          { estNo: Number(estNo) },
          auth,
          shopCode,
        ),
        DynamicQueryService.fetchList(
          `SELECT * FROM crn_billmstr WHERE est_no = :estNo`,
          { estNo: Number(estNo) },
          auth,
          shopCode,
        ),
      ]);

      console.log("🔍 checkEstimateIsBilled results:", {
        sbillmstr: salesRes?.data,
        pbillmstr: purchaseRes?.data,
        crn_billmstr: crnRes?.data,
      });

      const hasRows = (res) => {
        const d = res?.data;
        if (Array.isArray(d) && d.length > 0) return true;
        if (d === true) return true;
        if (
          typeof d === "object" &&
          d !== null &&
          !Array.isArray(d) &&
          Object.keys(d).length > 0
        )
          return true;
        return false;
      };

      const isBilled =
        hasRows(salesRes) || hasRows(purchaseRes) || hasRows(crnRes);
      console.log("🔍 Is Billed:", isBilled);
      return isBilled;
    } catch (e) {
      console.error("checkEstimateIsBilled failed", e);
      return false;
    }
  };

  // API Fetch
  const fetchData = async (
    estNo,
    showNotFoundMessage = true,
    skipBilledCheck = false,
  ) => {
    if (!estNo) return false;
    const auth = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
    const activeShopCode = resolveActiveShopCode();
    const rawLoadedEstNo = String(estNo ?? "").trim();
    const safeLoadedEstNo = rawLoadedEstNo.replace(/'/g, "''");
    const numericLoadedEstNo = Number(rawLoadedEstNo);
    const hasNumericEstNo =
      Number.isFinite(numericLoadedEstNo) && numericLoadedEstNo > 0;

    const normalizeRows = (res) => {
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res?.data?.data)) return res.data.data;
      if (Array.isArray(res?.data?.result)) return res.data.result;
      if (Array.isArray(res?.data?.rows)) return res.data.rows;
      if (typeof res?.data === "string") {
        try {
          const parsed = JSON.parse(res.data);
          if (Array.isArray(parsed)) return parsed;
          if (Array.isArray(parsed?.data)) return parsed.data;
          if (Array.isArray(parsed?.result)) return parsed.result;
          if (Array.isArray(parsed?.rows)) return parsed.rows;
          if (parsed && typeof parsed === "object") return [parsed];
        } catch (e) { }
      }
      if (res?.data && typeof res.data === "object") return [res.data];
      return [];
    };

    try {
      // Parallelize Billed Check and Main Estimate Entry Fetch
      const [isBilled, response] = await Promise.all([
        skipBilledCheck
          ? Promise.resolve(false)
          : checkEstimateIsBilled(estNo),
        SalesService.getEntry(estNo, activeShopCode).catch((err) => {
          console.error("Failed to fetch estimate entry:", err);
          return { data: null };
        }),
      ]);

      if (isBilled) {
        showPopupMessage(
          "This Estimate is Already Billed",
          "Warning Message",
          "warning",
        );
        setTimeout(() => headerRefs.current["estNo"]?.focus(), 100);
        return "BILLED";
      }

      const rawData = response?.data;
      const data = Array.isArray(rawData) ? rawData[0] : rawData;
      console.log("??? DEBUG - Estimate Response Data:", data);

      if (data) {
        // --- Metal Type Validation Guard ---
        const rawMetalVal =
          data.goldSlv ||
          data.goldslv ||
          data.gold_slv ||
          (data.estmstr &&
            (data.estmstr.goldSlv ||
              data.estmstr.goldslv ||
              data.estmstr.gold_slv)) ||
          "";
        const normalizedMetal = String(rawMetalVal).trim().toUpperCase();
        const estMetalType =
          normalizedMetal === "S" || normalizedMetal === "SILVER"
            ? "SILVER"
            : "GOLD";

        if (estMetalType !== headerData.goldSlv) {
          showPopupMessage(
            `Estimate #${estNo} is a ${estMetalType} estimate, but ${headerData.goldSlv} is currently selected!`,
            "Metal Type Mismatch",
            "warning",
          );
          setHeaderData((prev) => ({ ...prev, estNo: "" }));
          setTimeout(() => headerRefs.current["estNo"]?.focus(), 100);
          return false;
        }

        // --- Check for Direct Credit Note Estimate ---
        try {
          const directSqlCandidates = [
            `SELECT * FROM crnest WHERE est_no='${safeLoadedEstNo}' AND UPPER(COALESCE(huid, ''))='DIRECT'`,
            hasNumericEstNo
              ? `SELECT * FROM crnest WHERE est_no=${numericLoadedEstNo} AND UPPER(COALESCE(huid, ''))='DIRECT'`
              : null,
            `SELECT * FROM crnest WHERE estno='${safeLoadedEstNo}' AND UPPER(COALESCE(huid, ''))='DIRECT'`,
            hasNumericEstNo
              ? `SELECT * FROM crnest WHERE estno=${numericLoadedEstNo} AND UPPER(COALESCE(huid, ''))='DIRECT'`
              : null,
          ].filter(Boolean);

          let directRows = [];
          const directResults = await Promise.all(
            directSqlCandidates.map((sql) =>
              DynamicQueryService.fetchList(sql, {}, auth, activeShopCode).catch(
                () => null,
              ),
            ),
          );
          for (const res of directResults) {
            const rows = normalizeRows(res);
            if (rows.length > 0) {
              directRows = rows;
              break;
            }
          }

          if (directRows.length > 0) {
            setIsDirectCreditNote(true);
            showPopupMessage(
              "Direct Credit Note Estimate",
              "Warning",
              "warning",
            );
            setActiveTab("CREDIT_NOTE");
          } else {
            setIsDirectCreditNote(false);
          }
        } catch (directErr) {
          console.error("Error checking direct credit note:", directErr);
          setIsDirectCreditNote(false);
        }

        // Find Values with deep search and sanitization
        const findVal = (obj, keys) => {
          if (!obj) return undefined;
          for (const k of keys) {
            let val = obj[k];
            if (val !== undefined && val !== null) {
              // Sanitize strings like "3.00%"
              if (typeof val === "string") val = val.replace(/[^\d.-]/g, "");
              return val;
            }
          }
          // Check nested estmstr if available
          if (obj.estmstr && typeof obj.estmstr === "object") {
            return findVal(obj.estmstr, keys);
          }
          return undefined;
        };

        const taxKeys = [
          "estIgstper",
          "estigstper",
          "est_igstper",
          "estIgstPer",
          "igstper",
          "igst_per",
          "igst_percent",
          "est_igst_per",
        ];
        const gstKeys = [
          "estGstper",
          "estgstper",
          "est_gstper",
          "estGstPer",
          "gstper",
          "gst_per",
          "gst_percent",
          "est_gst_per",
        ];

        const rawIgst = findVal(data, taxKeys);
        const rawGst = findVal(data, gstKeys);

        const hasIgst = getAmt(rawIgst) > 0;
        const hasGst = getAmt(rawGst) > 0;

        setHeaderData((prev) => ({
          ...prev, // Preserve shopCode
          estNo:
            data.estNo ||
            data.estno ||
            data.est_no ||
            (data.estmstr &&
              (data.estmstr.estNo ||
                data.estmstr.estno ||
                data.estmstr.est_no)) ||
            prev.estNo,
          estDate:
            data.estDte ||
            data.estdte ||
            data.est_dte ||
            (data.estmstr &&
              (data.estmstr.estDte ||
                data.estmstr.estdte ||
                data.estmstr.est_dte)) ||
            new Date().toISOString().split("T")[0],
          gRate: fmtAmt(
            findVal(data, ["estGrate", "estgrate", "est_grate", "grate"]),
          ),
          goldSlv: prev.goldSlv,
          gstPer: fmtAmt(hasIgst ? "0.00" : hasGst ? rawGst : "3.00"),
          igstPer: fmtAmt(rawIgst || "0.00"),
          applyIgst: hasIgst,
          custId: data.custid || data.custId || data.cust_id || "",
          custName: data.estCunm || data.estcunm || data.est_cunm || "",
          phone: data.estPhone || data.estphone || data.est_phone || "",
          address1: data.estAdd1 || data.estadd1 || data.est_add1 || "",
          address2: data.estAdd2 || data.estadd2 || data.est_add2 || "",
          place: data.estAdd3 || data.estadd3 || data.est_add3 || "",
          pincode: data.estPin || data.estpin || data.est_pin || "",
          aadhar: data.aadharno || data.aadhar || data.aadhar_no || "",
          pan: data.panno || data.pan || data.pan_no || "",
          gstNo: data.gstno || data.gstNo || data.gst_no || prev.gstNo || "",
          careOf:
            data.careofcode ||
            data.care_of_code ||
            data.careoff ||
            data.careof ||
            data.care_of ||
            "",
          salesman: data.estSman1 || data.estsman1 || data.est_sman1 || "",
        }));

        const custIdVal = data.custid || data.custId || data.cust_id || "";
        const phoneVal = data.estPhone || data.estphone || data.est_phone || "";
        if (custIdVal || phoneVal) {
          setTimeout(async () => {
            try {
              let crmData: any = null;
              if (phoneVal) {
                crmData = await getCrmPhoneno(phoneVal, activeShopCode);
              }
              if (!crmData && custIdVal) {
                crmData = await getCustData(custIdVal);
              }
              if (crmData && custIdVal && (!crmData.name && !crmData.custName && !crmData.estCunm)) {
                try {
                  let localCust = await getCustData(custIdVal);
                  if (
                    !localCust ||
                    (!localCust.name && !localCust.custName && !localCust.estCunm)
                  ) {
                    localCust = await findCrmByCustId(custIdVal);
                  }
                  if (localCust && (localCust.name || localCust.custName || localCust.estCunm)) {
                    crmData = {
                      ...localCust,
                      ...crmData,
                      name: localCust.name || localCust.custName || localCust.estCunm || ""
                    };
                  }
                } catch (err) {
                  console.warn("Failed fallback inside loadEstimateData:", err);
                }
              }
              if (crmData) {
                setHeaderData((prev) => {
                  const resolvedAadhar =
                    prev.aadhar && prev.aadhar !== "0"
                      ? prev.aadhar
                      : crmData.aadhar || crmData.aadharno || "";
                  const resolvedPan =
                    prev.pan && prev.pan !== "0"
                      ? prev.pan
                      : crmData.pan || crmData.panNo || crmData.panno || "";
                  const resolvedGst =
                    prev.gstNo && prev.gstNo !== "0"
                      ? prev.gstNo
                      : crmData.gstin || crmData.gstno || crmData.gstNo || "";
                  return {
                    ...prev,
                    aadhar: resolvedAadhar,
                    pan: resolvedPan,
                    gstNo: resolvedGst,
                    email: crmData.email || "",
                  };
                });
              }
            } catch (err: any) {
              console.warn(
                "Dynamic CRM loading after estimate load failed:",
                err,
              );
            }
          }, 50);
        }

        // Map Sales Items with hidden Stone Details
        const allStones = data.stoneEntries || data.stoneentries || [];
        const sales = (data.saleItems || data.saleitems || []).map(
          (item, index) => {
            const myStones = allStones
              .filter((s) => (s.itSlno ?? s.itslno) === index + 1)
              .map((s, sIdx) => ({
                sNo: s.slno || sIdx + 1,
                stoneCode: s.stnTyp || s.stntyp || "",
                wt: fmtWt(s.stnQty || s.stnqty),
                rate: fmtAmt(s.stnRate || s.stnrate),
                amount: fmtAmt(s.stnAmt || s.stnamt),
                qty: fmtQty(s.stnNos || s.stnnos),
                color: s.sunit || s.ut || s.stoneunit || "",
                type: s.stype || s.sType || "",
                dtype: s.dtype || s.sdtype || s.tp || "Y",
              }));

            return {
              slNo: index + 1,
              barcode: item.estBarcode || item.estbarcode || "",
              itemCode: item.estIcode || item.esticode || "",
              itemDesc: item.estItdesc || item.estitdesc || "",
              cntr: item.estCntr || item.estcntr || "",
              actualWt: fmtWt(item.estActualwt || item.estactualwt),
              noded: fmtQty(item.estNoded || item.estnoded),
              wtAdd: fmtWt(item.estWtadd || item.estwtadd),
              wastage: fmtWt(item.estWage || item.estwage || 0),
              wtDed: fmtWt(item.estWtded || item.estwtded),
              qty: fmtQty(item.estQty || item.estqty || "1"),
              grossWt: fmtWt(item.estWt || item.estwt),
              stoneWt: fmtWt(item.estStnwt || item.eststnwt),
              netWt: fmtWt(item.estNtwt || item.estntwt),
              vaPer: fmtAmt(item.estVaper || item.estvaper),
              mkRate: fmtAmt(item.estMkch || item.estmkch),
              vaAmt: fmtAmt(
                getAmt(item.estVamt || item.estvamt) ||
                getAmt(item.estGamt || item.estgamt) *
                (getAmt(item.estVaper || item.estvaper) / 100),
              ),
              stnChg: fmtAmt(
                item.estStnch ??
                item.eststnch ??
                item.est_stnch ??
                item.EST_STNCH ??
                item.stnChg ??
                item.stnchg ??
                item.STNCHG ??
                0,
              ),
              goldAmt: fmtAmt(item.estGamt || item.estgamt),
              amount: fmtAmt(
                item.estTamt ||
                item.esttamt ||
                item.totalamount ||
                item.total_amount,
              ),
              estRate: fmtAmt(
                item.estRate ??
                item.estrate ??
                item.est_rate ??
                data.estGrate ??
                data.estgrate ??
                headerData.gRate ??
                0,
              ),
              sMan:
                item.estSman1 ||
                item.estsman1 ||
                item.estSman ||
                item.estsman ||
                data.estSman1 ||
                data.estsman1 ||
                "",
              stoneDetails: myStones,
            };
          },
        );
        setSalesGrid(sales);
        // --- Concurrent Secondary Queries (Salesman, Purchase, Credit Note, Advance) ---
        const purchaseSql = `SELECT ps_itcde, ps_itdesc, ps_qty, ps_gwt, ps_stwt, ps_ntwt, ps_meltper, ps_melt, ps_val, ps_valadd, ps_stch, dcode, ps_ctno, ps_ctwt, purrate, ps_tamt, ps_grate, ps_slno, ps_touch FROM pureest WHERE est_no = ${estNo} ORDER BY ps_slno`;
        const crnSql = `SELECT * FROM crnest WHERE est_no='${safeLoadedEstNo}' ORDER BY it_slno`;
        const advSql = `SELECT * FROM saleadvest WHERE est_no='${safeLoadedEstNo}' ORDER BY 1`;

        const [smanResSettled, purchaseResSettled, crnResSettled, advResSettled] =
          await Promise.allSettled([
            SalesService.getSalesmanDetails(estNo, activeShopCode),
            DynamicQueryService.fetchList(purchaseSql, {}, auth, activeShopCode),
            DynamicQueryService.fetchList(crnSql, {}, auth, activeShopCode),
            DynamicQueryService.fetchList(advSql, {}, auth, activeShopCode),
          ]);

        // Process Salesman Details
        if (
          smanResSettled.status === "fulfilled" &&
          smanResSettled.value?.data &&
          Array.isArray(smanResSettled.value.data) &&
          smanResSettled.value.data.length > 0
        ) {
          setSalesmanGrid(
            smanResSettled.value.data.map((sm) => ({
              smCode: sm.smcode || sm.smCode || sm.salesmancode || "",
              smName: sm.smname || sm.smName || sm.salesman_name || "",
            })),
          );
        } else {
          const loadedSalesmen: any[] = [];
          const sm1 = data.estSman1 || data.estsman1;
          if (sm1) {
            loadedSalesmen.push({
              smCode: sm1,
              smName: data.salesmanName || data.salesmanname || "",
            });
          }
          const sm2 = data.estSman2 || data.estsman2;
          if (sm2 && sm2 !== sm1) {
            loadedSalesmen.push({
              smCode: sm2,
              smName: data.salesmanName2 || data.salesmanname2 || "",
            });
          }
          setSalesmanGrid(loadedSalesmen);
        }

        // Process Purchase Details
        let mappedPurchase: any[] = [];
        if (
          purchaseResSettled.status === "fulfilled" &&
          purchaseResSettled.value?.data &&
          Array.isArray(purchaseResSettled.value.data)
        ) {
          mappedPurchase = purchaseResSettled.value.data.map((p) => ({
            itemCode: p.ps_itcde || p.PS_ITCDE || "",
            itemDesc: p.ps_itdesc || p.PS_ITDESC || "",
            qty: (p.ps_qty || p.PS_QTY || 0).toString(),
            grossWt: fmtWt(p.ps_gwt || p.PS_GWT),
            stoneWt: fmtWt(p.ps_stwt || p.PS_STWT),
            netWt: fmtWt(p.ps_ntwt || p.PS_NTWT),
            meltPer: fmtAmt(p.ps_meltper || p.PS_MELTPER),
            meltLoss: fmtWt(p.ps_melt || p.PS_MELT),
            vaPer: fmtAmt(p.ps_valadd || p.PS_VALADD),
            vaAmt: fmtAmt(p.ps_val || p.PS_VAL),
            stnChg: fmtAmt(p.ps_stch || p.PS_STCH),
            rate: fmtAmt(p.purrate || p.PURRATE),
            amount: fmtAmt(p.ps_tamt || p.PS_TAMT),
            gRate: fmtAmt(p.ps_grate || p.PS_GRATE),
            touch: fmtAmt(p.ps_touch || p.PS_TOUCH),
            dCode: p.dcode || p.DCODE || "",
            dNo: (p.ps_ctno || p.PS_CTNO || 0).toString(),
            dCWt: fmtWt(p.ps_ctwt || p.PS_CTWT),
            slNo: p.ps_slno || p.PS_SLNO || "",
          }));
        }
        setPurchaseGrid(mappedPurchase);

        // Process Credit Note Details
        let crnRows: any[] = [];
        let mappedCreditNote: any[] = [];
        if (crnResSettled.status === "fulfilled") {
          crnRows = normalizeRows(crnResSettled.value);
        }
        if (crnRows.length > 0) {
          mappedCreditNote = crnRows.map((c) => {
            const gst = Number(c.est_gstamt || c.EST_GSTAMT || 0);
            const igst = Number(c.est_igstamt || c.EST_IGSTAMT || 0);
            const oth = Number(c.est_othtaxamt || c.EST_OTHTAXAMT || 0);

            return {
              itemCode: c.est_icode || c.EST_ICODE || "",
              itemDesc: c.est_itdesc || c.EST_ITDESC || "",
              cntr: c.est_cntr || c.EST_CNTR || "",
              qty: (c.est_qty || c.EST_QTY || 0).toString(),
              grossWt: fmtWt(c.est_wt || c.EST_WT),
              stoneWt: fmtWt(c.est_stnwt || c.EST_STNWT),
              netWt: fmtWt(c.est_ntwt || c.EST_NTWT),
              vaPer: fmtAmt(c.est_vaper || c.EST_VAPER),
              vaAmt: fmtAmt(c.est_vamt || c.EST_VAMT),
              stnChg: fmtAmt(c.est_stnch || c.EST_STNCH),
              goldAmt: fmtAmt(c.est_gamt || c.EST_GAMT),
              taxableAmt: fmtAmt(c.est_tamt || c.EST_TAMT),
              taxAmt: fmtAmt(gst + igst + oth),
              amount: fmtAmt(c.totalamount || c.TOTALAMOUNT),
              rowTotal: fmtAmt(c.totalamount || c.TOTALAMOUNT),
              sman: c.sm || c.SM || "",
              sBillNo: (c.estsbillno || c.ESTSBILLNO || "").toString(),
              sDate: c.estsdate || c.ESTSDATE || "",
              trSlno: (c.esttrslno || c.ESTTRSLNO || "").toString(),
              barcode: c.est_barcode || c.EST_BARCODE || "",
              aVa: fmtAmt(c.afterva || c.AFTERVA),
              aVaAmt: fmtAmt(c.aftervaamt || c.AFTERVAAMT),
              aStnch: fmtAmt(c.actual_stnch || c.ACTUAL_STNCH),
              invoiceNo: c.estsinvoiceno || c.ESTSINVOICENO || "",
              finYearRow: (c.estyear || c.ESTYEAR || "").toString(),
              stnCost: fmtAmt(c.stonecost || c.STONECOST),
              purCost: fmtAmt(c.purcost || c.PURCOST),
              slno: (c.it_slno || c.IT_SLNO || 1).toString(),
            };
          });
        }
        setCreditNoteGrid(mappedCreditNote);

        // Process Advance Details
        let advRows: any[] = [];
        if (advResSettled.status === "fulfilled") {
          advRows = normalizeRows(advResSettled.value);
        }

        const get = (obj, ...keys) => {
          for (const k of keys) {
            if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
            if (
              obj?.[k.toUpperCase()] !== undefined &&
              obj?.[k.toUpperCase()] !== null
            )
              return obj[k.toUpperCase()];
            if (
              obj?.[k.toLowerCase()] !== undefined &&
              obj?.[k.toLowerCase()] !== null
            )
              return obj[k.toLowerCase()];
          }
          return "";
        };

        const fmtGdwt6 = (v) => Number(toNum(v)).toFixed(6);
        const mappedAdvance = (advRows || []).map((a, idx) => {
          const advName = String(
            get(a, "adv_name", "advname") || "",
          ).toUpperCase();
          const orderYearOrSchemeName = get(
            a,
            "adv_orderyear",
            "adv_order_year",
            "advorderyear",
          );
          const rawBarflag = get(a, "barflag");
          const barflag =
            rawBarflag === true ||
            String(rawBarflag).toLowerCase() === "true" ||
            String(rawBarflag).toLowerCase() === "t" ||
            String(rawBarflag).toLowerCase() === "y" ||
            String(rawBarflag) === "1";

          return {
            slNo: Number(get(a, "slno", "sl_no", "slNo") || idx + 1),
            advName,
            advNo: String(get(a, "adv_no", "advno", "advNo") || ""),
            advOrderYear: String(orderYearOrSchemeName || ""),
            barflag,
            advAmt: fmtAmt(get(a, "adv_amt", "advamt") || 0),
            balAmt: fmtAmt(get(a, "adv_amt", "advamt") || 0),
            schemeBonus: fmtAmt(
              get(a, "schm_bonus", "schmbonus", "schemebonus") || 0,
            ),
            schemeGrossWt: fmtGdwt6(
              get(a, "schm_gdwt", "schmgdwt", "schemegrosswt") || 0,
            ),
            schemeDesc:
              advName === "SCHEME"
                ? String(orderYearOrSchemeName || "")
                : "",
          };
        });
        setAdvanceGrid(mappedAdvance);

        // DO NOT populate stoneGrid helper table immediately
        setStoneGrid([]);

        // In Modify mode, freeze Est No after successful fetch.
        if (actionStatus === "MODIFY") {
          setIsEstNoLocked(true);
        }

        setIsMetalLocked(true); // Lock metal dropdown from changing after details are fetched
        setIsUpdate(true); // Flag as update

        return {
          success: true,
          salesGrid: sales,
          purchaseGrid: mappedPurchase,
          creditNoteGrid: mappedCreditNote,
          advanceGrid: mappedAdvance,
        };
      }
    } catch (error: any) {
      console.error(error);
      if (showNotFoundMessage) {
        showPopupMessage(`Estimate No ${estNo} Not Found`, "Lookup Error");
      }
      return false; // Failure
    }
    return false;
  };

  // Generic Focus Handler - Enforce Data Entry
  const handleFocusNext = (e, nextField, value) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = value !== undefined ? value : e.target.value;

      if (val && val.toString().trim() !== "") {
        headerRefs.current[nextField]?.focus();
      } else {
        // 📌 STEP A: Save the current field in memory
        setLastField(e.target);

        // 📌 STEP B: Show your existing popup
        showPopupMessage("Field cannot be empty", "Validation");
      }
    }
  };

  // Helper to generate EstNo lazily
  const generateEstNo = async () => {
    // Only generate if currently empty or "New"
    if (!headerData.estNo || headerData.estNo === "New") {
      try {
        const estNoResponse = await SalesService.getNextEstNo(
          resolveActiveShopCode(),
        );
        if (estNoResponse.data) {
          const newEst = estNoResponse.data.toString();
          setHeaderData((prev) => ({ ...prev, estNo: newEst }));
        }
      } catch (error: any) {
        console.error("Failed to generate EstNo", error);
      }
    }
  };

  // Simple Focus Handler (No validation) - For optional fields like Email, PAN, GST
  const handleFocusMove = (e, nextField) => {
    if (e.key === "Enter") {
      e.preventDefault();
      headerRefs.current[nextField]?.focus();
    }
  };

  const focusSalesEntryStart = () => {
    const barcodeEl = salesRefs.current["barcode"];
    if (barcodeEl) {
      barcodeEl.dataset.bypassed = "true";
      barcodeEl.focus();
      barcodeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        if (barcodeEl) barcodeEl.dataset.bypassed = "false";
      }, 1000);
      return;
    }

    salesRefs.current["itemCode"]?.focus();
  };
  const handleCareOfEnter = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // If the value was just set by the lookup popup, skip re-validation
      if (careOfSelectedRef.current) {
        careOfSelectedRef.current = false;
        headerRefs.current["salesman"]?.focus();
        return;
      }

      const val = (headerData.careOf || "").trim();

      if (!val) {
        openCareOfLookup();
        return;
      }

      // If text is entered, check if it's a valid code in backend
      try {
        const res = await SalesService.checkCareOfCode(
          val,
          resolveActiveShopCode(),
        );

        if (res.data && res.data.careofcode) {
          // Valid code found
          console.log("CareOf code validated:", res.data.careofcode);
        } else {
          // Not found -> open lookup
          showPopupMessage(
            "Invalid Care-Of code.",
            "Validation",
            "warning",
            headerRefs.current["careOf"],
            () => openCareOfLookup(),
          );
          return;
        }
      } catch (err: any) {
        console.warn("CareOf validation failed, opening lookup...", err);
        showPopupMessage(
          "Invalid Care-Of code.",
          "Validation",
          "warning",
          headerRefs.current["careOf"],
          () => openCareOfLookup(),
        );
        return;
      }

      headerRefs.current["salesman"]?.focus();
    } else if (e.key === "F5") {
      e.preventDefault();
      openCareOfLookup();
    }
  };

  const careOfSelectedRef = useRef(false);

  const handleCareOfSelect = (careOf) => {
    careOfSelectedRef.current = true; // Mark as selected from lookup — skip validation
    setHeaderData((prev) => ({
      ...prev,
      careOf: String(
        careOf?.careofcode || careOf?.careofname || "",
      ).toUpperCase(),
    }));
    setTimeout(() => {
      careOfSelectedRef.current = false; // Reset flag
      headerRefs.current["salesman"]?.focus();
    }, 150);
  };

  const openCareOfLookup = () => {
    showLookup({
      ...lookupConfigs.careof(handleCareOfSelect, resolveActiveShopCode()),
      onClose: () => {
        if (!careOfSelectedRef.current) {
          headerRefs.current["careOf"]?.focus();
        }
      }
    });
  };

  const handleCustomerSelect = (cust) => {
    setHeaderData((prev) => ({
      ...prev,
      custId: cust.code,
      custName: cust.name,
      address1: cust.add1,
      address2: cust.add2,
      place: cust.place,
      phone: cust.mob,
      pincode: cust.pincode,
      gstNo: cust.gstNo || "",
      pan: cust.panNo || "",
      aadhar: cust.aadhar || "",
      email: cust.email || "",
    }));
    setTimeout(() => headerRefs.current["careOf"]?.focus(), 100);
  };

  // Helper to fetch CRM details and fall back to local customer details if CRM details are empty
  const fetchCustomerByPhone = async (phone: string) => {
    const data = await getCrmPhoneno(phone, resolveActiveShopCode());
    if (!data) return null;

    const isFound =
      data &&
      (data.name ||
        data.custName ||
        data.estCunm ||
        data.custid ||
        data.custId ||
        data.code);
    if (!isFound) return data;

    const custId = data.custid || data.custId || data.code;
    const hasName = data.name || data.custName || data.estCunm;
    const hasAddress =
      data.add1 ||
      data.address1 ||
      data.estAdd1 ||
      data.add2 ||
      data.address2 ||
      data.estAdd2;

    if (custId && (!hasName || !hasAddress)) {
      try {
        console.log(
          `CRM response details are incomplete but custid "${custId}" exists. Fetching full local customer details...`,
        );
        let localData = await getCustData(custId);
        if (
          !localData ||
          (!localData.name && !localData.custName && !localData.estCunm)
        ) {
          console.log(
            `Customer "${custId}" details not found in local getCustData, falling back to findCrmByCustId...`,
          );
          localData = await findCrmByCustId(custId);
        }
        if (
          localData &&
          (localData.name || localData.custName || localData.estCunm)
        ) {
          return {
            ...localData,
            ...data, // Keep CRM IDs, mob, crmid
            name:
              data.name ||
              data.custName ||
              data.estCunm ||
              localData.name ||
              localData.custName ||
              localData.estCunm ||
              "",
            add1:
              data.add1 ||
              data.address1 ||
              data.estAdd1 ||
              localData.add1 ||
              localData.address1 ||
              localData.estAdd1 ||
              "",
            add2:
              data.add2 ||
              data.address2 ||
              data.estAdd2 ||
              localData.add2 ||
              localData.address2 ||
              localData.estAdd2 ||
              "",
            place:
              data.place ||
              data.add3 ||
              data.estAdd3 ||
              localData.place ||
              localData.add3 ||
              localData.estAdd3 ||
              "",
            pincode:
              data.pincode ||
              data.estPin ||
              localData.pincode ||
              localData.estPin ||
              "",
            aadhar:
              data.aadhar ||
              data.aadharno ||
              localData.aadhar ||
              localData.aadharno ||
              "",
            pan:
              data.pan ||
              data.panNo ||
              data.panno ||
              localData.pan ||
              localData.panNo ||
              localData.panno ||
              "",
            gstin:
              data.gstin ||
              data.gstno ||
              data.gstNo ||
              localData.gstin ||
              localData.gstno ||
              localData.gstNo ||
              "",
            email: data.email || localData.email || "",
          };
        }
      } catch (localErr) {
        console.warn(
          "Failed to retrieve full local customer data for fallback lookup:",
          localErr,
        );
      }
    }
    return data;
  };

  // Handlers
  const handlePhoneEnter = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const phone = (headerData.phone || "").trim();
      const minLen = parseInt(getPhoneMinLength(), 10);
      const maxLen = parseInt(getPhoneMaxLength(), 10);
      const fixedLen = getPhoneFixedLength() === "true";

      const isValidPhone = fixedLen
        ? phone.length === maxLen
        : phone.length >= minLen && phone.length <= maxLen;

      if (!phone || !isValidPhone) {
        if (fixedLen) {
          showPopupMessage(
            `Phone number must be exactly ${maxLen} digits!`,
            "Validation",
            "error",
          );
        } else {
          showPopupMessage(
            `Phone number must be between ${minLen} and ${maxLen} digits!`,
            "Validation",
            "error",
          );
        }
        headerRefs.current["phone"]?.select();
        return;
      }

      if (phone && isValidPhone) {
        try {
          const data = await fetchCustomerByPhone(phone);

          // Must have at least a Name or ID to be considered "found" (ignores empty objects {})
          const isFound =
            data &&
            (data.name ||
              data.custName ||
              data.estCunm ||
              data.custid ||
              data.custId ||
              data.code);

          if (isFound) {
            console.log("CRM phone response:", data);
            setHeaderData((prev) => ({
              ...prev,
              custId: data.custid || data.custId || data.code || "",
              custName: data.name || data.custName || data.estCunm || "",
              address1: data.add1 || data.address1 || data.estAdd1 || "",
              address2: data.add2 || data.address2 || data.estAdd2 || "",
              place: data.place || data.add3 || data.estAdd3 || "",
              pincode: data.pincode || data.estPin || "",
              email: data.email || "",
              aadhar: data.aadhar || data.aadharno || "",
              pan: data.pan || data.panNo || data.panno || "",
              gstNo: data.gstin || data.gstno || data.gstNo || "",
              careOf:
                data.careofcode ||
                data.care_of_code ||
                data.careoff ||
                data.careof ||
                "",
              salesman: prev.salesman || "",
              salesmanName: data.salesmanName || "",
            }));
            headerRefs.current["careOf"]?.focus();
            return;
          }
        } catch (err: any) {
          console.log("CRM phone lookup error:", err.message);
        }

        // Not found flow
        // The CustID will be generated automatically when focus enters the Salesman field
        try {
          setHeaderData((prev) => ({
            ...prev,
            custId: "", // Purposely left empty, will be auto-generated in Salesman onFocus
            custName: "",
            address1: "",
            address2: "",
            place: "",
            pincode: "",
            email: "",
            aadhar: "",
            pan: "",
            gstNo: "",
            careOf: "",
            salesman: "",
          }));
        } catch (idErr) {
          console.warn("Could not clear ID fields", idErr);
        }
        setTimeout(() => headerRefs.current["name"]?.focus(), 100);
      }
    }
  };
  const handleCustIdEnter = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const custId = headerData.custId;
      if (custId) {
        try {
          let data = await getCustData(custId);

          // Check if not found locally, or contains an error/not found message
          if (
            !data ||
            data.message ||
            (!data.name && !data.custName && !data.estCunm)
          ) {
            console.log(
              "Customer not found in local data, falling back to Scheme CRM database lookup via find-by-custid...",
            );
            data = await findCrmByCustId(custId);
            console.log("findCrmByCustId direct response:", data);
          }

          if (
            data &&
            !data.message &&
            (data.name ||
              data.custName ||
              data.estCunm ||
              data.custid ||
              data.code)
          ) {
            console.log("Customer successfully loaded:", data);
            setHeaderData((prev) => ({
              ...prev,
              custName: data.name || data.custName || data.estCunm || "",
              address1: data.add1 || data.address1 || data.estAdd1 || "",
              address2: data.add2 || data.address2 || data.estAdd2 || "",
              place: data.place || data.add3 || data.estAdd3 || "",
              pincode: data.pincode || data.estPin || "",
              phone: data.mob || data.phone || data.estPhone || "",
              email: data.email || "",
              aadhar: data.aadhar || data.aadharno || "",
              pan: data.pan || data.panNo || data.panno || "",
              gstNo: data.gstin || data.gstno || data.gstNo || "",
              careOf:
                data.careofcode ||
                data.care_of_code ||
                data.careoff ||
                data.careof ||
                "",
              salesman: data.estSman1 || prev.salesman || "",
            }));
            headerRefs.current["careOf"]?.focus();
            return;
          }
        } catch (error: any) {
          console.warn("Customer ID lookup failed", error);
        }
        headerRefs.current["phone"]?.focus();
      } else {
        headerRefs.current["phone"]?.focus();
      }
    } else if (e.key === "F5") {
      showLookup(
        lookupConfigs.customer(handleCustomerSelect, resolveActiveShopCode()),
      );
    }
  };

  const handleEstNoSelect = async (est) => {
    console.log("Selected Estimate from Lookup:", est);
    const actualEstNo = est?.estNo ?? est?.estno;
    if (est && actualEstNo) {
      const selectedEstNo = String(actualEstNo || "").trim();

      // Delete mode: selected EstNo must continue delete flow immediately
      if (actionStatus === "DELETE") {
        setPendingPrintAfterEstSelect(false);
        setPendingPrintType("T");
        setHeaderData((prev) => ({ ...prev, estNo: selectedEstNo }));
        // Modal logic removed
        await runDeleteFlow(selectedEstNo);
        return;
      }

      // Print mode: do not block print on fetchData success.
      if (pendingPrintAfterEstSelect) {
        // Modal logic removed
        setPendingPrintAfterEstSelect(false);
        const printType =
          pendingPrintType || (headerData.printEstimate ? "E" : "T");
        const shopCode = resolveActiveShopCode();
        setPendingPrintType("T");
        if (!shopCode) {
          showPopupMessage(
            "Shop code is missing. Please reload and try again.",
            "Validation",
          );
          return;
        }
        await fetchAndPrintReport(selectedEstNo, shopCode, printType);
        return;
      }

      const success = await fetchData(selectedEstNo);
      if (success) {
        // Modal logic removed
      }
    } else {
      console.error("Invalid estimate selected:", est);
    }
  };

  const handleEstNoLookup = () => {
    console.log("EstNo Lookup Triggered (Double Click)");
    showLookup(
      lookupConfigs.estno(
        handleEstNoSelect,
        headerData.goldSlv,
        resolveActiveShopCode(),
      ),
    );
  };

  const handleEstNoLookupClose = () => {
    // Modal logic removed
    setPendingPrintAfterEstSelect(false);
    setPendingPrintType("T");
  };

  const validateEstNoForSelectedMetal = async (estNo) => {
    const metalType = headerData.goldSlv === "SILVER" ? "S" : "G";
    const response = await SalesService.searchEstimatesByMetal(
      metalType,
      resolveActiveShopCode(),
    );
    const rows = Array.isArray(response?.data) ? response.data : [];
    const typedEstNo = String(estNo || "").trim();

    return rows.some((row) => {
      const rowEstNo =
        row?.estNo ?? row?.estno ?? row?.est_no ?? row?.EST_NO ?? "";
      return String(rowEstNo).trim() === typedEstNo;
    });
  };

  // Touch + Laptop friendly EstNo popup trigger in Delete/Modify mode
  const openEstNoLookupFromField = () => {
    const typedEstNo = (headerData.estNo || "").trim();
    // Modal logic removed

    if (
      (actionStatus === "DELETE" || actionStatus === "MODIFY") &&
      (!typedEstNo || typedEstNo === "New")
    ) {
      showLookup(
        lookupConfigs.estno(
          handleEstNoSelect,
          headerData.goldSlv,
          resolveActiveShopCode(),
        ),
      );
    }
  };

  const addSalesmanToGrid = async (salesman) => {
    // 1. Check for Duplicate
    if (salesmanGrid.some((s) => s.smCode === salesman.salesman_code)) {
      showPopupMessage("Salesman already added!", "Validation");
      setSalesmanRow(salesmanEmpty);
      return;


    }

    // 2. Add to salesman grid
    const newSalesman = {
      smCode: salesman.salesman_code || "",
      smName: salesman.salesman_name || "",
    };

    // In Advance flow too, append below existing rows (do not replace table rows).
    setSalesmanGrid((prev) => [...prev, newSalesman]);

    // 3. Update header salesman field
    setHeaderData((prev) => ({
      ...prev,
      salesman: salesman.salesman_code || "",
      salesmanName: salesman.salesman_name || "",
    }));

    // 4. Clear input row
    setSalesmanRow(salesmanEmpty);

    const focusBarcode = () => {
      focusSalesEntryStart();
    };

    const shouldRestoreBarcodeFocus = () =>
      document.activeElement === salesRefs.current["barcode"];

    // 4.5 SYNCHRONOUS FOCUS: We MUST call focus synchronously here before any `await`
    // to trick the iPad into keeping the software keyboard open!
    focusBarcode();

    // 5. Generate EstNo - await so it completes
    await generateEstNo();

    setTimeout(() => {
      if (document.activeElement === document.body) {
        focusBarcode();
      }
    }, 100);
  };
  const handleSalesmanCodeEnter = async (isBlur = false) => {
    if (isValidatingSalesmanRef.current) return;

    // Validate Care-Of Code existence and correctness first
    const careOfVal = (headerData.careOf || "").trim();
    if (!careOfVal) {
      showPopupMessage(
        "Please select a Care-Of code first.",
        "Validation",
        "warning",
        headerRefs.current["careOf"],
        () => openCareOfLookup(),
      );
      return;
    }

    try {
      const res = await SalesService.checkCareOfCode(
        careOfVal,
        resolveActiveShopCode(),
      );
      if (!res.data || !res.data.careofcode) {
        showPopupMessage(
          "Invalid Care-Of code. Please correct it first.",
          "Validation",
          "warning",
          headerRefs.current["careOf"],
          () => openCareOfLookup(),
        );
        return;
      }
    } catch (err) {
      showPopupMessage(
        "Invalid Care-Of code. Please correct it first.",
        "Validation",
        "warning",
        headerRefs.current["careOf"],
        () => openCareOfLookup(),
      );
      return;
    }

    const code = salesmanRow.smCode?.trim();

    // Empty code -> Open lookup or focus details grid, but bypass if this is a blur event
    if (!code) {
      if (!isBlur) {
        if (salesmanGrid.length > 0) {
          focusSalesEntryStart();
        } else {
          showLookup(
            lookupConfigs.salesman(
              addSalesmanToGrid,
              resolveActiveShopCode(),
            ),
          );
        }
      }
      return;
    }

    isValidatingSalesmanRef.current = true;

    try {
      const response = await SalesService.getAllSalesmen(
        resolveActiveShopCode(),
      );

      if (response.data) {
        const found = response.data.find(
          (s) =>
            s.salesman_code.toUpperCase() ===
            code.toUpperCase(),
        );

        if (found) {
          await addSalesmanToGrid(found);
        } else {
          console.log(
            "Salesman code not found, opening modal",
          );

          showLookup(
            lookupConfigs.salesman(
              addSalesmanToGrid,
              resolveActiveShopCode(),
            ),
          );
        }
      }
    } catch (error) {
      console.error("Error fetching salesmen:", error);

      showLookup(
        lookupConfigs.salesman(
          addSalesmanToGrid,
          resolveActiveShopCode(),
        ),
      );
    } finally {
      isValidatingSalesmanRef.current = false;
    }
  };

  const addchar = (len, cr) => {
    if (len <= 0) return "";
    return new Array(len).fill(cr).join("");
  };

  const isPieceBillType = (value) => {
    const normalized = String(value || "")
      .trim()
      .toUpperCase();
    return normalized === "P" || normalized === "PIECE" || normalized === "PCS";
  };

  const isSilverFocusFlow = () => headerData.goldSlv === "SILVER";

  const handleBarcodeEnter = async (
    e: any,
    overrideBarcode?: string,
    isBlur = false,
  ) => {
    if ((e && e.key === "Enter") || overrideBarcode) {
      if (e && e.preventDefault) e.preventDefault();

      let barcode = overrideBarcode
        ? overrideBarcode.trim().toUpperCase()
        : (salesRow.barcode || "").trim().toUpperCase();

      // Pad barcode to 10 digits with leading zeros (migrated from Java addchar)
      if (barcode && barcode !== "0000000000") {
        const paddedBarcode = addchar(10 - barcode.length, "0") + barcode;
        barcode = paddedBarcode; // Ensure local variable is updated

        if (paddedBarcode !== salesRow.barcode) {
          setSalesRow((prev) => ({ ...prev, barcode: paddedBarcode }));
        }

        // If editing and barcode is unchanged, skip re-fetching/re-calculating
        if (
          editingRowIndex !== null &&
          barcode === salesGrid[editingRowIndex]?.barcode
        ) {
          return;
        }

        // Check for duplicate barcode
        const isDuplicateBarcode = salesGrid.some(
          (item, idx) => item.barcode === barcode && idx !== editingRowIndex,
        );
        if (isDuplicateBarcode) {
          showPopupMessage("Duplicate Barcode Entry!", "Validation");
          setSalesRow((prev) => ({ ...prev, barcode: "" }));
          return;
        }

        try {
          // Get shopcode from header or default
          const shopcode = resolveActiveShopCode();
          setStoneGrid([]); // Clear current stones before new lookup

          // 🛡️ Security Check: Stock Transfer (Matches Java logic)
          const isTransferred = await SalesService.checkBarcodeTransfer(
            barcode,
            shopcode,
          );
          if (isTransferred.data === true) {
            showPopupMessage(
              "Unable to Enter, Barcode already Transferred",
              "Validation",
            );
            setSalesRow((prev) => ({ ...prev, barcode: "" }));
            if (!isBlur && shouldRestoreBarcodeFocus())
              salesRefs.current["barcode"]?.focus();
            return;
          }

          const isNotConfirmed = await SalesService.checkBarcodeReceive(
            barcode,
            shopcode,
          );
          if (isNotConfirmed.data === true) {
            showPopupMessage(
              "Unable to Enter, Barcode Transferred but not confirmed",
              "Validation",
            );
            setSalesRow((prev) => ({ ...prev, barcode: "" }));
            if (!isBlur && shouldRestoreBarcodeFocus())
              salesRefs.current["barcode"]?.focus();
            return;
          }

          console.log(`Fetching barcode: ${barcode} for shop: ${shopcode}`);
          const payload = {
            barcode: barcode,
            estNo: Number(headerData.estNo) || 0,
            goldSlv: String(headerData.goldSlv || "GOLD")
              .charAt(0)
              .toUpperCase(),
            checked: false,
            igstSelected: headerData.applyIgst || false,
            salesmanCode: headerData.salesman || "",
            gstPer: Number(headerData.gstPer) || 0,
            igstPer: Number(headerData.igstPer) || 0,
            tabSaleRowCount: salesGrid.length,
            goldRate: getAmt(headerData.gRate),
          };

          // Validate barcode stone weight before fetching barcode details
try {
  const stoneWeightResponse =
    await SalesService.checkBarcodeStoneWeight(barcode, shopcode);

  const weightsSame = stoneWeightResponse.data?.weights_same;

  if (weightsSame !== true && weightsSame !== "true") {
    showPopupMessage(
      "Stone weight does not match.",
      "Validation",
      "error",
    );

    setSalesRow((prev) => ({ ...prev, barcode: "" }));

    if (!isBlur && shouldRestoreBarcodeFocus()) {
      salesRefs.current["barcode"]?.focus();
    }

    return;
  }
} catch (error) {
  console.error("Stone weight validation error:", error);

  showPopupMessage(
    "Unable to validate stone weight.",
    "Validation",
    "error",
  );

  setSalesRow((prev) => ({ ...prev, barcode: "" }));

  if (!isBlur && shouldRestoreBarcodeFocus()) {
    salesRefs.current["barcode"]?.focus();
  }

  return;
}

          const response = await SalesService.getBarcodeDetails(
            payload,
            shopcode,
          );

          console.log("Barcode response:", response.data);
          // ── New flat response from SalesBarcodeResponseDto ──
          const resMap = response.data || {};

          // Handle backend error/warning signals first
          if (resMap.success === false) {
            const msg = resMap.warningMessage || "Barcode Not Found";
            showPopupMessage(msg, "Invalid Barcode", "error");
            setSalesRow((prev) => ({ ...prev, barcode: "" }));
            if (!isBlur && shouldRestoreBarcodeFocus())
              salesRefs.current["barcode"]?.focus();
            return;
          }

          if (!resMap.success || !resMap.itemCode) {
            showPopupMessage("Barcode Not Found", "Invalid Barcode", "error");
            setSalesRow((prev) => ({ ...prev, barcode: "" }));
            if (!isBlur && shouldRestoreBarcodeFocus())
              salesRefs.current["barcode"]?.focus();
            return;
          }

          // Direct mapping from flat DTO fields
          const itemCode = String(resMap.itemCode || "").trim();
          const stoneList = Array.isArray(resMap.stoneDetails)
            ? resMap.stoneDetails
            : [];

          const pickBarcodeField = (...keys) => {
            for (const key of keys) {
              const value = resMap?.[key];
              if (value !== undefined && value !== null && value !== "") {
                return value;
              }
            }
            return undefined;
          };

          const newSalesRow = {
            ...salesRow,
            barcode: resMap.barcode || barcode,
            itemCode: itemCode,
            itemDesc: resMap.itemDesc || "",
            cntr: resMap.cntr || "",
            qty: resMap.qty || "1",
            grossWt: resMap.grwt || "0.000",
            stoneWt: resMap.stwt || "0.000",
            netWt: resMap.netwt || "0.000",
            actualWt:
              pickBarcodeField("actualWt", "actualwt", "actual_wt", "actwt") ||
              "0.000",
            wastage:
              pickBarcodeField(
                "wastage",
                "wage",
                "estWage",
                "estwage",
                "wast",
              ) || "0.000",
            vaPer: resMap.vaper || "0.00",
            vaAmt: resMap.vaamt || "0.00",
            mkRate: resMap.mkchg || "0.00",
            stnChg: resMap.stnchg || "0.00",
            goldAmt: resMap.goldamt || "0.00",
            amount: resMap.amount || "0.00",
            noded: resMap.noded || "0",
            wtDed: resMap.wtded || "0.000",
            wtAdd: resMap.wtadd || "0.000",
            origQty: resMap.qty || "1",
            baseGrossWt: resMap.grwt || "0.000",
            slNo: salesGrid.length + 1,
            sMan: resolveSelectedSalesman(
              salesRow.sMan || resMap.sman || headerData.salesman,
            ),
            estRate: resMap.estRate || resMap.r || resMap.rate || resMap.goldRate || resMap.grate || "0.00",
            billType: "G",
          };

          // Handle otherItem (dual-item barcode support)
          const otherItem = resMap.otherItem || null;
          const suppressStoneHelperGrid =
            actionStatus === "MODIFY" || actionStatus === "NEW";

          // Check if it's a diamond item from backend
          let isDiamond = false;
          try {
            const dmdCheck = await SalesService.checkDiamondItem(
              itemCode.trim(),
              shopcode,
            );

            isDiamond =
              dmdCheck.data === true ||
              dmdCheck.data === "true" ||
              dmdCheck.data === 1 ||
              dmdCheck.data === "1";

            if (isDiamond) {
              seIsStonecodeEnable(true);
            } else {
              seIsStonecodeEnable(false);
            }
          } catch (err: any) {
            console.warn("Diamond check failed", err);
            isDiamond = false;
          }
          newSalesRow.isDiamond = isDiamond;
          lastValidatedItemCodeRef.current = itemCode;

          // AUTO-LOAD STONES from backend stoneDetails array
          // Backend returns: {stonecode, nos, stonewt, rate, amount, sUnit, sType, sDtype}
          let mappedStones = [];
          if (stoneList && stoneList.length > 0) {
            mappedStones = stoneList.map((s, idx) => ({
              sNo: (idx + 1).toString(),
              stoneCode: String(s.stonecode || s.stoneCode || ""),
              color: String(s.sUnit || s.sunit || ""),
              qty: fmtQty(s.nos || s.qty || "0"),
              wt: fmtWt(s.stonewt || s.wt || "0"),
              rate: fmtAmt(s.rate || "0"),
              amount: fmtAmt(s.amount || "0"),
              type: String(s.sType || s.stype || ""),
              dtype: String(s.sDtype || s.sdtype || "Y"),
            }));
            if (!suppressStoneHelperGrid) {
              setStoneGrid(mappedStones);
            }
            const { totalWt, totalAmt } = calculateStoneTotals(mappedStones);
            newSalesRow.stoneWt = fmtWt(totalWt);
            newSalesRow.stnChg = fmtAmt(totalAmt);
          }
          newSalesRow.stoneDetails = mappedStones;

          // Fetch System Quantity for difference calculation
          try {
            const qtyRes = await SalesService.getBarcodeQty(barcode, shopcode);
            // Expected number directly or {amount: X}
            const systemQty =
              typeof qtyRes.data === "object"
                ? qtyRes.data.amount || qtyRes.data.qty || 0
                : qtyRes.data || 0;
            newSalesRow.origQty = systemQty.toString();
            console.log("Fetched System Quantity:", systemQty);
          } catch (qtyErr) {
            console.warn(
              "Could not fetch system quantity, defaulting to current row qty",
              qtyErr,
            );
            newSalesRow.origQty = newSalesRow.qty;
          }

          // Fetch gold rate by item code (for header display only when rateFix is off)
          let currentGoldRate = getAmt(headerData.gRate);
          if (itemCode && !headerData.rateFix) {
            try {
              const goldRateResponse = await SalesService.getGoldRateByItemCode(
                itemCode,
                resolveActiveShopCode(),
              );
              if (goldRateResponse.data && goldRateResponse.data.rate) {
                currentGoldRate = goldRateResponse.data.rate;
                setHeaderData((prev) => ({
                  ...prev,
                  gRate: fmtAmt(currentGoldRate),
                }));
              }
            } catch (err: any) {
              console.error("Gold rate error:", err);
            }
          }

          // Perform Calculations for the new row
          const gross = getWt(newSalesRow.grossWt);
          const stone = getWt(newSalesRow.stoneWt);
          const net = gross - stone;
          const vaPer = getAmt(newSalesRow.vaPer);
          const stnChg = getAmt(newSalesRow.stnChg);

          // The barcode response already contains the correct item-specific goldAmt,
          // computed by the backend using the same SQL as Java's AspCommonFunctions.getGoldRate():
          //   SELECT SUM(rate) FROM goldratemaster WHERE code IN (SELECT unit FROM itemmaster WHERE item_code=?)
          // Use it directly to get the correct VA amount. Only fall back to recalculation
          // if the backend didn't return a valid goldAmt (e.g., non-barcode items).
          const backendGoldAmt = getAmt(resMap.goldamt);
          const goldAmt =
            backendGoldAmt > 0 ? backendGoldAmt : net * currentGoldRate;
          const vaAmt = goldAmt * (vaPer / 100);
          const totalAmt = goldAmt + vaAmt + stnChg;

          newSalesRow.goldAmt = fmtAmt(goldAmt);
          newSalesRow.vaAmt = fmtAmt(vaAmt);
          newSalesRow.amount = fmtAmt(totalAmt);
          newSalesRow.netWt = fmtWt(net);

          // Ensure estRate (R column) is always populated — fall back to currentGoldRate
          // if the barcode response didn't include any rate field.
          if (!getAmt(newSalesRow.estRate) && currentGoldRate > 0) {
            newSalesRow.estRate = fmtAmt(currentGoldRate);
          }


          // Barcode duplicate check: real barcodes can only be used once
          const barcodeVal = (newSalesRow.barcode || "").replace(/^0+$/, "");
          if (
            barcodeVal &&
            salesGrid.some(
              (item, idx) =>
                item.barcode === newSalesRow.barcode && idx !== editingRowIndex,
            )
          ) {
            showPopupMessage(
              "This barcode is already used in this estimate!",
              "Validation",
            );
            lastValidatedItemCodeRef.current = "";
            setSalesRow({
              ...salesEmpty,
              slNo: salesGrid.length + 1,
              itemCode: "",
            });
            if (!isBlur && shouldRestoreBarcodeFocus())
              salesRefs.current["barcode"]?.focus();
            return;
          }

          // check salesman
          if (!headerData.salesman && salesmanGrid.length === 0) {
            showPopupMessage(
              "Please select a Salesman before adding items!",
              "Validation",
            );
            if (!isBlur) headerRefs.current["salesman"]?.focus();
            return;
          }

          // Add to sales grid or update editing row
          if (editingRowIndex !== null) {
            setSalesRow(newSalesRow);
            if (mappedStones.length > 0) {
              setStoneGrid(mappedStones);
            }
            return;
          }

          const updatedGrid = [...salesGrid, newSalesRow];
          setSalesGrid(updatedGrid);

          // Reset sales row for next entry
          setStoneRow({
            sNo: "1",
            stoneCode: "",
            color: "",
            qty: "0",
            wt: "",
            rate: "",
            amount: "",
          });

          // Reset salesRow in next tick to ensure stoneWt clears properly
          setTimeout(() => {
            lastValidatedItemCodeRef.current = "";
            setSalesRow({
              ...salesEmpty,
              slNo: (updatedGrid.length + 1).toString(),
              itemCode: "",
              stoneWt: "0.000",
              stnChg: "0.00",
              netWt: "0.000",
              goldAmt: "0.00",
              amount: "0.00",
            });
          }, 0);

          // Focus back to barcode for next entry
          if (!isBlur && shouldRestoreBarcodeFocus())
            setTimeout(() => salesRefs.current["barcode"]?.focus(), 100);
        } catch (error: any) {
          if (error.response?.status === 400) {
            // Validation error (already transferred or not confirmed)
            const errorMsg = error.response.data.error || "Invalid barcode";
            showPopupMessage(errorMsg, "Validation");
            setSalesRow((prev) => ({ ...prev, barcode: "" }));
            if (!isBlur && shouldRestoreBarcodeFocus())
              salesRefs.current["barcode"]?.focus();
          } else if (error.response?.status === 404) {
            // Barcode not found - allow manual entry
            setSalesRow((prev) => ({ ...prev, barcode: "0000000000" }));
            if (!isBlur) salesRefs.current["itemCode"]?.focus();
          } else {
            console.error("Barcode lookup error:", error);
            showPopupMessage("Error fetching barcode details", "Lookup Error");
          }
        }
      } else if (barcode === "0000000000" || !barcode) {
        // Allow manual entry
        setSalesRow((prev) => ({ ...prev, barcode: "0000000000" }));
        if (!isBlur) salesRefs.current["itemCode"]?.focus();
      }
    }
  };

  const validateItemMetalType = async (itemCode: string) => {
    const shopcode = resolveActiveShopCode();
    if (headerData.goldSlv === "SILVER") {
      const checkRes = await SalesService.checkItemCode(
        itemCode,
        "S",
        shopcode,
      );
      return (
        checkRes.data === true ||
        checkRes.data === "true" ||
        checkRes.data === 1 ||
        checkRes.data === "1"
      );
    } else {
      // Gold Estimate: check Gold (G) first
      const checkG = await SalesService.checkItemCode(itemCode, "G", shopcode);
      const isValidG =
        checkG.data === true ||
        checkG.data === "true" ||
        checkG.data === 1 ||
        checkG.data === "1";
      if (isValidG) return true;

      // If not valid G, check if it's a Diamond (D) item
      const checkD = await SalesService.checkItemCode(itemCode, "D", shopcode);
      return (
        checkD.data === true ||
        checkD.data === "true" ||
        checkD.data === 1 ||
        checkD.data === "1"
      );
    }
  };

  const processItemCodeChange = async (itemCode: string, isBlur = false) => {
    // 1. Empty field
    if (!itemCode) {
      if (!isBlur) {
        setSalesRow((prev) => ({ ...prev, itemCode: "" }));
        lastValidatedItemCodeRef.current = "";
        showLookup(
          lookupConfigs.itemdetails(
            handleItemSelect,
            headerData.goldSlv,
            resolveActiveShopCode(),
          ),
        );
      }
      return;
    }

    // Skip if already validated
    if (itemCode.toUpperCase() === lastValidatedItemCodeRef.current.toUpperCase()) {
      return;
    }

    console.log(
      "processItemCodeChange: isBlur =",
      isBlur,
      "value =",
      itemCode,
      "isValidating =",
      isValidatingItemRef.current,
    );
    if (isValidatingItemRef.current) {
      return;
    }
    isValidatingItemRef.current = true;
    try {
      const shopcode = resolveActiveShopCode();

      // Validate metal type
      const isValid = await validateItemMetalType(itemCode);

      if (isValid) {
        const response = await SalesService.getItemByCode(itemCode, shopcode);
        const item = response.data;

        if (item) {
          setSalesRow((prev) => ({ ...prev, itemCode }));
          lastValidatedItemCodeRef.current = itemCode;
          handleItemSelect(item);
        } else {
          setSalesRow((prev) => ({ ...prev, itemCode: "", itemDesc: "", cntr: "" }));
          lastValidatedItemCodeRef.current = "";
          showPopupMessage(`Invalid Item Code: ${itemCode}`, "Validation", "warning", salesRefs.current["itemCode"]);
          if (!isBlur) {
            showLookup(
              lookupConfigs.itemdetails(
                handleItemSelect,
                headerData.goldSlv,
                resolveActiveShopCode(),
              ),
            );
          }
        }
      } else {
        setSalesRow((prev) => ({ ...prev, itemCode: "", itemDesc: "", cntr: "" }));
        lastValidatedItemCodeRef.current = "";
        showPopupMessage(`Invalid Item Code: ${itemCode}`, "Validation", "warning", salesRefs.current["itemCode"]);
        if (!isBlur) {
          showLookup(
            lookupConfigs.itemdetails(
              handleItemSelect,
              headerData.goldSlv,
              resolveActiveShopCode(),
            ),
          );
        }
      }
    } catch (error: any) {
      console.error("Item lookup error:", error);
      setSalesRow((prev) => ({ ...prev, itemCode: "", itemDesc: "", cntr: "" }));
      lastValidatedItemCodeRef.current = "";
      if (!isBlur) {
        showLookup(
          lookupConfigs.itemdetails(
            handleItemSelect,
            headerData.goldSlv,
            resolveActiveShopCode(),
          ),
        );
      }
    } finally {
      isValidatingItemRef.current = false;
    }
  };

  const handleItemCodeEnter = async (e, isBlur = false) => {
    if (e.key === "Home") {
      e.preventDefault();
      salesRefs.current["barcode"]?.focus();
      return;
    }
    if (e.key === "PageUp") {
      e.preventDefault();
      headerRefs.current["gRate"]?.focus();
      return;
    }
    if (e.key === "PageDown") {
      e.preventDefault();
      // Placeholder for Purchase / Old Exchange focus as per Java app
      console.log("PageDown triggered: Move to purchase block");
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      // Focus sales table
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const itemCode = (salesRow.itemCode || "").trim().toUpperCase();
      await processItemCodeChange(itemCode, false);
    } else if (e.key === "F2") {
      e.preventDefault();
      showLookup(
        lookupConfigs.itemdetails(
          handleItemSelect,
          headerData.goldSlv,
          resolveActiveShopCode(),
        ),
      );
    }
  };

  const handleItemSelect = async (item) => {
    console.log("Selected item:", item);
    console.log("Counter value:", item.counter);
    setIsMetalLocked(true); // Lock metal type as soon as an item is selected

    // Resolve itemCode defensively from any backend casing variant
    const resolvedCode = (
      item.itemCode ||
      item.item_code ||
      item.ITEM_CODE ||
      item.icode ||
      item.ICODE ||
      ""
    )
      .toString()
      .trim();

    // Fetch gold rate by item code
    if (resolvedCode) {
      try {
        const goldRateResponse = await SalesService.getGoldRateByItemCode(
          resolvedCode,
          resolveActiveShopCode(),
        );
        console.log("Gold rate response:", goldRateResponse.data);
        const rateData = goldRateResponse.data;

        if (rateData) {
          // 1. Tax Validation Logic
          const itemTax = getAmt(rateData.taxPer);
          const currentTax =
            getAmt(headerData.gstPer) + getAmt(headerData.igstPer);

          // Helper to set header tax
          const setHeaderTax = (tax) => {
            if (headerData.igst) {
              setHeaderData((prev) => ({
                ...prev,
                igstPer: fmtAmt(tax),
                gstPer: "0.00",
              }));
            } else {
              setHeaderData((prev) => ({
                ...prev,
                gstPer: fmtAmt(tax),
                igstPer: "0.00",
              }));
            }
          };

          if (salesGrid.length === 0) {
            // First Item: Set Header Tax automatically
            setHeaderTax(itemTax);
          } else {
            // Subsequent Items: Validate Tax
            // Tolerance for floating point comparison
            if (Math.abs(itemTax - currentTax) > 0.01) {
              showPopupMessage(
                "Tax % Is Different, Unable To Enter This Data",
                "Validation",
              );
              // Clear selection and return to prevent adding
              setSalesRow((prev) => ({ ...prev, itemCode: "" }));
              salesRefs.current["itemCode"]?.focus();
              return;
            }
          }

          // 2. Rate Fix Logic
          if (rateData.rate) {
            if (!headerData.rateFix) {
              setHeaderData((prev) => ({
                ...prev,
                gRate: fmtAmt(rateData.rate),
              }));
              console.log("G-Rate updated to:", rateData.rate);
            } else {
              console.log(
                "Rate Fix active, keeping existing G-Rate:",
                headerData.gRate,
              );
            }
          }
        }
      } catch (goldRateError) {
        console.error(
          "Could not fetch gold rate for item:",
          item.itemCode,
          goldRateError,
        );
      }
    }

    // Get diamond status from backend
    let isDiamond = false;
    const resolvedItemCode = (
      item.itemCode ||
      item.item_code ||
      item.ITEM_CODE ||
      item.icode ||
      item.ICODE ||
      ""
    )
      .toString()
      .trim();
    try {
      const shopcode = resolveActiveShopCode();
      if (resolvedItemCode) {
        const dmdCheck = await SalesService.checkDiamondItem(
          resolvedItemCode,
          shopcode,
        );
        // Backend might return boolean, string "true", or even number 1
        isDiamond =
          dmdCheck.data === true ||
          dmdCheck.data === "true" ||
          dmdCheck.data === 1 ||
          dmdCheck.data === "1";
        console.log(
          `Backend diamond check for ${resolvedItemCode}:`,
          dmdCheck.data,
          "Result:",
          isDiamond,
        );
      }
    } catch (err: any) {
      console.warn("Diamond check failed", err);
      isDiamond = false;
    }

    lastValidatedItemCodeRef.current = resolvedCode || resolvedItemCode;
    setIsManualVaPerEdit(false);
    setSalesRow((prev) => {
      const pickItemValue = (...values) =>
        values.find(
          (value) =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== "",
        ) ?? 0;
      const existingVaPer = String(prev.vaPer || "").trim();
      const existingVaAmt = String(prev.vaAmt || "").trim();
      const itemVaPer = pickItemValue(
        item.vaPercent,
        item.va_percent,
        item.vaPer,
        item.va_per,
        item.vaper,
        item.estVaper,
        item.est_vaper,
        item.estvaper,
        item.EST_VAPER,
        item.va,
        item.valadd,
        item.VALADD,
        item.ps_valadd,
        item.PS_VALADD,
      );
      const itemVaAmt = pickItemValue(
        item.vaAmount,
        item.va_amount,
        item.vaAmt,
        item.va_amt,
        item.vaamt,
        item.estVamt,
        item.est_vamt,
        item.estvamt,
        item.EST_VAMT,
        item.vamt,
        item.VAMT,
        item.ps_val,
        item.PS_VAL,
      );
      const resolvedVaPer =
        existingVaPer && getAmt(existingVaPer) !== 0
          ? existingVaPer
          : fmtAmt(itemVaPer);
      const shouldUseItemVaAmt =
        getAmt(resolvedVaPer) === 0 &&
        (!existingVaAmt || getAmt(existingVaAmt) === 0) &&
        getAmt(itemVaAmt) !== 0;

      return {
        ...prev,
        itemCode: resolvedItemCode || resolvedCode,
        itemDesc: item.itemDesc || item.item_desc || item.ITEM_DESC || "",
        cntr: item.cntr || item.counter || "",
        unit: item.unit || "", // Store unit
        billType:
          item.billType ||
          item.bill_type ||
          item.billtype ||
          item.bType ||
          item.btype ||
          "", // Store billType
        isDiamond: isDiamond,
        // Preserve non-zero VA%, otherwise fall back to item VA percent or VA amount.
        vaPer: resolvedVaPer,
        vaAmt: shouldUseItemVaAmt ? fmtAmt(itemVaAmt) : prev.vaAmt,
        isVaAmtManual: shouldUseItemVaAmt,
        sMan: resolveSelectedSalesman(prev.sMan || headerData.salesman),
      };
    });

    // Auto-Focus Logic:
    // 1. If Stone Item (unit=CT/CTS) -> Focus Stone Code
    // 2. Else -> Focus Qty (standard flow)
    // Note: Piece Items (billType='P') do NOT auto-open modal here.
    //       Modal opens AFTER Gross Weight entry (see Gross Wt onKeyDown handler)

    const isStoneItem = ["CT", "CTS"].includes(item.unit?.toUpperCase());

    if (isStoneItem) {
      console.log(
        "Detected Stone Item (Unit: " + item.unit + "), focusing Stone Code...",
      );
      setTimeout(() => stoneRefs.current["stoneCode"]?.focus(), 0);
    } else {
      console.log("Standard Item, focusing Qty...");
      setTimeout(() => {
        const qtyEl = salesRefs.current["qty"];
        if (qtyEl) {
          qtyEl.focus();
          qtyEl.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }, 0);
    }
  };

  const processEstNoSubmit = async (customEstNo?: string) => {
    if (estNoDebounceTimerRef.current) {
      clearTimeout(estNoDebounceTimerRef.current);
    }
    const estNo = (customEstNo ?? headerData.estNo ?? "").trim();
    if (!estNo || estNo === "New") {
      handleEstNoLookup();
      return;
    }

    if (isEstNoLocked || isProcessingEstNoRef.current) return;

    isProcessingEstNoRef.current = true;

    try {
      // Delete mode must follow the delete flow model
      if (actionStatus === "DELETE") {
        await runDeleteFlow(estNo);
        return;
      }

      if (pendingPrintAfterEstSelect) {
        const printType =
          pendingPrintType || (headerData.printEstimate ? "E" : "T");
        const shopCode = resolveActiveShopCode();

        if (!shopCode) {
          showPopupMessage(
            "Shop code is missing. Please reload and try again.",
            "Validation",
          );
          return;
        }

        // Check existence first
        try {
          const exists = await SalesService.getEntry(estNo, shopCode);
          if (exists.data) {
            setPendingPrintAfterEstSelect(false);
            setPendingPrintType("T");
            await fetchAndPrintReport(estNo, shopCode, printType);
            return;
          }
        } catch (err: any) {
          console.log("Print entry not found, opening lookup");
          handleEstNoLookup();
        }
        return;
      }

      const success = await fetchData(estNo, false);
      if (success && success !== "BILLED") {
        headerRefs.current["name"]?.focus();
      } else if (success === "BILLED") {
        // Already handled inside fetchData (shows warning & focuses estNo)
      } else {
        // Estimate not found or invalid -> Open Lookup Modal
        handleEstNoLookup();
      }
    } catch (err) {
      console.error("EstNo processing error:", err);
      handleEstNoLookup();
    } finally {
      isProcessingEstNoRef.current = false;
    }
  };

  const handleEstNoBlur = async () => {
    // Prevent onBlur from triggering if a warning/message popup is open, or if currently processing or locked
    if (popupMessage || isProcessingEstNoRef.current || isEstNoLocked) return;

    const estNo = (headerData.estNo || "").trim();
    if (estNo && estNo !== "New") {
      await processEstNoSubmit(estNo);
    }
  };

  const handleHeaderEnter = async (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (field === "estNo") {
        await processEstNoSubmit();
      }
    } else if (e.key === "F2" && field === "estNo") {
      e.preventDefault();
      handleEstNoLookup();
    }
  };

  const completeSalesRow = async () => {
    const isSilverPieceItem = isSilverFocusFlow();

    const vaAmt = getAmt(salesRow.vaAmt);
    const grossWt = getWt(salesRow.grossWt);
    const itemAmt = getAmt(salesRow.amount);
    const isLooseStone =
      ["LS", "BS"].includes(salesRow.cntr || "") || salesRow.itemCode === "BS";
    const isPieceItem =
      String(salesRow.billType || "").toUpperCase() === "P";

    // Skip validation completely if the row is empty (user just tabbed through)
    const isEmptyRow = grossWt <= 0 && itemAmt <= 0 && !salesRow.itemCode;
    if (isEmptyRow) {
      return;
    }

    // Validation 1: Require a valid Item Code
    const currentItemCode = (salesRow.itemCode || "").trim().toUpperCase();
    const validatedCode = (lastValidatedItemCodeRef.current || "").trim().toUpperCase();
    if (!currentItemCode || (validatedCode && currentItemCode !== validatedCode)) {
      showPopupMessage(
        "Please enter a valid Item Code!",
        "Validation",
        "warning",
        salesRefs.current["itemCode"],
      );
      salesRefs.current["itemCode"]?.focus();
      return;
    }

    // Validation 2: Require Gross Weight > 0 for non-piece items
    if (grossWt <= 0 && !isPieceItem) {
      showPopupMessage(
        "Please enter valid Gross Weight!",
        "Validation",
        "warning",
        salesRefs.current["grossWt"],
      );
      salesRefs.current["grossWt"]?.focus();
      return;
    }

    if (vaAmt <= 0 && !isLooseStone && !isSilverPieceItem && !isEmptyRow) {
      if (isPieceItem) {
        // bill_type='P' items bypass VA Amount check (piece-priced items)
      } else {
        // Check zero_va_item table — items listed there are allowed with zero VA
        let isZeroVaItem = false;
        try {
          const auth = JSON.parse(
            sessionStorage.getItem("currentUser") || "{}",
          );
          const shopCode = resolveActiveShopCode();
          const itemCode = String(salesRow.itemCode || "").trim().toUpperCase();
          if (itemCode) {
            const res = await DynamicQueryService.fetchList(
              `SELECT itemcode FROM zero_va_item WHERE itemcode = '${itemCode}'`,
              {},
              auth,
              shopCode,
            );
            isZeroVaItem =
              Array.isArray(res?.data) && res.data.length > 0;
          }
        } catch {
          // If lookup fails, fall through to block
        }

        if (!isZeroVaItem) {
          showPopupMessage(
            "Please check VA Amount !!!",
            "Validation",
            "info",
            salesRefs.current["vaAmt"],
          );
          return;
        }
      }
    }

    if (getAmt(salesRow.amount) > 0 || getWt(salesRow.grossWt) > 0 || isPieceItem) {
      // Validation: Ensure Salesman is selected before adding items
      if (!headerData.salesman && salesmanGrid.length === 0) {
        showPopupMessage(
          "Please select a Salesman before adding items!",
          "Validation",
        );
        headerRefs.current["salesman"]?.focus();
        return;
      }

      const selectedSmanCode = String(salesRow.sMan || "")
        .trim()
        .toUpperCase();
      const availableSmanCodes = getAvailableSalesmanCodes();
      if (
        availableSmanCodes.length > 0 &&
        selectedSmanCode &&
        !availableSmanCodes.includes(selectedSmanCode)
      ) {
        showPopupMessage(
          "Selected salesman is not in the Salesman table. Please choose from the list.",
          "Validation",
        );
        return;
      }

      // Validation: Check Gross Weight vs Stone Weight
      const stoneWt = getWt(salesRow.stoneWt);
      if (stoneWt > grossWt && grossWt > 0) {
        showPopupMessage(
          `Gross Weight (${grossWt}) cannot be less than Stone Weight (${fmtWt(stoneWt)})`,
          "Validation",
        );
        salesRefs.current["grossWt"]?.focus();
        return;
      }

      // Validation: Check for duplicate barcode (skip default 0000000000)
      const barcodeCheck = (salesRow.barcode || "").replace(/^0+$/, "");
      if (
        barcodeCheck &&
        salesGrid.some(
          (item, idx) =>
            item.barcode === salesRow.barcode && idx !== editingRowIndex,
        )
      ) {
        showPopupMessage(
          "This barcode is already used in this estimate!",
          "Validation",
        );
        salesRefs.current["barcode"]?.focus();
        salesRefs.current["barcode"]?.select();
        return;
      }

      const updatedRow = {
        ...salesRow,
        barcode: (salesRow.barcode || "").trim() || "0000000000",
        estRate: fmtAmt(
          salesRow.estRate && getAmt(salesRow.estRate) > 0
            ? salesRow.estRate
            : getAmt(headerData.gRate) > 0
              ? headerData.gRate
              : 0,
        ),
        sMan: resolveSelectedSalesman(salesRow.sMan || headerData.salesman),
        stoneDetails:
          stoneGrid.length > 0 ? stoneGrid : salesRow.stoneDetails || [],
      };

      let newGridForNextSlno = salesGrid;
      if (editingRowIndex !== null) {
        // UPDATE existing row in-place
        newGridForNextSlno = salesGrid.map((row, idx) =>
          idx === editingRowIndex ? { ...updatedRow, slNo: row.slNo } : row,
        );
        setSalesGrid(newGridForNextSlno);
        setEditingRowIndex(null); // Exit edit mode
      } else {
        // APPEND new row
        const newRow = {
          ...updatedRow,
          slNo: (salesGrid.length + 1).toString(),
        };
        newGridForNextSlno = [...salesGrid, newRow];
        setSalesGrid(newGridForNextSlno);
      }

      // Clear stone grid FIRST (synchronously) so useEffect sees empty stoneGrid
      setStoneGrid([]);
      setStoneRow({
        sNo: "1",
        stoneCode: "",
        color: "",
        qty: "0",
        wt: "",
        rate: "",
        amount: "",
      });

      // Reset salesRow in next tick so the useEffect recalculates from stoneWt=0.000
      setTimeout(() => {
        lastValidatedItemCodeRef.current = "";
        setSalesRow({
          ...salesEmpty,
          slNo: (newGridForNextSlno.length + 1).toString(),
          itemCode: "",
          stoneWt: "0.000",
          stnChg: "0.00",
          netWt: "0.000",
          goldAmt: "0.00",
          amount: "0.00",
        });
      }, 0);

      salesRefs.current["barcode"]?.focus();
    }
  };

  const handleSalesEnter = async (e, nextField) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (nextField === "SLNO_FOCUS") {
        salesRefs.current["slNo"]?.focus();
        return;
      }

      if (nextField === "PLUS_BUTTON") {
        plusBtnRef.current?.focus();
        return;
      }

      if (nextField === "COMPLETE") {
        await completeSalesRow();
      } else if (salesRefs.current[nextField]) {
        salesRefs.current[nextField]?.focus();
      }
    }
  };

  // Handle Piece Amount (Reverse Calculation)
  const handlePieceAmountSubmit = (e) => {
    e.preventDefault();
    const mrp = getAmt(pieceAmountInput);

    // Validation: Amount must be >= 50
    if (mrp < 50) {
      showPopupMessage("Amount is Less", "Validation");
      setIsPieceModalOpen(false);
      setPieceAmountInput("");
      salesRefs.current["grossWt"]?.focus(); // Return to Gross Weight
      return;
    }

    // ... (existing piece amount logic remains managed by useEffect/setSalesRow)

    // Calculate Base Amount by removing Tax
    // Formula from Java: amt = (amt / (100 + gst + igst)) * 100
    const gstRate = getAmt(headerData.gstPer);
    const igstRate = getAmt(headerData.igstPer);
    const baseAmount = (mrp / (100 + gstRate + igstRate)) * 100;

    // Set the calculated base amount directly in the Amount field
    // This is the Total before Tax (Gold + VA + Stone + MK)
    // The system will back-calculate VA% from this
    setSalesRow((prev) => ({
      ...prev,
      amount: fmtAmt(baseAmount),
    }));

    setIsPieceModalOpen(false);
    setPieceAmountInput("");
    // Focus the Amount field to show where the value was set
    setTimeout(() => salesRefs.current["amount"]?.focus(), 100);
  };

  const handleVaAmtEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const vaAmt = getAmt(salesRow.vaAmt);

      if (vaAmt === 0) {
        // If 0, reset formatted and focus Making Charge
        setSalesRow((prev) => ({ ...prev, vaAmt: "0.00" }));
        salesRefs.current["mkRate"]?.focus();
      } else {
        // If > 0, Clear Wastage and Making Charge (Mutual Exclusivity)
        // Recalculate Totals based on Fixed VA Amount
        const netWt = getWt(salesRow.netWt);
        const goldRate = getAmt(headerData.gRate);
        const goldAmt = netWt * goldRate;
        const stnChg = getAmt(salesRow.stnChg);
        const total = goldAmt + stnChg + vaAmt;

        // Calculate implied VA% for reference (though not used for calculation in this mode)
        let impliedVaPer = 0;
        if (goldAmt > 0) {
          impliedVaPer = (vaAmt * 100) / goldAmt;
        }

        setSalesRow((prev) => ({
          ...prev,
          vaAmt: fmtAmt(vaAmt),
          wastage: "0.000",
          mkRate: "0.00", // Clear Making Charge
          vaPer: fmtAmt(impliedVaPer), // Update VA% for display
          amount: fmtAmt(total),
          isVaAmtManual: true, // FLAG: Prevent reverse calc from implied percentage
        }));

        if (getWt(salesRow.stoneWt) > 0) {
          salesRefs.current["stnChg"]?.focus();
        } else {
          salesRefs.current["stnChg"]?.focus();
        }
      }
    }
  };

  const openPieceModal = async () => {
    // This is a piece-rate item: G-Rate (header) and Gold Amount must be zeroed out
    setHeaderData((prev) => ({
      ...prev,
      gRate: "0.00",
    }));

    // If it's the first row, auto-fetch category tax from backend (as per Java logic)
    if (salesGrid.length === 0) {
      try {
        const itemCode = salesRow.itemCode;
        if (itemCode) {
          const taxRes = await SalesService.getCategoryTaxRate(
            itemCode,
            resolveActiveShopCode(),
          );
          if (taxRes.data) {
            const tax = Number(taxRes.data);
            if (!isNaN(tax)) {
              setHeaderData((prev) => ({
                ...prev,
                gstPer: prev.applyIgst ? "0.00" : fmtAmt(tax),
                igstPer: prev.applyIgst ? fmtAmt(tax) : "0.00",
              }));
              console.log("Auto-loaded category tax:", tax);
            }
          }
        }
      } catch (err: any) {
        console.warn("Failed to auto-load category tax:", err);
      }
    }

    setSalesRow((prev) => ({
      ...prev,
      mkRate: "0.00",
      goldAmt: "0.00",
    }));

    setPieceAmountInput("");
    setIsPieceModalOpen(true);
    setTimeout(() => pieceModalRef.current?.focus(), 100);
  };

  const handleStoneSelect = (stone) => {
    setStoneRow({
      ...stoneRow,
      stoneCode: stone.SCode || stone.sCode || stone.scode || "",
      color: stone.SUnit || stone.sUnit || stone.sunit || stone.ut || "",
      type: stone.SType || stone.sType || stone.stype || "",
      dtype: stone.SDtype || stone.sDtype || stone.sdtype || stone.tp || "Y",
      rate:
        stone.SRate !== undefined && stone.SRate !== null
          ? stone.SRate.toString()
          : stone.sRate !== undefined && stone.sRate !== null
            ? stone.sRate.toString()
            : stone.srate !== undefined && stone.srate !== null
              ? stone.srate.toString()
              : stone.rate !== undefined && stone.rate !== null
                ? stone.rate.toString()
                : "0.00",
    });

    setTimeout(() => stoneRefs.current["qty"]?.focus(), 0);
  };

  // Shared logic: saves the current stone row to the grid and updates sales totals.
  // Returns the updated grid, or null if validation fails (no stone code).
  const saveStoneRow = () => {
    console.log("Saving stone entry:", stoneRow);
    if (!stoneRow.stoneCode) {
      console.warn("No stone code, aborting");
      return null;
    }

    const rowToSave = {
      ...stoneRow,
      qty: String(Number(stoneRow.qty || 0)),
      wt: fmtWt(stoneRow.wt),
      rate: fmtAmt(stoneRow.rate),
      amount: fmtAmt(stoneRow.amount),
    };

    let newGrid;
    if (editingStoneIndex !== null) {
      // Update existing row
      newGrid = [...stoneGrid];
      newGrid[editingStoneIndex] = { ...rowToSave };
      setEditingStoneIndex(null);
    } else {
      // Add new row
      newGrid = [...stoneGrid, { ...rowToSave, sNo: stoneGrid.length + 1 }];
    }
    setStoneGrid(newGrid);
    setStoneRow({ ...stoneEmpty, sNo: newGrid.length + 1 });

    // Calculate totals
    const { totalWt, totalAmt } = calculateStoneTotals(newGrid);

    // Validation: Check Gross Wt
    const grossWt = getWt(salesRow.grossWt);
    if (totalWt > grossWt && grossWt > 0) {
      showPopupMessage(
        `Gross Weight (${grossWt}) cannot be less than Stone Weight (${fmtWt(totalWt)})`,
        "Validation",
      );
    }

    // Update Sales Row with new totals
    const stoneWtVal = fmtWt(totalWt);
    const stoneChgVal = fmtAmt(totalAmt);
    const netWt = fmtWt(Math.max(0, grossWt - totalWt));
    const goldRate = getAmt(headerData.gRate);
    const goldAmt = fmtAmt(getWt(netWt) * goldRate);

    setSalesRow((prev) => ({
      ...prev,
      stoneWt: stoneWtVal,
      stnChg: stoneChgVal,
      netWt: netWt,
      goldAmt: goldAmt,
    }));

    return newGrid;
  };

  // Called by Enter key on the last stone field (dtype) — saves and immediately
  // returns focus to stoneCode so the user can enter the next stone quickly.
  const completeStoneRow = () => {
    const result = saveStoneRow();
    if (result === null) return;
    // Move focus back to Stone Code for next entry
    setTimeout(() => stoneRefs.current["stoneCode"]?.focus(), 100);
  };

  // Called by the + button — saves the stone row then asks whether to add another.
  // Yes → focus stoneCode  |  No → focus vaPer in Sales Details
  const completeStoneRowWithConfirm = () => {
    const result = saveStoneRow();
    if (result === null) return;
    // Defer modal open until after React flushes the grid/row state updates
    setTimeout(() => {
      setConfirmModal({
        isOpen: true,
        title: "Add Stone",
        message: "Do you want to add another stone?",
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));

          setTimeout(() => stoneRefs.current["stoneCode"]?.focus(), 100);
        },
        onCancel: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));

          setTimeout(() => salesRefs.current["vaPer"]?.focus(), 100);
        },
        isDestructive: false,
      });
    }, 50);
  };

  const handleStoneEnter = (e, nextField) => {
    if (e.key === "Enter") {
      e.preventDefault();

      try {
        console.log(`handleStoneEnter: nextField=${nextField}`);

        if (nextField === "COMPLETE") {
          // Focus the + button so the user confirms via the modal
          stonePlusBtnRef.current?.focus();
        } else if (stoneRefs.current[nextField]) {
          stoneRefs.current[nextField].focus();
        }
      } catch (error: any) {
        console.error("Error in handleStoneEnter:", error);
        showPopupMessage(
          "An error occurred while adding stone details.",
          "Stone Details",
        );
      }
    }
  };

  const handleStoneCodeEnter = async (e, isBlur = false) => {
    if (e.key === "PageDown") {
      e.preventDefault();
      setTimeout(() => salesRefs.current["vaPer"]?.focus(), 50);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const code = (stoneRow.stoneCode || "").trim();
      const shopcode = resolveActiveShopCode();

      // 1. Empty field: open lookup immediately (no guard needed)
      if (!code) {
        if (!isBlur) {
          showLookup(lookupConfigs.stone(handleStoneSelect, shopcode));
        }
        return;
      }

      // 2. Code typed: validate (guard prevents concurrent API calls)
      console.log(
        "handleStoneCodeEnter: Enter pressed. isBlur =",
        isBlur,
        "value =",
        code,
        "isValidating =",
        isValidatingStoneRef.current,
      );
      if (isValidatingStoneRef.current) {
        console.log("handleStoneCodeEnter: validation guard active, returning");
        return;
      }
      isValidatingStoneRef.current = true;
      try {
        try {
          const response = await SalesService.getStones(shopcode);
          const stones = response.data || [];

          const match = stones.find(
            (s) =>
              String(s.SCode || s.sCode || s.scode || "").toUpperCase() ===
              code.toUpperCase(),
          );

          if (match) {
            handleStoneSelect(match);
          } else {
            if (!isBlur) {
              setStoneRow((prev) => ({
                ...prev,
                stoneCode: "",
              }));
              showLookup(lookupConfigs.stone(handleStoneSelect, shopcode));
            }
          }
        } catch (err: any) {
          console.error("Error matching stone:", err);
          if (!isBlur) {
            setStoneRow((prev) => ({
              ...prev,
              stoneCode: "",
            }));
            showLookup(lookupConfigs.stone(handleStoneSelect, shopcode));
          }
        }
      } finally {
        isValidatingStoneRef.current = false;
      }
    }
  };

  // Handle manual VA Amount entry (with vaPer calculation)
  const handleVaAmountChange = (value) => {
    setSalesRow((prev) => ({
      ...prev,
      vaAmt: limitDecimals(value, 3),
      wastage: "0.000",
      mkRate: "0.00",
      isVaAmtManual: true,
    }));
    setIsManualVaPerEdit(false); // Let the effect calculate the percentage live
  };

  // Lookup Modal Handlers
  // const handleStoneCodeLookup = () => {
  //   setIsStoneModalOpen(true);
  // };

  // Row Action Handlers
  const handleRowDoubleClick = (index) => {
    setClickedRowIndex(index);
    setIsActionModalOpen(true);
  };

  // Touch support for mobile/tablet double-tap
  const handleRowTap = (index) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 500; // Increased to 500ms for better touch responsiveness

    if (lastTapIndex === index && now - lastTapTime < DOUBLE_TAP_DELAY) {
      // Double tap detected
      setClickedRowIndex(index);
      setIsActionModalOpen(true);
      setLastTapTime(0);
      setLastTapIndex(null);
    } else {
      // First tap
      setLastTapTime(now);
      setLastTapIndex(index);
    }
  };

  // Manual Double-Tap for Inputs (Touch Screens)
  const handleInputDoubleTap = (field, action) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 500; // 500ms

    if (
      lastInputTap.field === field &&
      now - lastInputTap.time < DOUBLE_TAP_DELAY
    ) {
      console.log(`Double tap detected on ${field}`);
      action(); // Trigger the lookup
      setLastInputTap({ field: null, time: 0 });
    } else {
      setLastInputTap({ field, time: now });
    }
  };

  // Specific Double-tap handler for Stone Details (Inline Edit via touch)
  const handleStoneRowTap = (index) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // milliseconds

    if (lastTapIndex === index && now - lastTapTime < DOUBLE_TAP_DELAY) {
      // Double tap detected on touch: Edit stone row inline
      setEditingStoneIndex(index);
      setStoneRow(stoneGrid[index]);
      setTimeout(() => stoneRefs.current["stoneCode"]?.focus(), 100);
      setLastTapTime(0);
      setLastTapIndex(null);
    } else {
      // First tap
      setLastTapTime(now);
      setLastTapIndex(index);
    }
  };

  const confirmEdit = () => {
    if (clickedRowIndex !== null) {
      // If another row is already being edited, block
      if (editingRowIndex !== null && editingRowIndex !== clickedRowIndex) {
        showPopupMessage(
          "Please finish editing the current row first before editing another.",
          "Validation",
        );
        setIsActionModalOpen(false);
        return;
      }

      const rowToEdit = salesGrid[clickedRowIndex];
      // Load into input fields
      lastValidatedItemCodeRef.current = rowToEdit.itemCode || "";
      setSalesRow(rowToEdit);
      // Load stone details back into stone table
      setStoneGrid(rowToEdit.stoneDetails || rowToEdit.stones || []); // Check both keys for safety!
      setStoneRow({
        sNo: "1",
        stoneCode: "",
        color: "",
        qty: "0",
        wt: "",
        rate: "",
        amount: "",
        dtype: "Y",
      });

      // Mark which row is being edited (DON'T remove from grid)
      setEditingRowIndex(clickedRowIndex);

      setIsActionModalOpen(false);
      setClickedRowIndex(null);
      // Focus barcode
      setTimeout(() => salesRefs.current["barcode"]?.focus(), 100);
    }
  };

  const confirmDelete = () => {
    if (clickedRowIndex !== null) {
      const newGrid = salesGrid
        .filter((_, i) => i !== clickedRowIndex)
        .map((row, index) => ({
          ...row,
          slNo: (index + 1).toString(), // Renumber sequentially
        }));
      setSalesGrid(newGrid);

      // Also update the next slNo for the input row
      setSalesRow({ ...salesEmpty, slNo: (newGrid.length + 1).toString() });
      setStoneGrid([]); // Clear stone details table

      setStoneRow(stoneEmpty);
      setEditingRowIndex(null); // Ensure we exit edit mode if the deleted row was being edited

      setIsActionModalOpen(false);
      setClickedRowIndex(null);
    }
  };

  // --- Salesman Row Actions ---
  const handleSmanRowDoubleClick = (index) => {
    setClickedSmanIndex(index);
    setIsSmanActionModalOpen(true);
  };

  const handleSmanRowTap = (index) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 500;
    const selected = salesmanGrid[index];
    const selectedCode = String(
      selected?.smCode || selected?.salesmancode || "",
    )
      .trim()
      .toUpperCase();

    if (selectedCode) {
      setSalesRow((prev) => ({ ...prev, sMan: selectedCode }));
    }

    if (lastTapIndex === index && now - lastTapTime < DOUBLE_TAP_DELAY) {
      setClickedSmanIndex(index);
      setIsSmanActionModalOpen(true);
      setLastTapTime(0);
      setLastTapIndex(null);
    } else {
      setLastTapTime(now);
      setLastTapIndex(index);
    }
  };

  const confirmSmanEdit = () => {
    if (clickedSmanIndex !== null) {
      const smToEdit = salesmanGrid[clickedSmanIndex];
      const smCode = smToEdit.smCode || "";

      // Check if this salesman is used in any sales grid item
      const isUsed = salesGrid.some(
        (item) => (item.sMan || "").trim() === smCode.trim(),
      );
      if (isUsed && smCode.trim() !== "") {
        showPopupMessage(
          `Cannot edit Salesman ${smCode} as it is assigned to items in the Sales Details.`,
          "Warning",
        );
        return;
      }

      // Load back into header fields
      setSalesmanRow({
        smCode: smCode,
        smName: smToEdit.smName || "",
      });
      // Remove from grid to allow re-adding
      const newGrid = salesmanGrid.filter((_, i) => i !== clickedSmanIndex);
      setSalesmanGrid(newGrid);

      setIsSmanActionModalOpen(false);
      setClickedSmanIndex(null);
      // Focus salesman input
      setTimeout(() => headerRefs.current["salesman"]?.focus(), 100);
    }
  };

  const confirmSmanDelete = () => {
    if (clickedSmanIndex !== null) {
      const smToDelete = salesmanGrid[clickedSmanIndex];
      const smCode = smToDelete.smCode || "";

      // Check if this salesman is used in any sales grid item
      const isUsed = salesGrid.some(
        (item) => (item.sMan || "").trim() === smCode.trim(),
      );
      if (isUsed && smCode.trim() !== "") {
        showPopupMessage(
          `Cannot delete Salesman ${smCode} as it is assigned to items in the Sales Details.`,
          "Warning",
        );
        return;
      }

      const newGrid = salesmanGrid.filter((_, i) => i !== clickedSmanIndex);
      setSalesmanGrid(newGrid);
      setIsSmanActionModalOpen(false);
      setClickedSmanIndex(null);
    }
  };

  const toIntOrNull = (value) => {
    const parsed = getNo(value);
    return parsed > 0 ? parsed : null;
  };

  const toOrderYearOrNull = (value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    if (/^\d+$/.test(raw)) {
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    const fourDigit = raw.match(/\d{4}/);
    if (fourDigit) {
      const n = Number(fourDigit[0]);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    const anyDigits = raw.match(/\d+/);
    if (anyDigits) {
      const n = Number(anyDigits[0]);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
  };

  const toWeight6Value = (value) => {
    const extractFirstNumeric = (raw) => {
      if (typeof raw === "number" && Number.isFinite(raw)) return raw;
      if (typeof raw === "string") {
        const text = raw.trim();
        if (!text) return 0;
        const normalized = text.replace(/,/g, "");
        const direct = Number(normalized);
        if (Number.isFinite(direct)) return direct;
        try {
          const parsed = JSON.parse(text);
          return extractFirstNumeric(parsed);
        } catch (e) { }
        const match = normalized.match(/-?\d+(\.\d+)?/);
        return match ? Number(match[0]) : 0;
      }
      if (Array.isArray(raw)) {
        for (const item of raw) {
          const n = extractFirstNumeric(item);
          if (Number.isFinite(n) && n !== 0) return n;
        }
        return 0;
      }
      if (raw && typeof raw === "object") {
        const preferredKeys = [
          "grosswt",
          "totalgdwtbycustid",
          "totalgdwt",
          "gdwt",
          "weight",
          "value",
        ];
        for (const key of preferredKeys) {
          const val = raw[key] ?? raw[key.toUpperCase()];
          const n = extractFirstNumeric(val);
          if (Number.isFinite(n) && n !== 0) return n;
        }
        for (const val of Object.values(raw)) {
          const n = extractFirstNumeric(val);
          if (Number.isFinite(n) && n !== 0) return n;
        }
      }
      return 0;
    };

    return Number(extractFirstNumeric(value).toFixed(6));
  };

  // Handle New Click
  const handleNewClick = async (options: any = {}) => {
    const { keepAdvanceOpen = false } = options;

    if (!keepAdvanceOpen) {
      setShowAdvance(false);
    }
    setSalesGrid([]);
    setStoneGrid([]);

    setSalesmanGrid([]);
    setAdvanceGrid([]);
    setCreditNoteGrid([]);
    setPurchaseGrid([]);
    setSalesRow(salesEmpty);
    lastValidatedItemCodeRef.current = "";
    setStoneRow(stoneEmpty);
    setSalesmanRow(salesmanEmpty);

    let fetchedRate = "";
    let fetchedEstNo = "";
    const activeShopCode = resolveActiveShopCode();

    try {
      const rateResponse = await SalesService.getTodayGoldRate(
        activeShopCode,
      );
      if (rateResponse.data && rateResponse.data.rate) {
        fetchedRate = fmtAmt(rateResponse.data.rate);
      }
    } catch (error: any) {
      console.warn("Could not fetch today gold rate:", error);
    }

    const serverDate = await fetchServerDate(activeShopCode);

    fetchedEstNo = "New"; // Default to New

    setHeaderData((prev) => ({
      ...prev,
      estNo: fetchedEstNo,
      estDate: serverDate,
      gRate: fetchedRate,
      goldSlv: prev.goldSlv || "GOLD",
      gstPer: "3.00",
      igstPer: "0.00",
      applyIgst: false,
      custId: "",
      custName: "",
      phone: "",
      address1: "",
      address2: "",
      place: "",
      pincode: "",
      email: "",
      aadhar: "",
      pan: "",
      gstNo: "",
      careOf: "",
      salesman: "",
      salesmanName: "",
      rateFix: false,
      printEstimate: false,
      barFlag: false,
    }));
    setIsUpdate(false);
    setActionStatus("NEW");
    setIsFormEnabled(true);
    setIsDirectCreditNote(false);

    setIsNewDisabled(true);
    setIsModifyDisabled(true);
    setIsDeleteDisabled(true);
    setIsSaveDisabled(false);
    setIsCancelDisabled(false);

    if (!options.skipFocus) {
      setTimeout(() => headerRefs.current["phone"]?.focus(), 100);
    }
  };

  // Handle Save
  const handleSave = async () => {
    if (!headerData.custName?.trim()) {
      showPopupMessage("Please enter a customer name.", "Validation");
      headerRefs.current["name"]?.focus();
      return;
    }

    if (!headerData.address1?.trim()) {
      showPopupMessage("Please enter Add1.", "Validation");
      headerRefs.current["add1"]?.focus();
      return;
    }

    if (
      salesGrid.length === 0 &&
      creditNoteGrid.length === 0 &&
      purchaseGrid.length === 0 &&
      advanceGrid.length === 0
    ) {
      showPopupMessage(
        "Please add at least one item (Sale, Advance, Credit Note, or Purchase) to save.",
        "Validation",
      );
      return;
    }

    // Legacy checkSave() rules — only apply when Sales grid is empty
    if (salesGrid.length === 0) {
      if (advanceGrid.length > 0) {
        showPopupMessage(
          "Advance Details Not Supported Against Credit Note / Purchase",
          "Warning",
        );
        return;
      }
      if (purchaseGrid.length > 0 && creditNoteGrid.length > 0) {
        showPopupMessage(
          "Cannot save Purchase and Credit Note together without Sales Details.",
          "Warning",
        );
        return;
      }
    }

    if (!headerData.salesman) {
      showPopupMessage("Please select a Salesman.", "Validation");
      headerRefs.current["salesman"]?.focus();
      return;
    }

    // Validate Care-Of Code existence and correctness
    const careOfVal = (headerData.careOf || "").trim();
    if (!careOfVal) {
      showPopupMessage(
        "Please select a Care-Of code.",
        "Validation",
        "warning",
        headerRefs.current["careOf"],
        () => openCareOfLookup(),
      );
      return;
    }

    try {
      const res = await SalesService.checkCareOfCode(
        careOfVal,
        resolveActiveShopCode(),
      );
      if (!res.data || !res.data.careofcode) {
        showPopupMessage(
          "Invalid Care-Of code.",
          "Validation",
          "warning",
          headerRefs.current["careOf"],
          () => openCareOfLookup(),
        );
        return;
      }
    } catch (err) {
      showPopupMessage(
        "Invalid Care-Of code.",
        "Validation",
        "warning",
        headerRefs.current["careOf"],
        () => openCareOfLookup(),
      );
      return;
    }

    const normalizedShopCode = resolveActiveShopCode();
    if (!normalizedShopCode) {
      showPopupMessage(
        "Shop code is missing. Please reload and try again.",
        "Validation",
      );
      return;
    }

    const normalizedEstNo = toIntOrNull(headerData.estNo);
    if (normalizedEstNo == null) {
      showPopupMessage("Invalid Estimate Number", "Validation");
      return;
    }

    // --- Zod Transaction Schema Validation ---
    const validationResult = validateEstimateSubmission(
      headerData,
      salesGrid,
      purchaseGrid,
      advanceGrid,
      creditNoteGrid,
    );

    if (!validationResult.isValid) {
      showPopupMessage(
        validationResult.errors.join("\n"),
        "Validation Errors",
        "warning",
      );
      return;
    }

    const currentSessionUser =
      JSON.parse(sessionStorage.getItem("currentUser") || "{}") ||
      JSON.parse(localStorage.getItem("currentUser") || "{}") ||
      {};
    const operatorUsername = String(currentSessionUser.username || "")
      .trim()
      .toUpperCase();

    const subTotal = salesGrid.reduce(
      (sum, row) => sum + getAmt(row.amount),
      0,
    );
    const gstRateValue = headerData.applyIgst
      ? getAmt(headerData.igstPer)
      : getAmt(headerData.gstPer);
    const gstAmtValue = subTotal * (gstRateValue / 100);

    // Deductions: Purchase (Old Gold) and Credit Note (Returns)
    const purchaseDeduction = purchaseGrid.reduce(
      (sum, row) => sum + getAmt(row.amount),
      0,
    );
    const creditNoteDeduction = creditNoteGrid.reduce(
      (sum, row) => sum + getAmt(row.amount),
      0,
    );

    const totalHeaderAmount =
      subTotal + gstAmtValue - purchaseDeduction - creditNoteDeduction;

    // Get salesmen from grid for multi-mapping
    const salesman1 = salesmanGrid[0]?.smCode || headerData.salesman || "";
    const salesman2 = salesmanGrid[1]?.smCode || "";

    // 🚀 Payload Builders
    const buildGeneralPayload = (
      estNo,
      custId,
      totalAmount,
      operator,
      shopCode,
      finalAadharVal,
      finalPanVal,
      finalGstVal,
    ) => ({
      estNo,
      estDte: headerData.estDate,
      estGrate: fmtAmt(headerData.gRate),
      userid: 1,
      custid: custId,
      estCunm: headerData.custName,
      estAdd1: headerData.address1,
      estAdd2: headerData.address2,
      estAdd3: headerData.place,
      estPin: headerData.pincode,
      estPhone: headerData.phone,
      estSman1: salesman1,
      estSman2: salesman2,
      estOptr: operator,
      goldSlv: headerData.goldSlv === "SILVER" ? "S" : "G",
      barflag: !!headerData.barFlag,
      estGstper: fmtAmt(headerData.applyIgst ? "0.00" : headerData.gstPer),
      estIgstper: fmtAmt(headerData.applyIgst ? headerData.igstPer : "0.00"),
      estOthtaxper: 0.0,
      estTamt: fmtAmt(totalAmount),
      estDiscount: 0.0,
      prevAmt: 0.0,
      aadharno: finalAadharVal,
      aadhar: finalAadharVal,
      aadhaar: finalAadharVal,
      panno: finalPanVal,
      pan: finalPanVal,
      gstno: finalGstVal,
      gstin: finalGstVal,
      careoff: headerData.careOf,
      estsbillno: 0,
      estsdate: headerData.estDate,
      estyear: new Date(headerData.estDate || Date.now()).getFullYear(),
      estDisrate: 0.0,
      shopcode: shopCode,
      grate22: fmtAmt(headerData.grate22 || 0),
      grate18: fmtAmt(headerData.grate18 || 0),
      slvrate: fmtAmt(headerData.slvrate || 0),
      purSplitflag: false,
    });

    const buildItemsPayload = (estNo, shopCode) => ({
      estNo,
      shopcode: shopCode,
      barflag: !!headerData.barFlag,
      sMan: salesman1 || "",
      saleItems: salesGrid.map((row, index) => {
        const grossWt = getWt(row.grossWt);
        const stoneWt = getWt(row.stoneWt);
        const netWt = getWt(row.netWt);
        const goldRate = getAmt(headerData.gRate);
        const goldAmt = getAmt(row.goldAmt);
        const vaPer = getAmt(row.vaPer);
        const vaAmt = getAmt(row.vaAmt);
        const stnChg = getAmt(row.stnChg);
        const totalBeforeTax = goldAmt + vaAmt + stnChg;
        const gstPer = headerData.applyIgst ? 0 : getAmt(headerData.gstPer);
        const igstPer = headerData.applyIgst ? getAmt(headerData.igstPer) : 0;
        const gstAmt = (totalBeforeTax * gstPer) / 100;
        const igstAmt = (totalBeforeTax * igstPer) / 100;
        const totalAmt = totalBeforeTax + gstAmt + igstAmt;
        const paddedBarcode = (row.barcode || "0000000000").padStart(10, "0");
        const rowSalesman = row.sMan || salesman1 || "";

        return {
          estNo,
          slno: index + 1,
          itSlno: index + 1,
          estBarcode: paddedBarcode,
          estIcode: row.itemCode,
          estItdesc: row.itemDesc,
          estCntr: row.cntr,
          estQty: getQty(row.qty) || 1,
          estNoded: getNo(row.noded),
          estWt: fmtWt(grossWt),
          estStnwt: fmtWt(stoneWt),
          estWtded: 0.0,
          estWtadd: 0.0,
          estActualwt: fmtWt(row.actualWt),
          estNtwt: fmtWt(netWt),
          estMkch: fmtAmt(row.mkRate),
          estVaper: fmtAmt(vaPer),
          estWage: getWt(row.wastage),
          estVamt: fmtAmt(vaAmt),
          estStnch: fmtAmt(stnChg),
          estRate: fmtAmt(goldRate),
          estGamt: fmtAmt(goldAmt),
          estTamt: fmtAmt(totalBeforeTax),
          estGstper: fmtAmt(gstPer),
          estIgstper: fmtAmt(igstPer),
          estOthtaxper: 0.0,
          estGstamt: fmtAmt(gstAmt),
          estIgstamt: fmtAmt(igstAmt),
          estOthtaxamt: 0.0,
          totalamount: fmtAmt(totalAmt),
          barflag: !!headerData.barFlag,
          estSman: rowSalesman,
          estSman1: rowSalesman,
          afterva: fmtAmt(vaPer),
          aftervaamt: fmtAmt(vaAmt),
          afterstnch: fmtAmt(stnChg),
          itout: "Y",
          billtime: new Date().toTimeString().split(" ")[0],
        };
      }),
    });

    const buildSmanPayload = (estNo, shopCode) => ({
      estNo,
      shopcode: shopCode,
      saleamen: salesmanGrid.map((sm, index) => ({
        estNo,
        slno: index + 1,
        smcode: sm.smCode || "",
        smname: sm.smName || "",
      })),
    });

    const buildStonePayload = (estNo, shopCode) => ({
      estNo,
      shopcode: shopCode,
      stoneEntries: salesGrid.flatMap((row, rowIndex) => {
        const stones = row.stoneDetails || [];
        const paddedBarcode = (row.barcode || "0000000000").padStart(10, "0");
        return stones.map((stone, stoneIndex) => {
          const rate = getAmt(stone.rate);
          const amt = getAmt(stone.amount);
          return {
            estNo,
            slno: stoneIndex + 1,
            itSlno: rowIndex + 1,
            barcode: paddedBarcode,
            stnTyp: stone.stoneCode || "",
            stnRate: fmtAmt(rate),
            stnQty: fmtWt(stone.wt),
            stnNos: getNo(stone.qty),
            stnAmt: fmtAmt(amt),
            aftStnrate: fmtAmt(rate),
            aftStnamt: fmtAmt(amt),
            stype: stone.type || stone.stoneCode || "",
          };
        });
      }),
    });

    const auth = {
      username: operatorUsername,
      password: String(currentSessionUser.password || "").trim(),
    };

    // Purchase Payload
    const purchasePayload = {
      estNo: Number(headerData.estNo),
      estDte: headerData.estDate,
      purchaseItems: purchaseGrid.map((row, index) => ({
        psItcde: row.itemCode,
        psItdesc: row.itemDesc,
        psQty: getAmt(row.qty),
        psGwt: getWt(row.grossWt),
        psStwt: getWt(row.stoneWt),
        psNtwt: getWt(row.netWt),
        psMeltper: getAmt(row.meltPer),
        psMelt: getWt(row.meltLoss),
        psValadd: getAmt(row.vaPer),
        psVal: getAmt(row.vaAmt),
        psStch: getAmt(row.stnChg),
        dcode: row.dCode,
        psCtno: getNo(row.dNo),
        psCtwt: getWt(row.dCWt),
        purrate: getAmt(row.rate),
        psTamt: getAmt(row.amount),
        psGrate: getAmt(row.gRate),
        psSlno: index + 1,
        psTouch: getAmt(row.touch),
      })),
    };

    const advancePayload = {
      estNo: Number(headerData.estNo),
      estDte: headerData.estDate,
      advanceItems: advanceGrid.map((row, index) => {
        let resolvedOrderYear = toOrderYearOrNull(
          row.advOrderYear ??
          row.adv_orderyear ??
          row.adv_order_year ??
          row.orderYear ??
          row.orderyear,
        );
        const advTypeName = String(row.advName ?? row.adv_name ?? "")
          .trim()
          .toUpperCase();
        const isOrderAdvanceType =
          advTypeName === "ORDER" || advTypeName === "ORDER SPLIT";
        const isSchemeAdvanceType = advTypeName === "SCHEME";
        const schemeNameForLegacyYear = String(
          row.schemeDesc ?? row.schm_desc ?? row.scheme_name ?? "",
        ).trim();
        if (!resolvedOrderYear && isOrderAdvanceType) {
          const estYearMatch = String(headerData.estDate || "").match(/\d{4}/);
          if (estYearMatch) {
            resolvedOrderYear = Number(estYearMatch[0]);
          }
        }
        const resolvedGdwt = toWeight6Value(
          row.schemeGrossWt ?? row.schmGdwt ?? row.schm_gdwt ?? 0,
        );
        const advOrderYearOut = isSchemeAdvanceType
          ? schemeNameForLegacyYear
          : resolvedOrderYear;

        return {
          slno: index + 1,
          advName: row.advName || "",
          advNo: row.advNo || "",
          advAmt: getAmt(row.advAmt ?? row.balAmt),
          advOrderYear: advOrderYearOut,
          barflag:
            row.barflag === true ||
            row.barflag === "true" ||
            row.barflag === "t",
          schmBonus: getAmt(row.schemeBonus || 0),
          schmGdwt: resolvedGdwt,
          adv_name: row.advName || "",
          adv_no: row.advNo || "",
          adv_amt: getAmt(row.advAmt ?? row.balAmt),
          adv_orderyear: advOrderYearOut,
          adv_order_year: advOrderYearOut,
          schm_gdwt: resolvedGdwt,
        };
      }),
    };

    // 🚀 Sync customer to CRM dynamically on Save click to ensure Aadhaar/profile details are perfectly updated!
    let resolvedCustId = headerData.custId || "";
    let finalAadhar = headerData.aadhar || "";
    let finalPan = headerData.pan || "";
    let finalGst = headerData.gstNo || "";

    if (
      headerData.phone &&
      headerData.phone.length >= (parseInt(getPhoneMinLength(), 10) || 10)
    ) {
      try {
        const currentUser = JSON.parse(
          sessionStorage.getItem("currentUser") || "{}",
        );
        const validLoginUser = currentUser.username || "";

        // Fetch latest CRM data defensively to ensure we never overwrite with empty
        const latestCrm = await getCrmPhoneno(
          headerData.phone,
          resolveActiveShopCode(),
        );
        finalAadhar =
          headerData.aadhar || latestCrm?.aadharno || latestCrm?.aadhar || "";
        finalPan =
          headerData.pan ||
          latestCrm?.pan ||
          latestCrm?.panNo ||
          latestCrm?.panno ||
          "";
        finalGst =
          headerData.gstNo ||
          latestCrm?.gstin ||
          latestCrm?.gstno ||
          latestCrm?.gstNo ||
          "";

        const crmData = {
          custid: resolvedCustId || headerData.custId || "",
          custId: resolvedCustId || headerData.custId || "",
          cust_id: resolvedCustId || headerData.custId || "",
          code: resolvedCustId || headerData.custId || "",
          name: headerData.custName || "",
          mob: headerData.phone,
          username: validLoginUser || "",
          add1: headerData.address1 || "",
          add2: headerData.address2 || "",
          add3: headerData.place || "",
          pincode: headerData.pincode || "",
          aadharno: finalAadhar || "",
          aadhar: finalAadhar || "",
          aadhaar: finalAadhar || "",
          aadharNo: finalAadhar || "",
          aadhar_no: finalAadhar || "",
          pan: finalPan || "",
          panno: finalPan || "",
          panNo: finalPan || "",
          pan_no: finalPan || "",
          gstin: finalGst || "",
          gstno: finalGst || "",
          gstNo: finalGst || "",
          gst_no: finalGst || "",
          smanname: headerData.salesman || "",
          shopcode: resolveActiveShopCode(),
          todaydate: new Date().toISOString().split("T")[0],
        };

        // Resolve the database primary key (crmid) for Scheme CRM
        const targetCrmId =
          latestCrm?.crmid ||
          latestCrm?.crmId ||
          resolvedCustId ||
          headerData.custId ||
          "";

        if (resolvedCustId) {
          await updateCrmCustomer(
            targetCrmId,
            crmData,
            resolveActiveShopCode(),
          );
        } else {
          // Fallback check by mobile number first
          const existingId =
            latestCrm?.custid || latestCrm?.custId || latestCrm?.code;
          if (existingId) {
            resolvedCustId = existingId;
            const finalTargetCrmId =
              latestCrm?.crmid || latestCrm?.crmId || existingId;
            await updateCrmCustomer(
              finalTargetCrmId,
              crmData,
              resolveActiveShopCode(),
            );
          } else {
            // Create brand new customer
            const res = await createCrmCustomer(
              crmData,
              resolveActiveShopCode(),
            );
            if (res && res.custid) {
              resolvedCustId = res.custid;
              setHeaderData((prev) => ({
                ...prev,
                custId: res.custid,
              }));
            }
          }
        }
      } catch (err: any) {
        console.error("CRM Sync during Save failed:", err);
      }
    }

    // 🚀 Initialize Payloads
    const generalPayload = buildGeneralPayload(
      headerData.estNo,
      resolvedCustId || headerData.custId,
      totalHeaderAmount,
      operatorUsername,
      normalizedShopCode,
      finalAadhar,
      finalPan,
      finalGst,
    );
    const itemsPayload = buildItemsPayload(
      headerData.estNo,
      normalizedShopCode,
    );
    const smanPayload = buildSmanPayload(headerData.estNo, normalizedShopCode);
    const stonePayload = buildStonePayload(
      headerData.estNo,
      normalizedShopCode,
    );

    // Credit Note Payload - Ensure numeric fields are Numbers, not Strings
    const creditNotePayload = {
      estNo: Number(headerData.estNo),
      estDte: headerData.estDate,
      creditItems: creditNoteGrid.map((row) => ({
        billNo: Number(row.sBillNo),
        itSlno: Number(row.trSlno),
        billYear: Number(row.finYearRow),
        billDate: row.sDate,
        invoiceNo: row.invoiceNo,
        shopcode: normalizedShopCode,
      })),
    };

    console.log("🛠️ DEBUG - Payloads prepared:", {
      generalPayload,
      itemsPayload,
      smanPayload,
      stonePayload,
    });

    try {
      console.log("📝 Starting Sequential Save Process...");

      // 1. Stones
      if (stonePayload.stoneEntries?.length > 0) {
        console.log("📝 Step 1: Saving Stone Details...");
        await SalesService.saveStoneDetails(stonePayload, auth);
      }

      // 2. General
      console.log("📝 Step 2: Saving General Details...");
      await SalesService.saveGeneralDetails(generalPayload, auth);

      // 3. Sales Items
      console.log("📝 Step 3: Saving Sales Items...");
      await SalesService.saveSalesDetails(itemsPayload, auth);

      // 4. Salesman
      console.log("📝 Step 4: Saving Sman Details...");
      await SalesService.saveSmanDetails(smanPayload, auth);

      // 5. Credit Note
      console.log("📝 Step 5: Saving Credit Note Details...");
      await SalesService.saveCreditNoteDetails(
        creditNotePayload,
        auth,
        normalizedShopCode,
      );

      // 6. Advance Adjustment Details (If items present)
      if (advanceGrid.length > 0) {
        console.log("📝 Step 6: Saving Advance Details...");
        await SalesService.saveAdvanceDetails(
          advancePayload,
          auth,
          normalizedShopCode,
        );
      }

      // 7. Purchase Details
      console.log("📝 Step 7: Saving Purchase Details...");
      await SalesService.savePurchaseDetails(
        purchasePayload,
        auth,
        normalizedShopCode,
      );

      console.log("🎉 All Steps Completed Successfully!");

      showPopupMessage(
        `Sales Entry ${isUpdate ? "Updated" : "Saved"} Successfully!`,
        "Success",
        "success",
      );

      // Auto-Print Prompt after successful save
      const savedEstNo = headerData.estNo || "New"; // If it was a new save, estNo might be empty in state but returned?
      // Actually fetchData should be called after save to refresh.
      // But for now, we just prompt.
      setConfirmModal({
        isOpen: true,
        title: "Print Estimate",
        message:
          "Entry saved successfully. Do you want to print the estimate now?",
        isDestructive: false,
        onConfirm: async () => {
          closeConfirmModal();
          const printType = getPrintTypeFromCheckbox();
          const shopCode = resolveActiveShopCode();
          if (headerData.estNo && headerData.estNo !== "New") {
            await fetchAndPrintReport(headerData.estNo, shopCode, printType);
          }
          performReset();
        },
        onCancel: () => {
          closeConfirmModal();
          performReset();
        },
      });
      setIsSaveDisabled(true);
    } catch (error: any) {
      console.error("Save Error (raw):", error?.response?.data ?? error);
      showPopupMessage(
        "Unable to save entry. Check required fields. Technical details are in console.",
        "Save Error",
        "error",
      );
    }
  };

  const exitDeleteMode = () => {
    setActionStatus("NONE");
    setIsNewDisabled(false);
    setIsModifyDisabled(false);
    setIsDeleteDisabled(false);
    setIsSaveDisabled(true);
    setIsCancelDisabled(true);
  };

  const enterModifyMode = () => {
    setActionStatus("MODIFY");
    setIsUpdate(true);
    setIsFormEnabled(true);
    setIsEstNoLocked(false);
    lastAttemptedEstNoRef.current = "";

    // Update Button States
    setIsNewDisabled(true);
    setIsModifyDisabled(true); // Disable while in modify mode
    setIsDeleteDisabled(true);
    setIsSaveDisabled(false);
    setIsCancelDisabled(false);

    setTimeout(() => {
      headerRefs.current["estNo"]?.focus();
    }, 100);
  };

  const handleModify = () => {
    if (!featureFlags.canModify) {
      showPopupMessage("Modification is currently disabled.", "Feature Locked");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: "Modify Confirmation",
      message: "Do you want to modify an estimate?",
      isDestructive: false,
      onConfirm: () => {
        closeConfirmModal();
        enterModifyMode();
      },
      onCancel: () => {
        closeConfirmModal();
      },
    });
  };

  const runDeleteFlow = async (estNoFromAction) => {
    const estNo = (estNoFromAction ?? headerData.estNo ?? "").toString().trim();
    const shopCode = resolveActiveShopCode();

    // 1. Check if Estimate exists in EstMstr
    if (!estNo || estNo === "New") {
      showPopupMessage("Invalid Estimate Number", "Error");
      setTimeout(() => headerRefs.current["estNo"]?.focus(), 100);
      return;
    }

    const exists = await fetchData(estNo, false, true);
    if (!exists) {
      handleEstNoLookup();
      return;
    }

    // 2. Check if Estimate is billed (sbillmstr, pbillmstr, crn_billmstr)
    const isBilled = await checkEstimateIsBilled(estNo);
    if (isBilled) {
      showPopupMessage(
        "This estimate is already billed !!! You can not delete this Estimate",
        "Warning",
      );
      handleCancel(true);
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Delete Confirmation",
      message: "Do you want to delete this estimate?",
      isDestructive: true,
      onConfirm: async () => {
        closeConfirmModal();
        try {
          await SalesService.deleteEntry(estNo, shopCode);
          showPopupMessage("Estimate deleted successfully", "Success");
          handleCancel(true);
        } catch (error: any) {
          console.error("Delete Error:", error);
          showPopupMessage("Failed to delete estimate.", "Error");
          exitDeleteMode();
        }
      },
      onCancel: () => {
        closeConfirmModal();
        // User flow: "No" should return to first mode (clear + focus New)
        handleCancel(true);
      },
    });
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!featureFlags.canDelete) {
      showPopupMessage("Deletion is currently disabled.", "Feature Locked");
      return;
    }

    // Phase 1: Preparation (Enter Delete Mode)
    const estNo = (headerData.estNo || "").trim();

    // If estNo is present, check it immediately
    if (estNo && estNo !== "New") {
      const exists = await fetchData(estNo, false);
      if (!exists) {
        handleEstNoLookup();
      }
    }

    setActionStatus("DELETE");
    setIsFormEnabled(false); // Lock other fields

    // Button states
    setIsNewDisabled(true);
    setIsModifyDisabled(true);
    setIsDeleteDisabled(true); // Disable itself
    setIsSaveDisabled(true);
    setIsCancelDisabled(false);

    // Focus and select Est No
    setTimeout(() => {
      headerRefs.current["estNo"]?.focus();
      headerRefs.current["estNo"]?.select();
    }, 100);
  };

  const checkPrintDisabled = () => {
    // Disabled if currently editing a NEW entry, modifying, or already in delete/print mode
    if (
      actionStatus === "NEW" ||
      actionStatus === "MODIFY" ||
      actionStatus === "DELETE" ||
      pendingPrintAfterEstSelect
    )
      return true;
    return false;
  };

  const checkDeleteDisabled = () => {
    // Disabled if currently editing a NEW entry, modifying, or already in delete/print mode
    if (isDeleteDisabled) return true; // State-based disable
    if (
      actionStatus === "NEW" ||
      actionStatus === "MODIFY" ||
      actionStatus === "DELETE" ||
      pendingPrintAfterEstSelect
    )
      return true;
    return false;
  };

  const escapeHtml = (text = "") =>
    String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const printPlainTextReport = (printText, estNo) => {
    const printWindow = window.open("", "_blank", "width=1280,height=800");
    if (!printWindow) {
      showPopupMessage(
        "Popup blocked. Please allow popups for printing.",
        "Print",
      );
      return false;
    }

    const safeText = escapeHtml(printText || "");
    const safeEstNo = escapeHtml(estNo || "");

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Estimate Print - ${safeEstNo}</title>
          <style>
            @media print {
              @page { margin: 0; size: auto; }
              body { margin: 0; }
            }
            body { margin: 12px; color: #000; background: #fff; }
            pre {
              margin: 0;
              white-space: pre;
              font-family: "Courier New", Courier, monospace;
              font-size: 12px;
              line-height: 1.25;
            }
          </style>
        </head>
        <body>
          <pre>${safeText}</pre>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    return true;
  };

  const generateFrontendReceiptText = (
    estNo?: string,
    shopCode?: string,
    overrideSalesGrid?: any[],
    overrideHeaderData?: any,
    overridePurchaseGrid?: any[],
    overrideCreditNoteGrid?: any[],
    overrideAdvanceGrid?: any[],
  ) => {
    const padR = (str, len) => String(str || "").padEnd(len, " ");
    const padL = (str, len) => String(str || "").padStart(len, " ");

    const currentHeader = overrideHeaderData || headerData;
    const currentSalesGrid =
      overrideSalesGrid && overrideSalesGrid.length > 0
        ? overrideSalesGrid
        : salesGrid;
    const currentPurchaseGrid = overridePurchaseGrid || purchaseGrid;
    const currentCreditNoteGrid = overrideCreditNoteGrid || creditNoteGrid;
    const currentAdvanceGrid = overrideAdvanceGrid || advanceGrid;

    const displayEstNo = estNo || currentHeader.estNo || "";

    // Resolve Salesman Name (prefer full name from salesmanGrid or headerData)
    const smCode = String(currentHeader.salesman || currentSalesGrid[0]?.sMan || "")
      .trim()
      .toUpperCase();
    const smObj = (salesmanGrid || []).find(
      (s) =>
        String(s.smCode || s.smcode || "").trim().toUpperCase() === smCode,
    );
    const smName = smObj?.smName || currentHeader.salesmanName || smCode || "";
    const smHeader = smCode ? `${displayEstNo}   ${smName}` : `${displayEstNo}`;

    // Date formatting (DD-MM-YYYY)
    let formattedDate =
      currentHeader.estDate || new Date().toISOString().split("T")[0];
    if (formattedDate.includes("-")) {
      const parts = formattedDate.split("-");
      if (parts[0].length === 4) {
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    const gRateStr = fmtAmt(currentHeader.gRate || 0);

    const lines: string[] = [];

    // Header Title
    lines.push("                    ESTIMATE ONLY\n");
    lines.push(`${smHeader}`);
    lines.push(`Date : ${padR(formattedDate, 14)} Rate : ${gRateStr}\n`);

    lines.push(`Name    : ${currentHeader.custName || ""}`);
    lines.push(`Address : ${currentHeader.address1 || ""}`);
    if (currentHeader.address2) lines.push(`          ${currentHeader.address2}`);
    lines.push(`Place   : ${currentHeader.place || ""}`);
    lines.push(`Phone   : ${currentHeader.phone || ""}\n`);

    // Sales Items Header
    lines.push("---SALES ITEMS----------------------------------");
    lines.push("  Gross  Stone    Net  Stone");
    lines.push(" Weight Weight Weight Charge   Amount");
    lines.push("------------------------------------------------");

    let totGross = 0;
    let totStone = 0;
    let totNet = 0;
    let totStnChg = 0;
    let totSalesAmt = 0;
    let totQty = 0;
    let totGoldAmt = 0;
    let totVaAmt = 0;

    currentSalesGrid.forEach((item) => {
      const gross = getWt(item.grossWt);
      const stone = getWt(item.stoneWt);
      const net = getWt(item.netWt);
      const stnChg = getAmt(item.stnChg);
      const amt = getAmt(item.amount);
      const qty = getQty(item.qty) || 1;
      const goldAmt = getAmt(item.goldAmt);
      const vaAmt = getAmt(item.vaAmt);
      const vaPer = getAmt(item.vaPer);

      totGross += gross;
      totStone += stone;
      totNet += net;
      totStnChg += stnChg;
      totSalesAmt += amt;
      totQty += qty;
      totGoldAmt += goldAmt;
      totVaAmt += vaAmt;

      const grossStr = padL(fmtWt(gross), 7);
      const stoneStr = stone > 0 ? padL(fmtWt(stone), 7) : padL("", 7);
      const netStr = padL(fmtWt(net), 7);
      const stnChgStr =
        stnChg > 0 ? padL(Math.round(stnChg).toString(), 6) : padL("", 6);
      const amtStr = padL(Math.round(amt).toString(), 10);

      lines.push(`${grossStr} ${stoneStr} ${netStr} ${stnChgStr} ${amtStr}`);

      // Item description line: e.g. "3 - : - 1 - BANGLE LJ"
      const vaPerDisplay = Number.isInteger(vaPer)
        ? vaPer.toString()
        : vaPer.toFixed(1);
      const cntrStr = item.cntr ? `  ${item.cntr}` : "";
      lines.push(`${vaPerDisplay} - : - ${qty} - ${item.itemDesc || ""}${cntrStr}`);
    });

    lines.push("\n------------------------------------------------");
    const totGrossStr = padL(fmtWt(totGross), 7);
    const totStoneStr = totStone > 0 ? padL(fmtWt(totStone), 7) : padL("", 7);
    const totNetStr = padL(fmtWt(totNet), 7);
    const totSalesAmtStr = padL(Math.round(totSalesAmt).toString(), 10);

    lines.push(
      `${totGrossStr} ${totStoneStr} ${totNetStr}        ${totSalesAmtStr}`,
    );
    lines.push(`Total Qty = ${totQty}`);
    lines.push("------------------------------------------------");

    // Tax calculation
    const isIgst = !!currentHeader.applyIgst;
    const taxLabel = isIgst ? "IGST" : "GST";
    const taxRate = isIgst
      ? getAmt(currentHeader.igstPer)
      : getAmt(currentHeader.gstPer);
    const taxAmt = Math.round((totSalesAmt * taxRate) / 100);

    const goldValRounded = Math.round(totGoldAmt);
    const vaValRounded = Math.round(totVaAmt);

    lines.push(
      `            Gold Value : ${padL(goldValRounded.toString(), 13)}`,
    );
    lines.push(
      `        Value Addition : ${padL(vaValRounded.toString(), 13)}`,
    );
    lines.push(
      `                Amount : ${padL(Math.round(totSalesAmt).toString(), 13)}`,
    );
    lines.push(
      `                   ${padL(taxLabel, 3)} : ${padL(taxAmt.toString(), 13)}`,
    );

    // Purchase Deduction
    const purchaseTotAmt = currentPurchaseGrid.reduce(
      (s, p) => s + getAmt(p.amount),
      0,
    );
    if (purchaseTotAmt > 0) {
      lines.push(
        `         PURCHASE DED. : ${padL(Math.round(purchaseTotAmt).toString(), 13)}`,
      );
    }

    // Credit Note Deduction
    const crnTotAmt = currentCreditNoteGrid.reduce(
      (s, c) => s + getAmt(c.rowTotal || c.taxableAmt),
      0,
    );
    if (crnTotAmt > 0) {
      lines.push(
        `       CREDIT NOTE DED : ${padL(Math.round(crnTotAmt).toString(), 13)}`,
      );
    }

    // Advance Deduction Rows
    let totAdvAmt = 0;
    currentAdvanceGrid.forEach((adv) => {
      const advName = String(
        adv.advName || adv.adv_name || "ORDER",
      ).toUpperCase();
      const advNo = String(adv.advNo || adv.adv_no || "").trim();
      const advAmt = getAmt(adv.advAmt ?? adv.balAmt);
      totAdvAmt += advAmt;

      const label = padR(advName, 10);
      const noStr = padR(advNo, 20);
      const amtStr = padL(Math.round(advAmt).toString(), 12);
      lines.push(`${label} ${noStr} ${amtStr}`);
    });

    // Net Payable Total
    const netPayable = Math.round(
      totSalesAmt + taxAmt - purchaseTotAmt - crnTotAmt - totAdvAmt,
    );
    lines.push(`                        ==================`);
    lines.push(`      Bill Amt Payable : ${padL(netPayable.toString(), 13)}`);
    lines.push(`                        ==================\n`);

    lines.push(`****${shopCode || "300"}***** THANK YOU **************`);

    return lines.join("\n");
  };

  const executePrint = async (
    estNo,
    shopCode,
    printType,
    fetchedPayload?: any,
  ) => {
    let printData = "";

    const activeSalesGrid =
      fetchedPayload?.salesGrid || salesGrid;
    const activeHeaderData = fetchedPayload?.headerData || headerData;
    const activePurchaseGrid =
      fetchedPayload?.purchaseGrid || purchaseGrid;
    const activeCreditNoteGrid =
      fetchedPayload?.creditNoteGrid || creditNoteGrid;
    const activeAdvanceGrid =
      fetchedPayload?.advanceGrid || advanceGrid;

    // Use frontend receipt text generator whenever item rows are available
    if (activeSalesGrid && activeSalesGrid.length > 0) {
      printData = generateFrontendReceiptText(
        estNo,
        shopCode,
        activeSalesGrid,
        activeHeaderData,
        activePurchaseGrid,
        activeCreditNoteGrid,
        activeAdvanceGrid,
      );
    } else {
      try {
        const response = await SalesService.getPrintReport(
          estNo,
          shopCode,
          printType,
        );
        printData =
          response?.data?.printData ||
          response?.data ||
          (typeof response === "string" ? response : null);
      } catch (error: any) {
        console.warn("Backend print endpoint unavailable:", error);
      }

      if (!printData) {
        printData = generateFrontendReceiptText(
          estNo,
          shopCode,
          activeSalesGrid,
          activeHeaderData,
          activePurchaseGrid,
          activeCreditNoteGrid,
          activeAdvanceGrid,
        );
      }
    }

    if (!printData || !String(printData).trim()) {
      showPopupMessage("No print data received for this estimate.", "Print");
      return;
    }
    const opened = printPlainTextReport(printData, estNo);
    if (opened) {
      setTimeout(() => handleCancel(true), 200);
    }
  };

  const fetchAndPrintReport = async (estNo, shopCode, printType = "E") => {
    let fetchedPayload: any = null;
    try {
      if (estNo && estNo !== "New") {
        const fetchRes = await fetchData(estNo, false, true);
        if (fetchRes && typeof fetchRes === "object") {
          fetchedPayload = fetchRes;
        }
      }

      // "Already Billed" Verification (sbillmstr, pbillmstr, crn_billmstr)
      const isBilled = await checkEstimateIsBilled(estNo);

      if (isBilled) {
        setConfirmModal({
          isOpen: true,
          title: "Warning Message",
          message: "This Estimate is Already Billed",
          isDestructive: false,
          onConfirm: async () => {
            closeConfirmModal();
            await executePrint(estNo, shopCode, printType, fetchedPayload);
          },
          onCancel: () => {
            closeConfirmModal();
          },
        });
        return;
      }
    } catch (err: any) {
      console.error("Status check failed during print", err);
    }

    await executePrint(estNo, shopCode, printType, fetchedPayload);
  };

  const getPrintTypeFromCheckbox = () => (headerData.printEstimate ? "E" : "T");

  const handlePrint = async () => {
    if (!featureFlags.canPrint) {
      showPopupMessage("Printing is currently disabled.", "Feature Locked");
      return;
    }
    const printType = getPrintTypeFromCheckbox();
    if (checkPrintDisabled()) {
      return;
    }

    const estNo = (headerData.estNo || "").trim();
    const shopCode = resolveActiveShopCode();

    if (estNo && estNo !== "New") {
      // Check if it exists
      try {
        const response = await SalesService.getEntry(estNo, shopCode);
        if (response.data) {
          // Exists -> Print directly
          await fetchAndPrintReport(estNo, shopCode, printType);
          return;
        }
      } catch (err: any) {
        console.log("Print validation: EstNo not found, opening lookup...");
      }
    }

    // Fallback: Preparation mode (Lock form and prepare for EstNo entry/lookup)
    setPendingPrintAfterEstSelect(true);
    setPendingPrintType(printType);
    setIsFormEnabled(false); // Lock other fields

    // Button states
    setIsNewDisabled(true);
    setIsModifyDisabled(true);
    setIsDeleteDisabled(true);
    setIsSaveDisabled(true);
    setIsCancelDisabled(false);

    setTimeout(() => {
      headerRefs.current["estNo"]?.focus();
      headerRefs.current["estNo"]?.select();
    }, 100);
  };

  // Handle Cancel / Reset
  const handleCancel = (skipPrompt = false) => {
    // If we have data and aren't skipping the prompt (e.g. from a successful delete)
    if (
      !skipPrompt &&
      (salesGrid.length > 0 || headerData.phone || headerData.custName)
    ) {
      setConfirmModal({
        isOpen: true,
        title: "Discard Changes?",
        message:
          "You have unsaved information. Are you sure you want to clear all fields and restart?",
        isDestructive: false,
        onConfirm: () => {
          closeConfirmModal();
          performReset();
        },
      });
      return;
    }
    performReset();
  };

  const performReset = () => {
    // Close transient dialogs when returning to first mode
    setPendingPrintAfterEstSelect(false);
    setPendingPrintType("T");
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    setShowAdvance(false);
    setActiveTab("SALES");
    setIsFormEnabled(false); // First-mode screen: keep all form fields disabled
    setIsEstNoLocked(false);
    lastAttemptedEstNoRef.current = "";
    setIsMetalLocked(false);
    setIsSalesmanFocused(false);
    setIsDirectCreditNote(false);

    // 1. Clear all grid data
    setSalesGrid([]);
    setStoneGrid([]);

    setSalesmanGrid([]);
    setAdvanceGrid([]);
    setCreditNoteGrid([]);
    setPurchaseGrid([]);
    setEditingRowIndex(null); // Clear editing state

    // 2. Clear input rows
    setSalesRow(salesEmpty);
    lastValidatedItemCodeRef.current = "";
    setStoneRow(stoneEmpty);
    setSalesmanRow(salesmanEmpty);

    // 3. Reset Header Data (CRM & General Info) - Preserve shopCode
    setHeaderData((prev) => ({
      ...prev,
      estNo: "",
      estDate: new Date().toISOString().split("T")[0],
      gRate: "", // Reset Rate as well on Cancel/Clear
      goldSlv: prev.goldSlv || "GOLD",
      gstPer: "3.00",
      igstPer: "0.00",
      applyIgst: false,
      custId: "",
      custName: "",
      address1: "",
      address2: "",
      place: "",
      pincode: "",
      phone: "",
      aadhar: "",
      pan: "",
      gstNo: "",
      careOf: "",
      salesman: "",
      salesmanName: "",
      rateFix: false,
      printEstimate: false,
      barFlag: false,
    }));

    // Force clear DOM input if React sync fails
    if (headerRefs.current["estNo"]) {
      headerRefs.current["estNo"].value = "";
    }

    // 5. Reset Action Flags
    setIsUpdate(false);
    setActionStatus("NONE");

    // 6. Reset Button States
    setIsNewDisabled(false);
    setIsModifyDisabled(false);
    setIsDeleteDisabled(false);
    setIsSaveDisabled(true);
    setIsCancelDisabled(true);

    // 7. Focus New Button
    setTimeout(() => newBtnRef.current?.focus(), 100);
  };

  return (
    <ModulePageLayout
      title="Sales Entry"
      navigate={navigate}
      panelClassName="max-w-[1920px]"
      contentClassName="w-full"
      extraHeaderActions={
        <>
          <button
            ref={newBtnRef}
            onClick={handleNewClick}
            disabled={isNewDisabled}
            className={`h-9 px-2.5 sm:px-3.5 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-90 flex-shrink-0 ${isNewDisabled
                ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50 shadow-none"
                : "bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 shadow-md shadow-sky-500/20 active:scale-95 active:shadow-sm"
              }`}
            title="New"
          >
            <PlusCircle className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">New</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={`h-9 px-2.5 sm:px-3.5 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 ${isSaveDisabled
                ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95"
              }`}
            title="Save"
          >
            <Save className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">Save</span>
          </button>

          {featureFlags.canModify && (
            <button
              onClick={handleModify}
              disabled={isModifyDisabled}
              className={`h-9 px-2.5 sm:px-3.5 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 ${isModifyDisabled
                  ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 shadow-md shadow-amber-500/20 active:scale-95"
                }`}
              title="Modify"
            >
              <Edit3 className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">Modify</span>
            </button>
          )}

          {featureFlags.canDelete && (
            <button
              onClick={handleDelete}
              disabled={checkDeleteDisabled()}
              className={`h-9 px-2.5 sm:px-3.5 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 ${checkDeleteDisabled()
                  ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-md shadow-rose-500/20 active:scale-95"
                }`}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">Delete</span>
            </button>
          )}

          {featureFlags.canPrint && (
            <button
              onClick={handlePrint}
              disabled={checkPrintDisabled()}
              className={`h-9 px-2.5 sm:px-3.5 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 ${checkPrintDisabled()
                  ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-slate-700 to-slate-700 hover:from-slate-700 hover:to-slate-700 shadow-md shadow-slate-700/20 active:scale-95"
                }`}
              title="Print"
            >
              <Printer className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">Print</span>
            </button>
          )}

          <button
            onClick={() => handleCancel()}
            disabled={isCancelDisabled}
            className={`h-9 px-2.5 sm:px-3.5 text-white text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 ${isCancelDisabled
                ? "bg-slate-300 dark:bg-slate-800 cursor-not-allowed opacity-50"
                : "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 shadow-md active:scale-95"
              }`}
            title="Cancel"
          >
            <X className="w-4 h-4 flex-shrink-0" />
            <span className="hidden md:inline">Cancel</span>
          </button>
        </>
      }
    >
      <div className="sales-entry-page w-full min-w-0 space-y-2">
        {/* Main Content */}
        <div className="p-1 sm:p-2 w-full flex flex-col space-y-2">
          {/* ROW 1: Customer Information (Full Width) */}
          <div className="compact-card bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-800/50">
            <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                Customer Information
              </h3>
            </div>
            <div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                  <div className="relative flex items-center w-full">
                    <input
                      list="estNos"
                      ref={(el) => {
                        headerRefs.current["estNo"] = el;
                      }}
                      disabled={
                        isEstNoLocked ||
                        (!isFormEnabled &&
                          !pendingPrintAfterEstSelect &&
                          actionStatus !== "DELETE")
                      }
                      placeholder="Est No"
                      className={`premium-input font-bold text-sky-600 dark:text-sky-400 w-full ${isDirectCreditNote ? "pr-16 border-rose-500 ring-rose-500/20" : ""}`}
                      value={headerData.estNo}
                      inputMode="numeric"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        lastAttemptedEstNoRef.current = "";
                        setHeaderData({ ...headerData, estNo: val });

                        if (estNoDebounceTimerRef.current) {
                          clearTimeout(estNoDebounceTimerRef.current);
                        }

                        if (val && val !== "New" && !isEstNoLocked) {
                          estNoDebounceTimerRef.current = setTimeout(() => {
                            processEstNoSubmit(val);
                          }, 500);
                        }
                      }}
                      onKeyDown={(e) => handleHeaderEnter(e, "estNo")}
                      onBlur={handleEstNoBlur}
                      onDoubleClick={handleEstNoLookup}
                      style={{ touchAction: "manipulation" }} // Enable double-tap on touch
                      title={
                        isEstNoLocked
                          ? "Cancel to change Est No"
                          : "Double click to search estimates"
                      }
                    />

                    {!isDirectCreditNote && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={handleEstNoLookup}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors bg-white/80 hover:bg-emerald-50 dark:bg-slate-900/80 dark:hover:bg-emerald-900/20 rounded-md backdrop-blur-sm z-10"
                        disabled={
                          isEstNoLocked ||
                          (!isFormEnabled &&
                            !pendingPrintAfterEstSelect &&
                            actionStatus !== "DELETE")
                        }
                        title="Search Estimates"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    )}

                    {isDirectCreditNote && (
                      <span className="absolute right-3 px-2 py-0.5 text-[10px] font-black tracking-wider text-white bg-rose-500 rounded-md shadow-sm animate-pulse z-10">
                        DIRECT
                      </span>
                    )}
                  </div>
                  <datalist id="estNos">
                    {availableEstNos.map((num) => (
                      <option key={num} value={num} />
                    ))}
                  </datalist>
                  <input
                    type="date"
                    disabled={true}
                    placeholder="Est Date"
                    className="premium-input sm:col-span-2"
                    value={headerData.estDate}
                    onChange={(e) =>
                      setHeaderData({ ...headerData, estDate: e.target.value })
                    }
                  />
                  <input
                    disabled={true}
                    placeholder="GST %"
                    className="premium-input text-emerald-600 dark:text-emerald-400 font-semibold"
                    value={headerData.gstPer}
                    inputMode="decimal"
                    onChange={(e) =>
                      setHeaderData({ ...headerData, gstPer: e.target.value })
                    }
                  />
                  <input
                    disabled={true}
                    placeholder="IGST %"
                    className="premium-input text-slate-700 dark:text-slate-700 font-semibold"
                    value={headerData.igstPer}
                    inputMode="decimal"
                    onChange={(e) =>
                      setHeaderData({ ...headerData, igstPer: e.target.value })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={!isFormEnabled}
                      className="w-4 h-4 text-cyan-600 border-slate-300 dark:border-slate-600 rounded focus:ring-cyan-500"
                      checked={headerData.applyIgst}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        if (isChecked) {
                          // Move GST% to IGST%, set GST% to 0
                          setHeaderData({
                            ...headerData,
                            applyIgst: true,
                            igstPer: headerData.gstPer,
                            gstPer: "0.00",
                          });
                        } else {
                          // Move IGST% back to GST%, set IGST% to 0
                          setHeaderData({
                            ...headerData,
                            applyIgst: false,
                            gstPer: headerData.igstPer,
                            igstPer: "0.00",
                          });
                        }
                      }}
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Apply IGST
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 items-center mt-1">
                  <select
                    disabled={
                      !isFormEnabled ||
                      salesGrid.length > 0 ||
                      isMetalLocked ||
                      !!(
                        salesRow.itemCode &&
                        (salesRow.itemCode || "").trim() !== ""
                      )
                    }
                    className="premium-input font-bold text-amber-600 dark:text-amber-400"
                    value={headerData.goldSlv}
                    onChange={async (e) => {
                      const metalType = e.target.value;
                      setHeaderData((prev) => ({ ...prev, goldSlv: metalType }));
                      try {
                        const metalCode = metalType === "SILVER" ? "S" : "G";
                        const response =
                          await SalesService.getEstNosByMetalType(
                            metalCode,
                            resolveActiveShopCode(),
                          );
                        setAvailableEstNos(response.data || []);
                      } catch (error: any) {
                        console.error("Failed to fetch EstNos:", error);
                        setAvailableEstNos([]);
                      }
                    }}
                  >
                    <option>GOLD</option>
                    <option>SILVER</option>
                  </select>
                  <input
                    disabled={!isFormEnabled}
                    placeholder="G-Rate"
                    className="premium-input text-right font-mono text-base font-black border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    value={headerData.gRate}
                    inputMode="decimal"
                    onChange={(e) =>
                      setHeaderData({
                        ...headerData,
                        gRate: limitDecimals(e.target.value, 3),
                      })
                    }
                    onBlur={(e) => {
                      setHeaderData({
                        ...headerData,
                        gRate: fmtAmt(e.target.value),
                      });
                    }}
                  />
                  <div className="flex items-center justify-start gap-1 sm:gap-2 px-1">
                    <input
                      type="checkbox"
                      disabled={!isFormEnabled}
                      checked={headerData.rateFix}
                      onChange={(e) =>
                        setHeaderData({
                          ...headerData,
                          rateFix: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-cyan-600 border-slate-300 dark:border-slate-600 rounded focus:ring-cyan-500"
                    />
                    <label className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      Rate Fix
                    </label>
                  </div>
                  <input
                    disabled={!isFormEnabled}
                    placeholder="Cust ID"
                    className="premium-input"
                    value={headerData.custId}
                    inputMode="numeric"
                    onChange={(e) =>
                      setHeaderData({ ...headerData, custId: e.target.value })
                    }
                    onKeyDown={handleCustIdEnter}
                    onBlur={(e) =>
                      handleCustIdEnter({
                        ...e,
                        key: "Enter",
                        preventDefault: () => { },
                      })
                    }
                    onDoubleClick={() =>
                      showLookup(
                        lookupConfigs.customer(
                          handleCustomerSelect,
                          resolveActiveShopCode(),
                        ),
                      )
                    }
                    title="Double click or tap away to search customers"
                  />
                  <input
                    disabled={true}
                    placeholder="Shop Code"
                    className="premium-input bg-slate-100/50 dark:bg-slate-800/30 cursor-not-allowed opacity-70"
                    value={resolveActiveShopCode() || ""}
                    title="Branch Code (Automated)"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id="print-type-estimate"
                      type="checkbox"
                      className="w-4 h-4 accent-cyan-500 bg-[#eef5f0] dark:bg-slate-800/50 border border-slate-300 dark:border-slate-500 rounded focus:ring-2 focus:ring-cyan-500/70"
                      checked={headerData.printEstimate}
                      onChange={(e) =>
                        setHeaderData({
                          ...headerData,
                          printEstimate: e.target.checked,
                        })
                      }
                    />
                    <label
                      htmlFor="print-type-estimate"
                      className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap"
                    >
                      Print
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="barcode-flag-toggle"
                      type="checkbox"
                      className="w-4 h-4 accent-cyan-500 bg-[#eef5f0] dark:bg-slate-800/50 border border-slate-300 dark:border-slate-500 rounded focus:ring-2 focus:ring-cyan-500/70"
                      checked={!!headerData.barFlag}
                      onChange={(e) =>
                        setHeaderData({
                          ...headerData,
                          barFlag: e.target.checked,
                        })
                      }
                    />
                    <label
                      htmlFor="barcode-flag-toggle"
                      className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap"
                    >
                      Barcode
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    disabled={!isFormEnabled}
                    ref={(el) => {
                      headerRefs.current["phone"] = el;
                    }}
                    placeholder="Phone :"
                    className="premium-input text-xl font-black tracking-wider border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    value={headerData.phone}
                    inputMode="tel"
                    onChange={(e) => {
                      const maxLen = parseInt(getPhoneMaxLength(), 10) || 15;
                      const minLen = parseInt(getPhoneMinLength(), 10) || 10;
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, maxLen);
                      setHeaderData({ ...headerData, phone: val });

                      // ── Auto CRM fetch ────────────────────────────────────
                      // Clear any pending debounce timer
                      if (phoneDebounceRef.current)
                        clearTimeout(phoneDebounceRef.current);

                      if (val.length >= minLen && val.length <= maxLen) {
                        phoneDebounceRef.current = setTimeout(async () => {
                          // Skip if we already fetched this exact number
                          if (lastFetchedPhoneRef.current === val) return;
                          lastFetchedPhoneRef.current = val;
                          try {
                            const data = await fetchCustomerByPhone(val);
                            const isFound =
                              data &&
                              (data.name ||
                                data.custName ||
                                data.estCunm ||
                                data.custid ||
                                data.custId ||
                                data.code);
                            if (isFound) {
                              setHeaderData((prev) => ({
                                ...prev,
                                custId:
                                  data.custid || data.custId || data.code || "",
                                custName:
                                  data.name ||
                                  data.custName ||
                                  data.estCunm ||
                                  "",
                                address1:
                                  data.add1 ||
                                  data.address1 ||
                                  data.estAdd1 ||
                                  "",
                                address2:
                                  data.add2 ||
                                  data.address2 ||
                                  data.estAdd2 ||
                                  "",
                                place:
                                  data.place || data.add3 || data.estAdd3 || "",
                                pincode: data.pincode || data.estPin || "",
                                email: data.email || "",
                                aadhar: data.aadhar || data.aadharno || "",
                                pan: data.pan || data.panNo || data.panno || "",
                                gstNo:
                                  data.gstin || data.gstno || data.gstNo || "",
                                careOf:
                                  data.careofcode ||
                                  data.care_of_code ||
                                  data.careoff ||
                                  data.careof ||
                                  "",
                                salesman: prev.salesman || "",
                                salesmanName: data.salesmanName || "",
                              }));
                              // Move focus to careOf after data fills in
                              setTimeout(
                                () => headerRefs.current["careOf"]?.focus(),
                                50,
                              );
                            }
                          } catch (err: any) {
                            console.log("CRM auto-fetch error:", err.message);
                          }
                        }, 400); // 400 ms debounce — fires after user stops typing
                      } else {
                        // Phone cleared or too short — reset last fetched tracker
                        lastFetchedPhoneRef.current = "";
                      }
                      // ─────────────────────────────────────────────────────
                    }}
                    onKeyDown={(e) => {
                      // Allow manual Enter/Tab to advance focus even before min digits
                      if (e.key === "Enter" || e.key === "Tab") {
                        if (phoneDebounceRef.current)
                          clearTimeout(phoneDebounceRef.current);
                        const phone = (headerData.phone || "").trim();
                        const minLen = parseInt(getPhoneMinLength(), 10) || 10;
                        const maxLen = parseInt(getPhoneMaxLength(), 10) || 15;
                        const fixedLen = getPhoneFixedLength() === "true";
                        const isValid = fixedLen
                          ? phone.length === maxLen
                          : phone.length >= minLen && phone.length <= maxLen;
                        if (isValid) {
                          handlePhoneEnter({
                            ...e,
                            key: "Enter",
                            preventDefault: () => { },
                          });
                        } else if (phone.length > 0) {
                          e.preventDefault();
                          if (fixedLen) {
                            showPopupMessage(
                              `Phone number must be exactly ${maxLen} digits!`,
                              "Validation",
                              "error",
                            );
                          } else {
                            showPopupMessage(
                              `Phone number must be between ${minLen} and ${maxLen} digits!`,
                              "Validation",
                              "error",
                            );
                          }
                          headerRefs.current["phone"]?.select();
                        } else {
                          headerRefs.current["name"]?.focus();
                        }
                      }
                    }}
                    onBlur={() => {
                      // Cancel debounce if field loses focus before timer fires
                      if (phoneDebounceRef.current)
                        clearTimeout(phoneDebounceRef.current);
                    }}
                  />
                  <input
                    disabled={!isFormEnabled}
                    ref={(el) => {
                      headerRefs.current["name"] = el;
                    }}
                    placeholder="Name :"
                    className="premium-input font-semibold"
                    value={headerData.custName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                      setHeaderData({ ...headerData, custName: val });
                    }}
                    onKeyDown={(e) =>
                      handleFocusNext(e, "add1", headerData.custName)
                    }
                    onBlur={() => {
                      if (headerData.custName?.trim())
                        headerRefs.current["add1"]?.focus();
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    disabled={!isFormEnabled}
                    ref={(el) => {
                      headerRefs.current["add1"] = el;
                    }}
                    placeholder="Add1 :"
                    className="premium-input"
                    value={headerData.address1}
                    onChange={(e) =>
                      setHeaderData({
                        ...headerData,
                        address1: e.target.value.toUpperCase(),
                      })
                    }
                    onKeyDown={(e) =>
                      handleFocusNext(e, "add2", headerData.address1)
                    }
                  />
                  <input
                    disabled={!isFormEnabled}
                    ref={(el) => {
                      headerRefs.current["add2"] = el;
                    }}
                    placeholder="Add2 :"
                    className="premium-input xl:col-start-2"
                    value={headerData.address2}
                    onChange={(e) =>
                      setHeaderData({
                        ...headerData,
                        address2: e.target.value.toUpperCase(),
                      })
                    }
                    onKeyDown={(e) =>
                      handleFocusNext(e, "place", headerData.address2)
                    }
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    disabled={!isFormEnabled}
                    ref={(el) => {
                      headerRefs.current["place"] = el;
                    }}
                    placeholder="Place :"
                    className="premium-input"
                    value={headerData.place}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                      setHeaderData({ ...headerData, place: val });
                    }}
                    onKeyDown={(e) =>
                      handleFocusNext(e, "pincode", headerData.place)
                    }
                  />
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      disabled={!isFormEnabled}
                      ref={(el) => {
                        headerRefs.current["pincode"] = el;
                      }}
                      placeholder="Pincode :"
                      className="premium-input"
                      value={headerData.pincode}
                      onChange={(e) =>
                        setHeaderData({
                          ...headerData,
                          pincode: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6),
                        })
                      }
                      onKeyDown={(e) =>
                        handleFocusNext(e, "aadhar", headerData.pincode)
                      }
                    />


                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      disabled={!isFormEnabled}
                      ref={(el) => {
                        headerRefs.current["aadhar"] = el;
                      }}
                      placeholder="Aadhar No :"
                      className="premium-input font-mono tracking-widest text-xs"
                      value={headerData.aadhar}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 12);
                        setHeaderData({
                          ...headerData,
                          aadhar: val,
                        });
                      }}
                      onKeyDown={(e) => handleFocusMove(e, "pan")}
                    />
                    <input
                      disabled={!isFormEnabled}
                      ref={(el) => {
                        headerRefs.current["pan"] = el;
                      }}
                      placeholder="PAN No :"
                      className="premium-input font-mono tracking-widest text-xs"
                      value={headerData.pan}
                      maxLength={10}
                      onChange={(e) =>
                        setHeaderData({
                          ...headerData,
                          pan: e.target.value.toUpperCase().slice(0, 10),
                        })
                      }
                      onKeyDown={(e) => handleFocusMove(e, "gstNo")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      disabled={!isFormEnabled}
                      ref={(el) => {
                        headerRefs.current["gstNo"] = el;
                      }}
                      placeholder="GST No :"
                      className="premium-input font-mono text-xs"
                      value={headerData.gstNo}
                      maxLength={15}
                      onChange={(e) =>
                        setHeaderData({
                          ...headerData,
                          gstNo: e.target.value.toUpperCase().slice(0, 15),
                        })
                      }
                      onKeyDown={(e) => handleFocusMove(e, "careOf")}
                    />
                    <div className="flex gap-1">
                      <input
                        disabled={!isFormEnabled}
                        ref={(el) => {
                          headerRefs.current["careOf"] = el;
                        }}
                        placeholder="CareOf Code :"
                        className="premium-input flex-1"
                        value={headerData.careOf}
                        onChange={(e) =>
                          setHeaderData({
                            ...headerData,
                            careOf: e.target.value.toUpperCase(),
                          })
                        }
                        onKeyDown={handleCareOfEnter}
                        onBlur={(e) => {
                          if (popupMessage) return;
                          const val = (headerData.careOf || "").trim();
                          if (!val) return; // Do not auto-launch Care-Of lookup on blur when careOf is empty
                          const target = e.relatedTarget as HTMLElement;
                          if (target) {
                            // If moving backward to preceding fields (phone, name, place, pin, etc.)
                            const careOfEl = headerRefs.current["careOf"];
                            if (careOfEl && (careOfEl.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_PRECEDING)) {
                              return;
                            }
                            if (
                              target.classList.contains("toolbar-btn") ||
                              target.closest(".careof-search-btn")
                            ) {
                              return;
                            }
                          }
                          handleCareOfEnter({
                            ...e,
                            key: "Enter",
                            preventDefault: () => { },
                          });
                        }}
                        onDoubleClick={openCareOfLookup}
                        title="Double click or tap 🔍 to search Care-Of code"
                      />
                      <button
                        type="button"
                        disabled={!isFormEnabled}
                        onClick={openCareOfLookup}
                        className="careof-search-btn h-9 px-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                        title="Search CareOf"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <circle cx="11" cy="11" r="8" strokeWidth="2" />
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            d="m21 21-4.35-4.35"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: [Salesman + Advance] (left) + Stone Details (right) side by side */}
            <div className="flex flex-col lg:flex-row gap-2.5 items-stretch">
              {/* Left Group: Sales Man + Advance panel side by side */}
              <div className="flex flex-col sm:flex-row gap-2.5 lg:w-[44%] w-full">
                {/* Sales Man - Compact Left Panel */}
                <div className="compact-card bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm flex flex-col sm:min-w-[130px] sm:max-w-[150px]">
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                      Sales Man
                    </h3>
                  </div>
                  <div className="border-2 border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-inner bg-slate-50/70 dark:bg-slate-900/60 h-[155px] flex flex-col min-h-0">
                    <div className="overflow-x-auto flex-1 overflow-y-auto relative custom-scrollbar">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                          {/* Row 1: Headers */}
                          <tr className="modern-table-header">
                            <th
                              className={`px-2 py-2 text-center w-8 ${tableTypography.header}`}
                            >
                              Slno
                            </th>
                            <th
                              className={`px-2 py-2 text-center ${tableTypography.header}`}
                            >
                              Code
                            </th>
                          </tr>
                          {/* Row 2: Inputs */}
                          <tr className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                            <td
                              className={`px-2 py-2 text-center text-slate-400 w-8 ${tableTypography.cellMono}`}
                            >
                              #
                            </td>
                            <td className="px-1 py-2 relative">
                              <input
                                ref={(el) => {
                                  headerRefs.current["salesman"] = el;
                                }}
                                // disabled={
                                //   !isFormEnabled || salesmanGrid.length > 0
                                // }
                                placeholder="CODE"
                                className={`w-full mx-auto h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 block ${tableTypography.cellMono}`}
                                value={salesmanRow.smCode || ""}
                                onChange={(e) =>
                                  setSalesmanRow({
                                    ...salesmanRow,
                                    smCode: e.target.value,
                                  })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSalesmanCodeEnter(false);
                                  }
                                }}
                                onFocus={() => setIsSalesmanFocused(true)}
                                onBlur={async (e) => {
                                  handleSalesmanCodeEnter(true);

                                  // 2. CRM data sync (existing behaviour)
                                  setIsSalesmanFocused(false);
                                  if (
                                    headerData.phone &&
                                    headerData.phone.length >=
                                    (parseInt(getPhoneMinLength(), 10) || 10)
                                  ) {
                                    try {
                                      if (headerData.custId) {
                                        // First fetch the latest CRM data defensively to ensure we don't overwrite with empty values!
                                        const latestCrm = await getCrmPhoneno(
                                          headerData.phone,
                                          resolveActiveShopCode(),
                                        );
                                        const resolvedAadhar =
                                          headerData.aadhar ||
                                          latestCrm?.aadharno ||
                                          latestCrm?.aadhar ||
                                          "";
                                        const resolvedPan =
                                          headerData.pan ||
                                          latestCrm?.pan ||
                                          latestCrm?.panNo ||
                                          latestCrm?.panno ||
                                          "";
                                        const resolvedGst =
                                          headerData.gstNo ||
                                          latestCrm?.gstin ||
                                          latestCrm?.gstno ||
                                          latestCrm?.gstNo ||
                                          "";

                                        if (
                                          resolvedAadhar !==
                                          headerData.aadhar ||
                                          resolvedPan !== headerData.pan ||
                                          resolvedGst !== headerData.gstNo
                                        ) {
                                          setHeaderData((prev) => ({
                                            ...prev,
                                            aadhar: resolvedAadhar,
                                            pan: resolvedPan,
                                            gstNo: resolvedGst,
                                          }));
                                        }
                                      } else {
                                        // Customer does not exist in local state, fetch or create!
                                        const existingData =
                                          await getCrmPhoneno(
                                            headerData.phone,
                                            resolveActiveShopCode(),
                                          );
                                        const isFound =
                                          existingData &&
                                          (existingData.custid ||
                                            existingData.custId ||
                                            existingData.code);
                                        if (isFound) {
                                          setHeaderData((prev) => ({
                                            ...prev,
                                            custId:
                                              existingData.custid ||
                                              existingData.custId ||
                                              existingData.code,
                                            custName:
                                              existingData.name ||
                                              existingData.custName ||
                                              existingData.estCunm ||
                                              prev.custName ||
                                              "",
                                            address1:
                                              existingData.add1 ||
                                              existingData.address1 ||
                                              existingData.estAdd1 ||
                                              prev.address1 ||
                                              "",
                                            address2:
                                              existingData.add2 ||
                                              existingData.address2 ||
                                              existingData.estAdd2 ||
                                              prev.address2 ||
                                              "",
                                          }));
                                        } else if (
                                          headerData.custName?.trim()
                                        ) {
                                          const currentUser = JSON.parse(
                                            sessionStorage.getItem(
                                              "currentUser",
                                            ) || "{}",
                                          );
                                          const validLoginUser =
                                            currentUser.username;
                                          const crmData = {
                                            name: headerData.custName || "",
                                            mob: headerData.phone,
                                            username: validLoginUser || "",
                                            add1: headerData.address1 || "",
                                            add2: headerData.address2 || "",
                                            add3: headerData.place || "",
                                            pincode: headerData.pincode || "",
                                            aadharno: headerData.aadhar || "",
                                            aadhar: headerData.aadhar || "",
                                            aadhaar: headerData.aadhar || "",
                                            aadharNo: headerData.aadhar || "",
                                            aadhar_no: headerData.aadhar || "",
                                            pan: headerData.pan || "",
                                            panno: headerData.pan || "",
                                            panNo: headerData.pan || "",
                                            pan_no: headerData.pan || "",
                                            gstin: headerData.gstNo || "",
                                            gstno: headerData.gstNo || "",
                                            gstNo: headerData.gstNo || "",
                                            gst_no: headerData.gstNo || "",
                                            smanname: headerData.salesman || "",
                                            shopcode: resolveActiveShopCode(),
                                            todaydate: new Date()
                                              .toISOString()
                                              .split("T")[0],
                                          };
                                          const response =
                                            await createCrmCustomer(
                                              crmData,
                                              resolveActiveShopCode(),
                                            );
                                          if (response && response.custid) {
                                            setHeaderData((prev) => ({
                                              ...prev,
                                              custId: response.custid,
                                            }));
                                          }
                                        }
                                      }
                                    } catch (err: any) {
                                      console.error("CRM Sync Error:", err);
                                    }
                                  }
                                }}
                                onDoubleClick={() =>
                                  showLookup(
                                    lookupConfigs.salesman(
                                      addSalesmanToGrid,
                                      resolveActiveShopCode(),
                                    ),
                                  )
                                }
                              />
                              <button
                                tabIndex={-1}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm"
                                onClick={() =>
                                  showLookup(
                                    lookupConfigs.salesman(
                                      addSalesmanToGrid,
                                      resolveActiveShopCode(),
                                    ),
                                  )
                                }
                              >
                                <Search className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        </thead>
                        <tbody>
                          {salesmanGrid.map((sm, idx) =>
                            (() => {
                              const rowSmCode = String(
                                sm?.smCode || sm?.salesmancode || "",
                              )
                                .trim()
                                .toUpperCase();
                              const selectedSmCode = String(salesRow.sMan || "")
                                .trim()
                                .toUpperCase();
                              const isSelectedRow =
                                rowSmCode !== "" &&
                                rowSmCode === selectedSmCode;
                              return (
                                <tr
                                  key={idx}
                                  className={`modern-table-row border-b border-slate-200 dark:border-slate-700 text-center cursor-pointer transition-colors ${isSelectedRow
                                      ? "bg-sky-100 dark:bg-sky-900/40 ring-1 ring-inset ring-sky-300 dark:ring-sky-700"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    }`}
                                  onDoubleClick={() =>
                                    handleSmanRowDoubleClick(idx)
                                  }
                                  onClick={() => handleSmanRowTap(idx)}
                                >
                                  <td
                                    className={`px-2 py-2 text-center text-slate-600 dark:text-slate-300 ${tableTypography.cellMono}`}
                                  >
                                    {idx + 1}
                                  </td>
                                  <td
                                    className={`px-2 py-2 text-center text-sky-700 dark:text-sky-300 ${tableTypography.cellMono}`}
                                  >
                                    {sm.smCode}
                                  </td>
                                </tr>
                              );
                            })(),
                          )}
                          {salesmanGrid.length === 0 && (
                            <tr>
                              <td
                                colSpan={2}
                                className="text-center py-5 text-slate-400 dark:text-slate-500 text-sm italic"
                              >
                                No salesman added
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Advance Adjustment Panel - always visible beside Salesman */}
                <div className="flex-1 min-w-0 z-10 flex flex-col">
                  <Advance
                    isFormEnabled={isFormEnabled}
                    isEmbedded={true}
                    headerBarFlag={headerData.barFlag}
                    onCustomerSync={async (data) => {
                      console.log("SalesEntry: Received Sync Data", data);

                      // Only trigger New flow if we aren't already in a transaction
                      if (actionStatus === "NONE") {
                        await handleNewClick({
                          keepAdvanceOpen: true,
                          skipFocus: true,
                        });
                      }

                      setHeaderData((prev) => {
                        const hasNewRate = data.gRate && toNum(data.gRate) > 0;
                        const updated = {
                          ...prev,
                          ...data,
                          gRate: hasNewRate ? fmtAmt(data.gRate) : prev.gRate,
                          rateFix: hasNewRate ? !!data.rateFix : prev.rateFix,
                        };
                        console.log("SalesEntry: Updated HeaderData", updated);
                        return updated;
                      });

                      // Handle Salesman Sync
                      if (data.salesman) {
                        try {
                          const smRes = await SalesService.getAllSalesmen(
                            resolveActiveShopCode(),
                          );
                          if (smRes.data && Array.isArray(smRes.data)) {
                            const found = smRes.data.find(
                              (s) =>
                                s.salesman_code.toUpperCase() ===
                                data.salesman.toUpperCase(),
                            );
                            if (found) {
                              const smCode = found.salesman_code;
                              const smName = found.salesman_name;

                              // Update Header
                              setHeaderData((prev) => ({
                                ...prev,
                                salesman: smCode,
                                salesmanName: smName,
                              }));

                              // Keep ADV-fetched salesman in the input row only.
                              setSalesmanRow((prev) => ({
                                ...prev,
                                smCode,
                                smName,
                              }));
                            }
                          }
                        } catch (err: any) {
                          console.warn("Failed to sync salesman name:", err);
                        }
                      }
                    }}
                    onFinish={() => {
                      setTimeout(() => {
                        headerRefs.current["careOf"]?.focus();
                        headerRefs.current["careOf"]?.select();
                      }, 100);
                    }}
                    initialData={{
                      estNo: headerData.estNo,
                      estDate: headerData.estDate,
                    }}
                    showPopupMessage={showPopupMessage}
                    externalGrid={advanceGrid}
                    setExternalGrid={setAdvanceGrid}
                  />
                </div>
              </div>
              {/* End Left Group: Salesman + Advance */}

              {/* Stone Details - Wider Right Panel */}
              <div className="compact-card bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-sm flex flex-col lg:flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-md bg-slate-500/10 flex items-center justify-center">
                    <Gem className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                    Stone Details
                  </h3>
                </div>

                <div
                  ref={stoneTableRef}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-50/50 dark:bg-slate-900/50 h-[155px] flex flex-col min-h-0"
                >
                  <div className="overflow-x-auto flex-1 overflow-y-auto relative custom-scrollbar">
                    <table className="w-full text-sm min-w-[540px]">
                      <colgroup>
                        <col style={{ width: "36px" }} />
                        <col style={{ width: "90px" }} />
                        <col style={{ width: "70px" }} />
                        <col style={{ width: "50px" }} />
                        <col style={{ width: "70px" }} />
                        <col style={{ width: "70px" }} />
                        <col style={{ width: "80px" }} />
                        <col style={{ width: "50px" }} />
                        <col style={{ width: "50px" }} />
                        <col style={{ width: "32px" }} />
                      </colgroup>
                      <thead className="sticky top-0 z-10">
                        {/* Row 1: Headers */}
                        <tr className="modern-table-header">
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            Sln
                          </th>
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            Code
                          </th>
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            Unit
                          </th>
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            Qty
                          </th>
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            Wt/Ct
                          </th>
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            Rate
                          </th>
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            Amount
                          </th>
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            Tp
                          </th>
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            Dd
                          </th>
                          <th
                            className={`px-1 py-2 text-center ${tableTypography.header}`}
                          >
                            +
                          </th>
                        </tr>
                        <tr className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm">
                          <td className="px-1 py-1.5">
                            <div
                              className={`text-center text-slate-400 dark:text-slate-500 ${tableTypography.cellMono}`}
                            >
                              {stoneRow.sNo}
                            </div>
                          </td>
                          <td className="px-1 py-1.5">
                            <div className="relative">
                              <input
                                ref={(el) => {
                                  stoneRefs.current["stoneCode"] = el;
                                }}
                                disabled={!isFormEnabled || !salesRow.itemCode}
                                readOnly={!isStonecodeEnable}
                                placeholder="CODE"
                                className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 pl-1 pr-6 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                                value={stoneRow.stoneCode}
                                onChange={(e) =>
                                  setStoneRow({
                                    ...stoneRow,
                                    stoneCode: e.target.value,
                                  })
                                }
                                onFocus={(e) => {
                                  handleFieldFocus(e);
                                }}
                                onDoubleClick={() =>
                                  showLookup(
                                    lookupConfigs.stone(
                                      handleStoneSelect,
                                      resolveActiveShopCode(),
                                    ),
                                  )
                                }
                                onKeyDown={handleStoneCodeEnter}
                                onBlur={(e) => {
                                  handleStoneCodeEnter(
                                    {
                                      ...e,
                                      key: "Enter",
                                      preventDefault: () => { },
                                    },
                                    false,
                                  );
                                }}
                              />
                              <button
                                type="button"
                                tabIndex={-1}
                                disabled={!isFormEnabled || !salesRow.itemCode}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                onClick={() =>
                                  showLookup(
                                    lookupConfigs.stone(
                                      handleStoneSelect,
                                      resolveActiveShopCode(),
                                    ),
                                  )
                                }
                                title="Search Stone"
                              >
                                <Search className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              ref={(el) => {
                                stoneRefs.current["color"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="UNIT"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellText}`}
                              value={stoneRow.color}
                              onChange={(e) =>
                                setStoneRow({
                                  ...stoneRow,
                                  color: e.target.value,
                                })
                              }
                              onKeyDown={(e) => handleStoneEnter(e, "qty")}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              ref={(el) => {
                                stoneRefs.current["qty"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="QTY"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={stoneRow.qty}
                              // onKeyDown={(e) => handleStoneEnter(e, "wt")}
                              onChange={(e) =>
                                setStoneRow({
                                  ...stoneRow,
                                  qty: e.target.value.replace(/[^\d]/g, ""),
                                })
                              }
                              onFocus={(e) => { const t = e.currentTarget; setTimeout(() => t.select(), 0); }}
                              onBlur={(e) => {
                                if (!e.target.value.trim()) {
                                  setStoneRow((prev) => ({
                                    ...prev,
                                    qty: "0",
                                  }));
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const qty = Number(stoneRow.qty || 0);

                                  if (qty < 1) {
                                    e.preventDefault();

                                    showPopupMessage(
                                      "Minimum quantity required",
                                      "Validation",
                                    );

                                    setTimeout(() => {
                                      stoneRefs.current["qty"]?.focus();
                                    }, 100);

                                    return;
                                  }
                                }

                                handleStoneEnter(e, "wt");
                              }}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              ref={(el) => {
                                stoneRefs.current["wt"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="WEIGHT"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={stoneRow.wt}
                              onChange={(e) =>
                                setStoneRow({
                                  ...stoneRow,
                                  wt: e.target.value.replace(/[^\d.]/g, ""),
                                })
                              }
                              onBlur={(e) => {
                                if (
                                  !e.target.value.trim() ||
                                  e.target.value === "."
                                ) {
                                  setStoneRow((prev) => ({
                                    ...prev,
                                    wt: "0.000",
                                  }));
                                }
                              }}
                              onFocus={(e) => { const t = e.currentTarget; setTimeout(() => t.select(), 0); }}
                              onKeyDown={(e) => handleStoneEnter(e, "rate")}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              ref={(el) => {
                                stoneRefs.current["rate"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="RATE"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={stoneRow.rate}
                              onChange={(e) =>
                                setStoneRow({
                                  ...stoneRow,
                                  rate: e.target.value.replace(/[^\d.]/g, ""),
                                })
                              }
                              onBlur={(e) => {
                                if (
                                  !e.target.value.trim() ||
                                  e.target.value === "."
                                ) {
                                  setStoneRow((prev) => ({
                                    ...prev,
                                    rate: "0.00",
                                  }));
                                }
                              }}
                              onFocus={(e) => { const t = e.currentTarget; setTimeout(() => t.select(), 0); }}
                              onKeyDown={(e) => handleStoneEnter(e, "COMPLETE")}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              ref={(el) => {
                                stoneRefs.current["amount"] = el;
                              }}
                              className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 px-1 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-right ${tableTypography.cellAmount}`}
                              value={stoneRow.amount}
                              readOnly
                              onKeyDown={(e) => handleStoneEnter(e, "type")}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              ref={(el) => {
                                stoneRefs.current["type"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="TP"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellText}`}
                              value={stoneRow.type || ""}
                              onChange={(e) =>
                                setStoneRow({
                                  ...stoneRow,
                                  type: e.target.value.toUpperCase(),
                                })
                              }
                              onKeyDown={(e) => handleStoneEnter(e, "dtype")}
                              onFocus={(e) => { const t = e.currentTarget; setTimeout(() => t.select(), 0); }}
                            />
                          </td>
                          <td className="px-1 py-1.5">
                            <input
                              ref={(el) => {
                                stoneRefs.current["dtype"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="DD"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellText}`}
                              value={stoneRow.dtype || ""}
                              onChange={(e) =>
                                setStoneRow({
                                  ...stoneRow,
                                  dtype: e.target.value.toUpperCase(),
                                })
                              }
                              onKeyDown={(e) => handleStoneEnter(e, "COMPLETE")}
                              onFocus={(e) => { const t = e.currentTarget; setTimeout(() => t.select(), 0); }}
                            />
                          </td>
                          <td className="px-1 py-1.5 text-center">
                            <button
                              ref={stonePlusBtnRef}
                              type="button"
                              disabled={!isFormEnabled}
                              onClick={completeStoneRowWithConfirm}
                              className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-emerald-500 hover:scale-105 transform duration-150 focus:ring-2 focus:ring-emerald-400 focus:outline-none mx-auto"
                              title="Add Stone to Grid"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        {stoneGrid.map((row, i) => (
                          <tr
                            key={i}
                            className={`modern-table-row border-b border-slate-100 dark:border-slate-800 cursor-pointer h-10 ${editingStoneIndex === i
                                ? "bg-sky-500 text-white font-bold"
                                : "text-slate-700 dark:text-slate-300"
                              }`}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingStoneIndex(i);
                              setStoneRow(stoneGrid[i]);
                              setTimeout(
                                () => stoneRefs.current["stoneCode"]?.focus(),
                                100,
                              );
                            }}
                            onClick={() => {
                              handleStoneRowTap(i);
                            }}
                          >
                            <td
                              className={`px-1 py-2 text-center ${tableTypography.cellMono}`}
                            >
                              {row.sNo}
                            </td>
                            <td
                              className={`px-1 py-2 font-bold text-sky-600 dark:text-sky-400 ${tableTypography.cellMono}`}
                            >
                              {row.stoneCode}
                            </td>
                            <td
                              className={`px-1 py-2 ${tableTypography.cellText}`}
                            >
                              {row.color || ""}
                            </td>
                            <td
                              className={`px-1 py-2 text-right ${tableTypography.cellMono}`}
                            >
                              {String(Number(row.qty || 0))}
                            </td>
                            <td
                              className={`px-1 py-2 text-right ${tableTypography.cellMono}`}
                            >
                              {fmtWt(row.wt)}
                            </td>
                            <td
                              className={`px-1 py-2 text-right ${tableTypography.cellMono}`}
                            >
                              {fmtAmt(row.rate)}
                            </td>
                            <td
                              className={`px-1 py-2 text-right font-bold ${tableTypography.cellAmount}`}
                            >
                              {row.amount}
                            </td>
                            <td
                              className={`px-1 py-2 text-center ${tableTypography.cellText}`}
                            >
                              {row.type || ""}
                            </td>
                            <td
                              className={`px-1 py-2 text-center ${tableTypography.cellText}`}
                            >
                              {row.dtype || ""}
                            </td>
                            <td></td>
                          </tr>
                        ))}
                        {stoneGrid.length === 0 && (
                          <tr>
                            <td
                              colSpan={9}
                              className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs italic"
                            >
                              No stones added
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              {/* END Stone Details */}
            </div>
            {/* END ROW 2 */}

            {/* ROW 3: Sales Details Table (Full Width) */}
            <div className="compact-card sales-grid-panel mt-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-sm flex flex-col min-h-[200px] min-w-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 gap-2">
                {/* Tab Bar */}
                <div className="flex items-center gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl overflow-x-auto w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("SALES")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "SALES"
                        ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                      }`}
                  >
                    <FileText className="w-4 h-4" />
                    Sales Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("PURCHASE")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "PURCHASE"
                        ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-orange-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                      }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Purchase
                  </button>
                  <button
                    type="button"
                    disabled={!!headerData.barFlag}
                    onClick={() => setActiveTab("CREDIT_NOTE")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === "CREDIT_NOTE"
                        ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-purple-400 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                      } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Credit Note
                  </button>
                </div>

                {/* Item Counter (Only show for Sales Tab) */}
                {activeTab === "SALES" && (
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-full border border-sky-100 dark:border-sky-500/20">
                      Items: {salesGrid.length}
                    </span>
                  </div>
                )}
              </div>

              {/* TAB CONTENT: SALES */}
              {activeTab === "SALES" && (
                <div className="border border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/40 flex-1 flex flex-col">
                  <div className="overflow-x-auto max-h-[220px] overflow-y-auto relative custom-scrollbar flex-1">
                    <table className="w-full text-sm min-w-[1800px]">
                      <thead className="sticky top-0 z-20 shadow-sm">
                        {/* Row 1: Labels (Premium Model) */}
                        <tr className="modern-table-header">
                          <th
                            className={`p-2 min-w-[120px] text-center text-white ${tableTypography.header}`}
                          >
                            Barcode
                          </th>
                          <th
                            className={`p-2 min-w-[100px] text-center text-white ${tableTypography.header}`}
                          >
                            Item
                          </th>
                          <th
                            className={`p-2 min-w-[200px] text-center text-white ${tableTypography.header}`}
                          >
                            Item Desc
                          </th>
                          <th
                            className={`p-2 min-w-[70px] text-center text-white ${tableTypography.header}`}
                          >
                            Cntr
                          </th>
                          <th
                            className={`p-2 min-w-[90px] text-center text-white ${tableTypography.header}`}
                          >
                            Actual Wt
                          </th>
                          <th
                            className={`p-2 min-w-[70px] text-center text-white ${tableTypography.header}`}
                          >
                            No.Ded
                          </th>
                          <th
                            className={`p-2 min-w-[90px] text-center text-white ${tableTypography.header}`}
                          >
                            Wt.Add
                          </th>
                          <th
                            className={`p-2 min-w-[90px] text-center text-white ${tableTypography.header}`}
                          >
                            Wt.Ded
                          </th>
                          <th
                            className={`p-2 min-w-[70px] text-center text-white ${tableTypography.header}`}
                          >
                            Qty
                          </th>
                          <th
                            className={`p-2 min-w-[100px] text-center text-white ${tableTypography.header}`}
                          >
                            Gross Wt
                          </th>
                          <th
                            className={`p-2 min-w-[90px] text-center text-white ${tableTypography.header}`}
                          >
                            Stone Wt
                          </th>
                          <th
                            className={`p-2 min-w-[100px] text-center text-white ${tableTypography.header}`}
                          >
                            Net Wt
                          </th>
                          <th
                            className={`p-2 min-w-[100px] text-center text-white ${tableTypography.header}`}
                          >
                            VA(%)
                          </th>
                          <th
                            className={`p-2 min-w-[100px] text-center text-white ${tableTypography.header}`}
                          >
                            Mk Rate
                          </th>
                          <th
                            className={`p-2 min-w-[120px] text-center text-white ${tableTypography.header}`}
                          >
                            VA Amt
                          </th>
                          <th
                            className={`p-2 min-w-[100px] text-center text-white ${tableTypography.header}`}
                          >
                            Stn.Chg
                          </th>
                          <th
                            className={`p-2 min-w-[120px] text-center text-white ${tableTypography.header}`}
                          >
                            Gold Amt
                          </th>
                          <th
                            className={`p-2 min-w-[120px] text-center text-white ${tableTypography.header}`}
                          >
                            Amount
                          </th>
                          <th
                            className={`p-2 min-w-[60px] text-center text-white ${tableTypography.header}`}
                          >
                            Slno
                          </th>
                          <th
                            className={`p-2 min-w-[100px] text-center text-white ${tableTypography.header}`}
                          >
                            Salesman
                          </th>
                          <th
                            className={`p-2 min-w-[90px] text-center text-white ${tableTypography.header}`}
                            title="Gold Rate per Row (R)"
                          >
                            R
                          </th>
                          <th
                            className={`p-2 min-w-[50px] text-center text-white ${tableTypography.header}`}
                          >
                            Action
                          </th>
                        </tr>
                        {/* Row 2: Inputs */}
                        <tr className="bg-slate-100/80 dark:bg-slate-800/60">
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[120px] relative">
                            <div className="flex items-center gap-1">
                              <input
                                ref={(el) => {
                                  salesRefs.current["barcode"] = el;
                                }}
                                disabled={!isGridEnabled}
                                placeholder="BARCODE"
                                className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:opacity-60 disabled:cursor-not-allowed ${tableTypography.cellMono}`}
                                value={salesRow.barcode}
                                onChange={(e) =>
                                  setSalesRow({
                                    ...salesRow,
                                    barcode: e.target.value.toUpperCase(),
                                  })
                                }
                                onFocus={(e) => {
                                  // Guard: Redirect to salesman if no salesman is set
                                  const hasSalesman =
                                    salesmanGrid.length > 0 ||
                                    (headerData.salesman &&
                                      headerData.salesman.trim() !== "");
                                  if (
                                    !hasSalesman &&
                                    e.target.dataset.bypassed !== "true"
                                  ) {
                                    e.target.blur();
                                    setTimeout(() => {
                                      showPopupMessage(
                                        "Please select a Salesman first!",
                                        "Validation",
                                      );
                                      headerRefs.current["salesman"]?.focus();
                                    }, 0);
                                  } else {
                                    handleFieldFocus(e);
                                  }
                                }}
                                onKeyDown={handleBarcodeEnter}
                                onBlur={async (e) => {
                                  const barcode = (salesRow.barcode || "").trim();
                                  if (barcode) {
                                    await handleBarcodeEnter(
                                      {
                                        ...e,
                                        key: "Enter",
                                        preventDefault: () => { },
                                      },
                                      undefined,
                                      true,
                                    );
                                  }
                                }}
                              />
                              {isScannerEnabled && (
                                <button
                                  type="button"
                                  onClick={() => setShowScanner(true)}
                                  className="p-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors flex-shrink-0 border border-slate-200 dark:border-slate-700"
                                  title="Scan Barcode"
                                >
                                  <Camera className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[100px] relative">
                            <input
                              ref={(el) => {
                                salesRefs.current["itemCode"] = el;
                              }}
                              disabled={!isGridEnabled}
                              placeholder="ITEM"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:opacity-60 disabled:cursor-not-allowed ${tableTypography.cellMono}`}
                              value={salesRow.itemCode}
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  itemCode: e.target.value.toUpperCase(),
                                })
                              }
                              onFocus={handleFieldFocus}
                              onKeyDown={handleItemCodeEnter}
                              onBlur={async () => {
                                setIsMetalLocked(true);
                                const itemCode = (salesRow.itemCode || "").trim().toUpperCase();
                                if (itemCode) {
                                  await processItemCodeChange(itemCode, true);
                                }
                              }}
                              onDoubleClick={() =>
                                showLookup(
                                  lookupConfigs.itemdetails(
                                    handleItemSelect,
                                    headerData.goldSlv,
                                    resolveActiveShopCode(),
                                  ),
                                )
                              }
                            />
                            <button
                              tabIndex={-1}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm"
                              onClick={() =>
                                showLookup(
                                  lookupConfigs.itemdetails(
                                    handleItemSelect,
                                    headerData.goldSlv,
                                    resolveActiveShopCode(),
                                  ),
                                )
                              }
                              title="Search Item (F2)"
                            >
                              <Search className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[200px]">
                            <input
                              className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 px-2 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 opacity-70 ${tableTypography.cellText}`}
                              value={salesRow.itemDesc}
                              readOnly
                              placeholder="DESCRIPTION"
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[70px]">
                            <input
                              readOnly
                              placeholder="CNTR"
                              className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 px-2 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 opacity-70 cursor-not-allowed text-center ${tableTypography.cellText}`}
                              value={salesRow.cntr}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[90px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["actualWt"] = el;
                              }}
                              disabled={true}
                              placeholder="ACT.WT"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:opacity-60 disabled:cursor-not-allowed ${tableTypography.cellMono}`}
                              value={salesRow.actualWt || ""}
                              inputMode="decimal"
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  actualWt: limitDecimals(e.target.value, 3),
                                  isVaAmtManual: false,
                                })
                              }
                              onFocus={(e) => {
                                handleFieldFocus(e, () => {
                                  setIsManualVaPerEdit(false);
                                });
                              }}
                              onBlur={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  actualWt: fmtWt(e.target.value),
                                })
                              }
                              onKeyDown={(e) => handleSalesEnter(e, "noded")}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[70px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["noded"] = el;
                              }}
                              disabled={!isFormEnabled || isDummyBarcode}
                              placeholder="NO.D"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={salesRow.noded || "0"}
                              inputMode="numeric"
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  noded: e.target.value.replace(/[^\d]/g, ""),
                                })
                              }
                              onFocus={handleFieldFocus}
                              onKeyDown={(e) => handleSalesEnter(e, "wtAdd")}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[90px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["wtAdd"] = el;
                              }}
                              disabled={!isFormEnabled || isDummyBarcode}
                              placeholder="WT.A"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={salesRow.wtAdd}
                              inputMode="decimal"
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  wtAdd: limitDecimals(e.target.value, 3),
                                })
                              }
                              onFocus={handleFieldFocus}
                              onBlur={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  wtAdd: fmtWt(e.target.value),
                                })
                              }
                              onKeyDown={(e) => handleSalesEnter(e, "wtDed")}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[90px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["wtDed"] = el;
                              }}
                              disabled={!isFormEnabled || isDummyBarcode}
                              placeholder="WT.D"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={salesRow.wtDed || ""}
                              inputMode="decimal"
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  wtDed: limitDecimals(e.target.value, 3),
                                })
                              }
                              onFocus={handleFieldFocus}
                              onBlur={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  wtDed: fmtWt(e.target.value),
                                })
                              }
                              onKeyDown={(e) => handleSalesEnter(e, "vaPer")}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[70px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["qty"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="QTY"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:opacity-60 disabled:cursor-not-allowed ${tableTypography.cellMono}`}
                              value={salesRow.qty}
                              inputMode="numeric"
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  qty: e.target.value.replace(/[^\d]/g, ""),
                                })
                              }
                              onBlur={(e) => {
                                const val = e.target.value.trim() || "0";
                                setSalesRow((prev) =>
                                  calculateAddDed({ ...prev, qty: val }),
                                );
                              }}
                              onFocus={handleFieldFocus}
                              onKeyDown={(e) => handleSalesEnter(e, "grossWt")}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[100px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["grossWt"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="GROSS"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={salesRow.grossWt}
                              inputMode="decimal"
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  grossWt: limitDecimals(e.target.value, 3),
                                })
                              }
                              onFocus={handleFieldFocus}
                              onBlur={(e) => {
                                const currentGross = e.target.value.trim();
                                const val = fmtWt(currentGross);
                                const updatedRow = calculateAddDed({ ...salesRow, grossWt: val });
                                setSalesRow(updatedRow);

                                if (updatedRow.isDiamond && getWt(val) > 0) {
                                  setStoneRow((prev) => ({
                                    ...stoneEmpty,
                                    sNo: (stoneGrid.length + 1).toString(),
                                  }));
                                  setTimeout(
                                    () => stoneRefs.current["stoneCode"]?.focus(),
                                    100,
                                  );
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const currentGross = salesRow.grossWt.trim();
                                  const isPiece = isPieceBillType(
                                    salesRow.billType,
                                  );
                                  const isSilverPiece = isSilverFocusFlow();

                                  // Java Logic: Validation
                                  if (
                                    currentGross.length === 0 ||
                                    (getWt(currentGross) <= 0 && !isPiece)
                                  ) {
                                    showPopupMessage(
                                      "Please Enter Valid Data",
                                      "Error",
                                    );
                                    salesRefs.current["grossWt"]?.focus();
                                    return;
                                  }

                                  const updatedRow = calculateAddDed({
                                    ...salesRow,
                                    grossWt: fmtWt(currentGross),
                                  });
                                  setSalesRow(updatedRow);

                                  e.preventDefault();

                                  console.log("Sales focus after Gross Wt:", {
                                    metal: headerData.goldSlv,
                                    billType: salesRow.billType,
                                    isPiece,
                                    isSilverPiece,
                                  });

                                  // Focus Flow based on Java logic
                                  const isDiamondItem = updatedRow.isDiamond;

                                  if (isDiamondItem) {
                                    setStoneRow((prev) => ({
                                      ...stoneEmpty,
                                      sNo: (stoneGrid.length + 1).toString(),
                                    }));
                                    setTimeout(
                                      () =>
                                        stoneRefs.current["stoneCode"]?.focus(),
                                      100,
                                    );
                                  } else if (isPiece && !isSilverPiece) {
                                    openPieceModal();
                                  } else {
                                    handleSalesEnter(e, "stoneWt");
                                  }
                                }
                              }}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[90px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["stoneWt"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="STONE"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={salesRow.stoneWt}
                              inputMode="decimal"
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  stoneWt: limitDecimals(e.target.value, 3),
                                })
                              }
                              onFocus={handleFieldFocus}
                              onBlur={(e) => {
                                const rawVal = e.target.value.trim();
                                const grossWt = getWt(salesRow.grossWt);

                                if (!rawVal || parseFloat(rawVal) === 0) {
                                  // Blank → set stoneWt=0.000, netWt=grossWt
                                  setSalesRow((prev) => ({
                                    ...prev,
                                    stoneWt: "0.000",
                                    netWt: fmtWt(grossWt),
                                  }));
                                } else {
                                  const stoneWt = getWt(rawVal);
                                  if (stoneWt < grossWt) {
                                    // Valid → compute netWt
                                    setSalesRow((prev) => ({
                                      ...prev,
                                      stoneWt: fmtWt(stoneWt),
                                      netWt: fmtWt(grossWt - stoneWt),
                                    }));
                                  } else {
                                    // Invalid: stoneWt >= grossWt → reset and refocus
                                    setSalesRow((prev) => ({
                                      ...prev,
                                      stoneWt: "0.000",
                                      netWt: fmtWt(grossWt),
                                    }));
                                    setTimeout(
                                      () =>
                                        salesRefs.current["stoneWt"]?.focus(),
                                      0,
                                    );
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const isSilverPiece = isSilverFocusFlow();
                                  if (isSilverPiece) {
                                    handleSalesEnter(e, "mkRate");
                                  } else if (
                                    ["LS", "BS"].includes(
                                      salesRow.cntr || "",
                                    ) ||
                                    salesRow.itemCode === "BS"
                                  ) {
                                    handleSalesEnter(e, "amount");
                                  } else {
                                    handleSalesEnter(e, "vaPer");
                                  }
                                }
                              }}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[100px]">
                            <input
                              className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 px-2 outline-none bg-slate-50 dark:bg-slate-900/50 text-sky-600 dark:text-sky-400 text-right ${tableTypography.cellMono}`}
                              value={salesRow.netWt}
                              readOnly
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[100px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["vaPer"] = el;
                              }}
                              disabled={!isGridEnabled}
                              placeholder="VA%"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={salesRow.vaPer}
                              inputMode="decimal"
                              onChange={(e) => {
                                setIsManualVaPerEdit(true);
                                setSalesRow({
                                  ...salesRow,
                                  vaPer: limitDecimals(e.target.value, 2),
                                  wastage: "0.000",
                                  mkRate: "0.00",
                                  isVaAmtManual: false,
                                });
                              }}
                              onBlur={(e) => {
                                setSalesRow((prev) => ({
                                  ...prev,
                                  vaPer: fmtAmt(e.target.value),
                                }));
                              }}
                              onFocus={(e) => {
                                handleFieldFocus(e, () => {
                                  setIsManualVaPerEdit(true);
                                });
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  salesRefs.current["vaAmt"]?.focus();
                                }
                              }}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[100px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["mkRate"] = el;
                              }}
                              disabled={!isGridEnabled}
                              placeholder="MK.RT"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                              value={salesRow.mkRate || ""}
                              onBlur={(e) => {
                                validateMakingCharge();
                                setSalesRow({
                                  ...salesRow,
                                  mkRate: "0.00",
                                });
                              }}
                              inputMode="decimal"
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  mkRate: limitDecimals(e.target.value, 2),
                                  isVaAmtManual: false,
                                })
                              }
                              onFocus={(e) => {
                                handleFieldFocus(e, () => {
                                  setIsManualVaPerEdit(false);
                                });
                              }}
                              onKeyDown={(e) =>
                                handleSalesEnter(e, "PLUS_BUTTON")
                              }
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[120px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["vaAmt"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="VA.AMT"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellAmount}`}
                              value={salesRow.vaAmt}
                              onChange={(e) =>
                                handleVaAmountChange(e.target.value)
                              }
                              onBlur={(e) => {
                                handleVaAmountChange(fmtAmt(e.target.value));
                              }}
                              onFocus={handleFieldFocus}
                              onKeyDown={handleVaAmtEnter}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[100px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["stnChg"] = el;
                              }}
                              disabled={!isFormEnabled}
                              placeholder="STN.CH"
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellAmount}`}
                              value={salesRow.stnChg || ""}
                              inputMode="decimal"
                              onChange={(e) =>
                                setSalesRow({
                                  ...salesRow,
                                  stnChg: limitDecimals(e.target.value, 2),
                                })
                              }
                              onFocus={handleFieldFocus}
                              onBlur={(e) => {
                                setSalesRow({
                                  ...salesRow,
                                  stnChg: fmtAmt(e.target.value),
                                });
                              }}
                              onKeyDown={(e) =>
                                handleSalesEnter(e, "PLUS_BUTTON")
                              }
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[120px]">
                            <input
                              className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 px-2 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-right opacity-70 ${tableTypography.cellAmount}`}
                              value={salesRow.goldAmt}
                              readOnly
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[120px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["amount"] = el;
                              }}
                              className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all shadow-sm ${tableTypography.cellAmount}`}
                              value={salesRow.amount}
                              readOnly
                              onFocus={handleFieldFocus}
                              onKeyDown={(e) =>
                                handleSalesEnter(e, "PLUS_BUTTON")
                              }
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[60px]">
                            <input
                              ref={(el) => {
                                salesRefs.current["slNo"] = el;
                              }}
                              className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 px-2 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all shadow-sm ${tableTypography.cellMono}`}
                              value={salesRow.slNo || "#"}
                              readOnly
                              onFocus={handleFieldFocus}
                              onKeyDown={(e) => {
                                if (e.key === "Tab") {
                                  e.preventDefault();
                                  plusBtnRef.current?.focus();
                                } else {
                                  handleSalesEnter(e, "PLUS_BUTTON");
                                }
                              }}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[100px] relative">
                            <input
                              readOnly
                              placeholder="SALESMAN"
                              className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 px-2 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 opacity-70 cursor-not-allowed text-center ${tableTypography.cellText}`}
                              value={salesRow.sMan || ""}
                            />
                          </td>
                          <td className="border-r border-b border-slate-300 dark:border-slate-700 p-1 min-w-[90px]">
                            <input
                              readOnly
                              tabIndex={-1}
                              placeholder="RATE"
                              className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 px-2 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 opacity-70 cursor-not-allowed text-right ${tableTypography.cellMono}`}
                              value={fmtAmt(salesRow.estRate && getAmt(salesRow.estRate) > 0 ? salesRow.estRate : headerData.gRate || 0)}
                            />
                          </td>
                          <td className="p-2 min-w-[50px] text-center">
                            <button
                              ref={plusBtnRef}
                              type="button"
                              disabled={!isGridEnabled}
                              onClick={completeSalesRow}
                              className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-emerald-500 hover:scale-105 transform duration-150 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                              title="Add Row to Grid"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-900/40">
                        {salesGrid.map((row, i) => (
                          <tr
                            key={i}
                            className={`modern-table-row transition-all duration-200 cursor-pointer select-none group ${editingRowIndex === i
                                ? "bg-sky-50 dark:bg-sky-500/10 ring-2 ring-sky-500 ring-inset shadow-inner"
                                : "hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                              }`}
                            onDoubleClick={() => handleRowDoubleClick(i)}
                            onClick={() => handleRowTap(i)}
                          >
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-left ${tableTypography.cellMono}`}
                            >
                              {row.barcode}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 font-bold text-sky-600 dark:text-sky-400 text-left ${tableTypography.cellMono}`}
                            >
                              {row.itemCode}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-500 dark:text-slate-400 text-left ${tableTypography.cellText}`}
                            >
                              {row.itemDesc}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-center ${tableTypography.cellText}`}
                            >
                              {row.cntr}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}
                            >
                              {row.actualWt}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-center ${tableTypography.cellMono}`}
                            >
                              {row.noded}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}
                            >
                              {fmtWt(row.wtAdd)}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}
                            >
                              {fmtWt(row.wtDed)}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}
                            >
                              {row.qty}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}
                            >
                              {fmtWt(row.grossWt)}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}
                            >
                              {fmtWt(row.stoneWt)}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 font-bold text-sky-600 dark:text-sky-400 text-right ${tableTypography.cellMono}`}
                            >
                              {fmtWt(row.netWt)}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}
                            >
                              {row.vaPer}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellMono}`}
                            >
                              {row.mkRate}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}
                            >
                              {row.vaAmt}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}
                            >
                              {row.stnChg}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 text-right ${tableTypography.cellAmount}`}
                            >
                              {row.goldAmt}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 font-bold text-emerald-600 dark:text-emerald-400 text-right ${tableTypography.cellAmount}`}
                            >
                              {fmtAmt(row.amount)}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-400 text-center ${tableTypography.cellMono}`}
                            >
                              #{row.slNo}
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-center ${tableTypography.cellText}`}
                            >
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                                {row.sMan}
                              </span>
                            </td>
                            <td
                              className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-right ${tableTypography.cellMono}`}
                            >
                              {fmtAmt(row.estRate || headerData.gRate || 0)}
                            </td>
                            <td className="border-b border-slate-200 dark:border-slate-700 p-2 text-center">
                              {/* Action spacer */}
                            </td>
                          </tr>
                        ))}
                        {salesGrid.length === 0 && (
                          <tr>
                            <td
                              colSpan={22}
                              className="text-center py-2 text-slate-400 bg-slate-50/30 dark:bg-slate-900/10"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <PlusCircle
                                  className="w-12 h-12 opacity-20"
                                  strokeWidth={1}
                                />
                                <span className="text-sm font-medium italic">
                                  Start by scanning a barcode or entering an
                                  item
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Embedded Credit Note Section */}
              {activeTab === "CREDIT_NOTE" && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <CreditSales
                    isEmbedded={true}
                    isFormEnabled={isGridEnabled}
                    externalGrid={creditNoteGrid}
                    setExternalGrid={setCreditNoteGrid}
                    goldSlv={headerData.goldSlv}
                    onCustomerUpdate={(customer) =>
                      setHeaderData((prev) => ({
                        ...prev,
                        address2: "",
                        place: "",
                        email: "",
                        aadhar: "",
                        pan: "",
                        gstNo: "",
                        careOf: "",
                        custId: customer.custId,
                        custName: customer.custName,
                        address1: customer.address1,
                        pincode: customer.pin,
                        phone: customer.phone,
                      }))
                    }
                    initialData={{
                      custId: headerData.custId,
                      custName: headerData.custName,
                      address1: headerData.address1,
                      pin: headerData.pincode,
                      phone: headerData.phone,
                      estNo: headerData.estNo,
                    }}
                  />
                </div>
              )}
              {/* Embedded Purchase Section */}
              {activeTab === "PURCHASE" && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <Purchase
                    isEmbedded={true}
                    isFormEnabled={isGridEnabled}
                    metalType={headerData.goldSlv}
                    shopcode={headerData.shopCode}
                    estNo={headerData.estNo}
                    estDate={headerData.estDate}
                    salesNetWt={salesGrid.reduce(
                      (sum, item) => sum + getWt(item.netWt),
                      0,
                    )}
                    barflag={!!headerData.barFlag}
                    externalGrid={purchaseGrid}
                    setExternalGrid={setPurchaseGrid}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Removed Keyboard Spacer to fix the visual gap between table and footer */}

      {/* Bottom Totals Bar (non-sticky) */}
      <div className="p-2 sm:px-3 sm:pb-3 sm:pt-1.5 bg-white/45 dark:bg-slate-800/60 border-t border-slate-200/50 dark:border-slate-800/50 rounded-2xl mt-2.5 mx-1 sm:mx-2 transition-all duration-300">
        <SalesTotalsPanel
          salesGrid={salesGrid}
          headerData={headerData}
          advanceGrid={advanceGrid}
          purchaseGrid={purchaseGrid}
          creditNoteGrid={creditNoteGrid}
        />
      </div>

      {/* Modals */}
      <ModernConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => {
          if (typeof confirmModal.onCancel === "function") {
            confirmModal.onCancel();
            return;
          }
          closeConfirmModal();
        }}
        isDestructive={confirmModal.isDestructive}
      />

      <MessagePopup
        open={!!popupMessage}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        onClose={() => {
          setPopupMessage("");
          if (popupCloseCallback) {
            popupCloseCallback();
            setPopupCloseCallback(null);
          }
          if (lastField) {
            setTimeout(() => {
              lastField.focus();
              if (typeof lastField.select === "function") {
                lastField.select();
              }
              setLastField(null);
            }, 100);
          }
        }}
      />

      {/* Piece Amount Modal */}
      {isPieceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md px-4 transition-all duration-200 animate-in fade-in">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                ₹
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Enter Piece Amount
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Specify fixed MRP / Item rate
                </p>
              </div>
            </div>

            <form onSubmit={handlePieceAmountSubmit}>
              <div className="mb-5 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500 text-sm">
                  ₹
                </span>
                <input
                  ref={pieceModalRef}
                  type="number"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-base font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                  placeholder="0.00"
                  value={pieceAmountInput}
                  onChange={(e) => setPieceAmountInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPieceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all cursor-pointer"
                >
                  Apply Amount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Row Action Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Item Options
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                  What would you like to do with this entry?
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmEdit}
                className="btn-secondary bg-white hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 w-full"
              >
                <Edit3 className="w-4 h-4 text-amber-500" />
                Edit Item Details
              </button>
              <button
                onClick={confirmDelete}
                className="btn-secondary bg-white hover:bg-rose-50 dark:hover:bg-rose-900/10 border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800/50 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 w-full"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                Remove from List
              </button>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all active:scale-95 mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salesman Action Modal */}
      {isSmanActionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Salesman Options
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                  Manage this salesman entry
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmSmanEdit}
                className="btn-secondary bg-white hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 w-full"
              >
                <Edit3 className="w-4 h-4 text-amber-500" />
                Change Salesman
              </button>
              <button
                onClick={confirmSmanDelete}
                className="btn-secondary bg-white hover:bg-rose-50 dark:hover:bg-rose-900/10 border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800/50 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 w-full"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                Remove Salesman
              </button>
              <button
                onClick={() => setIsSmanActionModalOpen(false)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all active:scale-95 mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={(scannedCode: string) => {
            setShowScanner(false);
            handleBarcodeEnter(null, scannedCode);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </ModulePageLayout>
  );
};

export default SalesEntry;
