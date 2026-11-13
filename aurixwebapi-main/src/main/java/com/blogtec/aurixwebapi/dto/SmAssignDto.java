package com.blogtec.aurixwebapi.dto;

import java.sql.Time;

import com.blogtec.aurixwebapi.smassign.SmAssign;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class SmAssignDto {
    private String name;
    private String phoneNo;
    private String place;
    private String smCode;
    private String shopcode;
    private java.sql.Date date;
    private Time time;
    private int slno;
    private int entryno;
    private String remarks;
    

    public SmAssignDto(SmAssign sa) {
        this.name = sa.getName();
        this.phoneNo = sa.getPhoneNo();
        this.place = sa.getPlace();
        this.smCode = sa.getSmCode();
        this.shopcode = sa.getShopcode();
        this.time = sa.getTime();
        this.slno = sa.getSlno();
        this.entryno=sa.getEntryno();
        this.date = sa.getDate() != null ? java.sql.Date.valueOf(sa.getDate()) : null;
        this.remarks=sa.getRemarks();
    }

}
