/**
 * TypeScript Interfaces for Sales Feature Module
 */

export interface SalesHeaderState {
  estNo: string;
  estDate: string;
  gRate: number;
  grate22?: number;
  grate18?: number;
  slvrate?: number;
  goldSlv: string;
  applyIgst: boolean;
  gstPer: number;
  igstPer: number;
  barFlag: boolean;
  custId: string;
  custName: string;
  phone: string;
  address1: string;
  address2: string;
  place: string;
  pincode: string;
  aadhar: string;
  pan: string;
  gstNo: string;
  careOf: string;
  salesman: string;
  salesmanName?: string;
  printEstimate?: boolean;
}

export interface SalesRowItem {
  slNo?: number;
  itemCode: string;
  itemDesc: string;
  qty: number | string;
  grossWt: number | string;
  stoneWt: number | string;
  netWt: number | string;
  stnChg: number | string;
  goldAmt?: number | string;
  vaPer?: number | string;
  vaAmt?: number | string;
  rate: number | string;
  amount: number | string;
  cntr?: string;
  sMan?: string;
  barcode?: string;
  stoneDetails?: any[];
}

export interface PurchaseRowItem {
  slNo?: number;
  itemCode: string;
  itemDesc: string;
  qty: number | string;
  grossWt: number | string;
  stoneWt: number | string;
  netWt: number | string;
  meltPer?: number | string;
  meltLoss?: number | string;
  vaPer?: number | string;
  vaAmt?: number | string;
  stnChg?: number | string;
  rate: number | string;
  amount: number | string;
  gRate?: number | string;
  touch?: number | string;
  dCode?: string;
  dNo?: string;
  dCWt?: number | string;
}

export interface AdvanceRowItem {
  slNo?: number;
  advName: string;
  advNo: string;
  custName?: string;
  advAmt: number | string;
  balAmt?: number | string;
  advOrderYear?: string | number;
  barflag?: boolean;
  schemeBonus?: number | string;
  schemeGrossWt?: number | string;
  schemeDesc?: string;
}

export interface CreditNoteRowItem {
  slNo?: number;
  itemCode: string;
  itemDesc: string;
  qty: number | string;
  grossWt: number | string;
  netWt: number | string;
  taxableAmt: number | string;
  taxAmt: number | string;
  rowTotal: number | string;
  sBillNo: string;
  sDate: string;
  trSlno: string;
  invoiceNo?: string;
  finYearRow?: string;
}
