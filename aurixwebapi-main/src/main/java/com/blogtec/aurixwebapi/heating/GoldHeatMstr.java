package com.blogtec.aurixwebapi.heating;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "gold_heat_mstr")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldHeatMstr {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "heat_id")
    private Integer heatId;

    @Column(name = "estno")
    private Integer estno = 0;

    @Column(name = "entry_date")
    private LocalDate entryDate = LocalDate.now();

    @Column(name = "sm_code", length = 50)
    private String smCode = "";

    @Column(name = "gld_slv", length = 10)
    private String gldSlv = "";

    @Column(name = "cust_id", length = 50)
    private String custId = "";

    @Column(name = "cust_name", length = 200)
    private String custName = "";

    @Column(name = "phone", length = 20)
    private String phone = "";

    @Column(name = "item_code", length = 50)
    private String itemCode = "";

    @Column(name = "qty")
    private Integer qty = 0;

    @Column(name = "grwt", precision = 15, scale = 3)
    private BigDecimal grwt = BigDecimal.ZERO;

    @Column(name = "stwt", precision = 15, scale = 3)
    private BigDecimal stwt = BigDecimal.ZERO;

    @Column(name = "ntwt", precision = 15, scale = 3)
    private BigDecimal ntwt = BigDecimal.ZERO;

    @Column(name = "remark", length = 500)
    private String remark = "";

    @Column(name = "iss_flag")
    private Boolean issFlag = false;

    @Column(name = "rec_grwt", precision = 15, scale = 3)
    private BigDecimal recGrwt = BigDecimal.ZERO;

    @Column(name = "rec_stwt", precision = 15, scale = 3)
    private BigDecimal recStwt = BigDecimal.ZERO;

    @Column(name = "rec_ntwt", precision = 15, scale = 3)
    private BigDecimal recNtwt = BigDecimal.ZERO;

    @Column(name = "rec_remark", length = 500)
    private String recRemark = "";

    @Column(name = "row_id")
    private Integer rowId = 0;

    @Column(name = "user_id")
    private Integer userId = 0;

    @Column(name = "sm_name", length = 100)
    private String smName = "";

    @Column(name = "shop_code", length = 50)
    private String shopCode = "";

    @Column(name = "rec_flag")
    private Boolean recFlag = false;

    @Column(name = "save_flag")
    private Boolean saveFlag = false;
}
