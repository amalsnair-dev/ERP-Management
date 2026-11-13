package com.blogtec.aurixwebapi.stocktaking;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class StockTakingDto {

    private Long slno;
    private LocalDate date;
    private String operator;
    private String counter;
    private String item;
    private String macId;
    private String ip;

    public StockTakingDto() {
    }

    public StockTakingDto(
            Long slno,
            LocalDate date,
            String operator,
            String counter,
            String item,
            String macId,
            String ip) {

        this.slno = slno;
        this.date = date;
        this.operator = operator;
        this.counter = counter;
        this.item = item;
        this.macId = macId;
        this.ip = ip;
    }

    public Long getSlno() {
        return slno;
    }

    public void setSlno(Long slno) {
        this.slno = slno;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getOperator() {
        return operator;
    }

    public void setOperator(String operator) {
        this.operator = operator;
    }

    public String getCounter() {
        return counter;
    }

    public void setCounter(String counter) {
        this.counter = counter;
    }

    public String getItem() {
        return item;
    }
    
    public String getMacId() {
        return macId;
    }

    public void setMacId(String macId) {
        this.macId = macId;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public void setItem(String item) {
        this.item = item;
    }
}