package com.blogtec.aurixwebapi.sync.builders;

import com.blogtec.aurixwebapi.dto.SyncPayloadDto.SmithReportSyncDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@Component
public class SmithReportBuilder {

    private static final Logger logger = LoggerFactory.getLogger(SmithReportBuilder.class);

    private final JdbcTemplate jdbcTemplate;

    public SmithReportBuilder(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SmithReportSyncDto> buildSmithReports(Date sqlDate) {
        List<SmithReportSyncDto> resultList = new ArrayList<>();

        // 1. Fetch Receipt Reports (//r)
        try {
            String receiptSql = "SELECT s3.smcode as code, p.p_name as name, s.itemcode as subcode, " +
                    "s.nos, s.grosswt, s.stonewt, s.netwt, s.date, s.mode, " +
                    "coalesce(sum(s2.stn_nos),0) as ctqty, coalesce(sum(s2.stn_qty),0) as ctwt, " +
                    "'R' as type " +
                    "FROM satran as s " +
                    "LEFT JOIN smstonedetails as s2 ON s2.est_no = s.entryno AND s2.it_slno = s.slno AND s2.stn_typ = 'D' " +
                    "LEFT JOIN samaster as s3 ON s3.entryno = s.entryno " +
                    "LEFT JOIN partymaster as p ON p.p_code = s3.smcode " +
                    "WHERE s.date = ? " +
                    "GROUP BY s.itemcode, s.nos, s.grosswt, s.stonewt, s.netwt, s.date, s.mode, p.p_name, s3.smcode, s.slno, s.entryno " +
                    "ORDER BY s3.smcode, s.date, s.itemcode";

            List<SmithReportSyncDto> receipts = jdbcTemplate.query(receiptSql, (rs, rowNum) -> mapRowToDto(rs), sqlDate);
            resultList.addAll(receipts);
            logger.debug("Successfully built {} smith receipt reports", receipts.size());
        } catch (Exception e) {
            logger.error("Error building smith receipt reports: {}", e.getMessage(), e);
        }

        // 2. Fetch Issue Reports (//i)
        try {
            String issueSql = "SELECT s3.smcode as code, p.p_name as name, s.itemcode as subcode, " +
                    "s.nos, s.grosswt, s.stonewt, s.netwt, s.date, s.mode, " +
                    "coalesce(sum(s2.stn_nos),0) as ctqty, coalesce(sum(s2.stn_qty),0) as ctwt, " +
                    "'I' as type " +
                    "FROM isstran as s " +
                    "LEFT JOIN sistonedetails as s2 ON s2.est_no = s.entryno AND s2.it_slno = s.slno AND s2.stn_typ = 'D' " +
                    "LEFT JOIN issmaster as s3 ON s3.entryno = s.entryno " +
                    "LEFT JOIN partymaster as p ON p.p_code = s3.smcode " +
                    "WHERE s.date = ? " +
                    "GROUP BY s.itemcode, s.nos, s.grosswt, s.stonewt, s.netwt, s.date, s.mode, p.p_name, s3.smcode, s.slno, s.entryno " +
                    "ORDER BY s3.smcode, s.date, s.itemcode";

            List<SmithReportSyncDto> issues = jdbcTemplate.query(issueSql, (rs, rowNum) -> mapRowToDto(rs), sqlDate);
            resultList.addAll(issues);
            logger.debug("Successfully built {} smith issue reports", issues.size());
        } catch (Exception e) {
            logger.error("Error building smith issue reports: {}", e.getMessage(), e);
        }

        return resultList.isEmpty() ? null : resultList;
    }

    private SmithReportSyncDto mapRowToDto(ResultSet rs) throws SQLException {
        SmithReportSyncDto dto = new SmithReportSyncDto();
        dto.code = rs.getString("code");
        dto.name = rs.getString("name");
        dto.subcode = rs.getString("subcode");
        dto.nos = getBigDecimal(rs, "nos");
        dto.grosswt = getBigDecimal(rs, "grosswt");
        dto.stonewt = getBigDecimal(rs, "stonewt");
        dto.netwt = getBigDecimal(rs, "netwt");
        dto.date = rs.getDate("date") != null ? rs.getDate("date").toString() : null;
        dto.mode = rs.getString("mode");
        dto.ctqty = getBigDecimal(rs, "ctqty");
        dto.ctwt = getBigDecimal(rs, "ctwt");
        dto.type = rs.getString("type");
        return dto;
    }

    private BigDecimal getBigDecimal(ResultSet rs, String colName) throws SQLException {
        BigDecimal val = rs.getBigDecimal(colName);
        return val != null ? val : BigDecimal.ZERO;
    }
}
