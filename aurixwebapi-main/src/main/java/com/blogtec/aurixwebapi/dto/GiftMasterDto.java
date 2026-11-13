package com.blogtec.aurixwebapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiftMasterDto {
    private Long giftId;
    private String giftCode;
    private String giftName;
}
