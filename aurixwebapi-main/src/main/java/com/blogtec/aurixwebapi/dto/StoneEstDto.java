package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StoneEstDto {
    private Integer estNo;
    private Integer itSlno;
    private Integer slno;
    private String barcode;
    private String stype;
    private String stnTyp;
    private String stnName;
    private Integer stnNos;
    private BigDecimal stnQty;
    private BigDecimal stnRate;
    private BigDecimal stnAmt;
    private BigDecimal aftStnrate;
    private BigDecimal aftStnamt;
}
