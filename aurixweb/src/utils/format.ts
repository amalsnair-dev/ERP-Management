export const toNum = (value: any): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// ============================================================
//  GETTERS (Return Numeric Values)
// ============================================================

/** Parse to Amount (2 decimal places) */
export const getAmt = (value: any): number => Number(toNum(value).toFixed(2));

/** Parse to No / Serial (Integer) */
export const getNo = (value: any): number => Math.round(toNum(value));

/** Parse to Quantity (Integer) */
export const getQty = (value: any): number => Math.round(toNum(value));

/** Parse to Weight (3 decimal places) */
export const getWt = (value: any): number => Number(toNum(value).toFixed(3));


// ============================================================
//  FORMATTERS (Return String Values for Display)
// ============================================================

/** Format as Amount / Money — "0.00" */
export const fmtAmt = (value: any): string => toNum(value).toFixed(2);

/** Format as Serial No / Count — "0" */
export const fmtNo = (value: any): string => String(Math.round(toNum(value)));

/** Format as Quantity — "0" */
export const fmtQty = (value: any): string => String(Math.round(toNum(value)));

/** Format as Weight — "0.000" */
export const fmtWt = (value: any): string => toNum(value).toFixed(3);

/** Format with any number of decimal places */
export const fmtAny = (value: any, decimals = 2): string => toNum(value).toFixed(decimals);

/** Limit input value to at most N decimal places (for typing/onChange) */
export const limitDecimals = (val: string, maxDecimals: number = 3): string => {
  // Strip everything except digits and dots
  let sanitized = val.replace(/[^\d.]/g, "");
  // Keep only the first dot, remove the rest
  const dotIndex = sanitized.indexOf(".");
  if (dotIndex !== -1) {
    const intPart = sanitized.substring(0, dotIndex);
    const decPart = sanitized.substring(dotIndex + 1).replace(/\./g, "").substring(0, maxDecimals);
    sanitized = intPart + "." + decPart;
  }
  return sanitized;
};

const fmt = {
  getAmt,
  getNo,
  getQty,
  getWt,
  
  amt: fmtAmt,
  no:  fmtNo,
  qty: fmtQty,
  wt:  fmtWt,
  any: fmtAny,
  limitDecimals,
  
  toNum,
};

export default fmt;
