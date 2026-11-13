package com.blogtec.aurixwebapi.payload;

import java.util.List;
import com.blogtec.aurixwebapi.dto.CreditNoteItemDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesCrnPayload {
    private Integer estNo;
    private String estDte;
    private List<CreditNoteItemDto> creditItems;
}
