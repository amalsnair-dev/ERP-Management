package com.blogtec.aurixwebapi.payload;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateSalesEntryPayload {
	
	private SalesGeneralPayload general;
    private SalesItemsPayload sales;
    private SalesStonePayload stones;

}
