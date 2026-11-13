package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CustomerDetailedDataDto 
{
	int dslno;
	String name;
	String barcode;
	String item_desc;
	String itemname;
	String designdescription;
	byte[] imagedta;

	int num;
	BigDecimal grossweight;
	BigDecimal stoneweight;
	BigDecimal netweight;
	BigDecimal stonecharge;
	BigDecimal makingchrge;
	BigDecimal purity;
	BigDecimal touch;
	String shopcode;

}
