// Matches StoneEstDto.java & Frontend UI State
export interface StoneRow {
    // Backend/DTO fields
    estNo?: number;
    itSlno?: number;
    slno?: number;
    barcode?: string;
    stype?: string;
    stnTyp?: string;
    stnName?: string;
    stnNos?: number;
    stnQty?: number;
    stnRate?: number;
    stnAmt?: number;
    aftStnrate?: number;
    aftStnamt?: number;

    // Frontend fields
    sNo?: string | number;
    stoneCode?: string;
    color?: string;
    qty?: string | number;
    wt?: string | number;
    rate?: string | number;
    amount?: string | number;
    dtype?: string;
    
    // Miscellaneous unit/deductible variants from calculator
    sunit?: string;
    SUnit?: string;
    unit?: string;
    ut?: string;
    unitCode?: string;
    stoneunit?: string;
    sdtype?: string;
    SDtype?: string;
}

// Matches SetSaleEstDto.java & Frontend UI State
export interface SalesRow {
    // Backend/DTO fields
    estNo?: number;
    slno?: number;
    itSlno?: number;
    estBarcode?: string;
    estIcode?: string;
    estItdesc?: string;
    estCntr?: string;
    estQty?: number;
    estNoded?: number;
    estWt?: number;
    estStnwt?: number;
    estWtded?: number;
    estWtadd?: number;
    estActualwt?: number;
    estNtwt?: number;
    estMkch?: number;
    estVaper?: number;
    estWage?: number;
    estVamt?: number;
    estStnch?: number;
    estRate?: string | number;
    estGamt?: number;
    estTamt?: number;
    estGstper?: number;
    estIgstper?: number;
    estOthtaxper?: number;
    estGstamt?: number;
    estIgstamt?: number;
    estOthtaxamt?: number;
    totalamount?: number;
    barflag?: boolean;
    estSman?: string;
    estSman1?: string;
    afterva?: number;
    aftervaamt?: number;
    afterstnch?: number;
    huid?: string;
    billtime?: string;

    // Frontend fields
    barcode?: string;
    itemCode?: string;
    itemDesc?: string;
    cntr?: string;
    actualWt?: string | number;
    noded?: string | number;
    wtAdd?: string | number;
    wtDed?: string | number;
    qty?: string | number;
    grossWt?: string | number;
    stoneWt?: string | number;
    netWt?: string | number;
    vaPer?: string | number;
    mkRate?: string | number;
    vaAmt?: string | number;
    stnChg?: string | number;
    goldAmt?: string | number;
    amount?: string | number;
    slNo?: string | number;
    sMan?: string;
    isDiamond?: boolean;
    origQty?: string | number;
    billType?: string;
    
    // Calculator/UI flags
    baseGrossWt?: string | number;
    isVaAmtManual?: boolean;
    barWtDiffLimit?: string | number;
    txtnoded?: string | number;
    txtnoadd?: string | number;

    // Nesting
    stones?: StoneRow[];
}

export interface HeaderData {
    estNo?: string;
    estDate?: string;
    gRate?: string | number;
    goldSlv?: string;
    gstPer?: string | number;
    igstPer?: string | number;
    applyIgst?: boolean;
    custId?: string;
    custName?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    place?: string;
    pincode?: string;
    email?: string;
    aadhar?: string;
    pan?: string;
    gstNo?: string;
    careOf?: string;
    salesman?: string;
    salesmanName?: string;
    shopCode?: string;
    rateFix?: boolean;
    printEstimate?: boolean;
    barFlag?: boolean;
}
