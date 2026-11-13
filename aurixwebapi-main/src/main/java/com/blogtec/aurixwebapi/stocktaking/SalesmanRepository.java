package com.blogtec.aurixwebapi.stocktaking;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.blogtec.aurixwebapi.stocktaking.*;

@Repository
public class SalesmanRepository {
	
	private JdbcTemplate jdbcTemplate;
	
	public SalesmanRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}
	
	public List<SalesmanDto> findAllSalesmen(){
		
		String sql = """
				SELECT salesman_name ,salesman_code
				FROM salesmanmaster s
				ORDER BY salesman_name
				""";
		return jdbcTemplate.query(
				sql,
				(rs, rowNum) -> new SalesmanDto(
						rs.getString("salesman_name"),
						rs.getString("salesman_code")
						)
				);
	}

}
