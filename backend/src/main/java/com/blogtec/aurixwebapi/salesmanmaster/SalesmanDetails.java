package com.blogtec.aurixwebapi.salesmanmaster;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class SalesmanDetails{
	@Id
	@Column
	private int SlNo;
}
