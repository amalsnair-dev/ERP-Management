/**
 * TypeScript Data Definitions for Receipt Gold Heating Details
 * Derived from Java Swing ReceiptGoldHeatingFrame.java
 */

// 1. Header State
export interface ReceiptGoldHeatingHeaderState {
  estNo: string;
  estDate: string;
  salesmanCode?: string;
  salesmanName: string;
  crmId: string;
  phone: string;
  custName: string;
  metalType: "GOLD" | "SILVER";
  isConfirmed: boolean; // rec_flag in Java
}

// 2. Receipt Item Row (Issued + Received)
export interface ReceiptGoldHeatingRow {
  slNo: number; // row_id in DB
  itemCode: string;
  itemDesc: string;
  qty: number;
  grossWt: number;
  stoneWt: number;
  netWt: number;
  remarks: string;
  recGrossWt: number;
  recStoneWt: number;
  recNetWt: number;
  recRemarks: string;
  originalRowId?: number | null;
}

// 3. Estimate Summary for Pickup Modal
export interface EstimatePickupItem {
  estno: string | number;
  entrydate: string;
  sm_name: string;
  cust_id: string;
  cust_name: string;
  phone: string;
  rec_flag: boolean;
  gld_slv?: string;
}
