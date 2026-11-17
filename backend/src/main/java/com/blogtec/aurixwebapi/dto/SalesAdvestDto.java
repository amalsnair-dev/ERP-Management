package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesAdvestDto {
    private String advName;
    private String advNo;
    private String advOrderYear;
    private BigDecimal advAmt;
    private BigDecimal schmBonus;
    private BigDecimal schmGdwt;
    private Boolean barflag;
}
