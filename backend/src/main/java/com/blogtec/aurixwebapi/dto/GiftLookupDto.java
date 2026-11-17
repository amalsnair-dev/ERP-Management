package com.blogtec.aurixwebapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GiftLookupDto {
    private String giftCode;
    private String giftName;
}
