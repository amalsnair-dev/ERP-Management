package com.blogtec.aurixwebapi.sync.builders;

import com.blogtec.aurixwebapi.dto.SyncPayloadDto.NumanaCatHeadSyncDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class NumanaCatHeadBuilder {

    private static final Logger logger = LoggerFactory.getLogger(NumanaCatHeadBuilder.class);

    private final JdbcTemplate jdbcTemplate;

    public NumanaCatHeadBuilder(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<NumanaCatHeadSyncDto> buildNumanaCatHeads() {
        List<NumanaCatHeadSyncDto> list = new ArrayList<>();
        try {
            String sql = "SELECT transdate, code, counter, \"name\", opgwt, opnos, salgwt, salnos, rctgwt, rctnos, " +
                    "shortgwt, shortnos, barrctwt, barrctnos, barisswt, barissnos, closingwt, closingnos, " +
                    "opcwt, opcno, salcwt, salcno, rctcwt, rctcno, shortcwt, shortcno, barrctcwt, barrctcno, " +
                    "barisscwt, barisscno, closingcwt, closingcno FROM public.temp_numanacathead";

            list = jdbcTemplate.query(sql, (rs, rowNum) -> {
                NumanaCatHeadSyncDto dto = new NumanaCatHeadSyncDto();
                dto.transdate = rs.getString("transdate");
                dto.code = rs.getString("code");
                dto.counter = rs.getString("counter");
                dto.name = rs.getString("name");
                dto.opgwt = rs.getBigDecimal("opgwt");
                dto.opnos = rs.getBigDecimal("opnos");
                dto.salgwt = rs.getBigDecimal("salgwt");
                dto.salnos = rs.getBigDecimal("salnos");
                dto.rctgwt = rs.getBigDecimal("rctgwt");
                dto.rctnos = rs.getBigDecimal("rctnos");
                dto.shortgwt = rs.getBigDecimal("shortgwt");
                dto.shortnos = rs.getBigDecimal("shortnos");
                dto.barrctwt = rs.getBigDecimal("barrctwt");
                dto.barrctnos = rs.getBigDecimal("barrctnos");
                dto.barisswt = rs.getBigDecimal("barisswt");
                dto.barissnos = rs.getBigDecimal("barissnos");
                dto.closingwt = rs.getBigDecimal("closingwt");
                dto.closingnos = rs.getBigDecimal("closingnos");
                dto.opcwt = rs.getBigDecimal("opcwt");
                dto.opcno = rs.getBigDecimal("opcno");
                dto.salcwt = rs.getBigDecimal("salcwt");
                dto.salcno = rs.getBigDecimal("salcno");
                dto.rctcwt = rs.getBigDecimal("rctcwt");
                dto.rctcno = rs.getBigDecimal("rctcno");
                dto.shortcwt = rs.getBigDecimal("shortcwt");
                dto.shortcno = rs.getBigDecimal("shortcno");
                dto.barrctcwt = rs.getBigDecimal("barrctcwt");
                dto.barrctcno = rs.getBigDecimal("barrctcno");
                dto.barisscwt = rs.getBigDecimal("barisscwt");
                dto.barisscno = rs.getBigDecimal("barisscno");
                dto.closingcwt = rs.getBigDecimal("closingcwt");
                dto.closingcno = rs.getBigDecimal("closingcno");
                return dto;
            });
        } catch (Exception e) {
            logger.warn("buildNumanaCatHeads failed: {}", e.getMessage());
        }
        return list.isEmpty() ? null : list;
    }
}
