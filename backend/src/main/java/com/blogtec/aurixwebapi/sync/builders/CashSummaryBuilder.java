package com.blogtec.aurixwebapi.sync.builders;

import com.blogtec.aurixwebapi.dto.SyncPayloadDto.CashSyncDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.List;
import java.util.Map;

@Component
public class CashSummaryBuilder {

    private static final Logger logger = LoggerFactory.getLogger(CashSummaryBuilder.class);

    private final JdbcTemplate jdbcTemplate;

    public CashSummaryBuilder(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean isOldModelEnabled() {
        try {
            List<Boolean> flags = jdbcTemplate.query(
                    "SELECT flag FROM setdiscount WHERE details = 'CASH SUMMARY OLD MODEL' AND flag = true",
                    (rs, rowNum) -> rs.getBoolean("flag"));
            return !flags.isEmpty() && Boolean.TRUE.equals(flags.get(0));
        } catch (Exception e) {
            logger.warn("Error checking old model flag: {}", e.getMessage());
            return false;
        }
    }

    public CashSyncDto buildCashSummary(Date sqlDate, boolean isOldModelEnabled) {
        CashSyncDto dto = new CashSyncDto();
        String cashTblDate = resolveCashMarkingsTable(sqlDate);
        String cashTblAll = resolveCashMarkingsTable();

        if (isOldModelEnabled) {
            logger.debug("Building cash summary using OLD MODEL (CashSummaryReport.java) with table {}", cashTblDate);
            try {
                List<Double> list = jdbcTemplate.query("SELECT opbal FROM lastno",
                        (rs, rowNum) -> rs.getDouble("opbal"));
                Double v = list.isEmpty() ? 0.0 : list.get(0);
                dto.openingCash = BigDecimal.valueOf(v != null ? v : 0.0);
            } catch (Exception e) {
                logger.warn("OLD MODEL openingCash: {}", e.getMessage());
            }

            try {
                List<Double> list = jdbcTemplate.query("SELECT COALESCE(SUM(cash_collected),0) FROM " + cashTblAll,
                        (rs, rowNum) -> rs.getDouble(1));
                Double totalCash = list.isEmpty() ? 0.0 : list.get(0);
                if (totalCash >= 0) {
                    dto.cashReceipts = BigDecimal.valueOf(totalCash);
                    dto.cashPayments = BigDecimal.ZERO;
                } else {
                    dto.cashReceipts = BigDecimal.ZERO;
                    dto.cashPayments = BigDecimal.valueOf(Math.abs(totalCash));
                }
            } catch (Exception e) {
                logger.warn("OLD MODEL cash_collected: {}", e.getMessage());
            }

            try {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                        "SELECT COALESCE(SUM(dramount),0) AS dr, COALESCE(SUM(cramount),0) AS cr FROM dailybook WHERE date=? AND entryno IN (SELECT est_no FROM " + cashTblAll + " WHERE counter_code='DB')",
                        sqlDate);
                if (!rows.isEmpty()) {
                    Map<String, Object> r = rows.get(0);
                    dto.bankReceipts = toBd(r.get("cr"));
                    dto.bankPayments = toBd(r.get("dr"));
                }
            } catch (Exception e) {
                logger.warn("OLD MODEL dailyBook: {}", e.getMessage());
            }

            try {
                List<Double> list = jdbcTemplate.query(
                        "SELECT COALESCE(SUM(totalamt),0) FROM vouchermaster WHERE date=? AND mode='RECEIPT'",
                        (rs, rowNum) -> rs.getDouble(1), sqlDate);
                Double v = list.isEmpty() ? 0.0 : list.get(0);
                dto.upiReceipts = BigDecimal.valueOf(v != null ? v : 0.0);
            } catch (Exception e) {
                logger.warn("OLD MODEL upiReceipts: {}", e.getMessage());
            }

            try {
                List<Double> list = jdbcTemplate.query(
                        "SELECT COALESCE(SUM(totalamt),0) FROM vouchermaster WHERE date=? AND mode='PAYMENT'",
                        (rs, rowNum) -> rs.getDouble(1), sqlDate);
                Double v = list.isEmpty() ? 0.0 : list.get(0);
                dto.upiPayments = BigDecimal.valueOf(v != null ? v : 0.0);
            } catch (Exception e) {
                logger.warn("OLD MODEL upiPayments: {}", e.getMessage());
            }

            try {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                        "SELECT COALESCE(SUM(RECPT),0) AS recpt, COALESCE(SUM(PAYMENT),0) AS payment FROM creditcustmaster WHERE slno IN (SELECT est_no FROM " + cashTblAll + " WHERE counter_code='CRD')");
                if (!rows.isEmpty()) {
                    Map<String, Object> r = rows.get(0);
                    dto.cardReceipts = toBd(r.get("recpt"));
                    dto.cardPayments = toBd(r.get("payment"));
                }
            } catch (Exception e) {
                logger.warn("OLD MODEL cardCash: {}", e.getMessage());
            }

            try {
                Double cashCollected = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(SUM(cash_collected),0) FROM " + cashTblDate + " WHERE marking_date = ?",
                        Double.class, sqlDate);
                dto.todayCollectionCash = toBd(cashCollected);
            } catch (Exception e) {
                logger.warn("OLD MODEL todayCollectionCash: {}", e.getMessage());
            }

            dto.closingCash = dto.openingCash.add(dto.cashReceipts).subtract(dto.cashPayments);
            return dto;
        }

        // Default NEW MODEL logic
        try {
            Double v = jdbcTemplate.queryForObject("SELECT opbal FROM lastno", Double.class);
            dto.openingCash = BigDecimal.valueOf(v != null ? v : 0.0);
        } catch (Exception e) {
            logger.warn("openingCash: {}", e.getMessage());
        }
        try {
            Double receipts = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(cash_collected),0) FROM " + cashTblDate + " WHERE cash_collected > 0 AND marking_date = ?",
                    Double.class, sqlDate);
            Double payments = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(ABS(SUM(cash_collected)),0) FROM " + cashTblDate + " WHERE cash_collected < 0 AND marking_date = ?",
                    Double.class, sqlDate);
            dto.cashReceipts = BigDecimal.valueOf(receipts != null ? receipts : 0.0);
            dto.cashPayments = BigDecimal.valueOf(payments != null ? payments : 0.0);
        } catch (Exception e) {
            logger.warn("cashReceiptsAndPayments: {}", e.getMessage());
        }
        try {
            Map<String, Object> r = jdbcTemplate.queryForMap(
                    "SELECT COALESCE(SUM(dramount),0) AS dr, COALESCE(SUM(cramount),0) AS cr FROM dailybook WHERE date=? AND entryno IN (SELECT est_no FROM " + cashTblDate + " WHERE counter_code='DB' AND marking_date=?)",
                    sqlDate, sqlDate);
            dto.bankReceipts = toBd(r.get("cr"));
            dto.bankPayments = toBd(r.get("dr"));
        } catch (Exception e) {
            logger.warn("dailyBook: {}", e.getMessage());
        }
        try {
            Double v = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(totalamt),0) FROM vouchermaster WHERE date=? AND mode='RECEIPT'", Double.class,
                    sqlDate);
            dto.upiReceipts = BigDecimal.valueOf(v != null ? v : 0.0);
        } catch (Exception e) {
            logger.warn("upiReceipts: {}", e.getMessage());
        }
        try {
            Double v = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(totalamt),0) FROM vouchermaster WHERE date=? AND mode='PAYMENT'", Double.class,
                    sqlDate);
            dto.upiPayments = BigDecimal.valueOf(v != null ? v : 0.0);
        } catch (Exception e) {
            logger.warn("upiPayments: {}", e.getMessage());
        }
        try {
            Map<String, Object> r = jdbcTemplate.queryForMap(
                    "SELECT COALESCE(SUM(RECPT),0) AS recpt, COALESCE(SUM(PAYMENT),0) AS payment" +
                            " FROM creditcustmaster WHERE slno IN" +
                            " (SELECT est_no FROM " + cashTblDate + " WHERE counter_code='CRD' AND marking_date=?)",
                    sqlDate);
            dto.cardReceipts = toBd(r.get("recpt"));
            dto.cardPayments = toBd(r.get("payment"));
        } catch (Exception e) {
            logger.warn("cardCash: {}", e.getMessage());
        }
        try {
            Double cashCollected = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(cash_collected),0) FROM " + cashTblDate + " WHERE marking_date = ?",
                    Double.class, sqlDate);
            dto.todayCollectionCash = toBd(cashCollected);
        } catch (Exception e) {
            logger.warn("todayCollectionCash: {}", e.getMessage());
        }
        dto.closingCash = dto.openingCash.add(dto.cashReceipts).subtract(dto.cashPayments);
        return dto;
    }

    public String resolveCashMarkingsTable(Date sqlDate) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT count(counter_code) FROM cashmarkings WHERE marking_date = ?", Integer.class, sqlDate);
            if (count != null && count > 0) {
                return "cashmarkings";
            }
        } catch (Exception e) {
            logger.debug("Error checking cashmarkings: {}", e.getMessage());
        }
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT count(counter_code) FROM temp_cashmarkings WHERE marking_date = ?", Integer.class, sqlDate);
            if (count != null && count > 0) {
                logger.info("Using fallback temp_cashmarkings for date {}", sqlDate);
                return "temp_cashmarkings";
            }
        } catch (Exception e) {
            // temp_cashmarkings table might not exist yet
        }
        return "cashmarkings";
    }

    public String resolveCashMarkingsTable() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT count(counter_code) FROM cashmarkings", Integer.class);
            if (count != null && count > 0) {
                return "cashmarkings";
            }
        } catch (Exception e) {
            logger.debug("Error checking cashmarkings: {}", e.getMessage());
        }
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT count(counter_code) FROM temp_cashmarkings", Integer.class);
            if (count != null && count > 0) {
                return "temp_cashmarkings";
            }
        } catch (Exception e) {
        }
        return "cashmarkings";
    }

    private BigDecimal toBd(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal) return (BigDecimal) val;
        if (val instanceof Number) return BigDecimal.valueOf(((Number) val).doubleValue());
        try {
            return new BigDecimal(val.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
