import React, { useEffect, useRef, useState } from "react";
import { Gem, Plus, Search } from "lucide-react";

import { SalesService } from "../../../services/SalesEntryApi";
import { useLookup, lookupConfigs } from "../../common/LookupContext";

import {
  calculateStoneAmount,
  calculateStoneTotals,
} from "../../../utils/SharedBillingCalculator";

import {
  fmtAmt,
  fmtWt,
  getAmt,
  getWt,
  getQty,
} from "../../../utils/format";

import { StoneRow } from "../../../models/SalesRow";
import { tableTypography } from "../../../utils/tableTypography";

interface StoneDetailsProps {
  isFormEnabled: boolean;

  itemCode: string;

  grossWt: string | number;

  goldRate: string | number;

  stoneRow: StoneRow;

  setStoneRow: React.Dispatch<React.SetStateAction<StoneRow>>;

  stoneGrid: StoneRow[];

  setStoneGrid: React.Dispatch<React.SetStateAction<StoneRow[]>>;

  editingStoneIndex: number | null;

  setEditingStoneIndex: React.Dispatch<
    React.SetStateAction<number | null>
  >;

  setSalesRow: React.Dispatch<any>;

  salesRefs: React.MutableRefObject<
    Record<string, HTMLInputElement | null>
  >;

  showPopupMessage: (
    message: string,
    title?: string,
    type?: string
  ) => void;

  stoneEmpty: StoneRow;
}

const StoneDetails: React.FC<StoneDetailsProps> = ({
  isFormEnabled,
  itemCode,
  grossWt,
  goldRate,

  stoneRow,
  setStoneRow,

  stoneGrid,
  setStoneGrid,

  editingStoneIndex,
  setEditingStoneIndex,

  setSalesRow,

  salesRefs,

  showPopupMessage,

  stoneEmpty,
}) => {
  const { showLookup } = useLookup();

  const stoneRefs = useRef<
    Record<string, HTMLInputElement | null>
  >({});

  const stonePlusBtnRef = useRef<HTMLButtonElement | null>(null);

  const isValidatingStoneRef = useRef(false);

  const [isStoneCodeEnabled, setIsStoneCodeEnabled] =
    useState(false);

  const [lastTapIndex, setLastTapIndex] = useState<number | null>(
    null
  );

  const [lastTapTime, setLastTapTime] = useState(0);

  /*
   * ---------------------------------------------------------
   * SHOP CODE
   * ---------------------------------------------------------
   */

  const resolveShopCode = () => {
    const currentUser = JSON.parse(
      sessionStorage.getItem("currentUser") || "{}"
    );

    return String(
      currentUser?.shopCode ||
        currentUser?.shopcode ||
        ""
    )
      .trim()
      .toUpperCase();
  };

  /*
   * ---------------------------------------------------------
   * STONE CODE ENABLE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    setIsStoneCodeEnabled(!!itemCode);
  }, [itemCode]);

  /*
   * ---------------------------------------------------------
   * CALCULATE CURRENT STONE AMOUNT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const qty = getQty(stoneRow.qty);

    const wt = getWt(stoneRow.wt);

    const rate = getAmt(stoneRow.rate);

    const amount =
      wt > 0
        ? wt * rate
        : qty * rate;

    const formattedAmount = fmtAmt(amount);

    if (stoneRow.amount !== formattedAmount) {
      setStoneRow((prev) => ({
        ...prev,
        amount: formattedAmount,
      }));
    }
  }, [
    stoneRow.qty,
    stoneRow.wt,
    stoneRow.rate,
  ]);

  /*
   * ---------------------------------------------------------
   * STONE SELECTED FROM LOOKUP
   * ---------------------------------------------------------
   */





  const handleStoneSelect = (stone: any) => {
    const rate =
      stone.SRate ??
      stone.sRate ??
      stone.srate ??
      stone.rate ??
      "0.00";

    setStoneRow((prev) => ({
      ...prev,

      stoneCode:
        stone.SCode ||
        stone.sCode ||
        stone.scode ||
        "",

      color:
        stone.SUnit ||
        stone.sUnit ||
        stone.sunit ||
        stone.ut ||
        "",

      type:
        stone.SType ||
        stone.sType ||
        stone.stype ||
        "",

      dtype:
        stone.SDtype ||
        stone.sDtype ||
        stone.sdtype ||
        stone.tp ||
        "Y",

      rate: String(rate),
    }));

    setTimeout(() => {
      stoneRefs.current["qty"]?.focus();
    }, 0);
  };

  /*
   * ---------------------------------------------------------
   * OPEN STONE LOOKUP
   * ---------------------------------------------------------
   */

  const openStoneLookup = () => {
    const shopCode = resolveShopCode();

    showLookup(
      lookupConfigs.stone(
        handleStoneSelect,
        shopCode
      )
    );
  };

  /*
   * ---------------------------------------------------------
   * SAVE STONE ROW
   * ---------------------------------------------------------
   */

  const saveStoneRow = () => {
    if (!stoneRow.stoneCode?.trim()) {
      return null;
    }

    const rowToSave: StoneRow = {
      ...stoneRow,

      qty: String(
        Number(stoneRow.qty || 0)
      ),

      wt: fmtWt(stoneRow.wt),

      rate: fmtAmt(stoneRow.rate),

      amount: fmtAmt(stoneRow.amount),
    };

    let newGrid: StoneRow[];

    if (editingStoneIndex !== null) {
      /*
       * EDIT EXISTING ROW
       */

      newGrid = [...stoneGrid];

      newGrid[editingStoneIndex] = {
        ...rowToSave,
        sNo: stoneGrid[editingStoneIndex]?.sNo,
      };

      setEditingStoneIndex(null);
    } else {
      /*
       * ADD NEW ROW
       */

      newGrid = [
        ...stoneGrid,

        {
          ...rowToSave,
          sNo: String(stoneGrid.length + 1),
        },
      ];
    }

    setStoneGrid(newGrid);

    /*
     * RESET INPUT
     */

    setStoneRow({
      ...stoneEmpty,
      sNo: String(newGrid.length + 1),
    });

    /*
     * CALCULATE TOTALS
     */

    const {
      totalWt,
      totalAmt,
    } = calculateStoneTotals(newGrid);

    /*
     * GROSS WEIGHT VALIDATION
     */

    const grossWeight = getWt(grossWt);

    if (
      totalWt > grossWeight &&
      grossWeight > 0
    ) {
      showPopupMessage(
        `Gross Weight (${grossWeight}) cannot be less than Stone Weight (${fmtWt(
          totalWt
        )})`,
        "Validation"
      );
    }

    /*
     * UPDATE SALES ROW
     */

    const stoneWeight = fmtWt(totalWt);

    const stoneCharge = fmtAmt(totalAmt);

    const netWeight = fmtWt(
      Math.max(
        0,
        grossWeight - totalWt
      )
    );

    const goldAmount = fmtAmt(
      getWt(netWeight) *
        getAmt(goldRate)
    );

    setSalesRow((prev: any) => ({
      ...prev,

      stoneWt: stoneWeight,

      stnChg: stoneCharge,

      netWt: netWeight,

      goldAmt: goldAmount,
    }));

    return newGrid;
  };

  /*
   * ---------------------------------------------------------
   * COMPLETE STONE
   * ---------------------------------------------------------
   */


  
  const completeStoneRow = () => {
    const result = saveStoneRow();

    if (!result) {
      return;
    }

    setTimeout(() => {
      stoneRefs.current[
        "stoneCode"
      ]?.focus();
    }, 100);
  };

  /*
   * ---------------------------------------------------------
   * ADD STONE
   * ---------------------------------------------------------
   */

  const addStone = () => {
    const result = saveStoneRow();

    if (!result) {
      return;
    }

    /*
     * Original SalesEntry asks whether
     * user wants to add another stone.
     *
     * For now we keep the focus behaviour.
     */

    setTimeout(() => {
      stoneRefs.current[
        "stoneCode"
      ]?.focus();
    }, 100);
  };

  /*
   * ---------------------------------------------------------
   * KEYBOARD NAVIGATION
   *
   * Code → Qty → Wt/Ct → Rate → Amount
   * → Type → DType → +
   * ---------------------------------------------------------
   */

  const handleStoneEnter = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextField: string
  ) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    if (nextField === "COMPLETE") {
      stonePlusBtnRef.current?.focus();

      return;
    }

    stoneRefs.current[
      nextField
    ]?.focus();
  };

  /*
   * ---------------------------------------------------------
   * STONE CODE ENTER
   * ---------------------------------------------------------
   */

  const handleStoneCodeEnter = async (
    e: any,
    isBlur = false
  ) => {
    if (e.key === "PageDown") {
      e.preventDefault();

      setTimeout(() => {
        salesRefs.current[
          "vaPer"
        ]?.focus();
      }, 50);

      return;
    }

    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const code =
      String(
        stoneRow.stoneCode || ""
      ).trim();

    /*
     * EMPTY CODE
     * OPEN LOOKUP
     */

    if (!code) {
      if (!isBlur) {
        openStoneLookup();
      }

      return;
    }

    /*
     * PREVENT DUPLICATE REQUEST
     */

    if (
      isValidatingStoneRef.current
    ) {
      return;
    }

    isValidatingStoneRef.current = true;

    try {
      const shopCode =
        resolveShopCode();

      const response =
        await SalesService.getStones(
          shopCode
        );

      const stones =
        response?.data || [];

      const match = stones.find(
        (stone: any) => {
          const stoneCode =
            stone.SCode ||
            stone.sCode ||
            stone.scode ||
            "";

          return (
            String(stoneCode)
              .toUpperCase() ===
            code.toUpperCase()
          );
        }
      );

      if (match) {
        handleStoneSelect(match);
      } else {
        /*
         * INVALID CODE
         */

        if (!isBlur) {
          setStoneRow((prev) => ({
            ...prev,
            stoneCode: "",
          }));

          openStoneLookup();
        }
      }
    } catch (error) {
      console.error(
        "Error matching stone:",
        error
      );

      if (!isBlur) {
        setStoneRow((prev) => ({
          ...prev,
          stoneCode: "",
        }));

        openStoneLookup();
      }
    } finally {
      isValidatingStoneRef.current =
        false;
    }
  };

  /*
   * ---------------------------------------------------------
   * DOUBLE TAP / EDIT STONE
   * ---------------------------------------------------------
   */

  const handleStoneRowTap = (
    index: number
  ) => {
    const now = Date.now();

    const DOUBLE_TAP_DELAY = 300;

    if (
      lastTapIndex === index &&
      now - lastTapTime <
        DOUBLE_TAP_DELAY
    ) {
      /*
       * DOUBLE TAP
       * LOAD ROW INTO EDIT AREA
       */

      setEditingStoneIndex(index);

      setStoneRow({
        ...stoneGrid[index],
      });

      setTimeout(() => {
        stoneRefs.current[
          "stoneCode"
        ]?.focus();
      }, 100);

      setLastTapIndex(null);

      setLastTapTime(0);

      return;
    }

    /*
     * FIRST TAP
     */

    setLastTapIndex(index);

    setLastTapTime(now);
  };

  /*
   * ---------------------------------------------------------
   * INPUT CHANGE HELPERS
   * ---------------------------------------------------------
   */

  const updateStone = (
    field: keyof StoneRow,
    value: string
  ) => {
    setStoneRow((prev) => ({
      ...prev,

      [field]: value,
    }));
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="compact-card bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-sm flex flex-col lg:flex-1 min-w-0 w-full">

      {/* HEADER */}

      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">

        <div className="w-6 h-6 rounded-md bg-slate-500/10 flex items-center justify-center">

          <Gem className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />

        </div>

        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
          Stone Details
        </h3>

      </div>

      {/* TABLE */}

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-50/50 dark:bg-slate-900/50 h-[200px] flex flex-col min-h-0">

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

              {/* COLUMN HEADERS */}

              <tr className="modern-table-header">

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  Sln
                </th>

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  Code
                </th>

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  Unit
                </th>

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  Qty
                </th>

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  Wt/Ct
                </th>

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  Rate
                </th>

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  Amount
                </th>

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  Tp
                </th>

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  Dd
                </th>

                <th className={`px-1 py-2 text-center ${tableTypography.header}`}>
                  +
                </th>

              </tr>

              {/* INPUT ROW */}

              <tr className="bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm">

                {/* S.NO */}

                <td className="px-1 py-1.5">

                  <div
                    className={`text-center text-slate-400 dark:text-slate-500 ${tableTypography.cellMono}`}
                  >
                    {stoneRow.sNo}
                  </div>

                </td>

                {/* STONE CODE */}

                <td className="px-1 py-1.5">

                  <div className="relative">

                    <input
                      ref={(el) => {
                        stoneRefs.current[
                          "stoneCode"
                        ] = el;
                      }}
                      disabled={
                        !isFormEnabled ||
                        !itemCode
                      }
                      readOnly={
                        !isStoneCodeEnabled
                      }
                      placeholder="CODE"
                      className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 pl-1 pr-6 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center focus:bg-emerald-50 dark:focus:bg-emerald-900/20 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 disabled:bg-slate-100/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed disabled:opacity-60 ${tableTypography.cellMono}`}
                      value={
                        stoneRow.stoneCode ||
                        ""
                      }
                      onChange={(e) =>
                        updateStone(
                          "stoneCode",
                          e.target.value
                        )
                      }
                      onDoubleClick={
                        openStoneLookup
                      }
                      onKeyDown={
                        handleStoneCodeEnter
                      }
                      onBlur={(e) =>
                        handleStoneCodeEnter(
                          {
                            ...e,
                            key: "Enter",
                            preventDefault:
                              () => {},
                          },
                          true
                        )
                      }
                    />

                    <button
                      type="button"
                      tabIndex={-1}
                      disabled={
                        !isFormEnabled ||
                        !itemCode
                      }
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={
                        openStoneLookup
                      }
                      title="Search Stone"
                    >
                      <Search className="w-3 h-3" />
                    </button>

                  </div>

                </td>

                {/* UNIT */}

                <td className="px-1 py-1.5">

                  <input
                    ref={(el) => {
                      stoneRefs.current[
                        "color"
                      ] = el;
                    }}
                    disabled={!isFormEnabled}
                    placeholder="UNIT"
                    className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center ${tableTypography.cellText}`}
                    value={
                      stoneRow.color || ""
                    }
                    onChange={(e) =>
                      updateStone(
                        "color",
                        e.target.value.toUpperCase()
                      )
                    }
                    onKeyDown={(e) =>
                      handleStoneEnter(
                        e,
                        "qty"
                      )
                    }
                  />

                </td>

                {/* QTY */}

                <td className="px-1 py-1.5">

                  <input
                    ref={(el) => {
                      stoneRefs.current[
                        "qty"
                      ] = el;
                    }}
                    disabled={!isFormEnabled}
                    placeholder="QTY"
                    className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right ${tableTypography.cellMono}`}
                    value={
                      stoneRow.qty || ""
                    }
                    onChange={(e) =>
                      updateStone(
                        "qty",
                        e.target.value.replace(
                          /[^\d.]/g,
                          ""
                        )
                      )
                    }
                    onKeyDown={(e) =>
                      handleStoneEnter(
                        e,
                        "wt"
                      )
                    }
                    onFocus={(e) => {
                      setTimeout(
                        () =>
                          e.currentTarget.select(),
                        0
                      );
                    }}
                  />

                </td>

                {/* WT / CT */}

                <td className="px-1 py-1.5">

                  <input
                    ref={(el) => {
                      stoneRefs.current[
                        "wt"
                      ] = el;
                    }}
                    disabled={!isFormEnabled}
                    placeholder="WT/CT"
                    className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right ${tableTypography.cellMono}`}
                    value={
                      stoneRow.wt || ""
                    }
                    onChange={(e) =>
                      updateStone(
                        "wt",
                        e.target.value.replace(
                          /[^\d.]/g,
                          ""
                        )
                      )
                    }
                    onKeyDown={(e) =>
                      handleStoneEnter(
                        e,
                        "rate"
                      )
                    }
                    onFocus={(e) => {
                      setTimeout(
                        () =>
                          e.currentTarget.select(),
                        0
                      );
                    }}
                  />

                </td>

                {/* RATE */}

                <td className="px-1 py-1.5">

                  <input
                    ref={(el) => {
                      stoneRefs.current[
                        "rate"
                      ] = el;
                    }}
                    disabled={!isFormEnabled}
                    placeholder="RATE"
                    className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-right ${tableTypography.cellMono}`}
                    value={
                      stoneRow.rate || ""
                    }
                    onChange={(e) =>
                      updateStone(
                        "rate",
                        e.target.value.replace(
                          /[^\d.]/g,
                          ""
                        )
                      )
                    }
                    onBlur={(e) => {
                      if (
                        !e.target.value.trim() ||
                        e.target.value === "."
                      ) {
                        updateStone(
                          "rate",
                          "0.00"
                        );
                      }
                    }}
                    onKeyDown={(e) =>
                      handleStoneEnter(
                        e,
                        "type"
                      )
                    }
                    onFocus={(e) => {
                      setTimeout(
                        () =>
                          e.currentTarget.select(),
                        0
                      );
                    }}
                  />

                </td>

                {/* AMOUNT */}

                <td className="px-1 py-1.5">

                  <input
                    ref={(el) => {
                      stoneRefs.current[
                        "amount"
                      ] = el;
                    }}
                    className={`w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 px-1 outline-none bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-right ${tableTypography.cellAmount}`}
                    value={
                      stoneRow.amount ||
                      "0.00"
                    }
                    readOnly
                    onKeyDown={(e) =>
                      handleStoneEnter(
                        e,
                        "type"
                      )
                    }
                  />

                </td>

                {/* TYPE */}

                <td className="px-1 py-1.5">

                  <input
                    ref={(el) => {
                      stoneRefs.current[
                        "type"
                      ] = el;
                    }}
                    disabled={!isFormEnabled}
                    placeholder="TP"
                    className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center ${tableTypography.cellText}`}
                    value={
                      stoneRow.type || ""
                    }
                    onChange={(e) =>
                      updateStone(
                        "type",
                        e.target.value.toUpperCase()
                      )
                    }
                    onKeyDown={(e) =>
                      handleStoneEnter(
                        e,
                        "dtype"
                      )
                    }
                  />

                </td>

                {/* DTYPE */}

                <td className="px-1 py-1.5">

                  <input
                    ref={(el) => {
                      stoneRefs.current[
                        "dtype"
                      ] = el;
                    }}
                    disabled={!isFormEnabled}
                    placeholder="DD"
                    className={`w-full h-8 rounded-md border border-slate-300 dark:border-slate-600 px-1 outline-none transition-all shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-center ${tableTypography.cellText}`}
                    value={
                      stoneRow.dtype || ""
                    }
                    onChange={(e) =>
                      updateStone(
                        "dtype",
                        e.target.value.toUpperCase()
                      )
                    }
                    onKeyDown={(e) =>
                      handleStoneEnter(
                        e,
                        "COMPLETE"
                      )
                    }
                  />

                </td>

                {/* PLUS */}

                <td className="px-1 py-1.5 text-center">

                  <button
                    ref={stonePlusBtnRef}
                    type="button"
                    disabled={!isFormEnabled}
                    onClick={addStone}
                    className="w-7 h-7 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:outline-none mx-auto"
                    title="Add Stone"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                </td>

              </tr>

            </thead>

            {/* GRID */}

            <tbody>

              {stoneGrid.map(
                (row, index) => (
                  <tr
                    key={`${row.sNo}-${index}`}
                    className={`modern-table-row border-b border-slate-100 dark:border-slate-800 cursor-pointer h-10 ${
                      editingStoneIndex ===
                      index
                        ? "bg-sky-500 text-white font-bold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();

                      setEditingStoneIndex(
                        index
                      );

                      setStoneRow({
                        ...row,
                      });

                      setTimeout(() => {
                        stoneRefs.current[
                          "stoneCode"
                        ]?.focus();
                      }, 100);
                    }}
                    onClick={() =>
                      handleStoneRowTap(
                        index
                      )
                    }
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
                      {String(
                        Number(
                          row.qty || 0
                        )
                      )}
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

                    <td />

                  </tr>
                )
              )}

              {stoneGrid.length ===
                0 && (
                <tr>
                  <td
                    colSpan={10}
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
  );
};

export default StoneDetails;