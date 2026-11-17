package com.blogtec.aurixwebapi.giftmaster;

import com.blogtec.aurixwebapi.dto.GiftMasterDto;
import com.blogtec.aurixwebapi.dto.GiftLookupDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GiftMasterServiceImpl implements GiftMasterService {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public GiftMasterServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void createTable() {
        String sql = """
            CREATE TABLE IF NOT EXISTS gift_master (
                gift_id BIGSERIAL PRIMARY KEY,
                gift_code VARCHAR(50) NOT NULL,
                gift_name VARCHAR(255) NOT NULL
            );
        """;
        jdbcTemplate.execute(sql);
    }

    @Override
    public boolean saveGift(GiftMasterDto giftDto) {
        String sql = "INSERT INTO gift_master (gift_code, gift_name) VALUES (?, ?)";
        return jdbcTemplate.update(sql, giftDto.getGiftCode(), giftDto.getGiftName()) > 0;
    }

    @Override
    public boolean updateGift(GiftMasterDto giftDto) {
        String sql = "UPDATE gift_master SET gift_code = ?, gift_name = ? WHERE gift_id = ?";
        return jdbcTemplate.update(sql, giftDto.getGiftCode(), giftDto.getGiftName(), giftDto.getGiftId()) > 0;
    }

    @Override
    public boolean deleteGift(Long giftId) {
        String sql = "DELETE FROM gift_master WHERE gift_id = ?";
        return jdbcTemplate.update(sql, giftId) > 0;
    }

    @Override
    public List<GiftMasterDto> getAllGifts() {
        String sql = "SELECT gift_id, gift_code, gift_name FROM gift_master ORDER BY gift_id DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new GiftMasterDto(
                rs.getLong("gift_id"),
                rs.getString("gift_code"),
                rs.getString("gift_name")
        ));
    }

    @Override
    public Optional<GiftMasterDto> getGiftById(Long giftId) {
        String sql = "SELECT gift_id, gift_code, gift_name FROM gift_master WHERE gift_id = ?";
        try {
            GiftMasterDto dto = jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new GiftMasterDto(
                    rs.getLong("gift_id"),
                    rs.getString("gift_code"),
                    rs.getString("gift_name")
            ), giftId);
            return Optional.ofNullable(dto);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<GiftMasterDto> getGiftByCode(String giftCode) {
        String sql = "SELECT gift_id, gift_code, gift_name FROM gift_master WHERE gift_code = ?";
        try {
            GiftMasterDto dto = jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new GiftMasterDto(
                    rs.getLong("gift_id"),
                    rs.getString("gift_code"),
                    rs.getString("gift_name")
            ), giftCode);
            return Optional.ofNullable(dto);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public boolean existsByGiftCode(String giftCode) {
        String sql = "SELECT COUNT(*) FROM gift_master WHERE gift_code = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, giftCode);
        return count != null && count > 0;
    }

    @Override
    public List<GiftLookupDto> getGiftLookup() {
        String sql = "SELECT gift_code, gift_name FROM gift_master ORDER BY gift_code ASC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new GiftLookupDto(
                rs.getString("gift_code"),
                rs.getString("gift_name")
        ));
    }
}
