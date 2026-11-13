  import React, { useCallback, useMemo, useRef, useState } from "react";
  import { createPortal } from "react-dom";
  import { useNavigate } from "react-router-dom";
  import { Plus, Sliders, Trash2, User, X, Wallet, Search } from "lucide-react";
  import ModulePageLayout from "../../layout/ModulePageLayout";
  import { fmtAmt, fmtWt, limitDecimals } from "../../../utils/format";
  import DynamicQueryService from "../../../services/DynamicQueryApi";
  import { getCurrentShopCode, getCurrentUser } from "../../../utils/session";
  import axiosInstance from "../../../services/axiosConfig";
  import { useLookup } from "../../common/LookupContext";

  const DEFAULT_ADVANCE_ITEM_OPTIONS = [
    { name: "ORDER", code: "4" },
    { name: "ORDER SPLIT", code: "6" },
    { name: "SCHEME", code: "5" },
  ];

  const toNum = (val) => {
    const normalized =
      typeof val === "string" ? val.replace(/,/g, "").trim() : val;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  };

  const asRows = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (res?.data && typeof res.data === "object") return [res.data];
    return [];
  };

  const escapeSqlLiteral = (value) => String(value ?? "").replace(/'/g, "''");
  const getVal = (obj, ...keys) => {
    const source = obj || {};
    const sourceKeys = Object.keys(source);
    for (const key of keys) {
      const search = key.toLowerCase().replace(/_/g, "");
      for (const k of sourceKeys) {
        const actual = k.toLowerCase().replace(/_/g, "");
        if (actual === search) return source[k];
      }
    }
    return "";
  };

  let setDiscountCache = null;
  let setDiscountCacheTime = 0;
  const SETDISCOUNT_CACHE_TTL = 30000; // 30 seconds

  const getCachedSetDiscount = async (fetchListFn) => {
    const now = Date.now();
    if (setDiscountCache && now - setDiscountCacheTime < SETDISCOUNT_CACHE_TTL) {
      return setDiscountCache;
    }
    try {
      const res = await fetchListFn("SELECT details, flag, amount FROM setdiscount");
      if (Array.isArray(res?.data)) {
        setDiscountCache = res.data;
        setDiscountCacheTime = now;
        return setDiscountCache;
      }
    } catch (err) {
      console.error("Failed to load setdiscount rules:", err);
    }
    return setDiscountCache || [];
  };

  const getRuleFromCache = (discountRows, ruleName) => {
    const target = String(ruleName || "").trim().toLowerCase();
    const row = (discountRows || []).find((r) => {
      const d = String(getVal(r, "details") || "").trim().toLowerCase();
      return d === target;
    });
    if (!row) return { flag: false, amount: 0 };
    const rawFlag = getVal(row, "flag");
    const flag =
      rawFlag === true ||
      String(rawFlag).toLowerCase() === "true" ||
      String(rawFlag).toLowerCase() === "t" ||
      String(rawFlag) === "1";
    const amount = toNum(getVal(row, "amount"));
    return { flag, amount, row };
  };

  const extractFirstNumeric = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string") {
      const text = value.trim();
      if (!text) return null;
      const normalized = text.replace(/,/g, "");
      const direct = Number(normalized);
      if (Number.isFinite(direct)) return direct;
      try {
        const parsed = JSON.parse(text);
        const nested = extractFirstNumeric(parsed);
        if (nested !== null) return nested;
      } catch {
        // ignore parsing error
      }
      const match = normalized.match(/-?\d+(\.\d+)?/);
      if (match) {
        const n = Number(match[0]);
        if (Number.isFinite(n)) return n;
      }
      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = extractFirstNumeric(item);
        if (nested !== null) return nested;
      }
      return null;
    }

    if (value && typeof value === "object") {
      const preferred = [
        "grosswt",
        "totalgdwtbycustid",
        "totalgdwt",
        "gdwt",
        "weight",
        "value",
      ];
      for (const key of preferred) {
        const v = getVal(value, key);
        const nested = extractFirstNumeric(v);
        if (nested !== null) return nested;
      }
      for (const v of Object.values(value)) {
        const nested = extractFirstNumeric(v);
        if (nested !== null) return nested;
      }
    }

    return null;
  };

  const Advance = ({
    isEmbedded = false,
    isFormEnabled = false,
    initialData = {},
    externalGrid,
    setExternalGrid,
    onCustomerSync,
    onFinish,
    showPopupMessage,
    headerBarFlag = false,
  }) => {
    const navigate = useNavigate();
    const currentUser = getCurrentUser() || {};
    const username = currentUser.username || "";
    const password = currentUser.password || "";
    const shopCode = getCurrentShopCode() || "";

    const [itemOptions, setItemOptions] = useState(DEFAULT_ADVANCE_ITEM_OPTIONS);

    const { showLookup } = useLookup();

    const [nameFilter, setNameFilter] = useState("");
    const [advNoFilter, setAdvNoFilter] = useState("");
    const [amountFilter, setAmountFilter] = useState("");
    const [cashAmountFilter, setCashAmountFilter] = useState("");
    const [currentOrderYear, setCurrentOrderYear] = useState("");
    const [currentBarFlag, setCurrentBarFlag] = useState("f");
    const [maxAvailableAmount, setMaxAvailableAmount] = useState(0);
    const [schemeBonus, setSchemeBonus] = useState("");
    const [schemeDesc, setSchemeDesc] = useState("");
    const [schemeGrossWt, setSchemeGrossWt] = useState("");
    const [editIndex, setEditIndex] = useState(-1);
    const [editContext, setEditContext] = useState(null);
    const [clickedRowIndex, setClickedRowIndex] = useState(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [lastTapIndex, setLastTapIndex] = useState(null);
    const [lastTapTime, setLastTapTime] = useState(0);

    const nameFilterRef = useRef(null);
    const advNoFilterRef = useRef(null);
    const amountFilterRef = useRef(null);
    const isValidatingAdvNoRef = useRef(false);
    const [internalGrid, setInternalGrid] = useState([]);

    const advanceGrid = externalGrid || internalGrid;

    const addButtonRef = useRef(null);

    const orderSplitEnabled  =  nameFilter.toUpperCase() === "ORDER SPLIT";

    const totalAdvanceAmount = useMemo(() => {
      return advanceGrid.reduce((sum, row) => {
        return sum + toNum(row.balAmt ?? row.advAmt ?? "0");
      }, 0);
    }, [advanceGrid]);

    const totalAdvCash = useMemo(() => {
      return advanceGrid.reduce((sum, row) => {
        return sum + toNum(row.advAmt ?? row.cashAmt ?? "0");
      }, 0);
    }, [advanceGrid]);

    const fetchList = useCallback(
      (sql) =>
        DynamicQueryService.fetchList(sql, {}, { username, password }, shopCode),
      [username, password, shopCode],
    );



    const resetEntryForm = useCallback(() => {
      setNameFilter("");
      setAdvNoFilter("");
      setAmountFilter("");
      setCashAmountFilter("");
      setCurrentOrderYear("");
      setCurrentBarFlag("f");
      setMaxAvailableAmount(0);
      setSchemeBonus("");
      setSchemeDesc("");
      setSchemeGrossWt("");
      setEditIndex(-1);
      setEditContext(null);
    }, []);

    const openAdvanceItemLookup = useCallback(() => {
      showLookup({
        title: "Select Advance Item",
        size: "sm",
        apiFunction: () => Promise.resolve(itemOptions),
        columns: [
          { key: "name", label: "Advance Item Name" },
          { key: "code", label: "Code" },
        ],
        onSelect: (opt) => {
          setNameFilter(opt.name);
          setTimeout(() => advNoFilterRef.current?.focus(), 50);
        },
      });
    }, [showLookup, itemOptions]);

    const handleRowDoubleClick = useCallback((idx) => {
      setClickedRowIndex(idx);
      setIsActionModalOpen(true);
    }, []);

    const handleRowTap = useCallback(
      (idx) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        if (lastTapIndex === idx && now - lastTapTime < DOUBLE_TAP_DELAY) {
          handleRowDoubleClick(idx);
          setLastTapTime(0);
          setLastTapIndex(null);
          return;
        }
        setLastTapIndex(idx);
        setLastTapTime(now);
      },
      [handleRowDoubleClick, lastTapIndex, lastTapTime],
    );

    const confirmDelete = useCallback(() => {
      if (clickedRowIndex === null || clickedRowIndex < 0) return;
      if (typeof setExternalGrid === "function") {
        setExternalGrid((prev) => {
          const rows = [...(prev || [])];
          rows.splice(clickedRowIndex, 1);
          return rows.map((r, i) => ({ ...r, slNo: i + 1 }));
        });
      }
      if (editIndex === clickedRowIndex) {
        resetEntryForm();
      } else if (editIndex > clickedRowIndex) {
        setEditIndex((prev) => prev - 1);
      }
      setIsActionModalOpen(false);
      setClickedRowIndex(null);
    }, [clickedRowIndex, editIndex, resetEntryForm, setExternalGrid]);

    const handleDeleteRowDirect = useCallback(
      (idx, e) => {
        if (e) e.stopPropagation();
        if (idx === null || idx < 0) return;
        if (typeof setExternalGrid === "function") {
          setExternalGrid((prev) => {
            const rows = [...(prev || [])];
            rows.splice(idx, 1);
            return rows.map((r, i) => ({ ...r, slNo: i + 1 }));
          });
        }
        if (editIndex === idx) {
          resetEntryForm();
        } else if (editIndex > idx) {
          setEditIndex((prev) => prev - 1);
        }
      },
      [editIndex, resetEntryForm, setExternalGrid],
    );

    const loadAdvanceItemOptions = useCallback(() => {
      const parentBarFlag = headerBarFlag === true || String(headerBarFlag).toLowerCase() === "true" || String(headerBarFlag).toLowerCase() === "t";
      if (parentBarFlag) {
        setItemOptions(DEFAULT_ADVANCE_ITEM_OPTIONS.filter((opt) => opt.name !== "SCHEME"));
      } else {
        setItemOptions(DEFAULT_ADVANCE_ITEM_OPTIONS);
      }
    }, [headerBarFlag]);

    React.useEffect(() => {
      loadAdvanceItemOptions();
    }, [loadAdvanceItemOptions]);

    React.useEffect(() => {
      if (!isFormEnabled) {
        resetEntryForm();
        setInternalGrid([]);
      }
    }, [isFormEnabled, resetEntryForm]);

    const handleAdvanceNameEnter = (e, isBlur = false) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      console.log("handleAdvanceNameEnter: Enter pressed. isBlur =", isBlur, "value =", nameFilter, "isFormEnabled =", isFormEnabled);
      if (!isFormEnabled) {
        console.log("handleAdvanceNameEnter: form is disabled, returning");
        return;
      }

      const typed = nameFilter.trim().toUpperCase();
      if (!typed) {
        console.log("handleAdvanceNameEnter: empty value path. isBlur =", isBlur);
        if (!isBlur) {
          console.log("handleAdvanceNameEnter: triggering advance lookup popup");
          openAdvanceItemLookup();
        }
        return;
      }

      // Match exactly or by prefix (e.g. typing O selects ORDER, S selects SCHEME)
      const match = itemOptions.find(
        (opt) =>
          opt.name.toUpperCase() === typed ||
          opt.name.toUpperCase().startsWith(typed),
      );
      if (match) {
        setNameFilter(match.name);
        if (!isBlur) {
          setTimeout(() => advNoFilterRef.current?.focus(), 50);
        }
        return;
      }

      if (!isBlur) {
        openAdvanceItemLookup();
      }
    };

    const handleAdvNoEnter = async (isBlur = false) => {
      if (isValidatingAdvNoRef.current) return;
      isValidatingAdvNoRef.current = true;
      try {
        const advType = nameFilter.trim().toUpperCase();
        const advNo = advNoFilter.trim().toUpperCase();

        if (!advNo) return;

        const isOrderType = advType === "ORDER" || advType === "ORDER SPLIT";
        const isSchemeType = advType === "SCHEME";
        if (!isOrderType && !isSchemeType) {
          showPopupMessage("Please choose a valid Advance Name.", "Validation", "info", nameFilterRef.current);
          return;
        }

        const safeAdvNo = escapeSqlLiteral(advNo);
        const estNo = String(initialData?.estNo || "NEW").trim() || "NEW";
        const isNewEstimate = estNo.toUpperCase() === "NEW";
        const safeEstNo = escapeSqlLiteral(estNo);
        const safeAdvType = escapeSqlLiteral(advType);

        const isDuplicateInTable = (externalGrid || []).some(
          (row, idx) =>
            idx !== editIndex &&
            String(row.advNo || "").trim() === String(advNo).trim(),
        );
        if (isDuplicateInTable) {
          showPopupMessage(
            advType === "SCHEME"
              ? "Scheme ID Already exists in the table!"
              : "Order Invoice Number Already exists in the table!",
            "Warning",
            "info",
            nameFilterRef.current
          );
          setNameFilter("");
          setAdvNoFilter("");
          setAmountFilter("");
          setMaxAvailableAmount(0);
          return;
        }

        try {
          if (isSchemeType) {
            setCurrentOrderYear("");
            setCurrentBarFlag("f");
          }

          if (isOrderType) {
            const sqlOrdmstr = `SELECT order_status FROM OrderMaster WHERE invoiceno='${safeAdvNo}' LIMIT 1`;
            const resOrdmstr = await fetchList(sqlOrdmstr);
            const metaOrder = resOrdmstr?.data?.[0];
            if (!metaOrder) {
              setAdvNoFilter("");
              showPopupMessage("Please select the Advance Item first", "Check", "info", nameFilterRef.current);
              return;
            }
            const rawStatus = getVal(metaOrder, "order_status");
            const statusStr = String(rawStatus ?? "").trim().toLowerCase();
            const isClosed = statusStr === "true" || statusStr === "t" || statusStr === "1" || statusStr === "c" || statusStr === "closed";
            if (isClosed) {
              setAdvNoFilter("");
              showPopupMessage("Please Check Order Status", "Warning Message", "warning", nameFilterRef.current);
              return;
            }
          }

          const sqlAdvEst = isNewEstimate
            ? `SELECT adv_no FROM saleadvest WHERE adv_no='${safeAdvNo}' AND adv_name='${safeAdvType}'`
            : `SELECT adv_no FROM saleadvest WHERE adv_no='${safeAdvNo}' AND est_no!='${safeEstNo}'`;
          const resAdvEst = await fetchList(sqlAdvEst);
          const advRows = asRows(resAdvEst);

          if (advRows.length > 0) {
            if (advType === "SCHEME") {
              showPopupMessage("Scheme ID Already Exists in Sales", "Warning", "info", nameFilterRef.current);
              setNameFilter("");
              setAdvNoFilter("");
            } else {
              showPopupMessage("Order Number Already Exists", "Validation", "info", nameFilterRef.current);
              setAdvNoFilter("");
            }
            return;
          }

          if (isOrderType) {
            const sqlRatefix = `SELECT ratefix FROM OrderMaster WHERE invoiceno='${safeAdvNo}' AND ratefix='Y'`;
            const resRatefix = await fetchList(sqlRatefix);
            const isBlocked = asRows(resRatefix).length > 0;

            if (isBlocked) {
              if (
                !window.confirm("This Entry Blocked. Do you want to continue?")
              ) {
                setTimeout(() => advNoFilterRef.current?.focus(), 50);
                return;
              }
              const pass = window.prompt("Enter Manager Password (pass2):");
              if (pass !== "pass2") {
                showPopupMessage("Invalid Password", "Security", "info", advNoFilterRef.current);
                setAdvNoFilter("");
                return;
              }
            }
          }

          if (!isOrderType && !isSchemeType) {
            setCurrentOrderYear("");
            setCurrentBarFlag("f");
            if (!isBlur) setTimeout(() => amountFilterRef.current?.focus(), 200);
            return;
          }

          if (isOrderType) {
            const parentBarFlag = headerBarFlag === true || String(headerBarFlag).toLowerCase() === "true" || String(headerBarFlag).toLowerCase() === "t";
            const bflag = parentBarFlag ? "t" : "f";

            // Fetch the order (no barflag/order_status filter in SQL — validated above)
            const sqlMeta = `SELECT barflag, order_year FROM OrderMaster WHERE invoiceno='${safeAdvNo}' LIMIT 1`;
            const resMeta = await fetchList(sqlMeta);
            const meta = resMeta?.data?.[0];

            if (!meta) {
              showPopupMessage(
                `Order "${advNo}" not found.`,
                "Validation",
                "error",
                advNoFilterRef.current
              );
              setAdvNoFilter("");
              return;
            }

            // Barflag mismatch check: only enforce when Barcode checkbox is OFF and type is ORDER (not ORDER SPLIT)
            if (advType === "ORDER" && !parentBarFlag) {
              const orderBarFlag = String(getVal(meta, "barflag") || "f").trim().toLowerCase();
              if (orderBarFlag !== "f") {
                showPopupMessage(
                  `Cannot use this order. "${advNo}" is a Barcode Order, but the current estimate is a Non-Barcode Estimate.`,
                  "Barcode Mismatch",
                  "error",
                  advNoFilterRef.current
                );
                setAdvNoFilter("");
                return;
              }
            }
            // When Barcode checkbox is ON — no mismatch check, accept any order

            const barFlagVal = String(getVal(meta, "barflag") || bflag).trim() || bflag;
            const orderYearVal = String(
              getVal(meta, "order_year", "orderyear") || "",
            );

            setCurrentBarFlag(barFlagVal);
            setCurrentOrderYear(orderYearVal);

            const sqlTotal = `SELECT COALESCE(SUM(cash_amount + credit_amount), 0) AS total FROM ordertrans WHERE invoiceno='${safeAdvNo}'`;
            const resTotal = await fetchList(sqlTotal);
            const totalPaid = toNum(getVal(resTotal?.data?.[0], "total"));

            const sqlAdjusted =
              estNo === "NEW"
                ? `SELECT COALESCE(SUM(adv_amt), 0) AS used FROM saleadvest WHERE adv_no='${safeAdvNo}' AND adv_name='${safeAdvType}'`
                : `SELECT COALESCE(SUM(adv_amt), 0) AS used FROM saleadvest WHERE adv_no='${safeAdvNo}' AND adv_name='${safeAdvType}' AND est_no!='${safeEstNo}'`;
            const resAdjusted = await fetchList(sqlAdjusted);
            const dbUsed = toNum(getVal(resAdjusted?.data?.[0], "used"));

            const localUsed = (externalGrid || [])
              .filter(
                (row, idx) =>
                  idx !== editIndex &&
                  String(row.advNo) === String(safeAdvNo) &&
                  String(row.advName).toUpperCase() ===
                    String(safeAdvType).toUpperCase(),
              )
              .reduce((sum, row) => sum + toNum(row.advAmt), 0);

            const sqlOrderCash = `SELECT COALESCE(SUM(cash_amount), 0) AS order_cash FROM ordertrans WHERE invoiceno='${safeAdvNo}'`;
            const resOrderCash = await fetchList(sqlOrderCash);
            const orderCashPaid = toNum(getVal(resOrderCash?.data?.[0], "order_cash"));

            const totalUsed = dbUsed + localUsed;
            const remainingBalance = Math.max(totalPaid - totalUsed, 0);
            const finalOrderCash = Math.min(orderCashPaid, remainingBalance);

            // MAX RECEIVABLE CASH Limit Check for ORDER (using in-memory cache)
            const discountRules = await getCachedSetDiscount(fetchList);
            const maxLimit = getRuleFromCache(discountRules, "MAX RECEIVABLE CASH").amount;
            const isCashCheckEnabled = getRuleFromCache(discountRules, "CASH LIMIT CHECK").flag;

            const currentGridCash = (externalGrid || []).reduce(
              (sum, r) => sum + toNum(r.advAmt ?? r.cashAmt),
              0
            );

            if (advType === "ORDER" && !parentBarFlag && maxLimit > 0 && currentGridCash + finalOrderCash >= maxLimit) {
              showPopupMessage(
                `Cash Amount Limit Exceeded ${fmtAmt(maxLimit)}`,
                "Warning"
              );

              if (isCashCheckEnabled) {
                setAdvNoFilter("");
                setAmountFilter("");
                setCashAmountFilter("");
                setSchemeBonus("");
                setSchemeDesc("");
                setSchemeGrossWt("");
                setTimeout(() => advNoFilterRef.current?.focus(), 50);
                return;
              }
            }

            if (advType === "ORDER SPLIT") {
              setAmountFilter(fmtAmt(remainingBalance));
              setCashAmountFilter("");
              setSchemeDesc(orderYearVal);
              setSchemeBonus("");
              setSchemeGrossWt("");
              setMaxAvailableAmount(remainingBalance);
            } else {
              setAmountFilter(fmtAmt(remainingBalance));
              setCashAmountFilter(fmtAmt(finalOrderCash));
              setSchemeDesc(orderYearVal);
              setMaxAvailableAmount(remainingBalance);
            }

            const sqlDetails = `
              SELECT om.cust_name, om.cust_addr1, om.cust_addr2, om.salesman_code,
                    SUM(ot.cash_amount + ot.credit_amount) AS total_paid,
                    om.order_date, om.gold_rate, om.custid, om.cust_addr3, om.phone,
                    om.est_pin, om.panno, om.gstno, om.aadharno, om.agentcode,
                    om.offerper, om.extraoffper
              FROM OrderMaster om, OrderTrans ot
              WHERE om.order_no = ot.order_no
                AND om.order_year = ot.order_year
                AND om.invoiceno = '${safeAdvNo}'
              GROUP BY om.cust_name, om.cust_addr1, om.cust_addr2, om.salesman_code,
                      om.order_date, om.gold_rate, om.custid, om.cust_addr3, om.phone,
                      om.est_pin, om.panno, om.gstno, om.aadharno, om.agentcode,
                      om.offerper, om.extraoffper
            `;

            const resDetails = await fetchList(sqlDetails);
            if (Array.isArray(resDetails?.data) && resDetails.data.length > 0) {
              const d = resDetails.data[0];
              const syncData = {
                custId: getVal(d, "custid", "cust_id", "custcode"),
                custName: getVal(d, "cust_name", "custname"),
                address1: getVal(d, "cust_addr1", "custaddr1", "address1"),
                address2: getVal(d, "cust_addr2", "custaddr2", "address2"),
                place: getVal(d, "cust_addr3", "custaddr3", "place", "city"),
                phone: getVal(d, "phone", "phoneno", "mobile"),
                pincode: String(getVal(d, "est_pin", "pincode", "pin") || ""),
                pan: getVal(d, "panno", "pan_no", "pan"),
                gstNo: getVal(d, "gstno", "gst_no", "gst"),
                aadhar: String(
                  getVal(d, "aadharno", "aadhar_no", "aadhar") || "",
                ),
                careOf: getVal(d, "agentcode", "careof"),
                salesman: getVal(d, "salesman_code", "salesman"),
                gRate: fmtAmt(getVal(d, "gold_rate", "goldrate", "grate")),
                advOrderYear: orderYearVal,
                rateFix: true,
              };

              const syncFn = onCustomerSync || initialData?.onCustomerSync;
              if (typeof syncFn === "function") {
                syncFn(syncData);
              }

              const offer = toNum(getVal(d, "offerper", "offer_per", "offer"));
              const extraOffer = toNum(
                getVal(d, "extraoffper", "extra_offer_per", "extraoffer"),
              );
              const goldRate = toNum(
                getVal(d, "gold_rate", "goldrate", "grate") || 1,
              );
              const recWt = goldRate > 0 ? remainingBalance / goldRate : 0;

              if (offer > 0) {
                const purchasableAmt = (remainingBalance / (100 - offer)) * 100;
                showPopupMessage(
                  `Total Order Amount: ${fmtAmt(remainingBalance)}\nOffer: ${offer}%\nYou Can Purchase For: ${fmtAmt(purchasableAmt)}\nTotal Receivable Weight: ${fmtWt(recWt)}`,
                  "Order Offer Info",
                );
              } else if (extraOffer > 0) {
                const purchasableAmt =
                  remainingBalance + (remainingBalance * extraOffer) / 100;
                showPopupMessage(
                  `Total Order Amount: ${fmtAmt(remainingBalance)}\nExtra Offer: ${extraOffer}%\nYou Can Purchase For: ${fmtAmt(purchasableAmt)}\nTotal Receivable Weight: ${fmtWt(recWt)}`,
                  "Order Offer Info",
                );
              }
            }
            return remainingBalance;
          } else if (isSchemeType) {
  // 1. Barcode Mode Check
  const parentBarFlag =
    headerBarFlag === true ||
    String(headerBarFlag).toLowerCase() === "true" ||
    String(headerBarFlag).toLowerCase() === "t";
  if (parentBarFlag) {
    showPopupMessage(
      "This Entry Is Barcode",
      "Error",
      "error",
      advNoFilterRef.current
    );
    setAdvNoFilter("");
    return;
  }

  // 2. Transfer Check
  const sqlTransfer = `SELECT * FROM order_shop_transfer WHERE custid='${safeAdvNo}'`;
  const resTransfer = await fetchList(sqlTransfer);
  if (Array.isArray(resTransfer?.data) && resTransfer.data.length > 0) {
    showPopupMessage("CustID is Already Transferred", "Warning");
    setAdvNoFilter("");
    setTimeout(() => advNoFilterRef.current?.focus(), 50);
    return;
  }

  try {
    // 3. Search Scheme Settlement Data
    const schemeQuery = `kurymaster/search-by-custid-and-settlement?custid=${advNo}&shopcode=${shopCode}&settlement=true`;
    const resSettle = await axiosInstance.get("api/query/getdata", {
      headers: { api: schemeQuery },
    });

    let settleData = [];
    let rawData = resSettle.data;

    if (typeof rawData === "string") {
      try {
        rawData = JSON.parse(rawData);
      } catch {
        rawData = null;
      }
    }

    if (Array.isArray(rawData)) {
      settleData = rawData;
    } else if (rawData && typeof rawData === "object" && !rawData.message) {
      settleData = [rawData];
    }

    if (settleData.length === 0) {
      showPopupMessage("Invalid Scheme ID or not settled", "Warning");
      setAdvNoFilter("");
      return;
    }

    // 4. Fetch Total Gross Gold Weight
    let grossWt = "0.000";
    try {
      const wtQuery = `kurytran/totalGdwtByCustId/${advNo}`;
      const resWt = await axiosInstance.get("api/query/getdata", {
        headers: { api: wtQuery },
      });
      const parsedGrossWt = extractFirstNumeric(resWt.data);
      grossWt = Number(parsedGrossWt ?? 0).toFixed(3);
    } catch (e) {
      console.warn("Failed to fetch gross weight:", e);
    }

    // 5. Fetch Scheme Total Cash Amount
    let cashAmt = 0;
    try {
      const cashQuery = `kurytran/find-by-custid/${advNo}`;
      const resCash = await axiosInstance.get("api/query/getdata", {
        headers: { api: cashQuery },
      });
      let rawCashData = resCash.data;
      if (typeof rawCashData === "string") {
        try {
          rawCashData = JSON.parse(rawCashData);
        } catch {
          rawCashData = null;
        }
      }

      if (Array.isArray(rawCashData)) {
        cashAmt = rawCashData.reduce((sum, rec) => sum + toNum(rec?.cash ?? 0), 0);
      } else if (rawCashData && typeof rawCashData === "object") {
        cashAmt = toNum(rawCashData?.cash ?? 0);
      }

      if (cashAmt === 0 && rawCashData) {
        cashAmt = toNum(extractFirstNumeric(rawCashData));
      }

    } catch (e) {
      console.warn("Failed to fetch scheme cash amount:", e);
    }

    for (const item of settleData) {
      // 6. Validation Guard 1: Settled Date Check
      const dbSettleDate = String(getVal(item, "settledate") || "").split("T")[0];
      const currentBillDate = String(initialData?.estDate || "").split("T")[0];
      if (dbSettleDate !== currentBillDate) {
        showPopupMessage(
          `Please Check Scheme Settled Date (Scheme: ${dbSettleDate}, Bill: ${currentBillDate})`,
          "Invalid Selection"
        );
        setAdvNoFilter("");
        setAmountFilter("0.00");
        return;
      }

      // 7. Validation Guard 2: Already Settled Check
      const sqlUsed = `SELECT adv_no FROM saleadvdetails WHERE adv_no='${safeAdvNo}'`;
      const resUsed = await fetchList(sqlUsed);
      if (Array.isArray(resUsed?.data) && resUsed.data.length > 0) {
        showPopupMessage("Scheme is Settled", "Invalid Selection");
        setAdvNoFilter("");
        setAmountFilter("0.00");
        return;
      }

      // 8. Validation Guard 3: Order Credit Conflict Check
      const sqlAdvCode = `SELECT billno FROM advancelist WHERE name='SCHEME' LIMIT 1`;
      const resAdvCode = await fetchList(sqlAdvCode);
      const advCodeVal = getVal(resAdvCode?.data?.[0], "billno") || "";

      const sqlCredit = `SELECT est_no FROM ord_credit WHERE code='${escapeSqlLiteral(advCodeVal)}' AND idno='${safeAdvNo}'`;
      const resCredit = await fetchList(sqlCredit);
      if (Array.isArray(resCredit?.data) && resCredit.data.length > 0) {
        const estNoConflict = getVal(resCredit.data[0], "est_no");
        showPopupMessage(
          `Scheme ID Already Exist in Order Estimate Number : ${estNoConflict}`,
          "Warning"
        );
        setAdvNoFilter("");
        return;
      }

      // 9. BARCODEDATE LIMIT Check
      let redeemableCash = cashAmt;
      if (redeemableCash === 0 && item) {
        redeemableCash = toNum(getVal(item, "settlementamt"));
      }
      const discountRulesScheme = await getCachedSetDiscount(fetchList);
      const isBarcodeLimitEnabled = getRuleFromCache(discountRulesScheme, "BARCODEDATE LIMIT").flag;
      if (isBarcodeLimitEnabled) {
        const sqlBarcodeDate = `SELECT value FROM company WHERE key='barcodedate'`;
        const resBarcodeDate = await fetchList(sqlBarcodeDate);
        const barcodeDateStr = getVal(resBarcodeDate?.data?.[0], "value");

        if (item.date && barcodeDateStr) {
          const schemeDt = new Date(item.date);
          const [d, m, y] = barcodeDateStr.split("-");
          const barcodeDt = new Date(`${y}-${m}-${d}`);

          if (schemeDt < barcodeDt) {
            redeemableCash = 0.0;
          }
        }
      }

       // 9.5. Check Scheme Bonus Amount
      const bonusAmount = toNum(getVal(item, "bonus"));

      if (bonusAmount === 0) {
        showPopupMessage(
          "There is NO Bonus Amount",
          "Warning"
        );
      }

      // 10. MAX RECEIVABLE CASH Limit Check
      const maxLimitScheme = getRuleFromCache(discountRulesScheme, "MAX RECEIVABLE CASH").amount;
      const isCashCheckEnabledScheme = getRuleFromCache(discountRulesScheme, "CASH LIMIT CHECK").flag;

      const currentGridCash = (externalGrid || []).reduce(
        (sum, r) => sum + toNum(r.advAmt ?? r.cashAmt),
        0
      );

      if (!parentBarFlag && maxLimitScheme > 0 && currentGridCash + redeemableCash >= maxLimitScheme) {
        showPopupMessage(
          `Cash Amount Limit Exceeded ${fmtAmt(maxLimitScheme)}`,
          "Warning"
        );

        if (isCashCheckEnabledScheme) {
          setAdvNoFilter("");
          setAmountFilter("");
          setCashAmountFilter("");
          setSchemeBonus("");
          setSchemeDesc("");
          setSchemeGrossWt("");
          setTimeout(() => advNoFilterRef.current?.focus(), 50);
          return;
        }
      }

      // 11. Populate Customer Header & CRM Data
      const crmCustId = getVal(item, "crmcustid");
      let crmGst = "", crmPan = "", crmAadhaar = "";
      if (crmCustId) {
        try {
          const crmRes = await axiosInstance.get(
            `api/query/getdata`,
            { headers: { api: `crm/find-by-custid?custid=${crmCustId}` } }
          );
          const crmObj = crmRes?.data;
          crmGst = getVal(crmObj, "gstin");
          crmPan = getVal(crmObj, "pan");
          crmAadhaar = getVal(crmObj, "aadharno");
        } catch (e) {
          console.warn("CRM lookup failed:", e);
        }
      }

      const syncData = {
        custId: crmCustId,
        custName: getVal(item, "aplname"),
        address1: getVal(item, "apladd1"),
        address2: getVal(item, "apladd2"),
        place: getVal(item, "apladd3"),
        pincode: getVal(item, "aplpincode"),
        phone: getVal(item, "aplmobile"),
        gRate: fmtAmt(getVal(item, "avgrate")),
        pan: crmPan || getVal(item, "pan"),
        gstNo: crmGst || getVal(item, "gstin"),
        aadhar: crmAadhaar || getVal(item, "aadharno"),
        schemeBonus: getVal(item, "bonus"),
        schemeDesc: getVal(item, "schemename"),
        schemeGrossWt: grossWt,
      };

      // 12. Update State & Dispatch Customer Sync
      setAmountFilter(fmtAmt(getVal(item, "settlementamt")));
      setCashAmountFilter(fmtAmt(redeemableCash));
      setMaxAvailableAmount(toNum(getVal(item, "settlementamt")));
      setSchemeBonus(String(getVal(item, "bonus") || ""));
      setSchemeDesc(String(getVal(item, "schemename") || ""));
      setSchemeGrossWt(String(grossWt || ""));

      const syncFn = onCustomerSync || initialData?.onCustomerSync;
      if (typeof syncFn === "function") syncFn(syncData);
      return toNum(getVal(item, "settlementamt"));
    }
  } catch (err) {
    console.error("Scheme validation error:", err);
    showPopupMessage("Error loading scheme details.", "Error");
  }
}


          if (!isBlur) setTimeout(() => addButtonRef.current?.focus(), 200);
        } catch (error) {
          console.error("Advance validation failed:", error);
          showPopupMessage("Error loading advance details.", "Error");
          setTimeout(() => advNoFilterRef.current?.focus(), 50);
        }
      } finally {
        isValidatingAdvNoRef.current = false;
      }
    };

    const handleAmountEnter = async () => {
      const advType = nameFilter.trim().toUpperCase();
      const advNo = advNoFilter.trim().toUpperCase();

      if (!advType || !advNo) {
        showPopupMessage(
          "Empty field detected",
          "Empty Field",
          "error",
          nameFilterRef.current
        );
        return;
      }

      let amt = toNum(amountFilter);

      // If ADV NO is entered but details haven't been fetched yet (e.g. user clicked + directly),
      // auto-fetch advance details first and use the returned balance directly in memory
      if (!amountFilter || amt <= 0) {
        const fetchedBalance = await handleAdvNoEnter(false);
        if (fetchedBalance !== null && fetchedBalance !== undefined && toNum(fetchedBalance) > 0) {
          amt = toNum(fetchedBalance);
        } else {
          amt = toNum(amountFilter);
        }
      }

      if (amt <= 0) {
        return;
      }

      const safeAdvNo = escapeSqlLiteral(advNo);
      const safeAdvType = escapeSqlLiteral(advType);
      const estNo = String(initialData?.estNo || "NEW").trim() || "NEW";
      const isNewEstimate = estNo.toUpperCase() === "NEW";
      const safeEstNo = escapeSqlLiteral(estNo);
      const isSameAsEditingRow =
        !!editContext &&
        String(editContext.advNo || "")
          .trim()
          .toUpperCase() === advNo &&
        String(editContext.advName || "")
          .trim()
          .toUpperCase() === advType;

      const isDuplicateInTable =
        !isSameAsEditingRow &&
        (externalGrid || []).some(
          (row, idx) =>
            idx !== editIndex &&
            String(row.advNo || "").trim() === String(advNo).trim(),
        );
      if (isDuplicateInTable) {
        nameFilterRef.current?.focus();
        showPopupMessage(
          advType === "SCHEME"
            ? "Scheme ID Already exists in the table!"
            : "Order Invoice Number Already exists in the table!",
          "Warning",
        );
        setNameFilter("");
        setAdvNoFilter("");
        setAmountFilter("");
        setMaxAvailableAmount(0);
        setTimeout(() => nameFilterRef.current?.focus(), 50);
        return;
      }

      try {
        if (!isSameAsEditingRow) {
          const sqlAdvEst = isNewEstimate
            ? `SELECT adv_no FROM saleadvest WHERE adv_no='${safeAdvNo}' AND adv_name='${safeAdvType}'`
            : `SELECT adv_no FROM saleadvest WHERE adv_no='${safeAdvNo}' AND est_no!='${safeEstNo}'`;
          const resAdvEst = await fetchList(sqlAdvEst);
          const advRows = asRows(resAdvEst);

          if (advRows.length > 0) {
            if (advType === "SCHEME") {
              nameFilterRef.current?.focus();
              showPopupMessage("Scheme ID Already Exists in Sales", "Warning");
              setNameFilter("");
              setAdvNoFilter("");
              setTimeout(() => nameFilterRef.current?.focus(), 50);
            } else {
              nameFilterRef.current?.focus();
              showPopupMessage("Order Number Already Exists", "Validation");
              setAdvNoFilter("");
              setTimeout(() => nameFilterRef.current?.focus(), 50);
            }
            return;
          }
        }
      } catch (e) {
        console.error("DB duplicate check failed in handleAmountEnter", e);
      }

      if (advType === "ORDER SPLIT") {
        if (amt > maxAvailableAmount) {
          showPopupMessage(
            "Enter Less Amount",
            "Warning",
            "warning",
            amountFilterRef.current
          );
          return;
        } else if (Math.abs(amt - maxAvailableAmount) < 0.01) {
          showPopupMessage(
            " Total Order Amount Not Allowed in Order Split ",
            "Warning",
            "warning",
            amountFilterRef.current
          );
          setTimeout(() => amountFilterRef.current?.focus(), 50);
          return;
        }
      }

      let orderYearForRow = String(currentOrderYear || "").trim();
      let barFlagForRow = String(currentBarFlag || "f").trim() || "f";
      const isOrderType = advType === "ORDER" || advType === "ORDER SPLIT";
      if (isOrderType && !orderYearForRow) {
        try {
          const sqlMetaFallback = `SELECT barflag, order_year FROM OrderMaster WHERE invoiceno='${safeAdvNo}' LIMIT 1`;
          const resMetaFallback = await fetchList(sqlMetaFallback);
          const metaFallback = asRows(resMetaFallback)[0] || {};
          orderYearForRow = String(
            getVal(metaFallback, "order_year", "orderyear") || "",
          ).trim();
          barFlagForRow =
            String(getVal(metaFallback, "barflag") || barFlagForRow).trim() ||
            "f";
          setCurrentOrderYear(orderYearForRow);
          setCurrentBarFlag(barFlagForRow);
        } catch {
          // ignore error
        }
      }

      let schemeGrossWtOut = String(schemeGrossWt || "").trim();
      if (
        advType === "SCHEME" &&
        (!schemeGrossWtOut || toNum(schemeGrossWtOut) === 0)
      ) {
        try {
          const wtQuery = `kurytran/totalGdwtByCustId/${advNo}`;
          const resWt = await axiosInstance.get("api/query/getdata", {
            headers: { api: wtQuery },
          });
          const parsedGrossWt = extractFirstNumeric(resWt.data);
          schemeGrossWtOut = Number(parsedGrossWt ?? 0).toFixed(3);
          setSchemeGrossWt(schemeGrossWtOut);
        } catch {
          schemeGrossWtOut = String(schemeGrossWt || "0").trim() || "0";
        }
      }

      if (advType === "SCHEME" && toNum(schemeGrossWtOut) === 0) {
        const fallbackFromDesc = extractFirstNumeric(
          getVal(
            {
              schemeGrossWt,
              schemeDesc,
              amountFilter,
            },
            "schemeGrossWt",
            "grosswt",
            "totalgdwtbycustid",
            "totalgdwt",
            "gdwt",
          ),
        );
        if (fallbackFromDesc !== null && Number(fallbackFromDesc) > 0) {
          schemeGrossWtOut = Number(fallbackFromDesc).toFixed(6);
        }
      }

      if (advType === "SCHEME" && toNum(schemeGrossWtOut) === 0) {
        showPopupMessage(
          "Scheme gross weight not received from API. Please verify scheme ID.",
          "Warning",
        );
        setTimeout(() => advNoFilterRef.current?.focus(), 50);
        return;
      }

      // --- Barflag Mix Validation ---
      // Normalize any barflag value (boolean or string) to true/false
      const normalizeBarflag = (val) => {
        if (typeof val === "boolean") return val;
        const s = String(val ?? "f").trim().toLowerCase();
        return s === "t" || s === "true" || s === "y" || s === "1";
      };

      const incomingBarflag = normalizeBarflag(barFlagForRow);
      const parentBarFlag = normalizeBarflag(headerBarFlag);

      if (!parentBarFlag && incomingBarflag !== parentBarFlag) {
        const headerType = parentBarFlag ? "Barcode" : "Non-Barcode";
        const incomingType = incomingBarflag ? "Barcode" : "Non-Barcode";
        showPopupMessage(
          `Cannot add ${incomingType} advance. The estimate is configured as ${headerType}.`,
          "Validation",
          "error",
          nameFilterRef.current
        );
        setNameFilter("");
        setAdvNoFilter("");
        setAmountFilter("");
        setMaxAvailableAmount(0);
        setTimeout(() => nameFilterRef.current?.focus(), 50);
        return;
      }

      // Find existing rows (excluding the one currently being edited)
      const existingRows = (externalGrid || []).filter((_, idx) => idx !== editIndex);
      const conflictRow = existingRows.find(
        (row) => normalizeBarflag(row.barflag) !== incomingBarflag
      );

      if (conflictRow) {
        const existingType = normalizeBarflag(conflictRow.barflag)
          ? "Barcode"
          : "Non-Barcode";
        const incomingType = incomingBarflag ? "Barcode" : "Non-Barcode";
        showPopupMessage(
          `Cannot mix item types. Table already has ${existingType} items. Current item is a ${incomingType} item.`,
          "Validation",
          "error",
          nameFilterRef.current
        );
        setNameFilter("");
        setAdvNoFilter("");
        setAmountFilter("");
        setMaxAvailableAmount(0);
        setTimeout(() => nameFilterRef.current?.focus(), 50);
        return;
      }
      // --- End Barflag Mix Validation ---

      const finalCash = cashAmountFilter !== "" ? toNum(cashAmountFilter) : amt;

      // MAX RECEIVABLE CASH Limit Check on Row Submission (using in-memory cache)
      const discountRulesSubmit = await getCachedSetDiscount(fetchList);
      const maxLimit = getRuleFromCache(discountRulesSubmit, "MAX RECEIVABLE CASH").amount;
      const isCashCheckEnabled = getRuleFromCache(discountRulesSubmit, "CASH LIMIT CHECK").flag;

      const currentGridCash = existingRows.reduce(
        (sum, r) => sum + toNum(r.advAmt ?? r.cashAmt),
        0
      );

      const isBarcodeMode = headerBarFlag === true || String(headerBarFlag).toLowerCase() === "true" || String(headerBarFlag).toLowerCase() === "t" || barFlagForRow === "t" || barFlagForRow === "true";
      if (advType === "ORDER" && !isBarcodeMode && maxLimit > 0 && currentGridCash + finalCash >= maxLimit) {
        showPopupMessage(
          `Cash Amount Limit Exceeded ${fmtAmt(maxLimit)}`,
          "Warning"
        );
        if (isCashCheckEnabled) {
          setNameFilter("");
          setAdvNoFilter("");
          setAmountFilter("");
          setCashAmountFilter("");
          setSchemeBonus("");
          setSchemeDesc("");
          setSchemeGrossWt("");
          setTimeout(() => nameFilterRef.current?.focus(), 50);
          return;
        }
      }

      const isOrderSplitRow = advType === "ORDER SPLIT";
      const newRow = {
        slNo: editIndex >= 0 ? editIndex + 1 : (externalGrid?.length || 0) + 1,
        advName: advType,
        advNo,
        advOrderYear: orderYearForRow,
        barflag: barFlagForRow,
        advAmt: isOrderSplitRow ? "0.00" : fmtAmt(finalCash),
        cashAmt: isOrderSplitRow ? "0.00" : fmtAmt(finalCash),
        balAmt: fmtAmt(amt),
        schemeBonus: isOrderSplitRow ? "" : schemeBonus,
        schemeDesc: schemeDesc || orderYearForRow || "",
        schemeGrossWt: isOrderSplitRow ? "0" : (schemeGrossWtOut || "0"),
      };

      if (typeof setExternalGrid === "function") {
        setExternalGrid((prev) => {
          const rows = [...(prev || [])];
          if (editIndex >= 0 && editIndex < rows.length) {
            rows[editIndex] = { ...rows[editIndex], ...newRow };
            return rows.map((r, i) => ({ ...r, slNo: i + 1 }));
          }
          rows.push(newRow);
          return rows.map((r, i) => ({ ...r, slNo: i + 1 }));
        });
      }

      resetEntryForm();
      setTimeout(() => nameFilterRef.current?.focus(), 50);

      if (typeof onFinish === "function") {
        onFinish();
      }
    };

    const renderContent = () => (
      <>
        <div
          className={`w-full space-y-3 animate-fade-in-up ${isEmbedded ? "h-full flex flex-col" : ""}`}
        >
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 px-1">
            <div className="w-6 h-6 rounded-md bg-cyan-500/10 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
              Advance Details
            </h3>
          </div>
          <div
            className={`app-card overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 ${isEmbedded ? "h-[155px] flex flex-col min-h-0" : ""}`}
          >
            <div
              className={`overflow-x-auto ${isEmbedded ? "flex-1 overflow-y-auto custom-scrollbar" : ""}`}
            >
              <table className="w-full text-sm border-collapse min-w-[740px]">
                <colgroup>
                  <col style={{ width: '30px' }} />
                  <col style={{ width: '110px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '90px' }} />
                  <col style={{ width: '80px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '75px' }} />
                  <col style={{ width: '95px' }} />
                  <col style={{ width: '35px' }} />
                </colgroup>
                <thead>
                  <tr className="modern-table-header">
                    {["Slno", "Name", "Adv No", "Amount", "Oth.Amt", "Description", "Gd.Wt", "Cash.Amt", ""].map((h) => (
                      <th
                        key={h}
                        className="p-2 border-r border-white/10 dark:border-slate-800/50 text-white font-black uppercase tracking-tighter text-center whitespace-nowrap text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <td className="p-1 border-r border-slate-200 dark:border-slate-800 text-center text-slate-400 font-bold text-xs">
                      #
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                      <div className="relative">
                        <input
                          ref={nameFilterRef}
                          type="text"
                          disabled={!isFormEnabled}
                          value={nameFilter}
                          onChange={(e) =>
                            setNameFilter(e.target.value)
                          }
                          onKeyDown={handleAdvanceNameEnter}
                          onBlur={(e) => {
                            if (nameFilter.trim() !== "") {
                              handleAdvanceNameEnter(
                                {
                                  ...e,
                                  key: "Enter",
                                  preventDefault: () => {},
                                },
                                true,
                              );
                            }
                          }}
                          onDoubleClick={() => {
                            if (!isFormEnabled) return;
                            openAdvanceItemLookup();
                          }}
                          className={`uppercase w-full h-7 rounded border border-slate-300 dark:border-slate-600 pl-1 pr-5 text-xs font-semibold outline-none shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-slate-700 ${!isFormEnabled ? "opacity-60 cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/50" : ""}`}
                          placeholder="NAME"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          disabled={!isFormEnabled}
                          className="absolute right-0.5 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          onClick={openAdvanceItemLookup}
                          title="Search Advance Type (F5)"
                        >
                          <Search className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                      <input
                        ref={advNoFilterRef}
                        type="text"
                        disabled={!isFormEnabled}
                        value={advNoFilter}
                        onChange={(e) =>
                          setAdvNoFilter(e.target.value)
                        }
                        onKeyDown={async (e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          if (!isFormEnabled) return;
                          await handleAdvNoEnter(false);
                        }}

                        className={`uppercase w-full h-7 rounded border border-slate-300 dark:border-slate-600 px-1 text-xs font-semibold outline-none shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center focus:border-slate-700 ${!isFormEnabled ? "opacity-60 cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/50" : ""}`}
                        placeholder="ADV NO"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                      <input
                        ref={amountFilterRef}
                        type="text"
                        disabled={!isFormEnabled || !orderSplitEnabled}
                        readOnly={nameFilter.toUpperCase() === "ORDER"}
                        value={amountFilter}
                        onChange={(e) => setAmountFilter(limitDecimals(e.target.value, 2))}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          if (!isFormEnabled) return;
                          handleAmountEnter();
                        }}
                        className={`w-full h-7 rounded border border-slate-300 dark:border-slate-600 px-1 text-xs font-bold outline-none shadow-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-right focus:border-slate-700 ${!isFormEnabled ? "opacity-60 cursor-not-allowed" : ""}`}
                        placeholder="AMOUNT"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                      <input
                        type="text"
                        readOnly
                        disabled={!isFormEnabled}
                        value={fmtAmt(schemeBonus)}
                        className="w-full h-7 rounded border border-slate-200 dark:border-slate-700 px-1 text-xs font-bold bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-right outline-none cursor-not-allowed"
                        placeholder="OTH.AMT"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                      <input
                        type="text"
                        readOnly
                        disabled={!isFormEnabled}
                        value={schemeDesc}
                        className="w-full h-7 rounded border border-slate-200 dark:border-slate-700 px-1 text-xs bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 outline-none truncate cursor-not-allowed"
                        placeholder="DESCRIPTION"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                      <input
                        type="text"
                        readOnly
                        disabled={!isFormEnabled}
                        value={schemeGrossWt}
                        className="w-full h-7 rounded border border-slate-200 dark:border-slate-700 px-1 text-xs font-bold bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-right outline-none cursor-not-allowed"
                        placeholder="GD.WT"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-200 dark:border-slate-800">
                      <input
                        type="text"
                        readOnly
                        disabled={!isFormEnabled}
                        value={cashAmountFilter}
                        className="w-full h-7 rounded border border-slate-200 dark:border-slate-700 px-1 text-xs font-bold bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-right outline-none cursor-not-allowed"
                        placeholder="CASH.AMT"
                      />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        ref={addButtonRef}
                        type="button"
                        tabIndex={-1}
                        disabled={!isFormEnabled}
                        onClick={() => {
                          if (!isFormEnabled) return;
                          handleAmountEnter();
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed mx-auto"
                        title="Add advance row"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-slate-950 divide-y divide-slate-100 dark:divide-slate-900">
                  {advanceGrid.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className={
                          isEmbedded
                            ? "py-2 text-center text-[10px] text-slate-400 italic"
                            : "py-16 text-center"
                        }
                      >
                        {isEmbedded ? (
                          "No records"
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                            <User className="w-10 h-10 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">
                              No Advance Records
                            </p>
                            <p className="text-[10px]">
                              Load or create receipts to display rows here.
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    advanceGrid.map((row, idx) => (
                      <tr
                        key={`${row.advNo || "ADV"}-${idx}`}
                        className="hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors font-mono cursor-pointer select-none text-xs"
                        onDoubleClick={() => handleRowDoubleClick(idx)}
                        onClick={() => handleRowTap(idx)}
                        title="Double click to Delete"
                      >
                        <td className="p-1.5 border-r border-slate-100 dark:border-slate-900 text-center font-bold text-slate-500 dark:text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-1.5 border-r border-slate-100 dark:border-slate-900 font-sans truncate max-w-[130px] font-semibold text-slate-700 dark:text-slate-200">
                          {row.custName || row.advName || "-"}
                        </td>
                        <td className="p-1.5 border-r border-slate-100 dark:border-slate-900 text-center font-bold text-slate-700 dark:text-slate-200">
                          {row.advNo || "-"}
                        </td>
                        <td className="p-1.5 border-r border-slate-100 dark:border-slate-900 text-right text-slate-700 dark:text-slate-200 font-bold">
                          {fmtAmt(row.balAmt ?? row.amount ?? "0")}
                        </td>
                        <td className="p-1.5 border-r border-slate-100 dark:border-slate-900 text-right text-slate-700 dark:text-slate-200 font-bold">
                          {fmtAmt(row.schemeBonus ?? row.othAmt ?? "0")}
                        </td>
                        <td className="p-1.5 border-r border-slate-100 dark:border-slate-900 font-sans truncate max-w-[140px] text-slate-600 dark:text-slate-300">
                          {row.schemeDesc || row.description || "-"}
                        </td>
                        <td className="p-1.5 border-r border-slate-100 dark:border-slate-900 text-right text-slate-700 dark:text-slate-200 font-bold">
                          {fmtWt(row.schemeGrossWt ?? row.gdWt ?? "0")}
                        </td>
                        <td className="p-1.5 border-r border-slate-100 dark:border-slate-900 text-right text-slate-800 dark:text-slate-100 font-bold">
                          {fmtAmt(row.advAmt ?? row.cashAmt ?? "0")}
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteRowDirect(idx, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center mt-auto shrink-0">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  TotAdv.Cash:
                </span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                  {fmtAmt(totalAdvCash)}
                </span>
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-950 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Amount:
                </span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                  {fmtAmt(totalAdvanceAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
        {isActionModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      Advance Item
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                      Delete selected row?
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="btn-secondary bg-white hover:bg-rose-50 dark:hover:bg-rose-900/10 border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800/50 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 w-full"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    Remove Item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionModalOpen(false);
                      setClickedRowIndex(null);
                    }}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all active:scale-95 mt-2"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </>
    );

    if (isEmbedded) {
      return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col h-full">
          {renderContent()}
        </div>
      );
    }

    return (
      <ModulePageLayout
        title="Advance Management"
        navigate={navigate}
        backPath="/salesentry"
      >
        <div className="pb-20">{renderContent()}</div>
      </ModulePageLayout>
    );
  };

  export default React.memo(Advance);
