package com.blogtec.aurixwebapi.stocktaking;


public class ItemDto {
	
	private String desc;
	private String code;
	
	public ItemDto(String desc, String code) {
		this.desc = desc;
		this.code = code;
	}
	
	public String getDesc() {
		return desc;
	}
	
	public String getCode() {
		return code;
	}
	
	public void setDesc(String desc) {
		this.desc = desc;
	}
	
	public void setCode(String code) {
		this.code = code;
	}

}
