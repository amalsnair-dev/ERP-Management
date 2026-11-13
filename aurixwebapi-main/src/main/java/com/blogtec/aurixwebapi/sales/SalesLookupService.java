package com.blogtec.aurixwebapi.sales;

import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.blogtec.aurixwebapi.dto.StoneMasterDto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SalesLookupService {

    private final JdbcTemplate jdbcTemplate;
    private static final Logger log = LoggerFactory.getLogger(SalesLookupService.class);

    public SalesLookupService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ============ STONES ============

    public List<StoneMasterDto> getAllStones() {
        String sql = "SELECT s_code AS sCode, s_desc AS sDesc, s_unit AS sUnit, s_type AS sType, s_dtype AS sDtype, s_rate AS sRate FROM stonemaster ORDER BY s_desc ASC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(StoneMasterDto.class));
    }

    public StoneMasterDto getStoneByCode(String code) {
        String sql = "SELECT s_code AS sCode, s_desc AS sDesc, s_unit AS sUnit, s_type AS sType, s_dtype AS sDtype, s_rate AS sRate FROM stonemaster WHERE s_code = ?";
        List<StoneMasterDto> result = jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(StoneMasterDto.class), code);
        return result.isEmpty() ? null : result.get(0);
    }

    // ============ EST NO ============

    @Transactional
    public Integer getNextEstNo() {
        String selectSql = "SELECT est_no FROM EstNo";
        String updateSql = "UPDATE EstNo SET est_no = est_no + 1";
        try {
            Integer currentNo = jdbcTemplate.queryForObject(selectSql, Integer.class);
            jdbcTemplate.update(updateSql);
            log.info("Fetched EstNo: {} and incremented in DB", currentNo);
            return currentNo;
        } catch (Exception e) {
            log.error("Error in getNextEstNo: {}", e.getMessage());
            return 1; // Fallback
        }
    }

    public List<Integer> getEstNosByMetalType(String metalType) {
        String sql = "SELECT DISTINCT est_no FROM estmstr WHERE gold_slv = ? ORDER BY est_no DESC";
        return jdbcTemplate.queryForList(sql, Integer.class, metalType.toUpperCase());
    }

    // ============ TAX RATE ============

    public Double getTaxRateByItemCode(String itemCode) {
        String sql = "SELECT c.unit FROM categorymaster c JOIN itemmaster i ON c.categ_code = i.item_categ WHERE i.item_code = ?";
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, itemCode);
            if (rows.isEmpty()) return 0.0;
            Object val = rows.get(0).get("unit");
            if (val == null) return 0.0;
            if (val instanceof Number) return ((Number) val).doubleValue();
            return Double.parseDouble(val.toString().trim());
        } catch (Exception e) {
            log.error("Error retrieving tax rate for item code {}: {}", itemCode, e.getMessage(), e);
            return 0.0;
        }
    }

    // ============ NEXT CUST ID ============

    public String getNextCustId() {
        String sql = "SELECT COALESCE(MAX(CAST(custid AS INTEGER)), 0) + 1 FROM estmstr WHERE custid ~ '^[0-9]+$'";
        Integer nextId = jdbcTemplate.queryForObject(sql, Integer.class);
        return String.valueOf(nextId != null ? nextId : 1);
    }

    // ============ ESTIMATE BY EST NO ============

    public Map<String, Object> getEstimateByEstNo(Integer estNo) {
    
    	String headerSql = "SELECT e.est_no as estNo, e.est_grate as estGrate, " +
    	                   "e.custid as custid, e.est_cunm as estCunm, " +
    	                   "e.est_phone as estPhone, e.est_add1 as estAdd1, " +
    	                   "e.est_add2 as estAdd2, e.est_add3 as estAdd3, " +
    	                   "e.est_pin as estPin, e.panno as panno, " +
    	                   "e.gstno as gstno, e.est_sman1 as estSman1, " +
    	                   "e.est_gstper as estGstper, e.est_igstper as estIgstper, " +
    	                   "s.salesman_name as salesmanName, " + 
    	                   "e.gold_slv as goldSlv, e.est_dte as estDte ,e.careof as careoff, e.aadhaar as aadharno " +
    	                   "FROM estmstr e " +
    	                   "LEFT JOIN salesmanmaster s ON e.est_sman1 = s.salesman_code " + 
    	                   "WHERE e.est_no = ?";


        List<Map<String, Object>> headers = jdbcTemplate.queryForList(headerSql, estNo);
        if (headers.isEmpty()) return null;

        Map<String, Object> header = headers.get(0);

        String itemsSql = "SELECT est_barcode as estBarcode, est_icode as estIcode, " +
                          "est_itdesc as estItdesc, est_cntr as estCntr, " +
                          "est_actualwt as estActualwt, est_noded as estNoded, " +
                          "est_wtadd as estWtadd, est_wtded as estWtded, " +
                          "est_qty as estQty, est_wt as estWt, " +
                          "est_stnwt as estStnwt, est_ntwt as estNtwt, " +
                          "est_vaper as estVaper, est_mkch as estMkch, " +
                          "est_vamt as estVamt, est_stnch as estStnch, " +
                          "est_gamt as estGamt, est_tamt as estTamt, " +
                          "est_gstper as estGstper, est_igstper as estIgstper, " +
                          "est_gstamt as estGstamt, est_igstamt as estIgstamt, " +
                          "totalamount as totalamount, " +
                          "est_sman as \"estSman\", est_sman1 as \"estSman1\", " +
                          "it_slno as itSlno FROM saleest " +
                          "WHERE est_no = ? ORDER BY it_slno";
        List<Map<String, Object>> saleItems = jdbcTemplate.queryForList(itemsSql, estNo);

        String stonesSql = "SELECT se.slno AS slno, se.stn_typ AS stnTyp, " +
                           "se.stn_qty AS stnQty, se.stn_rate AS stnRate, " +
                           "se.stn_amt AS stnAmt, se.stn_nos AS stnNos, " +
                           "se.it_slno AS itSlno, se.s_type AS stype, " +
                           "s.s_unit AS sUnit " +
                           "FROM stoneest se JOIN stonemaster s ON s.s_code = se.s_type " +
                           "WHERE se.est_no = ? ORDER BY se.it_slno, se.slno";
        List<Map<String, Object>> stoneEntries = jdbcTemplate.queryForList(stonesSql, estNo);

        // --- NEW: Fetch all salesmen from salesmanbilldata ---
        String smanSql = "SELECT b.slno, b.salesmancode as \"smCode\", m.salesman_name as \"smName\" " +
                         "FROM salesmanbilldata b " +
                         "LEFT JOIN salesmanmaster m ON b.salesmancode = m.salesman_code " +
                         "WHERE b.estno = ? AND b.mode = 'S' ORDER BY b.slno";
        List<Map<String, Object>> smanEntries = jdbcTemplate.queryForList(smanSql, estNo);

        Map<String, Object> response = new HashMap<>(header);
        response.put("saleItems", saleItems);
        response.put("stoneEntries", stoneEntries);
        response.put("smanEntries", smanEntries);
        return response;
    }

    // ============ SEARCH BY METAL ============

    public List<Map<String, Object>> searchByMetal(String metalType) {
        String sql = "SELECT est_no as estNo, est_cunm as estCunm, " +
                     "est_add1 as estAdd1, est_phone as estPhone, " +
                     "est_sman1 as estSman1 FROM estmstr " +
                     "WHERE gold_slv = ? ORDER BY est_no ASC";
        return jdbcTemplate.queryForList(sql, metalType);
    }

    // ============ BARCODE SEARCH ============

    public Map<String, Object> searchByBarcode(String barcode) {
        String paddedBarcode = barcode.length() < 10
                ? String.format("%10s", barcode).replace(' ', '0')
                : barcode;

        String sql = "SELECT * FROM mainstock WHERE barcode = ? AND (sold IS NULL OR sold = false) LIMIT 1";
        List<Map<String, Object>> stockRows = jdbcTemplate.queryForList(sql, paddedBarcode);
        if (stockRows.isEmpty()) return null;

        Map<String, Object> ms = stockRows.get(0);
        Map<String, Object> data = new HashMap<>();
        data.put("itemcode", ms.get("itemcode"));
        data.put("cntr", ms.get("counter_code"));
        data.put("qty", ms.get("num"));
        data.put("grossWt", ms.get("grossweight"));
        data.put("stoneWt", ms.get("stoneweight"));
        data.put("netWt", ms.get("netweight"));
        data.put("vaPer", ms.get("valueaddition"));
        data.put("stnChg", ms.get("stonecharge"));
        data.put("mkRate", ms.get("makingcharge"));
        data.put("wastage", ms.get("wastage"));

        try {
            String itemSql = "SELECT item_desc, unit, bill_type, item_categ FROM itemmaster WHERE item_code = ?";
            Map<String, Object> imRow = jdbcTemplate.queryForMap(itemSql, ms.get("itemcode"));
            data.put("itemDesc", imRow.get("item_desc"));
            data.put("unit", imRow.get("unit"));
            data.put("billType", imRow.get("bill_type"));
            data.put("itemCateg", imRow.get("item_categ"));
        } catch (Exception ignored) {
        }

        Map<String, Object> response = new HashMap<>();
        response.put("barcode", paddedBarcode);
        response.put("data", data);
        return response;
    }
}
