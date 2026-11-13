package com.blogtec.aurixwebapi.stocktaking;

public class StockTakingTransactionRequest {

    private String slno;
    private String barcode;
    private String macId;
    private String ip;

    public StockTakingTransactionRequest() {
    }

    public String getSlno() {
        return slno;
    }

    public void setSlno(String slno) {
        this.slno = slno;
    }

    public String getBarcode() {
        return barcode;
    }

    public void setBarcode(String barcode) {
        this.barcode = barcode;
    }
    
    public String getMacId() {
        return macId;
    }

    public void setMacId(String macId) {
        this.macId = macId;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }
}