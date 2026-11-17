package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class EasyTotalDto 
{

	int orderno;
	String head;
	String Categry;
	BigDecimal wt;
	BigDecimal amount;
	
	
	
}
