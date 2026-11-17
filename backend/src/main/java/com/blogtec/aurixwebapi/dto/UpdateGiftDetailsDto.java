package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGiftDetailsDto {
    private Integer estNo;
    private String giftNo;
    private BigDecimal collAmt;
    private Boolean barcodeFlag;
}
