package com.blogtec.aurixwebapi.heating;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blogtec.aurixwebapi.dto.HeatingDto;

@Service
public class HeatingServImpl implements HeatingServ {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    @PostConstruct
    public void createGoldHeatMstrTable() {
        String sql = """
            CREATE TABLE IF NOT EXISTS gold_heat_mstr (
                heat_id     SERIAL PRIMARY KEY,
                estno       INTEGER DEFAULT 0,
                entry_date  DATE DEFAULT CURRENT_DATE,
                sm_code     VARCHAR(50) DEFAULT '',
                gld_slv     VARCHAR(10) DEFAULT '',
                cust_id     VARCHAR(50) DEFAULT '',
                cust_name   VARCHAR(200) DEFAULT '',
                phone       VARCHAR(20) DEFAULT '',
                item_code   VARCHAR(50) DEFAULT '',
                qty         INTEGER DEFAULT 0,
                grwt        NUMERIC(15, 3) DEFAULT 0,
                stwt        NUMERIC(15, 3) DEFAULT 0,
                ntwt        NUMERIC(15, 3) DEFAULT 0,
                remark      VARCHAR(500) DEFAULT '',
                iss_flag    BOOLEAN DEFAULT FALSE,
                rec_grwt    NUMERIC(15, 3) DEFAULT 0,
                rec_stwt    NUMERIC(15, 3) DEFAULT 0,
                rec_ntwt    NUMERIC(15, 3) DEFAULT 0,
                rec_remark  VARCHAR(500) DEFAULT '',
                row_id      INTEGER DEFAULT 0,
                user_id     INTEGER DEFAULT 0,
                sm_name     VARCHAR(100) DEFAULT '',
                shop_code   VARCHAR(50) DEFAULT '',
                rec_flag    BOOLEAN DEFAULT FALSE,
                save_flag   BOOLEAN DEFAULT FALSE
            );
        """;
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception e) {
            // Ignore if table initialization failed or already created
        }
    }

    // ─── Row Mapper ────────────────────────────────────────────────────────────

    private static final RowMapper<HeatingDto> HEATING_ROW_MAPPER = new RowMapper<HeatingDto>() {
        @Override
        public HeatingDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            HeatingDto dto = new HeatingDto();
            dto.setHeatId(rs.getInt("heat_id"));
            dto.setEstno(rs.getInt("estno"));
            Date d = rs.getDate("entry_date");
            dto.setEntryDate(d != null ? d.toLocalDate() : null);
            dto.setSmCode(rs.getString("sm_code"));
            dto.setGldSlv(rs.getString("gld_slv"));
            dto.setCustId(rs.getString("cust_id"));
            dto.setCustName(rs.getString("cust_name"));
            dto.setPhone(rs.getString("phone"));
            dto.setItemCode(rs.getString("item_code"));
            dto.setQty(rs.getInt("qty"));
            dto.setGrwt(rs.getBigDecimal("grwt"));
            dto.setStwt(rs.getBigDecimal("stwt"));
            dto.setNtwt(rs.getBigDecimal("ntwt"));
            dto.setRemark(rs.getString("remark"));
            dto.setIssFlag(rs.getBoolean("iss_flag"));
            dto.setRecGrwt(rs.getBigDecimal("rec_grwt"));
            dto.setRecStwt(rs.getBigDecimal("rec_stwt"));
            dto.setRecNtwt(rs.getBigDecimal("rec_ntwt"));
            dto.setRecRemark(rs.getString("rec_remark"));
            dto.setRowId(rs.getInt("row_id"));
            dto.setUserId(rs.getInt("user_id"));
            dto.setSmName(rs.getString("sm_name"));
            dto.setShopCode(rs.getString("shop_code"));
            dto.setRecFlag(rs.getBoolean("rec_flag"));
            dto.setSaveFlag(rs.getBoolean("save_flag"));
            return dto;
        }
    };

    // ─── Null-safe helpers ─────────────────────────────────────────────────────

    private String s(String v) { return v != null ? v : ""; }
    private Integer i(Integer v) { return v != null ? v : 0; }
    private BigDecimal b(BigDecimal v) { return v != null ? v : BigDecimal.ZERO; }
    private Boolean bl(Boolean v) { return v != null ? v : false; }

    // ─── Service Methods ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public HeatingDto addHeat(HeatingDto dto) {
        String sql = "INSERT INTO gold_heat_mstr ("
                + "estno, entry_date, sm_code, gld_slv, cust_id, cust_name, phone, item_code, "
                + "qty, grwt, stwt, ntwt, remark, iss_flag, rec_grwt, rec_stwt, rec_ntwt, "
                + "rec_remark, row_id, user_id, sm_name, shop_code, rec_flag, save_flag"
                + ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        jdbcTemplate.update(sql,
                i(dto.getEstno()),
                dto.getEntryDate() != null ? Date.valueOf(dto.getEntryDate()) : Date.valueOf(java.time.LocalDate.now()),
                s(dto.getSmCode()),
                s(dto.getGldSlv()),
                s(dto.getCustId()),
                s(dto.getCustName()),
                s(dto.getPhone()),
                s(dto.getItemCode()),
                i(dto.getQty()),
                b(dto.getGrwt()),
                b(dto.getStwt()),
                b(dto.getNtwt()),
                s(dto.getRemark()),
                bl(dto.getIssFlag()),
                b(dto.getRecGrwt()),
                b(dto.getRecStwt()),
                b(dto.getRecNtwt()),
                s(dto.getRecRemark()),
                i(dto.getRowId()),
                i(dto.getUserId()),
                s(dto.getSmName()),
                s(dto.getShopCode()),
                bl(dto.getRecFlag()),
                bl(dto.getSaveFlag()));

        return dto;
    }

    @Override
    @Transactional
    public HeatingDto updateHeat(int estno, int rowId, HeatingDto dto) {

        // Fetch existing row
        String selectSql = "SELECT * FROM gold_heat_mstr WHERE estno = ? AND row_id = ?";
        List<HeatingDto> rows = jdbcTemplate.query(selectSql, HEATING_ROW_MAPPER, estno, rowId);

        if (rows.isEmpty()) {
            return null;
        }

        HeatingDto existing = rows.get(0);

        BigDecimal newRecGrwt  = dto.getRecGrwt()  != null ? dto.getRecGrwt()  : existing.getRecGrwt();
        BigDecimal newRecStwt  = dto.getRecStwt()  != null ? dto.getRecStwt()  : existing.getRecStwt();
        BigDecimal newRecNtwt  = dto.getRecNtwt()  != null ? dto.getRecNtwt()  : existing.getRecNtwt();
        String     newRecRemark = dto.getRecRemark() != null ? dto.getRecRemark() : existing.getRecRemark();

        String updateSql = "UPDATE gold_heat_mstr "
                + "SET rec_grwt = ?, rec_stwt = ?, rec_ntwt = ?, rec_remark = ?, save_flag = true "
                + "WHERE estno = ? AND row_id = ?";

        jdbcTemplate.update(updateSql, newRecGrwt, newRecStwt, newRecNtwt, newRecRemark, estno, rowId);

        existing.setRecGrwt(newRecGrwt);
        existing.setRecStwt(newRecStwt);
        existing.setRecNtwt(newRecNtwt);
        existing.setRecRemark(newRecRemark);
        existing.setSaveFlag(true);

        return existing;
    }

    @Override
    @Transactional
    public ResponseEntity<?> updateFlag(int estno) {
        int updatedRows = jdbcTemplate.update(
                "UPDATE gold_heat_mstr SET iss_flag = true WHERE estno = ?", estno);

        if (updatedRows > 0) {
            return ResponseEntity.ok("Daily Heating Record with Estno : " + estno + " has been updated successfully");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Daily Heating Record with Estno : " + estno + " Not Found");
        }
    }

    @Override
    @Transactional
    public ResponseEntity<?> updateRecFlag(int estno) {
        int updatedRows = jdbcTemplate.update(
                "UPDATE gold_heat_mstr SET rec_flag = true WHERE estno = ?", estno);

        if (updatedRows > 0) {
            return ResponseEntity.ok("Daily Heating Record with Estno : " + estno + " has been updated successfully");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Daily Heating Record with Estno : " + estno + " Not Found");
        }
    }

    @Override
    @Transactional
    public ResponseEntity<?> deleteHeat(int estno) {
        int deletedRows = jdbcTemplate.update(
                "DELETE FROM gold_heat_mstr WHERE estno = ?", estno);

        if (deletedRows > 0) {
            return ResponseEntity.ok("Daily Heating Record with Estno : " + estno + " has been deleted successfully");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Daily Heating Record with Estno : " + estno + " Not Found");
        }
    }

    @Override
    public List<HeatingDto> getByEstno(int estno) {
        String sql = "SELECT * FROM gold_heat_mstr WHERE estno = ? ORDER BY row_id";
        return jdbcTemplate.query(sql, HEATING_ROW_MAPPER, estno);
    }
}
