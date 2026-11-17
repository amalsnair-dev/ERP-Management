package com.blogtec.aurixwebapi.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoneMasterDto {
    private String sCode;
    private String sDesc;
    private String sUnit;
    private String sType;
    private String sDtype;
    private Double sRate;
}
