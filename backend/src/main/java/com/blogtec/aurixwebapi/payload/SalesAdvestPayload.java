package com.blogtec.aurixwebapi.payload;

import java.util.List;
import com.blogtec.aurixwebapi.dto.SalesAdvestDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesAdvestPayload {
    private Integer estNo;
    private List<SalesAdvestDto> advanceItems;
}
