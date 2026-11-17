package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@SuppressWarnings("unused")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class getSubdesginDTO 

{
	private String subDesignCode;
	private Integer designCode;
	private String categoryName;
	private String itemName;
	private String subDesignName;
	
}
