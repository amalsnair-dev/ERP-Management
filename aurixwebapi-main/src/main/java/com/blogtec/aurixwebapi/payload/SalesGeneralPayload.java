package com.blogtec.aurixwebapi.payload;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesGeneralPayload {
    private Integer estNo;
    private String estDte;
    private BigDecimal estGrate;
    private Integer userid;
    private String custid;
    private String estCunm;
    private String estAdd1;
    private String estAdd2;
    private String estAdd3;
    private String estPin;
    private String estPhone;
    private String estSman1;
    private String estSman2;
    private String estOptr;
    private String goldSlv;
    private Boolean barflag;
    private BigDecimal estGstper;
    private BigDecimal estIgstper;
    private BigDecimal estOthtaxper;
    private BigDecimal estTamt;
    private BigDecimal estDiscount;
    private BigDecimal prevAmt;
    private String panno;
    private String gstno;
    private String aadharno;
    private String careoff;
    private Integer estsbillno;
    private String estsdate;
    private Integer estyear;
    private String shopcode; 
    private BigDecimal estDisrate;
    private BigDecimal grate22;
    private BigDecimal grate18;
    private BigDecimal slvrate;
    private BigDecimal totadvcash;
    private Boolean purSplitflag;
}
