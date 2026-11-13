import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Plus, X, Loader2, Edit3, Trash2, Sliders, Search } from "lucide-react";
import ModulePaselecgeLayout from "../../layout/ModulePageLayout";
import { DynamicQueryService } from "../../../services/DynamicQueryApi";
import { SalesService } from "../../../services/SalesEntryApi";
import MessagePopup from "../../common/MessagePopup";
import { tableTypography } from "../../../utils/tableTypography";
import { limitDecimals } from "../../../utils/format";
import { useLookup, lookupConfigs } from "../../common/LookupContext";

const Purchase = ({
  isEmbedded = false,
  isFormEnabled = false,
  metalType = "G",
  shopcode = "",
  estNo = "New",
  estDate = "",
  salesNetWt = 0,
  barflag = false,
  externalGrid,
  setExternalGrid,
}) => {
  const navigate = useNavigate();
  const { showLookup } = useLookup();
  const [localNewMode, setLocalNewMode] = useState(false);
  const isNewMode = isEmbedded ? isFormEnabled : localNewMode;
  const setIsNewMode = isEmbedded ? () => {} : setLocalNewMode;
  const [isLoading, setIsLoading] = useState(false);
  const itemCodeRef = useRef(null);
  const qtyRef = useRef(null);
  const grossWtRef = useRef(null);
  const meltPerRef = useRef(null);
  const meltLossRef = useRef(null);
  const vaPerRef = useRef(null);
  const touchRef = useRef(null);
  const stnChgRef = useRef(null);
  const rateRef = useRef(null);
  const plusBtnRef = useRef(null);
  const vaAmtRef = useRef(null);
  const dcWtRef = useRef(null);
  const dCodeRef = useRef(null);
  const dNoRef = useRef(null);
  const [localGridData, setLocalGridData] = useState([]);
  const gridData = externalGrid || localGridData;
  const setGridData = setExternalGrid || setLocalGridData;

  const [ogCashRate, setOgCashRate] = useState(0);
  const [splitModal, setSplitModal] = useState({
    isOpen: false,
    weightDiff: 0,
  });
  const [isItemPopupOpen, setIsItemPopupOpen] = useState(false);
  const [purchaseItemsList, setPurchaseItemsList] = useState([]);
  // Track whether current row item was selected via popup (DETAILS dialog) vs typed/scanned directly
  const [itemFromPopup, setItemFromPopup] = useState(false);

  // Action Modal States
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [clickedRowIndex, setClickedRowIndex] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [lastTapIndex, setLastTapIndex] = useState(null);

  // Popup States
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupType, setPopupType] = useState("info");
  const [refToFocusAfterPopup, setRefToFocusAfterPopup] = useState(null);
  const [pendingStoneWeight, setPendingStoneWeight] = useState(null);

  const initialRowState = {
    itemCode: "",
    itemDesc: "",
    qty: "0",
    grossWt: "",
    stoneWt: "0.000",
    netWt: "0.000",
    meltPer: "0.00",
    meltLoss: "0.000",
    vaPer: "0.00",
    touch: "0.00",
    vaAmt: "0.00",
    stnChg: "0.00",
    dCode: "",
    dNo: "0",
    dCWt: "0.000",
    rate: "0.00",
    amount: "0.00",
    gRate: "0.00",
    slNo: "",
    stoneType: "",
    isManualAmount: false,
  };

  const checkOldType = (values) => {
    return (
      values?.stoneType === "O" ||
      values?.itemCode === "OGOL" ||
      values?.itemCode === "OSIL"
    );
  };

  const [rowValues, setRowValues] = useState(initialRowState);

  useEffect(() => {
    setTimeout(() => {
      grossWtRef.current?.focus();
    }, 150);
  }, []);

  const getAuth = () => {
    const currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || {};
    return {
      username: currentUser.username || "",
      password: currentUser.password || "",
    };
  };

  const getSqlDate = () => {
    const raw = String(estDate || "").trim();
    if (raw) return raw.split("T")[0];
    return new Date().toISOString().split("T")[0];
  };

  const getSpecialSilverRate = async (itemCode) => {
    try {
      const auth = getAuth();
      const sqlDate = getSqlDate();
      const safeCode = String(itemCode || "").replace(/'/g, "''");

      const [oldSilverRes, returnSilverRes] = await Promise.all([
        DynamicQueryService.fetchSingle(
          `select item_code from itemmaster where item_desc='OLD SILVER' and item_code='${safeCode}'`,
          {},
          auth,
          shopcode,
        ).catch(() => null),
        DynamicQueryService.fetchSingle(
          `select item_code from itemmaster where item_desc='RETURN SILVER' and item_code='${safeCode}'`,
          {},
          auth,
          shopcode,
        ).catch(() => null),
      ]);

      const oldSilverCode =
        oldSilverRes?.data?.item_code || oldSilverRes?.data?.ITEM_CODE;
      if (oldSilverCode) {
        const rateRes = await DynamicQueryService.fetchSingle(
          `select g916 from dateandrate where thisday='${sqlDate}' and id = (SELECT MAX(id) FROM dateandrate WHERE thisday = '${sqlDate}')`,
          {},
          auth,
          shopcode,
        );
        const rate = Number(rateRes?.data?.g916 ?? rateRes?.data?.G916 ?? 0);
        return Number.isFinite(rate) && rate > 0 ? rate : null;
      }

      const returnSilverCode =
        returnSilverRes?.data?.item_code || returnSilverRes?.data?.ITEM_CODE;
      if (returnSilverCode) {
        const rateRes = await DynamicQueryService.fetchSingle(
          `select msrate from dateandrate where thisday='${sqlDate}' and id = (SELECT MAX(id) FROM dateandrate WHERE thisday = '${sqlDate}')`,
          {},
          auth,
          shopcode,
        );
        const rate = Number(
          rateRes?.data?.msrate ?? rateRes?.data?.MSRATE ?? 0,
        );
        return Number.isFinite(rate) && rate > 0 ? rate : null;
      }
    } catch {
      // fall through with null (no override)
    }
    return null;
  };

  const calculateRowFields = (values) => {
    const gross = parseFloat(values.grossWt) || 0;
    const stone = parseFloat(values.stoneWt) || 0;
    const net = gross - stone;
    const meltPer = parseFloat(values.meltPer) || 0;
    const vaPer = parseFloat(values.vaPer) || 0;
    const rate = parseFloat(values.rate) || 0;
    const stnChg = parseFloat(values.stnChg) || 0;
    const isOldGold = checkOldType(values);

    // Melt Loss calculation
    let meltLoss = 0;
    let displayMeltLoss = "0.000";
    if (values.isManualMeltLoss) {
      displayMeltLoss = values.meltLoss !== undefined ? values.meltLoss : "";
      meltLoss = parseFloat(displayMeltLoss) || 0;
    } else {
      meltLoss = (net * meltPer) / 100;
      displayMeltLoss = meltLoss.toFixed(3);
    }

    // VA Amount calculation (Always 0.00 by default for purchase items)
    let vaAmt = parseFloat(values.vaAmt) || 0;
    let displayVaAmt = values.vaAmt || "0.00";
    if (values.isManualVaAmt) {
      displayVaAmt = values.vaAmt || "";
      vaAmt = parseFloat(displayVaAmt) || 0;
    } else {
      vaAmt = 0;
      displayVaAmt = "0.00";
    }

    // G.Rate logic
    let gRateVal = rate;
    if (isOldGold && meltPer > 0) {
      gRateVal = rate * (1 - meltPer / 100);
    }
    const gRate = gRateVal.toFixed(2);

    let dcWt = values.dCWt;
    let dCode = values.dCode;
    if (values.itemCode === "OD" && stone > 0 && !values.isManualDCWt) {
      dcWt = (stone / 0.2).toFixed(3);
      dCode = "D";
    }

    // Touch: melt% >= 10 → Touch = 100 - melt%
    //        melt% < 10  → Touch = vaPer - melt%
    let touchVal = parseFloat(values.touch) || 0;
    if (isOldGold && (touchVal === 0 || !values.isManualTouch)) {
      const currentVaPer = parseFloat(values.vaPer) || parseFloat(values.masterPurity) || 91.60;
      if (meltPer >= 10) {
        touchVal = 100 - meltPer;
      } else {
        touchVal = currentVaPer - meltPer;
      }
    }
    const touchStr = values.isManualTouch ? values.touch : touchVal.toFixed(2);

    const amount = net * parseFloat(gRate) + vaAmt + stnChg;
    const roundedAmount = Math.round(amount);

    return {
      ...values,
      netWt: net.toFixed(3),
      meltLoss: displayMeltLoss,
      vaAmt: displayVaAmt,
      touch: touchStr,
      gRate: gRate,
      dCWt: dcWt,
      dCode: dCode,
      amount: values.isManualAmount ? values.amount : roundedAmount.toFixed(2),
    };
  };

  const normalizePurchaseRowForEdit = (row = {}) => ({
    ...initialRowState,
    ...row,
    vaPer: row.vaPer ?? row.psVal ?? row.ps_valadd ?? row.PS_VALADD ?? "0.00",
    vaAmt: row.vaAmt ?? row.psVal ?? row.ps_val ?? row.PS_VAL ?? "0.00",
    isManualVaAmt:
      row.vaAmt !== undefined &&
      row.vaAmt !== null &&
      Number(row.vaAmt) > 0,
    isManualTouch:
      row.touch !== undefined &&
      row.touch !== null &&
      Number(row.touch) > 0,
  });

  const handleInputChange = (field, value, preserveManualDCWt = false) => {
    const normalizedValue =
      field === "dCode" ? String(value || "").toUpperCase() : value;

    setRowValues((prev) => {
      let updated = {
        ...prev,
        [field]: normalizedValue,
        isManualTouch:
          field === "touch"
            ? true
            : ["vaPer", "meltPer", "meltLoss"].includes(field)
              ? false
              : prev.isManualTouch,
        isManualVaAmt: field === "vaAmt" || field === "amount",
        isManualDCWt:
          field === "dCWt"
            ? true
            : field === "stoneWt"
              ? preserveManualDCWt
                ? prev.isManualDCWt
                : false
              : prev.isManualDCWt,
        isManualMeltLoss:
          field === "meltLoss"
            ? true
            : field === "meltPer"
              ? false
              : prev.isManualMeltLoss,
        isManualAmount:
          field === "amount"
            ? true
            : [
                  "grossWt",
                  "stoneWt",
                  "rate",
                  "gRate",
                  "vaPer",
                  "vaAmt",
                  "touch",
                  "stnChg",
                ].includes(field)
              ? false
              : prev.isManualAmount,
      };
      if (field === "dCWt" && prev.itemCode === "OD") {
        const dcWtVal = parseFloat(normalizedValue) || 0;
        if (dcWtVal > 0) {
          updated.dCode = "D";
        }
      }

      if (field === "amount") {
        updated.amount = normalizedValue;
        updated.isManualAmount = true;

        const amountVal = parseFloat(normalizedValue) || 0;
        const gross = parseFloat(prev.grossWt) || 0;
        const stone = parseFloat(prev.stoneWt) || 0;
        const net = gross - stone;
        const rateVal = parseFloat(prev.rate) || 0;
        const gRateVal = parseFloat(prev.gRate) || 0;
        const stnChg = parseFloat(prev.stnChg) || 0;
        const meltPerVal = parseFloat(prev.meltPer) || 0;

        if (prev.itemCode === "OGOL") {
          if (net > 0) {
            const calculatedPurRate = amountVal / net - 1;
            updated.rate = calculatedPurRate.toFixed(2);
          }
        } else {
          let initialVaAmt = amountVal - net * gRateVal - stnChg;
          if (initialVaAmt < 0) initialVaAmt = 0;

          if (net > 0 && rateVal > 0) {
            const calculatedVaPer = (initialVaAmt * 100) / (rateVal * net);
            const roundedVaPer = parseFloat(calculatedVaPer.toFixed(2)) || 0;
            updated.vaPer = roundedVaPer.toFixed(2);

            const recalculatedVaAmt = (net * rateVal * roundedVaPer) / 100;
            updated.vaAmt = recalculatedVaAmt.toFixed(2);

            let touchVal = 0;
            if (checkOldType(prev)) {
              const basePurity = parseFloat(prev.masterPurity) || 91.60;
              if (meltPerVal >= 10) {
                touchVal = 100 - meltPerVal;
                updated.vaPer = basePurity.toFixed(2); // Show 91.6 in ATC/VA when melt% >= 10
              } else {
                touchVal = basePurity - meltPerVal;
              }
              updated.touch = prev.isManualTouch ? prev.touch : touchVal.toFixed(2);
            } else {
              updated.touch = prev.isManualTouch ? prev.touch : "0.00";
            }
          } else {
            updated.vaAmt = "0.00";
            updated.vaPer = "0.00";
            updated.touch = prev.isManualTouch ? prev.touch : "0.00";
          }
        }
      }

      if (field === "vaPer") {
        let vaPerVal = parseFloat(normalizedValue) || 0;
        if (vaPerVal >= 100) {
          setPopupTitle("Warning");
          setPopupMessage("Please Check ATC/VA");
          setPopupType("warning");
          setRefToFocusAfterPopup(vaPerRef);
          vaPerVal = 91.60;
          updated.vaPer = "91.60";
        }
        const meltPerVal = parseFloat(prev.meltPer) || 0;
        let touchVal = 0;
        if (checkOldType(prev)) {
          if (meltPerVal >= 10) {
            touchVal = 100 - meltPerVal;
          } else {
            touchVal = vaPerVal - meltPerVal;
          }
          updated.touch = touchVal.toFixed(2);
          updated.isManualTouch = false;
        } else {
          updated.touch = "0.00";
        }
      }

      if (field === "meltPer") {
        const meltPerVal = parseFloat(normalizedValue) || 0;
        const vaPerVal = parseFloat(prev.vaPer) || 0;
        let touchVal = 0;
        if (checkOldType(prev)) {
          const currentVa = vaPerVal > 0 ? vaPerVal : (parseFloat(prev.masterPurity) || 91.60);
          if (meltPerVal >= 10) {
            touchVal = 100 - meltPerVal;
          } else {
            touchVal = currentVa - meltPerVal;
          }
          updated.touch = touchVal.toFixed(2);
        } else {
          updated.touch = "0.00";
        }
        updated.isManualMeltLoss = false;
        updated.isManualTouch = false;
      }

      if (field === "meltLoss") {
        const meltLossVal = parseFloat(normalizedValue) || 0;
        const gross = parseFloat(prev.grossWt) || 0;
        const stone = parseFloat(prev.stoneWt) || 0;
        const net = gross - stone;
        const isOldGold = checkOldType(prev);
        if (net > 0) {
          const calculatedMeltPer = (meltLossVal * 100) / net;
          updated.meltPer = calculatedMeltPer.toFixed(2);
          if (isOldGold) {
            const vaPerVal = parseFloat(prev.vaPer) || 0;
            const currentVa = vaPerVal > 0 ? vaPerVal : (parseFloat(prev.masterPurity) || 91.60);
            let touchCalc = 0;
            if (calculatedMeltPer >= 10) {
              touchCalc = 100 - calculatedMeltPer;
            } else {
              touchCalc = currentVa - calculatedMeltPer;
            }
            updated.touch = touchCalc.toFixed(2);
          }
        }
        updated.isManualMeltLoss = true;
        updated.isManualTouch = false;
      }

      if (field === "vaAmt") {
        if (!checkOldType(prev)) {
          const vaAmtVal = parseFloat(value) || 0;
          const gross = parseFloat(prev.grossWt) || 0;
          const stone = parseFloat(prev.stoneWt) || 0;
          const net = gross - stone;
          const rate = parseFloat(prev.rate) || 0;
          if (vaAmtVal <= 0) {
            updated.vaPer = "0.00";
            updated.touch = "0.00";
          } else if (net > 0 && rate > 0) {
            const calculatedVaPer = (vaAmtVal * 100) / (rate * net);
            updated.vaPer = calculatedVaPer.toFixed(2);
            updated.touch = calculatedVaPer.toFixed(2);
          }
        }
      }
      return calculateRowFields(updated);
    });
  };

  const handleAmountEnterOrBlur = async (enteredValue) => {
    const amountVal = parseFloat(enteredValue) || 0;
    if (amountVal <= 0) return;

    try {
      const currentUser =
        JSON.parse(sessionStorage.getItem("currentUser")) || {};
      const auth = {
        username: currentUser.username || "",
        password: currentUser.password || "",
      };

      // Fetch standard gold rate from Goldrate table
      let standardGoldRate = 0;
      try {
        const goldRateRes = await DynamicQueryService.fetchSingle(
          `select GLD_RTE from Goldrate`,
          {},
          auth,
          shopcode,
        );
        standardGoldRate =
          parseFloat(getVal(goldRateRes.data, ["GLD_RTE", "gld_rte"])) || 0;
      } catch (e) {
        console.error("Failed to fetch standard gold rate", e);
      }

      setRowValues((prev) => {
        const gross = parseFloat(prev.grossWt) || 0;
        const stone = parseFloat(prev.stoneWt) || 0;
        const net = gross - stone;
        const rateVal = parseFloat(prev.rate) || 0;
        const gRateVal = parseFloat(prev.gRate) || 0;
        const stnChg = parseFloat(prev.stnChg) || 0;
        const meltPerVal = parseFloat(prev.meltPer) || 0;

        let updated = {
          ...prev,
          amount: amountVal.toFixed(2),
          isManualAmount: false, // Allow recalculated amount to display on blur/Enter
          isManualVaAmt: true,
        };

        if (prev.itemCode === "OGOL") {
          if (net > 0) {
            const calculatedPurRate = amountVal / net - 1;
            updated.rate = calculatedPurRate.toFixed(2);
            updated.isManualAmount = false; // Amount is derived from the new Rate for OGOL

            // If calculated rate is greater than standard gold rate, show warning
            if (calculatedPurRate > standardGoldRate) {
              setPopupTitle("Warning");
              setPopupMessage("Please Check Gold Rate !!!");
              setPopupType("warning");
            }
          }
        } else {
          let initialVaAmt = amountVal - net * gRateVal - stnChg;
          if (initialVaAmt < 0) initialVaAmt = 0;

          if (net > 0 && rateVal > 0) {
            const calculatedVaPer = (initialVaAmt * 100) / (rateVal * net);
            // Format to 2 decimal places first to match Java rounding behavior
            const roundedVaPer = parseFloat(calculatedVaPer.toFixed(2)) || 0;
            updated.vaPer = roundedVaPer.toFixed(2);

            // Recalculate vaAmt based on the rounded vaPer
            const recalculatedVaAmt = (net * rateVal * roundedVaPer) / 100;
            updated.vaAmt = recalculatedVaAmt.toFixed(2);

            let touchVal = 0;
            if (checkOldType(prev)) {
              const currentVa = roundedVaPer > 0 ? roundedVaPer : (parseFloat(prev.masterPurity) || 91.60);
              if (meltPerVal >= 10) {
                touchVal = 100 - meltPerVal;
              } else {
                touchVal = currentVa - meltPerVal;
              }
              updated.touch = touchVal.toFixed(2);
            } else {
              updated.touch = "0.00";
            }
          } else {
            updated.vaAmt = "0.00";
            updated.vaPer = "0.00";
            updated.touch = "0.00";
          }
        }

        return calculateRowFields(updated);
      });
    } catch (err) {
      console.error("Error in handleAmountEnterOrBlur", err);
    }
  };

  const getStoneCode = (stone) => {
    const source = stone || {};
    return String(
      source.sCode ?? source.SCode ?? source.scode ?? source.stoneCode ?? "",
    )
      .trim()
      .toUpperCase();
  };

  const handlePurchaseStoneSelect = (stone) => {
    const selectedCode = getStoneCode(stone);
    if (!selectedCode) return;
    handleInputChange("dCode", selectedCode);
    setTimeout(() => dNoRef.current?.focus(), 50);
  };

  const openPurchaseStoneLookup = () => {
    showLookup(lookupConfigs.stone(handlePurchaseStoneSelect, shopcode));
  };

  const handleDCodeEnter = (e) => {
    e.preventDefault();
    const code = String(rowValues.dCode || "")
      .trim()
      .toUpperCase();
    if (code === "D") {
      if (rowValues.dCode !== "D") handleInputChange("dCode", "D");
      dNoRef.current?.focus();
      return;
    }
    openPurchaseStoneLookup();
  };

  const addRowToGrid = async () => {
    let targetValues = { ...rowValues };
    if (!targetValues.itemCode.trim()) {
      const defaultCode = metalType === "SILVER" ? "OSIL" : "OGOL";
      let validItem = await validateItemCode(defaultCode);
      if (!validItem) {
        validItem = {
          itemCode: defaultCode,
          itemDesc: defaultCode === "OSIL" ? "OLD SILVER" : "OLD GOLD",
          stoneType: "O",
          purity: 91.60,
        };
      }

      let resolvedRate = parseFloat(targetValues.rate) || 0;
      if (resolvedRate === 0) {
        if (ogCashRate > 0) {
          resolvedRate = ogCashRate;
        } else {
          try {
            const rateRes = await SalesService.getGoldRateByItemCode(
              validItem.itemCode,
              shopcode,
            );
            resolvedRate =
              rateRes.data?.rate ||
              rateRes.data?.gold_rate ||
              rateRes.data?.grate ||
              0;
          } catch {}
        }
      }

      const formattedMasterPurity = "91.60";
      targetValues = calculateRowFields({
        ...targetValues,
        itemCode: validItem.itemCode,
        itemDesc: validItem.itemDesc || (metalType === "SILVER" ? "OLD SILVER" : "OLD GOLD"),
        stoneType: validItem.stoneType || "O",
        masterPurity: formattedMasterPurity,
        vaPer: targetValues.vaPer !== "0.00" ? targetValues.vaPer : formattedMasterPurity,
        rate: resolvedRate ? resolvedRate.toString() : targetValues.rate,
        gRate: resolvedRate ? resolvedRate.toString() : targetValues.gRate,
      });
    }

    const gross = parseFloat(targetValues.grossWt) || 0;
    if (gross <= 0) return;

    if (targetValues.itemCode === "OD") {
      const dcWtVal =
        parseFloat(targetValues.dCWt) ||
        parseFloat(targetValues.stoneWt) ||
        0;
      if (dcWtVal <= 0) {
        setPopupTitle("Error");
        setPopupMessage("Please Enter DC Wt");
        setPopupType("error");
        setRefToFocusAfterPopup(dcWtRef);
        return;
      }
    }

    if (checkOldType(targetValues)) {
      const touchVal = parseFloat(targetValues.touch) || 0;
      const vaPerVal = parseFloat(targetValues.vaPer) || 0;
      if (vaPerVal >= 100) {
        setPopupTitle("Warning");
        setPopupMessage("Please Check ATC/VA");
        setPopupType("warning");
        setRefToFocusAfterPopup(vaPerRef);
        return;
      }
      if (touchVal > vaPerVal) {
        setPopupTitle("Warning");
        setPopupMessage("Please Check Touch");
        setPopupType("warning");
        setRefToFocusAfterPopup(vaPerRef);
        return;
      }
    } else {
      const vaAmt = parseFloat(targetValues.vaAmt) || 0;
      if (vaAmt <= 0) {
        setPopupTitle("Error");
        setPopupMessage("Please Enter VA Amount");
        setPopupType("error");
        setRefToFocusAfterPopup(vaAmtRef);
        return;
      }
    }

    // Split Logic Check

    if (
      targetValues.itemCode === "OGOL" &&
      gridData.length === 0 &&
      salesNetWt > 0 &&
      gross > salesNetWt
    ) {
      setSplitModal({
        isOpen: true,
        weightDiff: (gross - salesNetWt).toFixed(3),
      });
      return;
    }

    executeAddRow(targetValues);
  };

  const formatRowData = (calculated) => ({
    ...calculated,
    grossWt: Number(calculated.grossWt || 0).toFixed(3),
    stoneWt: Number(calculated.stoneWt || 0).toFixed(3),
    netWt: Number(calculated.netWt || 0).toFixed(3),
    meltPer: Number(calculated.meltPer || 0).toFixed(2),
    meltLoss: Number(calculated.meltLoss || 0).toFixed(3),
    vaPer: Number(calculated.vaPer || 0).toFixed(2),
    touch: Number(calculated.touch || 0).toFixed(2),
    dCWt: Number(calculated.dCWt || 0).toFixed(3),
    rate: Number(calculated.rate || 0).toFixed(2),
    gRate: Number(calculated.gRate || 0).toFixed(2),
    amount: Number(calculated.amount || 0).toFixed(2),
  });

  const executeAddRow = (values) => {
    const calculated = calculateRowFields(values);
    const formattedRow = formatRowData(calculated);

    let nextGrid = gridData;

    if (editingRowIndex !== null) {
      nextGrid = gridData.map((row, index) =>
        index === editingRowIndex ? { ...formattedRow, slNo: row.slNo } : row,
      );
      setEditingRowIndex(null);
    } else {
      nextGrid = [...gridData, { ...formattedRow, slNo: gridData.length + 1 }];
    }

    setGridData(nextGrid);

    // Clear top input form text fields for next entry
    setRowValues({
      ...initialRowState,
      slNo: (nextGrid.length + 1).toString(),
    });

    if (itemCodeRef.current) {
      itemCodeRef.current.focus();
    }
  };

  const handleSplitConfirm = async () => {
    const originalGross = parseFloat(rowValues.grossWt) || 0;
    const remainingWt = (originalGross - salesNetWt).toFixed(3);

    let spliRate = ogCashRate;

    // Direct fetch if rate is missing (matches Java behavior)
    if (spliRate === 0) {
      try {
        const currentUser =
          JSON.parse(sessionStorage.getItem("currentUser")) || {};
        const auth = {
          username: currentUser.username || "",
          password: currentUser.password || "",
        };
        const today = new Date().toISOString().split("T")[0];
        const res = await DynamicQueryService.fetchSingle(
          `SELECT ogcash FROM dateandrate WHERE thisday = '${today}' and id = (SELECT MAX(id) FROM dateandrate WHERE thisday = '${today}')`,
          {},
          auth,
          shopcode,
        );
        const val = (res.data && (res.data.ogcash || res.data.OG_CASH)) || 0;
        if (val) spliRate = val;
        else spliRate = parseFloat(rowValues.rate) || 0; // Fallback to current rate
      } catch {
        spliRate = parseFloat(rowValues.rate) || 0;
      }
    }

    // 1. Add first part matching sales weight
    const firstPart = formatRowData(
      calculateRowFields({
        ...rowValues,
        grossWt: salesNetWt.toFixed(3),
      }),
    );

    const newGrid = [...gridData, { ...firstPart, slNo: gridData.length + 1 }];
    setGridData(newGrid);

    // 2. Prepare second part in input fields
    const secondPart = formatRowData(
      calculateRowFields({
        ...rowValues,
        grossWt: remainingWt,
        rate: spliRate.toString(),
        gRate: spliRate.toString(),
        slNo: (newGrid.length + 1).toString(),
      }),
    );

    setRowValues(secondPart);
    setSplitModal({ isOpen: false, weightDiff: 0 });

    if (rateRef.current) rateRef.current.focus();
  };

  // --- Row Action Handlers ---
  const handleRowDoubleClick = (index) => {
    setClickedRowIndex(index);
    setIsActionModalOpen(true);
  };

  const handleRowTap = (index) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTapIndex === index && now - lastTapTime < DOUBLE_TAP_DELAY) {
      handleRowDoubleClick(index);
      setLastTapTime(0);
      setLastTapIndex(null);
    } else {
      setLastTapTime(now);
      setLastTapIndex(index);
    }
  };

  const confirmEdit = () => {
    if (clickedRowIndex !== null) {
      if (editingRowIndex !== null && editingRowIndex !== clickedRowIndex) {
        setPopupTitle("Validation");
        setPopupMessage(
          "Please finish editing the current row first before editing another.",
        );
        setPopupType("error");
        setIsActionModalOpen(false);
        return;
      }

      const rowToEdit = normalizePurchaseRowForEdit(gridData[clickedRowIndex]);
      setRowValues(rowToEdit);
      setEditingRowIndex(clickedRowIndex);

      setIsActionModalOpen(false);
      setClickedRowIndex(null);
      setTimeout(() => grossWtRef.current?.focus(), 100);
    }
  };

  const confirmDelete = () => {
    if (clickedRowIndex !== null) {
      const newGrid = gridData
        .filter((_, i) => i !== clickedRowIndex)
        .map((row, index) => ({ ...row, slNo: index + 1 }));
      setGridData(newGrid);
      setEditingRowIndex(null);
      setRowValues({
        ...initialRowState,
        slNo: (newGrid.length + 1).toString(),
      });
      setIsActionModalOpen(false);
      setClickedRowIndex(null);
    }
  };

  const loadPurchaseItemsList = async () => {
    try {
      const auth = getAuth();
      const gold_slv = metalType === "SILVER" ? "S" : "G";

      const sql = barflag
        ? `SELECT i.item_desc, i.item_code, i.stone_type, i.purity
           FROM itemmaster as i, metalmaster as m
           WHERE i.catg_type = m.code
             AND m.itemmetaltype='${gold_slv}'
           ORDER BY i.item_desc`
        : `SELECT i.item_desc, i.item_code, i.stone_type, i.purity
           FROM itemmaster as i, metalmaster as m
           WHERE i.stone_type IN('O','S')
             AND i.catg_type = m.code
             AND m.itemmetaltype='${gold_slv}'
           ORDER BY i.item_desc`;
      const res = await DynamicQueryService.fetchList(sql, {}, auth, shopcode);

      const rows = (res.data || []).map((row) => ({
        itemDesc: row.item_desc || row.ITEM_DESC || "",
        itemCode: row.item_code || row.ITEM_CODE || "",
        stoneType: row.stone_type || row.STONE_TYPE || "",
        purity: row.purity || row.PURITY || 0,
      }));
      setPurchaseItemsList(rows);
    } catch (e) {
      console.error("Failed to load purchase items list", e);
    }
  };

  const validateItemCode = async (code) => {
    const typed = String(code || "")
      .trim()
      .toUpperCase();
    if (!typed) return false;

    try {
      const currentUser =
        JSON.parse(sessionStorage.getItem("currentUser")) || {};
      const auth = {
        username: currentUser.username || "",
        password: currentUser.password || "",
      };
      const gold_slv = metalType === "SILVER" ? "S" : "G";

      const sql = `select i.item_code, i.item_desc, i.stone_type, i.purity from itemmaster as i, metalmaster as m where item_code='${typed}' and i.catg_type = m.code and m.itemmetaltype='${gold_slv}'`;
      const res = await DynamicQueryService.fetchSingle(
        sql,
        {},
        auth,
        shopcode,
      );

      const itemData = res.data || {};
      const resolvedCode = itemData.item_code || itemData.ITEM_CODE;

      if (resolvedCode) {
        return {
          itemCode: resolvedCode,
          itemDesc: itemData.item_desc || itemData.ITEM_DESC || "",
          stoneType: itemData.stone_type || itemData.STONE_TYPE || "",
          purity: itemData.purity || itemData.PURITY || 0,
        };
      }
      return null;
    } catch (e) {
      console.error("Error validating purchase item code", e);
      return null;
    }
  };

  const handleItemEnter = async () => {
    let typedCode = String(rowValues.itemCode || "")
      .trim()
      .toUpperCase();

    if (!typedCode) {
      await loadPurchaseItemsList();
      setIsItemPopupOpen(true);
      return;
    }

    setIsLoading(true);
    let validItem = await validateItemCode(typedCode);
    if (!validItem && (typedCode === "OGOL" || typedCode === "OSIL")) {
      validItem = {
        itemCode: typedCode,
        itemDesc: typedCode === "OSIL" ? "OLD SILVER" : "OLD GOLD",
        stoneType: "O",
        purity: 91.60,
      };
    }
    setIsLoading(false);

    if (validItem) {
      let resolvedRate = parseFloat(rowValues.rate) || 0;
      if (resolvedRate === 0) {
        try {
          const rateRes = await SalesService.getGoldRateByItemCode(
            validItem.itemCode,
            shopcode,
          );
          const val =
            rateRes.data?.rate ||
            rateRes.data?.gold_rate ||
            rateRes.data?.grate ||
            0;
          if (val) {
            resolvedRate = val;
          }
        } catch (err) {
          console.error("Failed to fetch rate", err);
        }
      }

      const gold_slv = metalType === "SILVER" ? "S" : "G";
      if (gold_slv === "G" && validItem.itemCode === "OGOL") {
        try {
          const currentUser =
            JSON.parse(sessionStorage.getItem("currentUser")) || {};
          const auth = {
            username: currentUser.username || "",
            password: currentUser.password || "",
          };
          const today = new Date().toISOString().split("T")[0];
          const ogCashRes = await DynamicQueryService.fetchSingle(
            `SELECT ogcash FROM dateandrate WHERE thisday = '${today}' and id = (SELECT MAX(id) FROM dateandrate WHERE thisday = '${today}')`,
            {},
            auth,
            shopcode,
          );
          const ogCashVal = ogCashRes.data?.ogcash || ogCashRes.data?.OG_CASH;
          if (ogCashVal) {
            resolvedRate = ogCashVal;
            setOgCashRate(ogCashVal);
          }
        } catch {
          // Ignore error and proceed
        }
      }

      const specialSilverRate = await getSpecialSilverRate(validItem.itemCode);
      if (specialSilverRate !== null) {
        resolvedRate = specialSilverRate;
      }

      let purityVal = parseFloat(validItem.purity) || 0;
      if (purityVal === 0 && checkOldType(validItem)) {
        purityVal = 91.60;
      }
      const formattedMasterPurity = purityVal ? purityVal.toFixed(2) : "91.60";
      const updated = calculateRowFields({
        ...rowValues,
        itemCode: validItem.itemCode,
        itemDesc: validItem.itemDesc,
        stoneType: validItem.stoneType || "O",
        masterPurity: formattedMasterPurity,
        vaPer: formattedMasterPurity,
        rate: Number(resolvedRate).toFixed(2),
        gRate: Number(resolvedRate).toFixed(2),
      });
      setRowValues(updated);
      setItemFromPopup(false); // item was typed/scanned directly — use normal flow

      setTimeout(() => qtyRef.current?.focus(), 50);
    } else {
      setRowValues((prev) => ({ ...prev, itemCode: "", itemDesc: "" }));
      await loadPurchaseItemsList();
      setIsItemPopupOpen(true);
    }
  };

  const handleSelectItemFromPopup = async (item) => {
    setIsItemPopupOpen(false);
    setIsLoading(true);

    let resolvedRate = 0;
    try {
      const rateRes = await SalesService.getGoldRateByItemCode(
        item.itemCode,
        shopcode,
      );
      const val =
        rateRes.data?.rate ||
        rateRes.data?.gold_rate ||
        rateRes.data?.grate ||
        0;
      if (val) resolvedRate = val;
    } catch (err) {
      console.error("Failed to fetch rate", err);
    }

    const gold_slv = metalType === "SILVER" ? "S" : "G";
    if (gold_slv === "G" && item.itemCode === "OGOL") {
      try {
        const currentUser =
          JSON.parse(sessionStorage.getItem("currentUser")) || {};
        const auth = {
          username: currentUser.username || "",
          password: currentUser.password || "",
        };

        const today = new Date().toISOString().split("T")[0];
        const ogCashRes = await DynamicQueryService.fetchSingle(
          `SELECT ogcash FROM dateandrate WHERE thisday = '${today}' and id = (SELECT MAX(id) FROM dateandrate WHERE thisday = '${today}')`,
          {},
          auth,
          shopcode,
        );
        const ogCashVal = ogCashRes.data?.ogcash || ogCashRes.data?.OG_CASH;
        if (ogCashVal) {
          resolvedRate = ogCashVal;
          setOgCashRate(ogCashVal);
        }
      } catch {
        // Ignore error and proceed
      }
    }

    const specialSilverRate = await getSpecialSilverRate(item.itemCode);
    if (specialSilverRate !== null) {
      resolvedRate = specialSilverRate;
    }

    let purityVal = parseFloat(item.purity) || 0;
    if (purityVal === 0 && checkOldType(item)) {
      purityVal = 91.60;
    }
    const formattedMasterPurity = purityVal ? purityVal.toFixed(2) : "91.60";
    const updated = calculateRowFields({
      ...rowValues,
      itemCode: item.itemCode,
      itemDesc: item.itemDesc,
      stoneType: item.stoneType || "",
      masterPurity: formattedMasterPurity,
      vaPer: formattedMasterPurity,
      rate: Number(resolvedRate).toFixed(2),
      gRate: Number(resolvedRate).toFixed(2),
    });
    setRowValues(updated);
    setItemFromPopup(true); // item was chosen from DETAILS popup — skip melt/VA fields in barcode mode
    setIsLoading(false);

    setTimeout(() => qtyRef.current?.focus(), 50);
  };

  const handleRowKeyDown = (e, col) => {
    if (e.key === "Enter") {
      if (col === "Item") {
        e.preventDefault();
        handleItemEnter();
      } else if (col === "Qty") {
        e.preventDefault();
        if (grossWtRef.current) grossWtRef.current.focus();
      } else if (col === "Gross Wt") {
        const val = parseFloat(rowValues.grossWt) || 0;
        if (val <= 0) {
          e.preventDefault();
          setPopupTitle("Error");
          setPopupMessage("Please Enter Valid Data");
          setPopupType("error");
          setRefToFocusAfterPopup(grossWtRef);
          return;
        }
        e.preventDefault();
        if (barflag && itemFromPopup) {
          // Item selected from DETAILS popup in barcode mode: skip Melt%/MeltLoss/VA%
          // Focus always goes to VA Amount (both old-type and regular items)
          if (vaAmtRef.current) vaAmtRef.current.focus();
        } else {
          if (meltPerRef.current) meltPerRef.current.focus();
        }
      } else if (col === "Stn Wt") {
        e.preventDefault();
        if (meltPerRef.current) meltPerRef.current.focus();
      } else if (col === "Melt%") {
        e.preventDefault();
        // Recalculate meltLoss immediately, then derive ATC/VA and Touch
        setRowValues((prev) => {
          const meltPerVal = parseFloat(prev.meltPer) || 0;
          return calculateRowFields({
            ...prev,
            meltPer: meltPerVal.toFixed(2),
            isManualMeltLoss: false,
          });
        });
        // After recalculating, run handleVaPerEnter to update ATC/VA and Touch
        setTimeout(() => {
          handleVaPerEnter();
        }, 0);
      } else if (col === "MeltLoss") {
        e.preventDefault();
        setRowValues((prev) => {
          const meltLossVal = parseFloat(prev.meltLoss) || 0;
          return calculateRowFields({
            ...prev,
            meltLoss: meltLossVal.toFixed(3),
            isManualMeltLoss: true,
          });
        });
        setTimeout(() => {
          if (vaPerRef.current) vaPerRef.current.focus();
        }, 0);
      } else if (col === "ATC/VA") {
        e.preventDefault();
        handleVaPerEnter();
      } else if (col === "VA Amt") {
        e.preventDefault();
        const vaAmtVal = parseFloat(rowValues.vaAmt) || 0;
        setRowValues((prev) => ({
          ...prev,
          vaAmt: vaAmtVal.toFixed(2),
          isManualVaAmt: true,
        }));
        if (barflag) {
          if (rateRef.current) rateRef.current.focus();
        } else {
          if (stnChgRef.current) stnChgRef.current.focus();
        }
      } else if (col === "Stn. Chg") {
        e.preventDefault();
        const stnChgVal = parseFloat(rowValues.stnChg) || 0;
        setRowValues((prev) =>
          calculateRowFields({
            ...prev,
            stnChg: stnChgVal.toFixed(2),
          }),
        );
        if (rateRef.current) rateRef.current.focus();
      } else if (col === "Touch") {
        if (rateRef.current) rateRef.current.focus();
      } else if (col === "D.Code") {
        handleDCodeEnter(e);
      } else if (col === "DNo") {
        e.preventDefault();
        if (dcWtRef.current) dcWtRef.current.focus();
      } else if (col === "DCWt") {
        e.preventDefault();
        const calculatedStoneWeight = (parseFloat(rowValues.dCWt) || 0) * 0.2;
        const existingStoneWeight = parseFloat(rowValues.stoneWt) || 0;

        if (calculatedStoneWeight > existingStoneWeight) {
          handleInputChange(
            "stoneWt",
            calculatedStoneWeight.toFixed(3),
            true,
          );
          rateRef.current?.focus();
        } else {
          setPendingStoneWeight(calculatedStoneWeight);
          setPopupTitle("confirmation");
          setPopupMessage(
            "Stn.Wt less than Dmd.Wt, Do You Want to Change ?",
          );
          setPopupType("info");
          setRefToFocusAfterPopup(rateRef);
        }
      } else if (col === "Slno" || col === "Amount" || col === "Rate") {
        e.preventDefault();
        if (col === "Rate") {
          if (plusBtnRef.current) plusBtnRef.current.focus();
        } else if (col === "Amount") {
          handleAmountEnterOrBlur(rowValues.amount).then(() => {
            if (plusBtnRef.current) plusBtnRef.current.focus();
          });
        } else {
          addRowToGrid();
        }
      }
    }
  };

  //   const calculateTouch = () => {
  //   const currentVaPer = parseFloat(rowValues.vaPer) || 0;
  //   const currentMeltPer = parseFloat(rowValues.meltPer) || 0;

  //   let touch = 0;

  //   if (currentMeltPer < 10) {
  //     touch = currentVaPer - currentMeltPer;
  //   } else {
  //     touch = 100 - currentMeltPer;
  //   }

  //   setRowValues(prev => ({
  //     ...prev,
  //     touch: touch.toFixed(2)
  //   }));
  // };

  const handleVaPerEnter = async () => {
    let currentVaPer = parseFloat(rowValues.vaPer) || 0;
    const currentMeltPer = parseFloat(rowValues.meltPer) || 0;

    if (currentVaPer === 0) {
      try {
        const currentUser =
          JSON.parse(sessionStorage.getItem("currentUser")) || {};

        const auth = {
          username: currentUser.username || "",
          password: currentUser.password || "",
        };

        const purityRes = await DynamicQueryService.fetchSingle(
          `select purity from itemmaster where item_code = '${rowValues.itemCode}'`,
          {},
          auth,
          shopcode,
        );

        const purity =
          (purityRes.data &&
            (purityRes.data.purity || purityRes.data.PURITY)) ||
          0;

        if (purity) currentVaPer = purity;
      } catch (err) {
        console.error("Error fetching purity:", err);
      }
    }

    if (currentMeltPer > currentVaPer) {
      currentVaPer = currentMeltPer;
    }

    // ===== TOUCH CALCULATION =====
    let touch = 0;
    if (rowValues.isManualTouch && parseFloat(rowValues.touch) > 0) {
      touch = parseFloat(rowValues.touch);
    } else if (currentMeltPer >= 10) {
      touch = 100 - currentMeltPer;
    } else {
      touch = currentVaPer - currentMeltPer;
    }

    const updated = calculateRowFields({
      ...rowValues,
      vaPer: currentVaPer.toFixed(2),
      touch: rowValues.isManualTouch ? rowValues.touch : touch.toFixed(2),
      isManualTouch: rowValues.isManualTouch,
    });

    setRowValues(updated);

    setTimeout(() => {
      touchRef.current?.focus();
      touchRef.current?.select();
    }, 0);
  };

  const handleNew = async () => {
    setIsLoading(true);
    try {
      const getVal = (obj, keys) => {
        if (!obj) return null;
        if (typeof obj !== "object") return obj;
        for (const k of keys) {
          if (obj[k] !== undefined && obj[k] !== null) return obj[k];
        }
        return null;
      };

      const gold_slv = metalType === "SILVER" ? "S" : "G";
      const itemCode = gold_slv === "S" ? "OSIL" : "OGOL";

      const currentUser =
        JSON.parse(sessionStorage.getItem("currentUser")) || {};
      const auth = {
        username: currentUser.username || "",
        password: currentUser.password || "",
      };

      // 1. Fetch Item Description, Stone Type and Purity
      const itemRes = await DynamicQueryService.fetchSingle(
        `select item_desc, stone_type, purity from itemmaster where item_code = '${itemCode}'`,
        {},
        auth,
        shopcode,
      );

      // 2. Fetch Rate
      const rateRes = await SalesService.getGoldRateByItemCode(
        itemCode,
        shopcode,
      );
      let currentRate =
        getVal(rateRes.data, ["rate", "gold_rate", "grate"]) || 0;

      // 4. Special Gold Condition (First Row logic)
      if (gold_slv === "G") {
        const today = new Date().toISOString().split("T")[0];
        const ogCashRes = await DynamicQueryService.fetchSingle(
          `SELECT ogcash FROM dateandrate WHERE thisday = '${today}' and id = (SELECT MAX(id) FROM dateandrate WHERE thisday = '${today}')`,
          {},
          auth,
          shopcode,
        );
        const ogCashVal = getVal(ogCashRes.data, ["ogcash", "og_cash"]);
        if (ogCashVal) {
          currentRate = ogCashVal;
          setOgCashRate(ogCashVal);
        }
      }

      const purity = getVal(itemRes.data, ["purity", "PURITY"]) || 0;
      setRowValues((prev) => ({
        ...prev,
        itemCode: itemCode,
        itemDesc: getVal(itemRes.data, ["item_desc", "itemdesc"]) || "",
        stoneType: getVal(itemRes.data, ["stone_type", "stonetype"]) || "",
        vaPer: purity ? purity.toFixed(2) : "0.00",
        qty: "0",
        rate: Number(currentRate).toFixed(2),
        gRate: Number(currentRate).toFixed(2),
      }));

      setIsNewMode(true);
    } catch (error) {
      console.error("Error initializing purchase:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (isEmbedded && isFormEnabled) {
      handleNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbedded, isFormEnabled]);

  useEffect(() => {
    if (isNewMode && itemCodeRef.current) {
      itemCodeRef.current.focus();
    }
  }, [isNewMode]);

  const columns = [
    "Item",
    "Item Desc",
    "Qty",
    "Gross Wt",
    "Stn Wt",
    "Net Wt",
    "Melt%",
    "MeltLoss",
    "ATC/VA",
    "Touch",
    "VA Amt",
    "Stn. Chg",
    "D.Code",
    "DNo",
    "DCWt",
    "Rate",
    "Amount",
    "G.Rate",
    "Slno",
    "+",
  ];

  const columnWidths = [
    "102px",
    "144px",
    "58px",
    "80px",
    "80px",
    "80px",
    "72px",
    "80px",
    "84px",
    "72px",
    "85px",
    "70px",
    "72px",
    "76px",
    "86px",
    "100px",
    "115px",
    "95px",
    "40px",
    "32px",
  ];

  const renderContent = () => (
    <div className="w-full animate-fade-in-up">
      <div
        className={
          isEmbedded
            ? "w-full"
            : "rounded-[2.5rem] border-2 border-violet-200 bg-slate-200/95 dark:bg-slate-900/80 p-5 sm:p-6 shadow-2xl"
        }
      >
        {!isEmbedded && (
          <div className="flex justify-end">
            <button
              type="button"
              aria-label="Close"
              onClick={() => navigate("/salesentry")}
              className="h-8 w-8 rounded-full text-slate-400 hover:text-rose-500 hover:bg-white/70 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="mx-auto h-5 w-5" />
            </button>
          </div>
        )}

        {!isEmbedded && (
          <div className="mt-2 rounded-2xl bg-white/45 dark:bg-slate-800/60 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm sm:text-lg font-black tracking-wide uppercase text-violet-700">
                Purchase Note No: {estNo || "New"}
              </span>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleNew}
                className="h-8 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-black uppercase tracking-wide hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                New
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 overflow-x-auto max-h-[220px] overflow-y-auto relative custom-scrollbar rounded-2xl border border-slate-300 dark:border-slate-700">
          <table className="min-w-[1518px] w-full border-collapse">
            <colgroup>
              {columnWidths.map((width, idx) => (
                <col key={`col-${idx}`} style={{ width }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-20 shadow-sm bg-white dark:bg-slate-900">
              <tr className="modern-table-header">
                {columns.map((col) => (
                  <th
                    key={col}
                    className={`border-r border-white/10 dark:border-slate-800/50 px-2 py-1.5 text-white whitespace-nowrap ${tableTypography.header} ${
                      ["Item", "Item Desc", "D.Code", "DNo"].includes(col)
                        ? "text-left"
                        : "text-right"
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-100/80 dark:bg-slate-800/60">
                {columns.map((col, idx) => (
                  <th
                    key={`input-${col}`}
                    className="border-r border-b border-slate-300 dark:border-slate-700 p-1"
                  >
                    {col === "+" ? (
                      <button
                        type="button"
                        ref={plusBtnRef}
                        disabled={!isNewMode}
                        onClick={addRowToGrid}
                        onFocus={() => {
                          if (checkOldType(rowValues)) {
                            const touchVal = parseFloat(rowValues.touch) || 0;
                            const vaPerVal = parseFloat(rowValues.vaPer) || 0;
                            if (vaPerVal >= 100) {
                              setPopupTitle("Warning");
                              setPopupMessage("Please Check ATC/VA");
                              setPopupType("warning");
                              setRefToFocusAfterPopup(vaPerRef);
                            } else if (touchVal > vaPerVal) {
                              setPopupTitle("Warning");
                              setPopupMessage("Please Check Touch");
                              setPopupType("warning");
                              setRefToFocusAfterPopup(vaPerRef);
                            }
                          } else {
                            const vaAmt = parseFloat(rowValues.vaAmt) || 0;
                            if (vaAmt <= 0) {
                              setPopupTitle("Error");
                              setPopupMessage("Please Enter VA Amount");
                              setPopupType("error");
                              setRefToFocusAfterPopup(vaAmtRef);
                            }
                          }
                        }}
                        className="w-6 h-6 rounded flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-base shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed mx-auto animate-in zoom-in-75"
                        title="Add purchase row"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addRowToGrid();
                          }
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        </button>
                    ) : col === "Item" ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            ref={itemCodeRef}
                            disabled={!isNewMode}
                            value={rowValues.itemCode}
                            onChange={(e) =>
                              handleInputChange(
                                "itemCode",
                                e.target.value.toUpperCase(),
                              )
                            }
                            onBlur={(e) => {
                              const val = String(
                                rowValues.itemCode || "",
                              ).trim();
                              if (val) handleItemEnter();
                            }}
                            onKeyDown={(e) =>
                              handleRowKeyDown(e, "Item")
                            }
                            onDoubleClick={() => {
                              if (isNewMode)
                                loadPurchaseItemsList().then(() =>
                                  setIsItemPopupOpen(true),
                                );
                            }}
                            className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all text-left ${tableTypography.cellText} ${
                              isNewMode
                                ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 shadow-sm"
                                : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            }`}
                            aria-label="item-code-input"
                          />
                          <button
                            type="button"
                            disabled={!isNewMode}
                            title="Search Item"
                            onClick={() => {
                              if (isNewMode)
                                loadPurchaseItemsList().then(() =>
                                  setIsItemPopupOpen(true),
                                );
                            }}
                            className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-400 text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          ref={
                            col === "Qty"
                              ? qtyRef
                              : col === "Gross Wt"
                                ? grossWtRef
                                : col === "Melt%"
                                  ? meltPerRef
                                  : col === "MeltLoss"
                                    ? meltLossRef
                                    : col === "ATC/VA"
                                      ? vaPerRef
                                      : col === "VA Amt"
                                        ? vaAmtRef
                                        : col === "Touch"
                                          ? touchRef
                                          : col === "Stn. Chg"
                                            ? stnChgRef
                                            : col === "D.Code"
                                              ? dCodeRef
                                              : col === "DNo"
                                                ? dNoRef
                                                : col === "DCWt"
                                                  ? dcWtRef
                                                  : col === "Rate"
                                                    ? rateRef
                                                    : null
                          }
                          disabled={!isNewMode}
                          readOnly={[
                            "Item Desc",
                            "Net Wt",
                            "G.Rate",
                          ].includes(col)}
                        value={
                          col === "Item"
                            ? rowValues.itemCode
                            : col === "Item Desc"
                              ? rowValues.itemDesc
                              : col === "Qty"
                                ? rowValues.qty
                                : col === "Gross Wt"
                                  ? rowValues.grossWt
                                  : col === "Stn Wt"
                                    ? rowValues.stoneWt
                                    : col === "Net Wt"
                                      ? rowValues.netWt
                                      : col === "Melt%"
                                        ? rowValues.meltPer
                                        : col === "MeltLoss"
                                          ? rowValues.meltLoss
                                          : col === "ATC/VA"
                                            ? rowValues.vaPer
                                            : col === "Touch"
                                              ? rowValues.touch
                                              : col === "VA Amt"
                                                ? rowValues.vaAmt
                                                : col === "Stn. Chg"
                                                  ? rowValues.stnChg
                                                  : col === "D.Code"
                                                    ? rowValues.dCode
                                                    : col === "DNo"
                                                      ? rowValues.dNo
                                                      : col === "DCWt"
                                                        ? rowValues.dCWt
                                                        : col === "Rate"
                                                          ? rowValues.rate
                                                          : col === "Amount"
                                                            ? rowValues.amount
                                                            : col === "G.Rate"
                                                              ? rowValues.gRate
                                                              : col === "Slno"
                                                                ? rowValues.slNo
                                                                : ""
                        }
                        onChange={(e) => {
                          let val;
                          if (col === "D.Code") {
                            val = e.target.value.toUpperCase();
                          } else if (
                            ["Gross Wt", "Stn Wt", "MeltLoss", "DCWt"].includes(
                              col,
                            )
                          ) {
                            val = limitDecimals(e.target.value, 3);
                          } else if (
                            [
                              "Rate",
                              "Melt%",
                              "ATC/VA",
                              "VA Amt",
                              "Stn. Chg",
                              "Touch",
                            ].includes(col)
                          ) {
                            val = limitDecimals(e.target.value, 2);
                          } else {
                            val = e.target.value;
                          }
                          handleInputChange(
                            col === "Item"
                              ? "itemCode"
                              : col === "Item Desc"
                                ? "itemDesc"
                                : col === "Qty"
                                  ? "qty"
                                  : col === "Gross Wt"
                                    ? "grossWt"
                                    : col === "Stn Wt"
                                      ? "stoneWt"
                                      : col === "Net Wt"
                                        ? "netWt"
                                        : col === "Melt%"
                                          ? "meltPer"
                                          : col === "MeltLoss"
                                            ? "meltLoss"
                                            : col === "ATC/VA"
                                              ? "vaPer"
                                              : col === "Touch"
                                                ? "touch"
                                                : col === "VA Amt"
                                                  ? "vaAmt"
                                                  : col === "Stn. Chg"
                                                    ? "stnChg"
                                                    : col === "D.Code"
                                                      ? "dCode"
                                                      : col === "DNo"
                                                        ? "dNo"
                                                        : col === "DCWt"
                                                          ? "dCWt"
                                                          : col === "Rate"
                                                            ? "rate"
                                                            : col === "Amount"
                                                              ? "amount"
                                                              : col === "G.Rate"
                                                                ? "gRate"
                                                                : col === "Slno"
                                                                  ? "slNo"
                                                                  : "",
                            val,
                          );
                        }}
                        onKeyDown={(e) => handleRowKeyDown(e, col)}
                        onFocus={(e) => {
                          const target = e.currentTarget;
                          setTimeout(() => {
                            target?.select();
                          }, 0);
                        }}
                        onBlur={() => {
                          if (col === "Gross Wt") {
                            const parsedGrossWt =
                              parseFloat(rowValues.grossWt) || 0;
                            const formatted = parsedGrossWt.toFixed(3);
                            if (rowValues.grossWt !== formatted)
                              handleInputChange("grossWt", formatted);
                          } else if (col === "Stn Wt") {
                            const parsedStoneWt =
                              parseFloat(rowValues.stoneWt) || 0;
                            const formatted = parsedStoneWt.toFixed(3);
                            if (rowValues.stoneWt !== formatted)
                              handleInputChange("stoneWt", formatted);
                          } else if (col === "MeltLoss") {
                            const parsedMeltLoss =
                              parseFloat(rowValues.meltLoss) || 0;
                            const formatted = parsedMeltLoss.toFixed(3);
                            if (rowValues.meltLoss !== formatted)
                              handleInputChange("meltLoss", formatted);
                          } else if (col === "DCWt") {
                            const parsedDCWt = parseFloat(rowValues.dCWt) || 0;
                            const formatted = parsedDCWt.toFixed(3);
                            if (rowValues.dCWt !== formatted)
                              handleInputChange("dCWt", formatted);
                          } else if (col === "Rate") {
                            const parsedRate = parseFloat(rowValues.rate) || 0;
                            const formatted = parsedRate.toFixed(2);
                            if (rowValues.rate !== formatted)
                              handleInputChange("rate", formatted);
                          } else if (col === "Melt%") {
                            const parsedMeltPer =
                              parseFloat(rowValues.meltPer) || 0;
                            const formatted = parsedMeltPer.toFixed(2);
                            if (rowValues.meltPer !== formatted)
                              handleInputChange("meltPer", formatted);
                          } else if (col === "ATC/VA") {
                            const parsedVa = parseFloat(rowValues.vaPer) || 0;
                            if (parsedVa >= 100) {
                              setPopupTitle("Warning");
                              setPopupMessage("Please Check ATC/VA");
                              setPopupType("warning");
                              setRefToFocusAfterPopup(vaPerRef);
                              handleInputChange("vaPer", "91.60");
                            } else if (parsedVa <= 0) {
                              setRowValues((prev) => {
                                const masterPurityVal =
                                  parseFloat(prev.masterPurity) || 91.60;
                                const formattedMasterPurity = masterPurityVal.toFixed(2);
                                const meltPerVal = parseFloat(prev.meltPer) || 0;
                                let touchVal = 0;
                                if (checkOldType(prev)) {
                                  if (meltPerVal >= 10) {
                                    touchVal = 100 - meltPerVal;
                                  } else {
                                    touchVal = masterPurityVal - meltPerVal;
                                  }
                                }
                                return calculateRowFields({
                                  ...prev,
                                  vaPer: formattedMasterPurity,
                                  touch: touchVal > 0 ? touchVal.toFixed(2) : formattedMasterPurity,
                                  isManualTouch: false,
                                });
                              });
                            } else {
                              const formatted = parsedVa.toFixed(2);
                              if (rowValues.vaPer !== formatted)
                                handleInputChange("vaPer", formatted);
                            }
                          } else if (col === "VA Amt") {
                            const parsedVaAmt =
                              parseFloat(rowValues.vaAmt) || 0;
                            const formatted = parsedVaAmt.toFixed(2);
                            if (rowValues.vaAmt !== formatted)
                              handleInputChange("vaAmt", formatted);
                          } else if (col === "Stn. Chg") {
                            const parsedStn = parseFloat(rowValues.stnChg) || 0;
                            const formatted = parsedStn.toFixed(2);
                            if (rowValues.stnChg !== formatted)
                              handleInputChange("stnChg", formatted);
                          } else if (col === "Touch") {
                            setRowValues((prev) => {
                              const meltPerVal = parseFloat(prev.meltPer) || 0;
                              const vaPerVal = parseFloat(prev.vaPer) || 0;
                              let touchVal = 0;
                              if (checkOldType(prev)) {
                                const basePurity =
                                  parseFloat(prev.masterPurity) ||
                                  (vaPerVal > 0 ? vaPerVal : 91.60);
                                if (meltPerVal < 10) {
                                  touchVal = basePurity - meltPerVal;
                                } else {
                                  touchVal = 100 - meltPerVal;
                                }
                              }
                              const formattedOriginalTouch = touchVal.toFixed(2);
                              return calculateRowFields({
                                ...prev,
                                touch: formattedOriginalTouch,
                                isManualTouch: false,
                              });
                            });
                          } else if (col === "Amount") {
                            handleAmountEnterOrBlur(rowValues.amount);
                          } else if (col === "Item") {
                            const val = String(rowValues.itemCode || "").trim();
                            if (val) {
                              handleItemEnter();
                            }
                          }
                        }}
                        onDoubleClick={() => {
                          if (col === "Item" && isNewMode) {
                            loadPurchaseItemsList().then(() =>
                              setIsItemPopupOpen(true),
                            );
                          }
                        }}
                        className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-2 outline-none transition-all ${
                          ["Item", "Item Desc", "D.Code", "DNo"].includes(col)
                            ? "text-left"
                            : "text-right"
                        } ${
                          ["Item", "Item Desc", "D.Code", "DNo"].includes(col)
                            ? tableTypography.cellText
                            : col === "Amount" ||
                                col === "VA Amt" ||
                                col === "Stn. Chg"
                              ? tableTypography.cellAmount
                              : tableTypography.cellMono
                        } ${
                          isNewMode
                            ? "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 shadow-sm"
                            : "bg-slate-100/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        }`}
                        aria-label={`column-input-${idx + 1}`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900/40">
              {gridData.map((row, rowIndex) => (
                <tr
                  key={`row-${rowIndex}`}
                  className={`modern-table-row transition-all duration-200 cursor-pointer select-none group ${
                    editingRowIndex === rowIndex
                      ? "bg-sky-50 dark:bg-sky-500/10 ring-2 ring-sky-500 ring-inset shadow-inner"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/80"
                  }`}
                  onDoubleClick={() => handleRowDoubleClick(rowIndex)}
                  onClick={() => handleRowTap(rowIndex)}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={`cell-${rowIndex}-${colIdx}`}
                      className={`border-r border-b border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 ${
                        col !== "+" &&
                        ["Item", "Item Desc", "D.Code", "DNo"].includes(col)
                          ? "text-left"
                          : "text-right"
                      } ${
                        col !== "+" &&
                        ["Item", "Item Desc", "D.Code", "DNo"].includes(col)
                          ? tableTypography.cellText
                          : col === "Amount" ||
                              col === "VA Amt" ||
                              col === "Stn. Chg"
                            ? tableTypography.cellAmount
                            : tableTypography.cellMono
                      }`}
                    >
                      {col === "+"
                        ? null
                        : col === "Item"
                          ? row.itemCode
                          : col === "Item Desc"
                            ? row.itemDesc
                            : col === "Qty"
                              ? row.qty
                              : col === "Gross Wt"
                                ? row.grossWt
                                : col === "Stn Wt"
                                  ? row.stoneWt
                                  : col === "Net Wt"
                                    ? row.netWt
                                    : col === "Melt%"
                                      ? row.meltPer
                                      : col === "MeltLoss"
                                        ? row.meltLoss
                                        : col === "ATC/VA"
                                          ? row.vaPer
                                          : col === "Touch"
                                            ? row.touch
                                            : col === "VA Amt"
                                              ? row.vaAmt
                                              : col === "Stn. Chg"
                                                ? row.stnChg
                                                : col === "D.Code"
                                                  ? row.dCode
                                                  : col === "DNo"
                                                    ? row.dNo
                                                    : col === "DCWt"
                                                      ? row.dCWt
                                                      : col === "Rate"
                                                        ? row.rate
                                                        : col === "Amount"
                                                          ? row.amount
                                                          : col === "G.Rate"
                                                            ? row.gRate
                                                            : col === "Slno"
                                                              ? row.slNo
                                                              : ""}
                    </td>
                  ))}
                </tr>
              ))}
              {gridData.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-slate-400 italic text-sm border-b border-slate-200 dark:border-slate-700"
                  >
                    No purchase entries yet. Click "New" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <MessagePopup
          open={!!popupMessage}
          title={popupTitle}
          message={popupMessage}
          type={popupType}
          actions={
            popupTitle === "confirmation"
              ? [
                  {
                    label: "Yes",
                    onClick: () => {
                      if (pendingStoneWeight !== null) {
                        handleInputChange(
                          "stoneWt",
                          pendingStoneWeight.toFixed(3),
                          true,
                        );
                      }
                      setPopupMessage("");
                      setPendingStoneWeight(null);
                      setRefToFocusAfterPopup(null);
                      setTimeout(() => rateRef.current?.focus(), 50);
                    },
                  },
                  {
                    label: "No",
                    variant: "secondary",
                    onClick: () => {
                      setPopupMessage("");
                      setPendingStoneWeight(null);
                      setRefToFocusAfterPopup(null);
                      setTimeout(() => rateRef.current?.focus(), 50);
                    },
                  },
                ]
              : []
          }
          onClose={() => {
            setPopupMessage("");
            if (refToFocusAfterPopup) {
              setTimeout(() => refToFocusAfterPopup.current?.focus(), 50);
              setRefToFocusAfterPopup(null);
            } else {
              grossWtRef.current?.focus();
            }
          }}
        />

        {/* Item Action Modal (Edit/Delete) */}
        {isActionModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      Purchase Item
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">
                      What would you like to do?
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmEdit}
                    className="btn-secondary bg-white hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 w-full"
                  >
                    <Edit3 className="w-4 h-4 text-amber-500" />
                    Edit Item
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="btn-secondary bg-white hover:bg-rose-50 dark:hover:bg-rose-900/10 border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800/50 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 w-full"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    Remove Item
                  </button>
                  <button
                    onClick={() => setIsActionModalOpen(false)}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-all active:scale-95 mt-2"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Split Confirmation Modal */}
        <MessagePopup
          open={splitModal.isOpen}
          title="Split Purchase?"
          message={`The purchase weight exceeds the sale weight. Do you want to split the remaining ${splitModal.weightDiff}g?`}
          type="info"
          actions={[
            {
              label: "Yes, Split",
              onClick: handleSplitConfirm,
            },
            {
              label: "No, Keep Full",
              variant: "secondary",
              onClick: () => {
                executeAddRow(rowValues);
                setSplitModal({ isOpen: false, weightDiff: 0 });
              },
            },
          ]}
          onClose={() => setSplitModal({ isOpen: false, weightDiff: 0 })}
        />

        {isItemPopupOpen &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-[500px] rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
                <div className="h-10 px-4 flex items-center justify-between bg-slate-200 dark:bg-slate-800 border-b border-slate-400 dark:border-slate-700">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsItemPopupOpen(false)}
                    className="text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="modern-table-header">
                        <th
                          className={`p-2.5 border-r border-white/10 text-left text-white ${tableTypography.header}`}
                        >
                          Item Description
                        </th>
                        <th
                          className={`p-2.5 text-left text-white w-[140px] ${tableTypography.header}`}
                        >
                          Item Code
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                      {purchaseItemsList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="p-4 text-center text-slate-400 italic"
                          >
                            No items found matching the metal type.
                          </td>
                        </tr>
                      ) : (
                        purchaseItemsList.map((item, idx) => (
                          <tr
                            key={idx}
                            onClick={() => handleSelectItemFromPopup(item)}
                            className="hover:bg-violet-50/50 dark:hover:bg-violet-900/10 cursor-pointer select-none font-bold text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-100 dark:border-slate-800/50"
                          >
                            <td
                              className={`p-2.5 border-r border-slate-100 dark:border-slate-800 ${tableTypography.cellText}`}
                            >
                              {item.itemDesc}
                            </td>
                            <td
                              className={`p-2.5 text-violet-600 dark:text-violet-400 ${tableTypography.cellMono}`}
                            >
                              {item.itemCode}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsItemPopupOpen(false)}
                    className="px-5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs uppercase transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return <div className="w-full">{renderContent()}</div>;
  }

  return (
    <ModulePageLayout
      title="Purchase / Exchange"
      navigate={navigate}
      backPath="/salesentry"
    >
      {renderContent()}
    </ModulePageLayout>
  );
};

export default React.memo(Purchase);
