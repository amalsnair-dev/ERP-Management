package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@NoArgsConstructor
public class BarcodeDetailsDTO {

    private String barcode;
    private String date;
    private String partyName;
    private String designName;
    private String itemCode;
    private String itemName;
    private String otherItemCode;
    private String purity;
    private String itemCounter;
    private Boolean sold;
    private String rfid;
    
    private BigDecimal quantity;
    private BigDecimal actualWeight;
    
    private BigDecimal otherItemWt;
    private BigDecimal grossWeight;
    private BigDecimal stoneWeight;
    private BigDecimal netWeight;
    private BigDecimal makingCharge;
    private BigDecimal wastage;

    private String designCode;
    private String dcode;   // ✅ INCLUDED
    private String metalType;

    // Billing
    private BigDecimal rate;
    private BigDecimal metalAmount;
    private BigDecimal vaPercent;
    private BigDecimal vaAmount;
    private BigDecimal stoneCharge;
    private BigDecimal taxableAmount;
    private BigDecimal gstPercent;
    private BigDecimal gstAmount;
    private BigDecimal netAmount;
    
    
    
    
    

    // getters & setters
}