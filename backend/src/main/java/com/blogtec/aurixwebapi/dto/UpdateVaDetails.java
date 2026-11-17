package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateVaDetails 
{
	
 String esticode;
 BigDecimal estvaper;
 BigDecimal aftervaper;
 String estitemdesc;
 Integer itemqty;
 BigDecimal estwt;
 BigDecimal esttotalamt;
 Integer itslno;
 BigDecimal est_gamt;
 BigDecimal est_stnch;
 BigDecimal est_stnwt;
 BigDecimal est_ntwt;
 BigDecimal est_rate;
 String description;
 String remarks;
 String barcode;
 String prebarcode;
 String arra;
 String image;
 
 
 
}
