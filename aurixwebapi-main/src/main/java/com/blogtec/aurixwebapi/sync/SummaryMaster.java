package com.blogtec.aurixwebapi.sync;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "summary_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SummaryMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer slno;

    private String shopcode;

    @Column(name = "transaction_type")
    private String transactionType;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "counter_code")
    private String counterCode;

    @Column(name = "metal_type")
    private String metalType;

    private Boolean active;
}
