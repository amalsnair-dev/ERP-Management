package com.blogtec.aurixwebapi.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "CRM Customer Record")
public class CrmDTO {

    @Schema(description = "CRM Record ID", example = "168291")
    private String crmid;

    @Schema(description = "Customer Code / ID", example = "P041813")
    private String custid;

    @Schema(description = "Customer Full Name", example = "SIVA KRISHNAN")
    private String name;

    @Schema(description = "Mobile Phone Number", example = "9895946945")
    private String mob;

    @Schema(description = "City / Town / Place", example = "TVPM")
    private String place;

    @Schema(description = "Address Line 1", example = "NEELAMBARI, TC 33/1504(4)")
    private String add1;

    @Schema(description = "Address Line 2")
    private String add2;

    @Schema(description = "Address Line 3")
    private String add3;

    @Schema(description = "GSTIN Number")
    private String gstin;

    @Schema(description = "PAN Number")
    private String pan;

    @Schema(description = "Postal Pincode")
    private String pincode;

    @Schema(description = "Aadhaar Card Number")
    private String aadharno;

    @Schema(description = "Email Address")
    private String email;
}
