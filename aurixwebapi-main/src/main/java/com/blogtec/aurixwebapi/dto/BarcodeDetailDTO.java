package com.blogtec.aurixwebapi.dto;

public interface BarcodeDetailDTO {

    String getBarcode();
    Integer getSlno();
    java.time.LocalDate getBardate();

    String getItemcode();
    String getItemname();
    Integer getQty();

    java.math.BigDecimal getGrossweight();
    java.math.BigDecimal getStoneweight();
    java.math.BigDecimal getNetweight();

    java.math.BigDecimal getStonecharge();
    java.math.BigDecimal getValueaddition();

    String getItemcounter();
    java.math.BigDecimal getPurity();
    String getBilltype();

    java.math.BigDecimal getPiecerate();
    String getUnit();
    java.math.BigDecimal getRate();

    String getDesigncode();
    String getSubdesigncode();

//    String getPartyname();
    String getDesignname();

    String getShopcode();

    java.math.BigDecimal getCrwt();
    Integer getCrqty();
}