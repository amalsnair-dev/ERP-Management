package com.blogtec.aurixwebapi.payload;

import java.util.List;
import com.blogtec.aurixwebapi.dto.PurchaseItemDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesPureestPayload {
    private Integer estNo;
    private String estDte;
    private List<PurchaseItemDto> purchaseItems;
}
