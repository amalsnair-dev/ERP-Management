package com.blogtec.aurixwebapi.dto;



public class SetDiscountDTO {

    private String details;
    private Double amount;
    private String flag;
    private String remark;

    // constructor for JPQL/Native mapping
    public SetDiscountDTO(String details, Double amount, String flag, String remark) {
        this.details = details;
        this.amount = amount;
        this.flag = flag;
        this.remark = remark;
    }

    public SetDiscountDTO() {
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getFlag() {
        return flag;
    }

    public void setFlag(String flag) {
        this.flag = flag;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}
