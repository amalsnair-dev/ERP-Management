import React from "react";
import { useSalesBillingState } from "./hooks/useSalesBillingState";
import { SalesHeaderSection } from "./components/SalesHeaderSection";
import { SalesItemsTable } from "./components/SalesItemsTable";
import { PurchaseItemsTable } from "./components/PurchaseItemsTable";
import { AdvanceItemsTable } from "./components/AdvanceItemsTable";
import SalesTotalsPanel from "../../components/pages/sales/SalesTotalsPanel";

export const SalesEntryFeature: React.FC = () => {
  const {
    headerData,
    updateHeaderField,
    salesGrid,
    removeSalesRow,
    purchaseGrid,
    removePurchaseRow,
    creditNoteGrid,
    advanceGrid,
    removeAdvanceRow,
    isEstNoLocked,
    isMetalLocked,
  } = useSalesBillingState();

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Header Section */}
      <SalesHeaderSection
        headerData={headerData}
        onUpdateField={updateHeaderField}
        isEstNoLocked={isEstNoLocked}
        isMetalLocked={isMetalLocked}
      />

      {/* 2. Main Sales Items Grid Table */}
      <SalesItemsTable items={salesGrid} onRemoveRow={removeSalesRow} />

      {/* 3. Purchase / Old Gold Deductions Table (Conditional) */}
      <PurchaseItemsTable items={purchaseGrid} onRemoveRow={removePurchaseRow} />

      {/* 4. Advance / Order Redemptions Table (Conditional) */}
      <AdvanceItemsTable items={advanceGrid} onRemoveRow={removeAdvanceRow} />

      {/* 5. Sales Totals Summary Panel */}
      <SalesTotalsPanel
        salesGrid={salesGrid}
        headerData={headerData}
        purchaseGrid={purchaseGrid}
        creditNoteGrid={creditNoteGrid}
        advanceGrid={advanceGrid}
      />
    </div>
  );
};

export default SalesEntryFeature;
