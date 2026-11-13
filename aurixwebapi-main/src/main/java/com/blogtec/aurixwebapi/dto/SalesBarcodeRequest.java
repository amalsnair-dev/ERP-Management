package com.blogtec.aurixwebapi.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SalesBarcodeRequest {
    private String barcode;
    private Integer estNo;
    private String goldSlv;
    private boolean checked;
    private boolean igstSelected;
    private String salesmanCode;
    private double gstPer;
    private double igstPer;
    private int tabSaleRowCount;
    private double goldRate;
}
