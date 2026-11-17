import { describe, it, expect } from "vitest";
import { calculateStoneAmount, calculateRowSalesTotals } from "./SharedBillingCalculator";
import { SalesRow, StoneRow, HeaderData } from "../models/SalesRow";

describe("SharedBillingCalculator - Stone Amount", () => {
  it("should calculate stone amount by piece when unit is 'P'", () => {
    const stone: StoneRow = {
      qty: 2,
      wt: 1.5,
      rate: 500,
      color: "P",
    };
    // P-unit: qty (2) * rate (500) = 1000.00
    expect(calculateStoneAmount(stone)).toBe("1000.00");
  });

  it("should calculate stone amount by weight when unit is not 'P'", () => {
    const stone: StoneRow = {
      qty: 2,
      wt: 1.5,
      rate: 500,
      color: "G", // gram unit
    };
    // G-unit: wt (1.5) * rate (500) = 750.00
    expect(calculateStoneAmount(stone)).toBe("750.00");
  });
});

describe("SharedBillingCalculator - Sales Row Totals", () => {
  it("should calculate correct sales row totals", () => {
    const salesRow: SalesRow = {
      grossWt: "10.000",
      stoneWt: "2.000",
      actualWt: "10.000",
      wastage: "0.500", // wastage
      mkRate: "5100.00",  // total rate (5100 - 5000 gold rate = 100 making charge per gram)
      vaPer: "5.00",
      stnChg: "150.00",
      isDiamond: false,
      isVaAmtManual: false,
    };

    const headerData: HeaderData = {
      gRate: 5000, // Gold Rate per gram
    };

    const result = calculateRowSalesTotals(salesRow, headerData, false);

    // goldWt = grossWt (10.000) - effectiveStoneWt (2.000) = 8.000
    expect(result.goldWt).toBe(8);
    
    // goldAmt = goldWt (8.000) * goldRte (5000) = 40000.00
    expect(result.goldAmt).toBe(40000);
    
    // vaAmt calculation: wastage (0.5 * 5000 = 2500) + making charge (100 * 8 = 800) = 3300.00
    expect(result.vaAmt).toBe(3300);

    // totalAmount = goldAmt (40000) + stnchg (150) + vaAmt (3300) = 43450.00
    expect(result.totalAmount).toBe(43450);
  });
});
