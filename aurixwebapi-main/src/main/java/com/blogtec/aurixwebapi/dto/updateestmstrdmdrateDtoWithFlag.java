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
public class updateestmstrdmdrateDtoWithFlag 
{
	int estno ;
	BigDecimal dmdrate;
	Boolean value;
}
