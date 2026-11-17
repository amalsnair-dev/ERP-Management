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
public class SaleestDto
{
	BigDecimal est_gamt;
	BigDecimal est_tamt;
	BigDecimal aftervaamt;
	BigDecimal afterstnch;
	BigDecimal est_gstper;
	BigDecimal est_igstper;
}
