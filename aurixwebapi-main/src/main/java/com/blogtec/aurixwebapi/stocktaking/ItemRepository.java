package com.blogtec.aurixwebapi.stocktaking;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.blogtec.aurixwebapi.stocktaking.*;

@Repository
public class ItemRepository {

    private final JdbcTemplate jdbcTemplate;

    public ItemRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ItemDto> findItemsByCounter(String counterCode) {

        String sql = """
                SELECT item_desc, item_code
                FROM itemmaster
                WHERE counter = ?
                ORDER BY item_desc
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new ItemDto(
                        rs.getString("item_desc"),
                        rs.getString("item_code")
                ),
                counterCode
        );
    }
}