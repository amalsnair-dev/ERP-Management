package com.blogtec.aurixwebapi.stocktaking;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.blogtec.aurixwebapi.stocktaking.*;
@Repository
public class CounterRepository {

    private final JdbcTemplate jdbcTemplate;

    public CounterRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CounterDto> findAllCounters() {

        String sql = """
                SELECT name, code
                FROM countermaster
                ORDER BY name
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new CounterDto(
                        rs.getString("name"),
                        rs.getString("code")
                )
        );
    }
}