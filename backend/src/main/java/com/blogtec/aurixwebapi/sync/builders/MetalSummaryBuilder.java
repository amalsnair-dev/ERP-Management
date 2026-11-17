package com.blogtec.aurixwebapi.sync.builders;

import com.blogtec.aurixwebapi.dto.SyncPayloadDto.MetalSyncDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Component
public class MetalSummaryBuilder {

    private static final Logger logger = LoggerFactory.getLogger(MetalSummaryBuilder.class);

    private final JdbcTemplate jdbcTemplate;

    public MetalSummaryBuilder(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<MetalSyncDto> buildMetalSummaries(Date sqlDate, boolean isOldModelEnabled) {
        Map<String, MetalSyncDto> byCategory = new LinkedHashMap<>();

        if (isOldModelEnabled) {
            logger.debug("Building metal summaries using OLD MODEL (metalmaster query)");
            try {
                List<Map<String, Object>> metals = jdbcTemplate
                        .queryForList("SELECT code, name FROM metalmaster ORDER BY slno");
                for (Map<String, Object> metalRow : metals) {
                    String code = Objects.toString(metalRow.get("code"), "");
                    String name = Objects.toString(metalRow.get("name"), "");

                    MetalSyncDto dto = byCategory.computeIfAbsent(code, k -> {
                        MetalSyncDto d = new MetalSyncDto();
                        d.categoryCode = k;
                        d.itemName = name;
                        return d;
                    });

                    try {
                        List<Map<String, Object>> salesRows = jdbcTemplate.queryForList(
                                "SELECT COALESCE(SUM(b.est_ntwt),0) AS weight, COALESCE(SUM(CASE WHEN a.barflag=false THEN b.totalamount ELSE b.est_tamt END),0) AS amount"
                                        +
                                        " FROM sbilltran b JOIN sbillmstr a ON a.bill_no=b.bill_no JOIN itemmaster i ON b.est_icode=i.item_code JOIN metalmaster m ON i.catg_type=m.code"
                                        +
                                        " WHERE a.gold_slv='G' AND a.est_dte=? AND m.code=? GROUP BY a.barflag, m.name",
                                sqlDate, code);
                        for (Map<String, Object> r : salesRows) {
                            dto.salesWeight = dto.salesWeight.add(toBd(r.get("weight")));
                            dto.salesAmount = dto.salesAmount.add(toBd(r.get("amount")));
                        }
                    } catch (Exception e) {
                        logger.debug("Old model sales query: {}", e.getMessage());
                    }

                    try {
                        List<Map<String, Object>> crnRows = jdbcTemplate.queryForList(
                                "SELECT COALESCE(SUM(b.est_ntwt),0) AS weight, COALESCE(SUM(CASE WHEN a.barflag=false THEN b.totalamount ELSE b.est_tamt END),0) AS amount"
                                        +
                                        " FROM crn_billtran b JOIN crn_billmstr a ON a.bill_no=b.bill_no JOIN itemmaster i ON b.est_icode=i.item_code JOIN metalmaster m ON i.catg_type=m.code"
                                        +
                                        " WHERE a.gold_slv='G' AND a.est_dte=? AND m.code=? GROUP BY a.barflag, m.name",
                                sqlDate, code);
                        for (Map<String, Object> r : crnRows) {
                            dto.creditNoteWeight = dto.creditNoteWeight.add(toBd(r.get("weight")));
                            dto.creditNoteAmount = dto.creditNoteAmount.add(toBd(r.get("amount")));
                        }
                    } catch (Exception e) {
                        logger.debug("Old model credit note query: {}", e.getMessage());
                    }
                }

                try {
                    List<Map<String, Object>> purRows = jdbcTemplate.queryForList(
                            "SELECT COALESCE(SUM(t.ps_gwt),0) AS weight, COALESCE(SUM(t.ps_tamt),0) AS amount" +
                                    " FROM pbilltran t JOIN pbillmstr m ON m.bill_no=t.bill_no" +
                                    " WHERE m.est_dte=? AND t.ps_itcde IN (SELECT item_code FROM itemmaster WHERE catg_type='G' AND stone_type='O')",
                            sqlDate);

                    List<Double> mltRows = jdbcTemplate.query(
                            "SELECT COALESCE(SUM(ps_melt),0) FROM pbilltran WHERE ps_itcde='OGOL' AND ps_melt>0 AND bill_no IN (SELECT bill_no FROM pbillmstr WHERE est_dte=?)",
                            (rs, rowNum) -> rs.getDouble(1), sqlDate);
                    Double mlt = mltRows.isEmpty() ? 0.0 : mltRows.get(0);

                    if (!purRows.isEmpty()) {
                        Map<String, Object> r = purRows.get(0);
                        MetalSyncDto gDto = byCategory.computeIfAbsent("G", k -> {
                            MetalSyncDto d = new MetalSyncDto();
                            d.categoryCode = "G";
                            d.itemName = "GOLD";
                            return d;
                        });
                        BigDecimal grossWeight = toBd(r.get("weight"));
                        BigDecimal meltedWeight = BigDecimal.valueOf(mlt != null ? mlt : 0.0);

                        gDto.purchaseWeight = gDto.purchaseWeight.add(grossWeight);
                        gDto.purchaseAmount = gDto.purchaseAmount.add(toBd(r.get("amount")));
                        gDto.lessMeltedWeight = gDto.lessMeltedWeight.add(meltedWeight);
                    }
                } catch (Exception e) {
                    logger.debug("Old model purchase query: {}", e.getMessage());
                }

                try {
                    List<Map<String, Object>> purSilRows = jdbcTemplate.queryForList(
                            "SELECT COALESCE(SUM(t.ps_gwt),0) AS weight, COALESCE(SUM(t.ps_tamt),0) AS amount" +
                                    " FROM pbilltran t JOIN pbillmstr m ON m.bill_no=t.bill_no" +
                                    " WHERE m.est_dte=? AND t.ps_itcde IN (SELECT item_code FROM itemmaster WHERE catg_type='S' AND stone_type='O')",
                            sqlDate);

                    List<Double> silMltRows = jdbcTemplate.query(
                            "SELECT COALESCE(SUM(t.ps_melt),0) FROM pbilltran t JOIN pbillmstr m ON m.bill_no=t.bill_no WHERE t.ps_melt>0 AND m.gold_slv='S' AND m.est_dte=?",
                            (rs, rowNum) -> rs.getDouble(1), sqlDate);
                    Double silMlt = silMltRows.isEmpty() ? 0.0 : silMltRows.get(0);

                    if (!purSilRows.isEmpty()) {
                        Map<String, Object> r = purSilRows.get(0);
                        MetalSyncDto sDto = byCategory.computeIfAbsent("S", k -> {
                            MetalSyncDto d = new MetalSyncDto();
                            d.categoryCode = "S";
                            d.itemName = "SILVER";
                            return d;
                        });
                        BigDecimal grossWeight = toBd(r.get("weight"));
                        BigDecimal meltedWeight = BigDecimal.valueOf(silMlt != null ? silMlt : 0.0);

                        sDto.purchaseWeight = sDto.purchaseWeight.add(grossWeight);
                        sDto.purchaseAmount = sDto.purchaseAmount.add(toBd(r.get("amount")));
                        sDto.lessMeltedWeight = sDto.lessMeltedWeight.add(meltedWeight);
                    }
                } catch (Exception e) {
                    logger.debug("Old model silver purchase query: {}", e.getMessage());
                }
            } catch (Exception e) {
                logger.warn("Old model metal summary query failed: {}", e.getMessage());
            }
            return new ArrayList<>(byCategory.values());
        }
        
        try {
            List<Map<String, Object>> masters = jdbcTemplate.queryForList(
                    "SELECT transaction_type, item_name, counter_code, metal_type" +
                            " FROM summary_master WHERE active=true ORDER BY slno");

            for (Map<String, Object> row : masters) {
                String txType = Objects.toString(row.get("transaction_type"), "");
                String itemName = Objects.toString(row.get("item_name"), "");
                String counterCode = Objects.toString(row.get("counter_code"), "");

                MetalSyncDto dto = byCategory.computeIfAbsent(counterCode, k -> {
                    MetalSyncDto d = new MetalSyncDto();
                    d.categoryCode = k;
                    d.itemName = itemName;
                    return d;
                });

                try {
                    Map<String, Object> r = switch (txType.toUpperCase()) {
                        case "SALES" -> jdbcTemplate.queryForMap(
                                "SELECT COALESCE(SUM(b.est_wt),0) AS weight, COALESCE(SUM(b.est_tamt),0) AS amount" +
                                        " FROM sbilltran b JOIN sbillmstr a ON a.bill_no=b.bill_no" +
                                        " JOIN itemmaster i ON b.est_icode=i.item_code" +
                                        " WHERE a.est_dte=? AND i.counter=?",
                                sqlDate, counterCode);
                        case "PURCHASE" -> jdbcTemplate.queryForMap(
                                "SELECT COALESCE(SUM(t.ps_gwt),0) AS weight, COALESCE(SUM(t.ps_tamt),0) AS amount" +
                                        " FROM pbilltran t JOIN pbillmstr m ON m.bill_no=t.bill_no" +
                                        " JOIN itemmaster i ON t.ps_itcde=i.item_code" +
                                        " WHERE m.est_dte=? AND i.counter=?",
                                sqlDate, counterCode);
                        case "CREDITNOTE" -> jdbcTemplate.queryForMap(
                                "SELECT COALESCE(SUM(b.est_wt),0) AS weight, COALESCE(SUM(b.est_tamt),0) AS amount" +
                                        " FROM crn_billtran b JOIN crn_billmstr a ON a.bill_no=b.bill_no" +
                                        " JOIN itemmaster i ON b.est_icode=i.item_code" +
                                        " WHERE a.est_dte=? AND i.counter=?",
                                sqlDate, counterCode);
                        default -> {
                            logger.warn("Unknown transaction_type: {}", txType);
                            yield null;
                        }
                    };
                    if (r != null) {
                        BigDecimal weight = toBd(r.get("weight"));
                        BigDecimal amount = toBd(r.get("amount"));
                        switch (txType.toUpperCase()) {
                            case "SALES" -> {
                                dto.salesWeight = dto.salesWeight.add(weight);
                                dto.salesAmount = dto.salesAmount.add(amount);
                            }
                            case "PURCHASE" -> {
                                dto.purchaseWeight = dto.purchaseWeight.add(weight);
                                dto.purchaseAmount = dto.purchaseAmount.add(amount);
                            }
                            case "CREDITNOTE" -> {
                                dto.creditNoteWeight = dto.creditNoteWeight.add(weight);
                                dto.creditNoteAmount = dto.creditNoteAmount.add(amount);
                            }
                        }
                    }
                } catch (Exception e) {
                    logger.warn("Metal [{} {}/{}]: {}", txType, itemName, counterCode, e.getMessage());
                }
            }
        } catch (Exception e) {
            logger.warn("buildMetalSummaries failed: {}", e.getMessage());
        }
        return new ArrayList<>(byCategory.values());
    }

    private BigDecimal toBd(Object val) {
        if (val == null) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(val.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
