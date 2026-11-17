package com.blogtec.aurixwebapi.stocktaking;

import java.math.BigDecimal;

public class StockTakingTransactionResponse {

    private boolean success;
    private String barcode;
    private String code;
    private BigDecimal qty;
    private BigDecimal grossWt;
    private BigDecimal netWt;

    public StockTakingTransactionResponse() {
    }

    public StockTakingTransactionResponse(
            boolean success,
            String barcode,
            String code,
            BigDecimal qty,
            BigDecimal netWt,
            BigDecimal grossWt) {

        this.success = success;
        this.barcode = barcode;
        this.code = code;
        this.qty = qty;
        this.netWt = netWt;
        this.grossWt = grossWt;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public BigDecimal getQty() {
        return qty;
    }

    public void setQty(BigDecimal qty) {
        this.qty = qty;
    }

    public BigDecimal getNetWt() {
        return netWt;
    }

    public void setNetWt(BigDecimal netWt) {
        this.netWt = netWt;
    }
    
    public BigDecimal getGrossWt() {
        return grossWt;
    }

    public void setGrossWt(BigDecimal grossWt) {
        this.grossWt = grossWt;
    }
}