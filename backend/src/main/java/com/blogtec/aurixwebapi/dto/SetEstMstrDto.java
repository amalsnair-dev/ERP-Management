package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import java.sql.Date;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SetEstMstrDto {
    private Integer estNo;
    private Date estDte;
    private BigDecimal estGrate;
    private Integer userid;
    private String custId;
    private String custName;
    private String add1;
    private String add2;
    private String add3;
    private String pin;
    private String phone;
    private String sman1;
    private String sman2;
    private String optr;
    private String goldSlv;
    private Boolean barFlag;
    private BigDecimal gstPer;
    private BigDecimal igstPer;
    private BigDecimal othTaxPer;
    private BigDecimal tamt;
    private BigDecimal discount;
    private BigDecimal prevAmt;
    private String panNo;
    private String gstNo;
    private Integer estSBillNo;
    private Date estSDate;
    private Integer estYear;
    private String shopCode;
}
