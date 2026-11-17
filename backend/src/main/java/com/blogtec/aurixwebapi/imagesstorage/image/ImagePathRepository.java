package com.blogtec.aurixwebapi.imagesstorage.image;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ImagePathRepository {

    private final JdbcTemplate jdbcTemplate;

    public ImagePathRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String getServerPath() {
        String sql = "select remark from setdiscount where details='SERVER PATH'";

        List<String> list = jdbcTemplate.queryForList(sql, String.class);

        if (list.isEmpty() || list.get(0) == null || list.get(0).trim().isEmpty()) {
            return "Server path is empty";
        }

        return list.get(0);
    }

    public String getImageFolder() {
        String sql = "select remark from setdiscount where details='IMAGE FOLDER NAME'";

        List<String> list = jdbcTemplate.queryForList(sql, String.class);

        if (list.isEmpty() || list.get(0) == null || list.get(0).trim().isEmpty()) {
            return "Image folder name is empty";
        }

        return list.get(0);
    }
}