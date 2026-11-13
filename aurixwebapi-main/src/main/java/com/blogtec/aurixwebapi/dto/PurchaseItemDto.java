package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PurchaseItemDto {
    private String psItcde;
    private String psItdesc;
    private BigDecimal psQty;
    private BigDecimal psGwt;
    private BigDecimal psStwt;
    private BigDecimal psNtwt;
    private BigDecimal psMeltper;
    private BigDecimal psMelt;
    private BigDecimal psValadd;
    private BigDecimal psVal;
    private BigDecimal psStch;
    private String dcode;
    private BigDecimal psCtno;
    private BigDecimal psCtwt;
    private BigDecimal purrate;
    private BigDecimal psTamt;
    private BigDecimal psGrate;
    private Integer psSlno;
    private BigDecimal psTouch;
}
