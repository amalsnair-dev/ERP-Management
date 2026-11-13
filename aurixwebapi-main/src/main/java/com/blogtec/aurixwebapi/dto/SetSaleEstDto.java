package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SetSaleEstDto 
{
    private Integer estNo;
    private Integer slno;
    private Integer itSlno;
    private String estBarcode;
    private String estIcode;
    private String estItdesc;
    private String estCntr;
    private Integer estQty;
    private Integer estNoded;
    private BigDecimal estWt;
    private BigDecimal estStnwt;
    private BigDecimal estWtded;
    private BigDecimal estWtadd;
    private BigDecimal estActualwt;
    private BigDecimal estNtwt;
    private BigDecimal estMkch;
    private BigDecimal estVaper;
    private BigDecimal estWage;
    private BigDecimal estVamt;
    private BigDecimal estStnch;
    private BigDecimal estRate;
    private BigDecimal estGamt;
    private BigDecimal estTamt;
    private BigDecimal estGstper;
    private BigDecimal estIgstper;
    private BigDecimal estOthtaxper;
    private BigDecimal estGstamt;
    private BigDecimal estIgstamt;
    private BigDecimal estOthtaxamt;
    private BigDecimal totalamount;
    private Boolean barflag;
    private String estSman;
    private String estSman1;
    private BigDecimal afterva;
    private BigDecimal aftervaamt;
    private BigDecimal afterstnch;
    private String huid;
    private String billtime;
}
