import { useState, useCallback } from "react";
import {
  SalesHeaderState,
  SalesRowItem,
  PurchaseRowItem,
  AdvanceRowItem,
  CreditNoteRowItem,
} from "../types/salesTypes";

const initialHeaderState: SalesHeaderState = {
  estNo: "",
  estDate: new Date().toISOString().split("T")[0],
  gRate: 0,
  goldSlv: "GOLD",
  applyIgst: false,
  gstPer: 3.0,
  igstPer: 3.0,
  barFlag: false,
  custId: "",
  custName: "",
  phone: "",
  address1: "",
  address2: "",
  place: "",
  pincode: "",
  aadhar: "",
  pan: "",
  gstNo: "",
  careOf: "",
  salesman: "",
  printEstimate: true,
};

export const useSalesBillingState = () => {
  const [headerData, setHeaderData] = useState<SalesHeaderState>(initialHeaderState);
  const [salesGrid, setSalesGrid] = useState<SalesRowItem[]>([]);
  const [purchaseGrid, setPurchaseGrid] = useState<PurchaseRowItem[]>([]);
  const [creditNoteGrid, setCreditNoteGrid] = useState<CreditNoteRowItem[]>([]);
  const [advanceGrid, setAdvanceGrid] = useState<AdvanceRowItem[]>([]);

  const [actionStatus, setActionStatus] = useState<"NEW" | "MODIFY" | "VIEW" | "DELETE">("NEW");
  const [isMetalLocked, setIsMetalLocked] = useState<boolean>(false);
  const [isEstNoLocked, setIsEstNoLocked] = useState<boolean>(false);

  const updateHeaderField = useCallback((field: keyof SalesHeaderState, value: any) => {
    setHeaderData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addSalesRow = useCallback((row: SalesRowItem) => {
    setSalesGrid((prev) => [...prev, { ...row, slNo: prev.length + 1 }]);
  }, []);

  const removeSalesRow = useCallback((index: number) => {
    setSalesGrid((prev) =>
      prev.filter((_, i) => i !== index).map((item, idx) => ({ ...item, slNo: idx + 1 }))
    );
  }, []);

  const addPurchaseRow = useCallback((row: PurchaseRowItem) => {
    setPurchaseGrid((prev) => [...prev, { ...row, slNo: prev.length + 1 }]);
  }, []);

  const removePurchaseRow = useCallback((index: number) => {
    setPurchaseGrid((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addAdvanceRow = useCallback((row: AdvanceRowItem) => {
    setAdvanceGrid((prev) => [...prev, { ...row, slNo: prev.length + 1 }]);
  }, []);

  const removeAdvanceRow = useCallback((index: number) => {
    setAdvanceGrid((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetTransaction = useCallback(() => {
    setHeaderData({
      ...initialHeaderState,
      estDate: new Date().toISOString().split("T")[0],
    });
    setSalesGrid([]);
    setPurchaseGrid([]);
    setCreditNoteGrid([]);
    setAdvanceGrid([]);
    setActionStatus("NEW");
    setIsMetalLocked(false);
    setIsEstNoLocked(false);
  }, []);

  return {
    headerData,
    setHeaderData,
    updateHeaderField,
    salesGrid,
    setSalesGrid,
    addSalesRow,
    removeSalesRow,
    purchaseGrid,
    setPurchaseGrid,
    addPurchaseRow,
    removePurchaseRow,
    creditNoteGrid,
    setCreditNoteGrid,
    advanceGrid,
    setAdvanceGrid,
    addAdvanceRow,
    removeAdvanceRow,
    actionStatus,
    setActionStatus,
    isMetalLocked,
    setIsMetalLocked,
    isEstNoLocked,
    setIsEstNoLocked,
    resetTransaction,
  };
};
