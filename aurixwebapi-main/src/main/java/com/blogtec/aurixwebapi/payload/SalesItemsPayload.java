package com.blogtec.aurixwebapi.payload;

import java.util.List;
import com.blogtec.aurixwebapi.dto.SetSaleEstDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesItemsPayload {
    private Integer estNo;
    private Boolean barflag;
    private String sMan;
    private List<SetSaleEstDto> saleItems;
}
