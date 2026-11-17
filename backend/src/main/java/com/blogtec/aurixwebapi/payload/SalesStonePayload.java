package com.blogtec.aurixwebapi.payload;

import java.util.List;
import com.blogtec.aurixwebapi.dto.StoneEstDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesStonePayload {
    private Integer estNo;
    private List<StoneEstDto> stoneEntries;
}
