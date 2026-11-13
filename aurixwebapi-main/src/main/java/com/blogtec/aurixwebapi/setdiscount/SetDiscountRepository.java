package com.blogtec.aurixwebapi.setdiscount;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.blogtec.aurixwebapi.dto.SetDiscountDTO;

import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;

@Repository
public class SetDiscountRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<SetDiscountDTO> getAllData() 
    {
        String sql = "SELECT details, amount, flag, remark FROM setdiscount";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new SetDiscountDTO(
                rs.getString("details"),
                rs.getDouble("amount"),
                rs.getString("flag"),
                rs.getString("remark")));
    }

    
    public int getIdleTimeout()
    {
        String sql = "SELECT amount FROM setdiscount WHERE details = 'IDLE TIMEOUT MINUTES' AND flag = true";

        List<Double> list = jdbcTemplate.queryForList(sql, Double.class);

        if (list.isEmpty() || list.get(0) == null) 
        {
            return 0;
        }

        double value = list.get(0);

        if (value < 1) {
            return 0;
        }

        if (value == Math.floor(value)) {
            return (int) value;
        }

        return (int) value;
    }
}
