package com.blogtec.aurixwebapi.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientAccessLogDto {
    private int userid;
    private String framename;
    private String operation;
    private String description;
    private String shopcode;
    private String macId;
}
