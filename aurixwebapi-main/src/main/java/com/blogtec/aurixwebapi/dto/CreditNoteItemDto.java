package com.blogtec.aurixwebapi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreditNoteItemDto {
    private Integer billNo;
    private Integer itSlno;
    private Integer billYear;
    private String billDate;
    private String invoiceNo;
    private String shopcode; // To handle cross-branch if needed
}
