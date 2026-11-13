package com.blogtec.aurixwebapi.discountdetails;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "discount_details")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class DiscountDetails {

    @Id
    private int id;          // global unique id (auto-set in service)

    private int estno;       // estimate number
    private int slno;        // serial number per estno (1, 2, 3 ... per estimate)

    private String username;
    private String shopCode;

    // ── Amount fields (scale = 2 → 0.00) ──────────────────────────────────────
    @Column(precision = 12, scale = 2)
    private BigDecimal discountamt;

    @Column(precision = 12, scale = 2)
    private BigDecimal roundoffamt;

    @Column(precision = 12, scale = 2)
    private BigDecimal salesamt;

    @Column(precision = 12, scale = 2)
    private BigDecimal puramt;

    @Column(precision = 12, scale = 2)
    private BigDecimal crnamt;

    // ── Weight fields (scale = 3 → 0.000) ─────────────────────────────────────
    @Column(precision = 12, scale = 3)
    private BigDecimal saleswt;

    @Column(precision = 12, scale = 3)
    private BigDecimal purwt;

    @Column(precision = 12, scale = 3)
    private BigDecimal crnwt;

    // ── Auto-set on insert ─────────────────────────────────────────────────────
    private LocalDateTime datetime;
    
    @Column(precision = 12, scale = 3)
    private BigDecimal collamt;

    @PrePersist
    protected void onInsert() {
        if (this.datetime == null) {
            this.datetime = LocalDateTime.now();
        }
    }
}
