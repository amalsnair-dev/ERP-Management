package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class HeatingDto {

    private Integer heatId;
    private Integer estno = 0;
    private LocalDate entryDate = LocalDate.now();
    private String smCode = "";
    private String gldSlv = "";
    private String custId = "";
    private String custName = "";
    private String phone = "";
    private String itemCode = "";
    private Integer qty = 0;
    private BigDecimal grwt = BigDecimal.ZERO;
    private BigDecimal stwt = BigDecimal.ZERO;
    private BigDecimal ntwt = BigDecimal.ZERO;
    private String remark = "";
    private Boolean issFlag = false;
    private BigDecimal recGrwt = BigDecimal.ZERO;
    private BigDecimal recStwt = BigDecimal.ZERO;
    private BigDecimal recNtwt = BigDecimal.ZERO;
    private String recRemark = "";
    private Integer rowId = 0;
    private Integer userId = 0;
    private String smName = "";
    private String shopCode = "";
    private Boolean recFlag = false;
    private Boolean saveFlag = false;
}
