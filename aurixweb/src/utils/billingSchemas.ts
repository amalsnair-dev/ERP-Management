import { z } from "zod";

/**
 * Customer Header Validation Schema
 */
/**
 * Customer Header Validation Schema
 */
export const CustomerHeaderSchema = z.object({
  estNo: z.union([z.string(), z.number()]).optional(),
  estDate: z.string().optional(),
  gRate: z.coerce
    .number({ message: "Gold Rate must be a valid number" })
    .min(0, "Gold Rate cannot be negative"),
  goldSlv: z.string().optional(),
  custName: z.string().optional(),
  phone: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? String(val).trim() : ""))
    .refine(
      (val) => !val || /^[0-9]{10}$/.test(val),
      "Phone number must be a 10-digit number"
    ),
  salesman: z.string().optional(),
});

/**
 * Sales Item Row Validation Schema
 */
export const SalesItemRowSchema = z
  .object({
    slNo: z.union([z.string(), z.number()]).optional(),
    itemCode: z.string().nonempty("Item Code is required"),
    itemDesc: z.string().optional(),
    qty: z.coerce.number().min(1, "Quantity must be at least 1"),
    grossWt: z.coerce.number().min(0, "Gross Weight cannot be negative"),
    stoneWt: z.coerce.number().min(0, "Stone Weight cannot be negative"),
    netWt: z.coerce.number().min(0, "Net Weight cannot be negative"),
    rate: z.coerce.number().min(0, "Item Rate cannot be negative"),
    amount: z.coerce.number().min(0, "Amount cannot be negative"),
  })
  .refine((data) => data.stoneWt <= data.grossWt, {
    message: "Stone Weight cannot exceed Gross Weight",
    path: ["stoneWt"],
  });

/**
 * Purchase Deduction Row Validation Schema
 */
export const PurchaseItemRowSchema = z.object({
  itemCode: z.string().optional(),
  grossWt: z.coerce.number().min(0, "Purchase Gross Weight cannot be negative"),
  netWt: z.coerce.number().min(0, "Purchase Net Weight cannot be negative"),
  amount: z.coerce.number().min(0, "Purchase Amount cannot be negative"),
});

/**
 * Helper to validate complete estimate transaction payload before saving
 */
export const validateEstimateSubmission = (
  headerData: any,
  salesGrid: any[],
  purchaseGrid: any[] = [],
  advanceGrid: any[] = [],
  creditNoteGrid: any[] = []
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 1. Validate Header
  const parsedGRate = Number(headerData?.gRate || 0);
  const headerResult = CustomerHeaderSchema.safeParse({
    ...headerData,
    gRate: parsedGRate,
  });

  if (!headerResult.success) {
    headerResult.error.issues.forEach((err) => {
      errors.push(`Header: ${err.message}`);
    });
  }

  // 2. Validate Sales Items Grid
  if ((!salesGrid || salesGrid.length === 0) &&
      (!purchaseGrid || purchaseGrid.length === 0) &&
      (!creditNoteGrid || creditNoteGrid.length === 0)) {
    errors.push("Sales Grid: At least one sales item is required before saving.");
  }

  if (salesGrid?.length > 0) {
    salesGrid.forEach((row, idx) => {
      const rowResult = SalesItemRowSchema.safeParse({
        ...row,
        qty: Number(row.qty || 1),
        grossWt: Number(row.grossWt || 0),
        stoneWt: Number(row.stoneWt || 0),
        netWt: Number(row.netWt || 0),
        rate: Number(row.rate || 0),
        amount: Number(row.amount || 0),
      });

      if (!rowResult.success) {
        rowResult.error.issues.forEach((err) => {
          errors.push(`Item #${idx + 1} (${row.itemCode || "Row"}): ${err.message}`);
        });
      }
    });
  }

  // 3. Validate Purchase Items Grid
  (purchaseGrid || []).forEach((pRow, idx) => {
    const pResult = PurchaseItemRowSchema.safeParse({
      ...pRow,
      grossWt: Number(pRow.grossWt || 0),
      netWt: Number(pRow.netWt || 0),
      amount: Number(pRow.amount || 0),
    });

    if (!pResult.success) {
      pResult.error.issues.forEach((err) => {
        errors.push(`Purchase Item #${idx + 1}: ${err.message}`);
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};
