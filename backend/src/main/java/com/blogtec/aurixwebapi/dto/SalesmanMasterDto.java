package com.blogtec.aurixwebapi.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@NoArgsConstructor 
public class SalesmanMasterDto {

    private String salesman_code;
    private String salesman_name;

    public SalesmanMasterDto(String salesman_code, String salesman_name) {
        this.salesman_code = salesman_code;  
        this.salesman_name = salesman_name;
    }
}
