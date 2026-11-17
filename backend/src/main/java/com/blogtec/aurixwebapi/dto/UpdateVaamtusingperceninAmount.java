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
public class UpdateVaamtusingperceninAmount 
{
	 BigDecimal estvaper;
	 BigDecimal etvaamount;
	 int itslno;
}
