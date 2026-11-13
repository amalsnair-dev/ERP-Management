import { getAmt, getWt, getNo, fmtAmt, fmtWt } from "../utils/format";
import { SalesRow, StoneRow, HeaderData } from "../models/SalesRow";

// ==========================================
// 1. SALES ENTRY CALCULATIONS
// ==========================================

export const calculateStoneAmount = (stoneRow: StoneRow): string => {
    const qty = getNo(stoneRow.qty);
    const wt = getWt(stoneRow.wt);
    const rate = getAmt(stoneRow.rate);
    const unit = (stoneRow.color || "").toUpperCase().trim();
    return fmtAmt(unit === "P" ? qty * rate : wt * rate);
};

export const calculateStoneTotals = (grid: StoneRow[]): { totalWt: number; totalAmt: number } => {
    let totalGramWt = 0;
    let totalCaratWt = 0;
    let totalStoneAmt = 0;

    grid.forEach((stone) => {
      const wtTotal = getWt(stone.wt);
      const unit = (
        stone.color ||
        stone.sunit ||
        stone.SUnit ||
        stone.unit ||
        stone.ut ||
        stone.unitCode ||
        stone.stoneunit ||
        ""
      )
        .toUpperCase()
        .trim();
      const ded = (stone.dtype || stone.sdtype || stone.SDtype || "Y")
        .toUpperCase()
        .trim();
      const amount = getAmt(stone.amount);

      totalStoneAmt += amount;

      if (ded === "Y") {
        if (unit === "C") {
          totalCaratWt += wtTotal;
        } else {
          totalGramWt += wtTotal;
        }
      }
    });

    if (totalCaratWt > 0) {
      totalCaratWt = totalCaratWt * 0.2;
    }

    const totalDeductibleWt = totalGramWt + totalCaratWt;
    return {
      totalWt: getWt(totalDeductibleWt),
      totalAmt: totalStoneAmt,
    };
};

export const calculateAddDed = (
  row: SalesRow, 
  barWtDiffLimit: number | string
): { updatedRow: SalesRow; errorMsg: string | null } => {
    const actual = getWt(row.actualWt);
    const gross = getWt(row.grossWt);
    let updatedRow = { ...row };
    let errorMsg: string | null = null;

    if (actual > 0) {
      let diff = actual - gross;
      const limit =
        getWt(row.barWtDiffLimit) > 0
          ? getWt(row.barWtDiffLimit)
          : getWt(barWtDiffLimit) > 0
            ? getWt(barWtDiffLimit)
            : 0.5;

      if (diff >= 0) {
        updatedRow.wtDed = fmtWt(diff);
        updatedRow.wtAdd = "0.000";
      } else {
        updatedRow.wtAdd = fmtWt(Math.abs(diff));
        updatedRow.wtDed = "0.000";
      }

      const currentQty = getNo(updatedRow.qty);
      const originalQty = getNo(updatedRow.origQty);
      const qtyDiff = Math.abs(currentQty - originalQty);

      if (currentQty !== originalQty && qtyDiff !== 0) {
        updatedRow.wtDed = "0.000";
        updatedRow.wtAdd = "0.000";
      }

      const txtnoded = getNo(updatedRow.txtnoded);
      const txtnoadd = getNo(updatedRow.txtnoadd);
      
      const wtDedVal = getWt(updatedRow.wtDed);
      const wtAddVal = getWt(updatedRow.wtAdd);
      const newGrossWt = actual + wtAddVal - wtDedVal + txtnoded - txtnoadd;

      if (Math.abs(getWt(updatedRow.grossWt) - newGrossWt) > 0.0001) {
          updatedRow.grossWt = fmtWt(newGrossWt);
      }
    } else {
        updatedRow.wtAdd = "0.000";
        updatedRow.wtDed = "0.000";
    }
    return { updatedRow, errorMsg };
};

export const calculateRowSalesTotals = (
  salesRow: SalesRow, 
  headerData: HeaderData, 
  isManualVaPerEdit: boolean
): {
  effectiveStoneWt: number;
  goldWt: number;
  goldAmt: number;
  vaAmt: number;
  finalVaPer: number;
  totalAmount: number;
} => {
    const grossWt = getWt(salesRow.grossWt);
    const stoneWt = getWt(salesRow.stoneWt);
    const wastage = getWt(salesRow.wastage || 0);
    const mkchg = getAmt(salesRow.mkRate);
    const vaper = getAmt(salesRow.vaPer);
    const stnchg = getAmt(salesRow.stnChg);
    const goldRte = getAmt(headerData.gRate);

    // 2. Calculate Gold Weight (Java: grosswt - (stnwt + incremental wastage))
    const isDiamondItem = salesRow.isDiamond;
    let effectiveStoneWt = stoneWt;

    if (isDiamondItem && wastage > 0) {
      const baseGross = getWt(salesRow.baseGrossWt) || 12;
      const diff = grossWt - baseGross;
      if (diff > 0) {
        effectiveStoneWt = stoneWt + diff * (wastage / 100);
      }
    }

    let goldWt = grossWt - effectiveStoneWt;
    if (goldWt < 0) goldWt = 0;

    // 3. Calculate Gold Amount (Java: goldamt = netWt * goldRte)
    let goldAmt = goldWt * goldRte;

    // 4. Calculate VA Amount (Waterfall Priority)
    let vaAmt = 0;
    let finalVaPer = vaper;

    if (salesRow.isVaAmtManual) {
      vaAmt = getAmt(salesRow.vaAmt);
      if (goldAmt > 0) {
        finalVaPer = (vaAmt * 100) / goldAmt;
      }
    } else if (!isManualVaPerEdit && (wastage !== 0 || mkchg !== 0)) {
      let adjustedMkchg = mkchg;
      if (adjustedMkchg > 0) {
        adjustedMkchg = adjustedMkchg - goldRte;
      }
      vaAmt = wastage * goldRte + adjustedMkchg * goldWt;
      if (goldAmt > 0) {
        finalVaPer = (vaAmt * 100) / goldAmt;
      }
    } else if (isManualVaPerEdit) {
      vaAmt = goldAmt * (vaper / 100);
      finalVaPer = vaper;
    } else if (vaper !== 0) {
      vaAmt = goldAmt * (vaper / 100);
      finalVaPer = vaper;
    } else {
      vaAmt = getAmt(salesRow.vaAmt);
      if (vaAmt > 0 && goldAmt > 0) {
        finalVaPer = (vaAmt * 100) / goldAmt;
      }
    }

    let totalAmount = goldAmt + stnchg + vaAmt;

    return {
        effectiveStoneWt,
        goldWt,
        goldAmt,
        vaAmt,
        finalVaPer,
        totalAmount
    };
};

// ==========================================
// 2. CREDIT SALES CALCULATIONS
// ==========================================

export const calculateCreditSalesRow = (row: any, headerData: HeaderData): any => {
    const gold = Number(row.goldAmt || 0);
    const va = Number(row.vaAmt || 0);
    const stone = Number(row.stnChg || 0);
    const taxable = gold + va + stone;
    
    const taxRate = headerData.applyIgst ? Number(headerData.igstPer || 0) : Number(headerData.gstPer || 0);
    const taxAmt = (taxable * taxRate) / 100;
    
    return {
        ...row,
        netWt: fmtWt(Number(row.grossWt || 0) - Number(row.stoneWt || 0)),
        taxableAmt: fmtAmt(taxable),
        taxAmt: fmtAmt(taxAmt)
    };
};

// ==========================================
// 3. PURCHASE CALCULATIONS
// ==========================================



export const calculatePurchaseRow = (row: any): any => {
    const gross = parseFloat(row.grossWt) || 0;
    const stone = parseFloat(row.stoneWt) || 0;
    const net = gross - stone;
    const meltPer = parseFloat(row.meltPer) || 0;
    const vaPer = parseFloat(row.vaPer) || 0;
    const rate = parseFloat(row.rate) || 0;
    const stnChg = parseFloat(row.stnChg) || 0;

    const meltLoss = (net * meltPer) / 100;
    const fineWt = net - meltLoss;
    const vaAmt = (fineWt * vaPer) / 100; 
    const amount = (fineWt * rate) + vaAmt + stnChg;

    return {
        ...row,
        netWt: fmtWt(net),
        meltLoss: fmtWt(meltLoss),
        fineWt: fmtWt(fineWt),
        vaAmt: fmtAmt(vaAmt),
        amount: fmtAmt(amount)
    };
};
