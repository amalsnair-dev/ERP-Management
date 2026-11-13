package com.blogtec.aurixwebapi.sync.builders;

import com.blogtec.aurixwebapi.config.IpConfig;
import com.blogtec.aurixwebapi.dto.GetCustDataDto;
import com.blogtec.aurixwebapi.dto.SyncPayloadDto.CollectionSyncDto;
import com.blogtec.aurixwebapi.dto.SyncPayloadDto.CollectionDetailSyncDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.*;

@Component
public class CollectionSummaryBuilder {

    private static final Logger logger = LoggerFactory.getLogger(CollectionSummaryBuilder.class);

    private final JdbcTemplate jdbcTemplate;
    private final GetCustDataDto getCustDataDto;
    private final ObjectMapper objectMapper;

    public CollectionSummaryBuilder(JdbcTemplate jdbcTemplate, GetCustDataDto getCustDataDto, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.getCustDataDto = getCustDataDto;
        this.objectMapper = objectMapper;
    }

    public CollectionSyncDto buildCollectionSummary(Date sqlDate) {
        return buildCollectionSummary(null, sqlDate != null ? sqlDate.toString() : null, sqlDate);
    }

    public CollectionSyncDto buildCollectionSummary(String shopCode, String dateStr, Date sqlDate) {
        CollectionSyncDto dto = new CollectionSyncDto();

        // 1. Fetch Scheme Collection details from API if shopCode and dateStr are present
        Map<String, BigDecimal> schemeMap = new HashMap<>();
        if (shopCode != null && dateStr != null) {
            try {
                String baseUrl = IpConfig.getProjectSchemeUrl();
                if (baseUrl != null && !baseUrl.isBlank()) {
                    String apiUrl = baseUrl + "kurytran/report/cardreport?fdate=" + dateStr + "&tdate=" + dateStr + "&shopcode=" + shopCode + "&report=D";
                    logger.debug("Fetching scheme collection from: {}", apiUrl);
                    String data = getCustDataDto.apiResponseGet(apiUrl);
                    if (data != null && !data.isBlank()) {
                        JsonNode root = objectMapper.readTree(data);
                        JsonNode kurytranNode = root.path("Kurytran");
                        if (kurytranNode.isTextual()) {
                            kurytranNode = objectMapper.readTree(kurytranNode.asText());
                        }
                        if (kurytranNode.isArray()) {
                            for (JsonNode row : kurytranNode) {
                                String bank = row.path("bank").asText("").trim();
                                BigDecimal credit = toBd(row.path("credit").asText("0"));
                                if (!bank.isEmpty()) {
                                    schemeMap.put(bank.toUpperCase(), schemeMap.getOrDefault(bank.toUpperCase(), BigDecimal.ZERO).add(credit));
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                logger.warn("Error fetching scheme collection from API: {}", e.getMessage());
            }
        }

        // 2. Query local database tables
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT UPPER(m.acname) AS acname," +
                            " COALESCE(SUM(s.amount),0) AS sale_amt," +
                            " COALESCE(SUM(p.amount),0) AS pur_amt," +
                            " COALESCE(SUM(c.amount),0) AS crn_amt," +
                            " COALESCE(SUM(t.credit_amount),0) AS order_amt," +
                            " COALESCE(SUM(aord.credit_amount),0) AS aord_amt," +
                            " COALESCE(SUM(aordp.credit_amount),0) AS aordp_amt" +
                            " FROM acc_register m" +
                            " LEFT JOIN (SELECT code, SUM(amount) AS amount FROM creditmarkings WHERE est_date=? GROUP BY code) s ON s.code=m.accode::TEXT" +
                            " LEFT JOIN (SELECT code, SUM(amount) AS amount FROM creditpurchase WHERE est_date=? GROUP BY code) p ON p.code=m.accode::TEXT" +
                            " LEFT JOIN (SELECT code, SUM(amount) AS amount FROM crn_markings WHERE est_date=? GROUP BY code) c ON c.code=m.accode::TEXT" +
                            " LEFT JOIN (SELECT payment_type, SUM(credit_amount) AS credit_amount FROM ordertrans WHERE order_date=? AND addl='F' AND credit_amount>0 AND advancehead='BANK' GROUP BY payment_type) t ON t.payment_type=m.accode::TEXT" +
                            " LEFT JOIN (SELECT payment_type, SUM(credit_amount) AS credit_amount FROM ordertrans WHERE advance_date=? AND addl='A' AND credit_amount>0 AND advancehead='BANK' GROUP BY payment_type) aord ON aord.payment_type=m.accode::TEXT" +
                            " LEFT JOIN (SELECT payment_type, SUM(credit_amount*-1) AS credit_amount FROM ordertrans WHERE advance_date=? AND addl='P' AND credit_amount<0 AND advancehead='BANK' GROUP BY payment_type) aordp ON aordp.payment_type=m.accode::TEXT" +
                            " WHERE m.billflg=true GROUP BY m.acname" +
                            " UNION ALL" +
                            " SELECT CASE WHEN m.groupcode = sd_debtors.amount THEN 'SUNDRY DEBTORS(CUSTOMER)' WHEN m.groupcode = sd_creditors.amount THEN 'SUNDRY CREDITORS(CUSTOMER)' END AS acname," +
                            " COALESCE(SUM(s.amount), 0) AS sale_amt," +
                            " COALESCE(SUM(p.amount), 0) AS pur_amt," +
                            " COALESCE(SUM(c.amount), 0) AS crn_amt," +
                            " COALESCE(SUM(t.credit_amount), 0) AS order_amt," +
                            " COALESCE(SUM(aord.credit_amount), 0) AS aord_amt," +
                            " COALESCE(SUM(aordp.credit_amount), 0) AS aordp_amt" +
                            " FROM acc_register m" +
                            " LEFT JOIN setdiscount sd_debtors ON sd_debtors.details = 'SUNDRY DEBTORS(CUSTOMER)'" +
                            " LEFT JOIN setdiscount sd_creditors ON sd_creditors.details = 'SUNDRY CREDITORS(CUSTOMER)'" +
                            " LEFT JOIN (SELECT code, SUM(amount) AS amount FROM creditmarkings WHERE est_date = ? GROUP BY code) s ON s.code = m.accode::TEXT" +
                            " LEFT JOIN (SELECT code, SUM(amount) AS amount FROM creditpurchase WHERE est_date = ? GROUP BY code) p ON p.code = m.accode::TEXT" +
                            " LEFT JOIN (SELECT code, SUM(amount) AS amount FROM crn_markings WHERE est_date = ? GROUP BY code) c ON c.code = m.accode::TEXT" +
                            " LEFT JOIN (SELECT payment_type, SUM(credit_amount) AS credit_amount FROM ordertrans WHERE order_date = ? AND addl = 'F' AND credit_amount > 0 AND advancehead = 'BANK' GROUP BY payment_type) t ON t.payment_type = m.accode::TEXT" +
                            " LEFT JOIN (SELECT payment_type, SUM(credit_amount) AS credit_amount FROM ordertrans WHERE advance_date = ? AND addl = 'A' AND credit_amount > 0 AND advancehead = 'BANK' GROUP BY payment_type) aord ON aord.payment_type = m.accode::TEXT" +
                            " LEFT JOIN (SELECT payment_type, SUM(credit_amount * -1) AS credit_amount FROM ordertrans WHERE advance_date = ? AND addl = 'P' AND credit_amount < 0 AND advancehead = 'BANK' GROUP BY payment_type) aordp ON aordp.payment_type = m.accode::TEXT" +
                            " WHERE (m.groupcode = sd_debtors.amount OR m.groupcode = sd_creditors.amount)" +
                            " GROUP BY CASE WHEN m.groupcode = sd_debtors.amount THEN 'SUNDRY DEBTORS(CUSTOMER)' WHEN m.groupcode = sd_creditors.amount THEN 'SUNDRY CREDITORS(CUSTOMER)' END",
                    sqlDate, sqlDate, sqlDate, sqlDate, sqlDate, sqlDate,
                    sqlDate, sqlDate, sqlDate, sqlDate, sqlDate, sqlDate);

            Set<String> processedBanks = new HashSet<>();
            for (Map<String, Object> row : rows) {
                String rawName = Objects.toString(row.get("acname"), "");
                String upperName = rawName.toUpperCase();

                CollectionDetailSyncDto detail = new CollectionDetailSyncDto();
                detail.acname = rawName;
                detail.saleAmount = toBd(row.get("sale_amt"));
                detail.purchaseAmount = toBd(row.get("pur_amt"));
                detail.creditNoteAmount = toBd(row.get("crn_amt"));
                detail.orderAmount = toBd(row.get("order_amt"));
                detail.advanceOrderAmount = toBd(row.get("aord_amt"));
                detail.advanceOrderPaymentAmount = toBd(row.get("aordp_amt"));

                if (schemeMap.containsKey(upperName)) {
                    detail.schemeAmount = schemeMap.get(upperName);
                    processedBanks.add(upperName);
                }

                dto.collectionDetails.add(detail);
            }

            // Add any bank scheme amounts that didn't match existing account names
            for (Map.Entry<String, BigDecimal> entry : schemeMap.entrySet()) {
                if (!processedBanks.contains(entry.getKey()) && entry.getValue() != null && entry.getValue().compareTo(BigDecimal.ZERO) != 0) {
                    CollectionDetailSyncDto detail = new CollectionDetailSyncDto();
                    detail.acname = entry.getKey();
                    detail.schemeAmount = entry.getValue();
                    dto.collectionDetails.add(detail);
                }
            }

        } catch (Exception e) {
            logger.warn("collectionSummary: {}", e.getMessage());
        }

        String cashTbl = resolveCashMarkingsTable(sqlDate);
        try {
            Map<String, Object> r = jdbcTemplate.queryForMap(
                    "SELECT COALESCE(SUM(RECPT),0) AS recpt FROM creditcustmaster WHERE slno IN (SELECT est_no FROM " + cashTbl + " WHERE counter_code='CRD' AND marking_date=?)",
                    sqlDate);
            dto.cashCollection = toBd(r.get("recpt"));
        } catch (Exception e) {
            logger.warn("cashCollection: {}", e.getMessage());
        }

        try {
            Double cashCollected = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(cash_collected),0) FROM " + cashTbl + " WHERE marking_date = ?",
                    Double.class, sqlDate);
            dto.todayCollectionCash = toBd(cashCollected);
        } catch (Exception e) {
            logger.warn("todayCollectionCash: {}", e.getMessage());
        }

        return dto;
    }

    private String resolveCashMarkingsTable(Date sqlDate) {
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
