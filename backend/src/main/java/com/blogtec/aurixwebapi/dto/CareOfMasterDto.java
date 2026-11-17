package com.blogtec.aurixwebapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CareOfMasterDto {
    private String careofcode;
    private String careofname;
    private String addr;
    private String place;
    private String phoneno;
}
