package com.blogtec.aurixwebapi.sales;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class salescheckingServices {

    private final JdbcTemplate jdbcTemplate;

    public salescheckingServices(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean isDiamondItem(String itemCode) {
        String query = "select item_code from itemmaster where item_code=? and counter in(select code from countermaster where dmd_flag='true')";
        List<String> results = jdbcTemplate.queryForList(query, String.class, itemCode);
        return !results.isEmpty();
    }

    public List<String> getDistinctEstNos(String goldSlv) {
        String query = "select distinct est_no from estmstr where gold_slv = ?";
        return jdbcTemplate.queryForList(query, String.class, goldSlv);
    }

    public boolean checkStockReceive(String barcode, String shopcode) {
        // Condition 1: check rshop (Receive Shop) and itemcon=false
        String sql = "select count(*) from stocktransfer where barcode = ? and rshop = ? and itemcon = false";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, barcode, shopcode);
        return count != null && count > 0;
    }

    public boolean checkStockTransfer(String barcode, String shopcode) {
        // Condition 2: check tshop (Transfer Shop)
        String sql = "select count(*) from stocktransfer where barcode = ? and tshop = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, barcode, shopcode);
        return count != null && count > 0;
    }

    public boolean existsByEstNo(int estNo) {
        String query = "select count(*) from estmstr where est_no = ?";
        Integer count = jdbcTemplate.queryForObject(query, Integer.class, estNo);
        return count != null && count > 0;
    }

    public Double barWtDiffLimit() {
        String sql = "select amount from setdiscount where details = 'BAR WT.DIFF SALE'";

        try {
            return jdbcTemplate.queryForObject(sql, Double.class);
        } catch (Exception e) {
            return 0.0; // or throw exception based on your logic
        }
    }

    public boolean isItem(String item, String metalType) {
        if (metalType != null && !metalType.trim().isEmpty()) {
            String query = "select i.item_code from itemmaster as i, metalmaster as m where i.item_code=? and i.catg_type = m.code and m.itemmetaltype=? and i.barcode_flag=false";
            List<String> results = jdbcTemplate.queryForList(query, String.class, item, metalType);
            return !results.isEmpty();
        } else {
            String query = "select item_code from itemmaster where item_code=?";
            List<String> results = jdbcTemplate.queryForList(query, String.class, item);
            return !results.isEmpty();
        }
    }

    @SuppressWarnings("deprecation")
    public Integer getQtyByBarcode(String barcode) {
        String sql = "SELECT COALESCE(SUM(num), 0) FROM mainstock WHERE barcode = ?";

        try {
            return jdbcTemplate.queryForObject(sql, new Object[] { barcode }, Integer.class);
        } catch (Exception e) {
            return 0;
        }
    }

    public boolean getStoneByCode(String code) {
        String sql = "SELECT COUNT(*) FROM stonemaster WHERE s_code = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, code);
        return count != null && count > 0;
    }

    public boolean minVaSalesChecking(String itemCode, Double va) {
        String query = "SELECT count(*) FROM itemmaster WHERE item_code = ? AND va <= ?";
        Integer count = jdbcTemplate.queryForObject(query, Integer.class, itemCode, va);
        return count != null && count > 0;
    }

    public String checkEstimate(Long estNo) {
        Integer c1 = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM sbillmstr WHERE est_no = ?", Integer.class, estNo);
        if (c1 != null && c1 > 0) return "ALREADY_BILLED";

        Integer c2 = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pbillmstr WHERE est_no = ?", Integer.class, estNo);
        if (c2 != null && c2 > 0) return "ALREADY_BILLED";

        Integer c3 = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM crn_billmstr WHERE est_no = ?", Integer.class, estNo);
        if (c3 != null && c3 > 0) return "ALREADY_BILLED";

        return "NOT_BILLED";
    }
}
