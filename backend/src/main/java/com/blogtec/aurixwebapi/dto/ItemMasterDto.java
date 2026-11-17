package com.blogtec.aurixwebapi.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemMasterDto {
    private String itemCode;
    private String itemDesc;
    private String counter;
    private String unit;
    private String billType;
    private String itemCateg;
    private String categType;
    private Boolean barcodeFlag;
    private String va;
}
