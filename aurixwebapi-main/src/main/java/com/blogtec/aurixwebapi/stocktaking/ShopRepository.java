package com.blogtec.aurixwebapi.stocktaking;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.blogtec.aurixwebapi.stocktaking.*;

@Repository
public class ShopRepository {
	
	private final JdbcTemplate jdbcTemplate;
	
	public ShopRepository(JdbcTemplate jdbcTemplate) {
		
		this.jdbcTemplate = jdbcTemplate;
	}
	
	public List<ShopDto> findAllShops(){
		
		String sql = """
				SELECT shop_id, shopcode, ipnumber
				FROM shopdetails
				WHERE shopflag = false
				ORDER BY shopcode
				""";
		
		return jdbcTemplate.query(
				sql,
				(rs, rowNum) -> new ShopDto(
						rs.getLong("shop_id"),
						rs.getString("shopcode"),
						rs.getString("ipnumber")
						)
				);
				
	}
	
	public ShopDto findShopByCode(String shopCode) {

	    String sql = """
	            SELECT shop_id, shopcode, ipnumber
	            FROM shopdetails
	            WHERE shopcode = ?
	              AND shopflag = false
	            """;

	    return jdbcTemplate.queryForObject(
	            sql,
	            (rs, rowNum) -> new ShopDto(
	                    rs.getLong("shop_id"),
	                    rs.getString("shopcode"),
	                    rs.getString("ipnumber")
	            ),
	            shopCode
	    );
	}
	

}
