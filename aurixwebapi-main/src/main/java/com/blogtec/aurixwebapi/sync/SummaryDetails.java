package com.blogtec.aurixwebapi.sync;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "summary_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SummaryDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer slno;

    @Column(name = "summary_slno")
    private Integer summarySlno;

    private String shopcode;

    @Column(name = "summary_date")
    private LocalDate summaryDate;

    private Double weight;

    private Double amount;
}
