package com.blogtec.aurixwebapi.stocktaking;

public class SalesmanDto {
	
	private String name;
	private String code;
	
	public SalesmanDto(String name, String code) {
		this.name = name;
		this.code = code;
	}
	
	public String getName() {
		return name;
	}
	
	public String getCode() {
		return code;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	public void setCode(String code) {
		this.code = code;
	}

}
