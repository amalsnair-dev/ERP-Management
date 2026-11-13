package com.blogtec.aurixwebapi.sync.builders;

import com.blogtec.aurixwebapi.dto.SyncPayloadDto.DateAndRateSyncDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DateAndRateBuilder {

    private static final Logger logger = LoggerFactory.getLogger(DateAndRateBuilder.class);

    private final JdbcTemplate jdbcTemplate;

    public DateAndRateBuilder(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DateAndRateSyncDto buildDateAndRate(LocalDate businessDate, String shopCode) {
        String sql = "SELECT * FROM dateandrate WHERE thisday = ? ORDER BY datatime desc LIMIT 1";
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> mapDto(rs, rs.getString("thisday")), java.sql.Date.valueOf(businessDate));
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            // Fallback: If no dateandrate row exists for businessDate, fetch the latest dateandrate available
            String fallbackSql = "SELECT * FROM dateandrate ORDER BY datatime desc, thisday desc LIMIT 1";
            try {
                return jdbcTemplate.queryForObject(fallbackSql, (rs, rowNum) -> mapDto(rs, businessDate.toString()));
            } catch (Exception ex) {
                logger.warn("No dateandrate record found in database: {}", ex.getMessage());
                return null;
            }
        } catch (Exception e) {
            logger.error("Error fetching dateandrate for sync: " + e.getMessage());
            return null;
        }
    }

    private DateAndRateSyncDto mapDto(java.sql.ResultSet rs, String thisDayStr) throws java.sql.SQLException {
        DateAndRateSyncDto dto = new DateAndRateSyncDto();
        dto.thisday = thisDayStr;
        dto.g999 = rs.getBigDecimal("g999");
        dto.g995 = rs.getBigDecimal("g995");
        dto.g994 = rs.getBigDecimal("g994");
        dto.g916 = rs.getBigDecimal("g916");
        dto.g875 = rs.getBigDecimal("g875");
        dto.g78 = rs.getBigDecimal("g78");
        dto.g75 = rs.getBigDecimal("g75");
        dto.ogcash = rs.getBigDecimal("ogcash");
        dto.slv = rs.getBigDecimal("slv");
        dto.oslv = rs.getBigDecimal("oslv");
        dto.bulslv = rs.getBigDecimal("bulslv");
        dto.slv50 = rs.getBigDecimal("slv50");
        dto.slv80 = rs.getBigDecimal("slv80");
        dto.slv995 = rs.getBigDecimal("slv995");
        dto.plt = rs.getBigDecimal("plt");
        dto.oplt = rs.getBigDecimal("oplt");
        dto.g14 = rs.getBigDecimal("g14");
        dto.g9 = rs.getBigDecimal("g9");
        dto.shopcode = rs.getString("shopcode");

        try {
            Object rf = rs.getObject("restflag");
            if (rf instanceof Boolean) {
                dto.restflag = (Boolean) rf;
            } else if (rf instanceof Number) {
                dto.restflag = ((Number) rf).intValue() == 1;
            } else if (rf != null) {
                String s = rf.toString().trim();
                dto.restflag = "true".equalsIgnoreCase(s) || "t".equalsIgnoreCase(s) || "1".equals(s);
            }
        } catch (Exception ignored) {}

        try {
            String rt = rs.getString("reset_time");
            if (rt == null) {
                rt = rs.getString("resttime");
            }
            if (rt != null && !rt.trim().isEmpty()) {
                dto.resetTime = rt.trim();
            }
        } catch (Exception ignored) {}

        return dto;
    }
}
