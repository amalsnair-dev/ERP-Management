package com.blogtec.aurixwebapi.smassign;

import java.sql.Time;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class SmAssign 
{

	@Id
	private Integer slno;
	private LocalDate date;
	@Column(name = "sm_code")
	private String smCode;
	@Column(name = "phone_no")
	private String phoneNo;
	private String name;
	private String place;
	@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
	private Time time;
	private String shopcode;
	private Integer entryno;
	private String remarks;
}
