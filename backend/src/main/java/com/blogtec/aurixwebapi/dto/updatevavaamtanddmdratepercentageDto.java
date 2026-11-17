package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import java.util.ArrayList;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class updatevavaamtanddmdratepercentageDto 
{

	int estno;
	BigDecimal percentage;
	ArrayList<Integer>itslnos;

}
