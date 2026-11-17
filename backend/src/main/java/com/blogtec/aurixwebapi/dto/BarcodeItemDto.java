package com.blogtec.aurixwebapi.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BarcodeItemDto {
	// Fields populated from DB
	private String barcode;
	private String itemCode;
	private String itemDesc;
	private String cntr;
	private String qty;
	private String grwt;
	private String stwt;
	private String netwt;
	private String vaper;
	private String vaamt = "0.00";
	private String stnchg;
	private String goldamt = "0.00";
	private String amount = "0.00";
	private String actualwt;
	private String noded = "0";
	private String wtded = "0.000";
	private String wtadd = "0.000";
	private String mkchg;
	private String wastage;
	private String sman;

	// GST
	private double gstper;
	private double igstper;
}
