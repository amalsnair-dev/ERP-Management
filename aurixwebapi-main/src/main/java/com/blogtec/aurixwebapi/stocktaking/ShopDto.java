package com.blogtec.aurixwebapi.stocktaking;

public class ShopDto {

    private Long shopId;
    private String shopCode;
    private String ipNumber;

    public ShopDto() {
    }

    public ShopDto(Long shopId, String shopCode, String ipNumber) {
        this.shopId = shopId;
        this.shopCode = shopCode;
        this.ipNumber = ipNumber;
    }

    public Long getShopId() {
        return shopId;
    }

    public void setShopId(Long shopId) {
        this.shopId = shopId;
    }

    public String getShopCode() {
        return shopCode;
    }

    public void setShopCode(String shopCode) {
        this.shopCode = shopCode;
    }

    public String getIpNumber() {
        return ipNumber;
    }

    public void setIpNumber(String ipNumber) {
        this.ipNumber = ipNumber;
    }
}