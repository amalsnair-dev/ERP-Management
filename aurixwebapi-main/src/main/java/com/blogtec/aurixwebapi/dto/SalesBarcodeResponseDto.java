package com.blogtec.aurixwebapi.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SalesBarcodeResponseDto {
    // Status flags (only on root response)
    private Boolean success;
    private String warningMessage;
    private String action; // e.g. "SHOW_WARNING", "FOCUS_BARCODE", "CLEAR_FIELDS"
    private Boolean salesEditable;

    // Fields populated from DB
    private String barcode;
    private String itemCode;
    private String itemDesc;
    private String cntr;
    private String qty;
    private String grwt;
    private String stwt;
    private String netwt;
    private String vaper;
    private String vaamt = "0.00";
    private String stnchg;
    private String goldamt = "0.00";
    private String amount = "0.00";
    private String actualwt;
    private String noded = "0";
    private String wtded = "0.000";
    private String wtadd = "0.000";
    private String mkchg;
    private String wastage;
    private String sman;
    
    // GST
    private double gstper;
    private double igstper;

    // Stone Details
    private List<Map<String, Object>> stoneDetails;

    // Dual-item support for other weight deduction (ot_itwt > 0)
    private SalesBarcodeResponseDto otherItem;
}
