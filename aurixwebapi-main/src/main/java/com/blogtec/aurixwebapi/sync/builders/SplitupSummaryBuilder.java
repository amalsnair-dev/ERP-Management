package com.blogtec.aurixwebapi.sync.builders;

import com.blogtec.aurixwebapi.dto.SyncPayloadDto.SplitupSyncDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class SplitupSummaryBuilder {

    private static final Logger logger = LoggerFactory.getLogger(SplitupSummaryBuilder.class);

    private final JdbcTemplate jdbcTemplate;

    public SplitupSummaryBuilder(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SplitupSyncDto> buildSplitupSummaries() {
        List<SplitupSyncDto> list = new ArrayList<>();
        try {
            String sql = "SELECT transdate,slno, description, catcode, catname, rctnos, rctgwt, issnos, issgwt FROM public.temp_splituptable";
            list = jdbcTemplate.query(sql, (rs, rowNum) -> {
                SplitupSyncDto dto = new SplitupSyncDto();
                dto.transdate = rs.getString("transdate");
                dto.slno = rs.getInt("slno");
                dto.description = rs.getString("description");
                dto.catcode = rs.getString("catcode");
                dto.catname = rs.getString("catname");
                dto.opnos = BigDecimal.ZERO;
                dto.opgwt = BigDecimal.ZERO;
                dto.rctnos = rs.getBigDecimal("rctnos");
                dto.rctgwt = rs.getBigDecimal("rctgwt");
                dto.issnos = rs.getBigDecimal("issnos");
                dto.issgwt = rs.getBigDecimal("issgwt");
                dto.closingnos = BigDecimal.ZERO;
                dto.closingwt = BigDecimal.ZERO;
                return dto;
            });
        } catch (Exception e) {
            logger.warn("buildSplitupSummaries failed: {}", e.getMessage());
        }
        return list.isEmpty() ? null : list;
    }
}
