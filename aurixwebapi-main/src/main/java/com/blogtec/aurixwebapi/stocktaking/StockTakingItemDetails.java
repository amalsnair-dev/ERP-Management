package com.blogtec.aurixwebapi.stocktaking;

import java.math.BigDecimal;

public class StockTakingItemDetails {

    private String barcode;
    private String itemCode;
    private BigDecimal grossWeight;
    private BigDecimal num;
    private BigDecimal netWeight;
    private String itemDescription;

    public StockTakingItemDetails() {
    }

    public StockTakingItemDetails(
            String barcode,
            String itemCode,
            BigDecimal grossWeight,
            BigDecimal num,
            BigDecimal netWeight,
            String itemDescription) {

        this.barcode = barcode;
        this.itemCode = itemCode;
        this.grossWeight = grossWeight;
        this.num = num;
        this.netWeight = netWeight;
        this.itemDescription = itemDescription;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public BigDecimal getGrossWeight() {
        return grossWeight;
    }

    public void setGrossWeight(BigDecimal grossWeight) {
        this.grossWeight = grossWeight;
    }

    public BigDecimal getNum() {
        return num;
    }

    public void setNum(BigDecimal num) {
        this.num = num;
    }

    public BigDecimal getNetWeight() {
        return netWeight;
    }

    public void setNetWeight(BigDecimal netWeight) {
        this.netWeight = netWeight;
    }

    public String getItemDescription() {
        return itemDescription;
    }

    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }
}