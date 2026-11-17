/**
 * TypeScript Data Definitions for Gold Heating Details
 * Derived from Java Swing GoldHeatingDetails.java
 */

// 1. Header Information State
export interface GoldHeatingHeaderState {
  estNo: string;
  estDate: string;
  salesmanCode: string;
  salesmanName: string;
  crmId: string;
  phone: string;
  custName: string;
  metalType: "GOLD" | "SILVER";
  isConfirmed: boolean; // iss_flag in Java
}

// 2. Single Item Grid Row
export interface GoldHeatingRow {
  slNo: number;
  itemCode: string;
  itemDesc: string;
  qty: number;
  grossWt: number;
  stoneWt: number;
  netWt: number; // grossWt - stoneWt
  remarks: string;
}

// 3. Overall Form Action Status
export type ActionStatus = "NONE" | "NEW" | "MODIFY" | "CONFIRM";

// 4. Estimate Summary for Pickup Modal
export interface EstimatePickupItem {
  estno: string | number;
  entrydate: string;
  sm_name: string;
  cust_id: string;
  cust_name: string;
  phone: string;
  iss_flag: boolean;
  rec_flag: boolean;
  gld_slv?: string;
}