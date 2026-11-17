package com.blogtec.aurixwebapi.giftmaster;

import com.blogtec.aurixwebapi.dto.GiftMasterDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class GiftMasterRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;


    public void createGiftMasterTable() {
        String sql = """
            CREATE TABLE IF NOT EXISTS gift_master (
                gift_id BIGSERIAL PRIMARY KEY,
                gift_code VARCHAR(50) NOT NULL,
                gift_name VARCHAR(255) NOT NULL
            );
        """;
        jdbcTemplate.execute(sql);
    }

  
    public int saveGift(GiftMasterDto giftDto) {
        String sql = "INSERT INTO gift_master (gift_code, gift_name) VALUES (?, ?)";
        return jdbcTemplate.update(sql, giftDto.getGiftCode(), giftDto.getGiftName());
    }

  
    public List<GiftMasterDto> getAllGifts() {
        String sql = "SELECT gift_id, gift_code, gift_name FROM gift_master";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new GiftMasterDto(
                rs.getLong("gift_id"),
                rs.getString("gift_code"),
                rs.getString("gift_name")
        ));
    }

   
    public GiftMasterDto getGiftById(Long giftId) {
        String sql = "SELECT gift_id, gift_code, gift_name FROM gift_master WHERE gift_id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new GiftMasterDto(
                rs.getLong("gift_id"),
                rs.getString("gift_code"),
                rs.getString("gift_name")
        ), giftId);
    }

  
    public GiftMasterDto getGiftByCode(String giftCode) {
        String sql = "SELECT gift_id, gift_code, gift_name FROM gift_master WHERE gift_code = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new GiftMasterDto(
                rs.getLong("gift_id"),
                rs.getString("gift_code"),
                rs.getString("gift_name")
        ), giftCode);
    }
}
