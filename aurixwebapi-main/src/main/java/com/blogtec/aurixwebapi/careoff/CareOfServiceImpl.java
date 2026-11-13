package com.blogtec.aurixwebapi.careoff;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.CareOfMasterDto;

@Service
public class CareOfServiceImpl implements CareOfService {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public CareOfServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<CareOfMasterDto> findAllCareOf() {
        String sql = "SELECT careofname, addr, place, phoneno, careofcode FROM careofmaster ORDER BY careofname";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(CareOfMasterDto.class));
    }

    @Override
    public Optional<String> findCareOfCode(String careofcode) {
        String sql = "SELECT careofcode FROM careofmaster WHERE careofcode = ? AND careofcode != ''";
        try {
            String result = jdbcTemplate.queryForObject(sql, String.class, careofcode);
            return Optional.ofNullable(result);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
