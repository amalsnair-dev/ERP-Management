package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class estmstrDto {

    private Integer est_no;
    private LocalDate est_dte;   // changed to LocalDate
    private BigDecimal est_grate;
    private String username;
    private String custid;
    private String est_cunm;
    private String est_add1;
    private String est_add2;
    private String est_add3;
    private String est_pin;
    private String est_phone;
    private String est_sman1;
    private String est_sman2;
    private String est_optr;
    private String gold_slv;
    private boolean barflag;
    private BigDecimal est_gstper;
    private BigDecimal est_igstper;
    private BigDecimal est_othtaxper;
    private BigDecimal est_tamt;
    private BigDecimal est_discount;
    private BigDecimal prev_amt;
    private String panno;
    private String gstno;
    private Integer estsbillno;
    private LocalDate estsdate;  // changed to LocalDate
    private Integer estyear;
    private BigDecimal est_disrate;
}
