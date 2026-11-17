package com.blogtec.aurixwebapi.Barcode;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Getter
@Setter
@NoArgsConstructor
@Entity
public class BarcodeDetails {
	
	@Id
	@Column
	private int barcodeid;


}
