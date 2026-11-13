package com.blogtec.aurixwebapi.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;

import com.blogtec.aurixwebapi.discountdetails.DiscountDetails;

import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class DiscountDetailsDto {

    private int id;
    private int userid;
    private String username;
    private int estno;
    private BigDecimal discountamt;
    private BigDecimal roundoffamt;
    private String shopCode;
    private Timestamp datetime; // Jasper-friendly type for combined date and time

    public DiscountDetailsDto(DiscountDetails sa) {
        this.id = sa.getId();
        this.username = sa.getUsername();
        this.estno = sa.getEstno();
        this.discountamt = sa.getDiscountamt();
        this.roundoffamt = sa.getRoundoffamt();
        this.shopCode = sa.getShopCode();

        // FIX: Convert LocalDateTime -> java.sql.Timestamp
        this.datetime = sa.getDatetime() != null ? Timestamp.valueOf(sa.getDatetime()) : null;
    }
}
