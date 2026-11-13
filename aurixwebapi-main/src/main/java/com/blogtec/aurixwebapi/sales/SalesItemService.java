package com.blogtec.aurixwebapi.sales;

import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.ItemMasterDto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SalesItemService {

    private final JdbcTemplate jdbcTemplate;

    public SalesItemService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ItemMasterDto> getItems(String metalType) {
        if (metalType != null && !metalType.isEmpty()) {
            String searchType = metalType;
            if (metalType.equalsIgnoreCase("GOLD") || metalType.equalsIgnoreCase("G"))
                searchType = "G";
            else if (metalType.equalsIgnoreCase("SILVER") || metalType.equalsIgnoreCase("S"))
                searchType = "S";

            String sql = "SELECT i.item_code AS itemCode, i.item_desc AS itemDesc, i.counter AS counter, i.unit AS unit, i.bill_type AS billType, i.item_categ AS itemCateg, i.catg_type AS categType, i.barcode_flag AS barcodeFlag, i.va AS va FROM itemmaster i JOIN metalmaster m ON i.catg_type = m.code WHERE m.itemmetaltype = ? AND i.barcode_flag = false ORDER BY i.item_code ASC";
            List<ItemMasterDto> items = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(ItemMasterDto.class), searchType);
            return items.stream()
                    .filter(i -> i.getCounter() == null || !i.getCounter().trim().equalsIgnoreCase("BLOCKED"))
                    .collect(Collectors.toList());
        } else {
            String sql = "SELECT item_code AS itemCode, item_desc AS itemDesc, counter AS counter, unit AS unit, bill_type AS billType, item_categ AS itemCateg, catg_type AS categType, barcode_flag AS barcodeFlag, va AS va FROM itemmaster ORDER BY item_code ASC";
            return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(ItemMasterDto.class));
        }
    }

    public ItemMasterDto getItemByCode(String itemCode) {
        String sql = "SELECT DISTINCT item_code AS itemCode, item_desc AS itemDesc, counter AS counter, unit AS unit, bill_type AS billType, item_categ AS itemCateg, catg_type AS categType, barcode_flag AS barcodeFlag, va AS va FROM itemmaster WHERE item_code = ?";
        List<ItemMasterDto> result = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(ItemMasterDto.class), itemCode);
        return result.isEmpty() ? null : result.get(0);
    }

    public Map<String, Object> getGoldRateByItemCode(String itemCode) {
        String sql = "SELECT coalesce(sum(rate), 0) FROM goldratemaster g WHERE code IN (SELECT unit FROM itemmaster WHERE item_code = ?)";
        Double rate = jdbcTemplate.queryForObject(sql, Double.class, itemCode);

        Map<String, Object> response = new HashMap<>();
        response.put("itemCode", itemCode);
        response.put("rate", rate != null ? rate : 0.0);

        try {
            String taxSql = "SELECT c.unit as taxPer FROM itemmaster i LEFT JOIN categorymaster c ON i.item_categ = c.categ_code WHERE i.item_code = ?";
            Map<String, Object> taxResult = jdbcTemplate.queryForMap(taxSql, itemCode);
            response.put("taxPer", taxResult.get("taxper"));
        } catch (Exception ignored) {
        }

        return response;
    }

    public Map<String, Object> getTodayGoldRate() {
        String sql = "SELECT gld_rte FROM goldrate ORDER BY today DESC LIMIT 1";
        Map<String, Object> result = jdbcTemplate.queryForMap(sql);
        Map<String, Object> response = new HashMap<>();
        response.put("rate", result.get("gld_rte"));
        return response;
    }

    public Map<String, Object> getLatestRates() {
        String sql = "SELECT g916, g75, slv FROM dateandrate ORDER BY datatime DESC LIMIT 1";
        try {
            Map<String, Object> result = jdbcTemplate.queryForMap(sql);
            Map<String, Object> response = new HashMap<>();
            response.put("grate22", result.get("g916"));
            response.put("grate18", result.get("g75"));
            response.put("slvrate", result.get("slv"));
            return response;
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("grate22", 0.0);
            response.put("grate18", 0.0);
            response.put("slvrate", 0.0);
            return response;
        }
    }

    public boolean isDuplicateRate(double g916, double g75, double slv) {
        String sql = "SELECT g916, g75, slv FROM dateandrate ORDER BY datatime DESC LIMIT 1";
        try {
            Map<String, Object> result = jdbcTemplate.queryForMap(sql);
            double lastG916 = ((Number) result.get("g916")).doubleValue();
            double lastG75 = ((Number) result.get("g75")).doubleValue();
            double lastSlv = ((Number) result.get("slv")).doubleValue();
            
            return (lastG916 == g916 && lastG75 == g75 && lastSlv == slv);
        } catch (Exception e) {
            return false;
        }
    }
    public List<Map<String, Object>> getSalesmanDetails(Long estNo) {
        String sql = "SELECT estno, slno, salesmancode FROM salesmanbilldata WHERE estno = ? AND mode = 'S'";
        return jdbcTemplate.queryForList(sql, estNo);
    }
}
