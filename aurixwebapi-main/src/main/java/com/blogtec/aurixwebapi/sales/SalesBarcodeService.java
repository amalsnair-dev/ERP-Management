package com.blogtec.aurixwebapi.sales;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.blogtec.aurixwebapi.dto.SalesBarcodeRequest;
import com.blogtec.aurixwebapi.dto.SalesBarcodeResponseDto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SalesBarcodeService {

    private static final Logger logger = LoggerFactory.getLogger(SalesBarcodeService.class);

    private final JdbcTemplate jdbcTemplate;

    public SalesBarcodeService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @SuppressWarnings("unused")
	@Transactional
    public SalesBarcodeResponseDto scanBarcode(SalesBarcodeRequest req) {
        SalesBarcodeResponseDto resp = new SalesBarcodeResponseDto();
        String barcode = req.getBarcode();
        String goldSlv = req.getGoldSlv();
        int estNo = req.getEstNo() != null ? req.getEstNo() : 0;
        boolean checked = req.isChecked();

        // 1. Check if barcode matches category type & barcode filters (mainstock joined with itemmaster & metalmaster)
        String mainCheckSql = "select count(*) from mainstock as m " +
                "inner join itemmaster as i on i.item_code=m.itemcode " +
                "join metalmaster as t on i.catg_type = t.code " +
                "where t.itemmetaltype=? and m.barcode=? and m.itemsold=false";
        
        Integer mainCount = jdbcTemplate.queryForObject(mainCheckSql, Integer.class, goldSlv, barcode);

        if (mainCount != null && mainCount > 0) {
            // 2. Check if already billed in sbilltran for another estimate
            String billedSql = "select count(*) from sbilltran where est_barcode=? and est_no <> ?";
            Integer billedCount = jdbcTemplate.queryForObject(billedSql, Integer.class, barcode, estNo);

            if (billedCount == null || billedCount == 0) {
                if (!checked) {
                    try {
                        String stockSql = "select * from mainstock where barcode = ?";
                        List<Map<String, Object>> rows = jdbcTemplate.queryForList(stockSql, barcode);
                        if (!rows.isEmpty()) {
                            Map<String, Object> rs = rows.get(0);
                            resp.setBarcode(String.valueOf(rs.get("BARCODE")));
                            resp.setItemCode(String.valueOf(rs.get("ITEMCODE")));

                            // Get Item Description
                            String descSql = "select item_desc from itemmaster where item_code = ?";
                            String itemDesc = "";
                            try {
                                itemDesc = jdbcTemplate.queryForObject(descSql, String.class, rs.get("ITEMCODE"));
                            } catch (Exception ignored) {}
                            resp.setItemDesc(itemDesc);

                            resp.setCntr(String.valueOf(rs.get("COUNTER_CODE")));
                            resp.setQty(String.valueOf(rs.get("NUM")));
                            resp.setGrwt(String.valueOf(rs.get("GROSSWEIGHT")));
                            resp.setStwt(String.valueOf(rs.get("STONEWEIGHT")));
                            resp.setNetwt(String.valueOf(rs.get("NETWEIGHT")));

                             // Parse database values
                            double dbGrossWt = 0.0;
                            double dbStnWt = 0.0;
                            double dbNetWt = 0.0;
                            double dbMakingCharge = 0.0;
                            double dbValueAddition = 0.0;
                            double dbWastage = 0.0;
                            double dbStoneCharge = 0.0;

                            try { dbGrossWt = Double.parseDouble(String.valueOf(rs.get("GROSSWEIGHT"))); } catch (Exception ignored) {}
                            try { dbStnWt = Double.parseDouble(String.valueOf(rs.get("STONEWEIGHT"))); } catch (Exception ignored) {}
                            try { dbNetWt = Double.parseDouble(String.valueOf(rs.get("NETWEIGHT"))); } catch (Exception ignored) {}
                            try { dbMakingCharge = Double.parseDouble(String.valueOf(rs.get("MAKINGCHARGE"))); } catch (Exception ignored) {}
                            try { dbValueAddition = Double.parseDouble(String.valueOf(rs.get("VALUEADDITION"))); } catch (Exception ignored) {}
                            try { dbWastage = Double.parseDouble(String.valueOf(rs.get("WASTAGE"))); } catch (Exception ignored) {}
                            try { dbStoneCharge = Double.parseDouble(String.valueOf(rs.get("STONECHARGE"))); } catch (Exception ignored) {}

                            // Simulate Desktop UI Variable Setup:
                            double txtgrwt = dbGrossWt;
                            double txtstwt = dbStnWt;
                            double txtnetwt = dbGrossWt - dbStnWt;
                            double txtvaper = dbValueAddition;
                            double txtvaamt = 0.00;
                            double txtstnchg = dbStoneCharge;
                            double txtactualwt = dbGrossWt;

                            double txtmkchg = 0.0;
                            if (dbMakingCharge > 0) {
                                txtvaamt = dbMakingCharge;
                                txtmkchg = 0.00;
                            } else {
                                txtmkchg = dbMakingCharge;
                            }

                            double txtwastage = 0.000;
                            if (dbWastage > 0) {
                                if (dbNetWt > 0) {
                                    txtmkchg = dbWastage / dbNetWt;
                                }
                            }

                            // Check other weight deduction (setOthiwt):
                            boolean salesEditable = true;
                            double othitwt = 0.0;
                            String dbBarcode = String.valueOf(rs.get("BARCODE"));
                            String othCheckSql = "select count(*) from mainstock m where m.barcode = ? and m.ot_itwt > 0";
                            Integer othCount = jdbcTemplate.queryForObject(othCheckSql, Integer.class, dbBarcode);
                            if (othCount != null && othCount > 0) {
                                salesEditable = false;
                                Double fetchedOth = null;
                                try {
                                    fetchedOth = jdbcTemplate.queryForObject("select ot_itwt from mainstock where barcode = ? and ot_itwt > 0", Double.class, dbBarcode);
                                } catch (Exception ignored) {}
                                if (fetchedOth != null) {
                                    othitwt = fetchedOth;
                                    txtgrwt = txtgrwt - othitwt;
                                    txtactualwt = txtactualwt - othitwt;
                                    txtnetwt = txtgrwt - txtstwt;
                                }
                            }

                            // calculateRowSalesTotals Math:
                            double grosswt = txtgrwt;
                            double stnwt = txtstwt;
                            double wastage = txtwastage; // 0.000
                            double mkchg = txtmkchg;
                            double vaper = txtvaper;
                            double stnchg = txtstnchg;
                            double goldRte = req.getGoldRate();
                            double vaamt = txtvaamt;

                            // TTD Silver making Rate adjustment:
                            if (mkchg > 0) 
                            {
                                mkchg = mkchg - goldRte;
                                if (mkchg < 0)
                                {
                                    resp.setSuccess(false);
                                    resp.setWarningMessage(" Making Charge less than Gold Rate.");
                                    resp.setAction("CLEAR_ALL");
                                    return resp;
                                }
                            }

                            double goldamt = (grosswt - stnwt) * goldRte;

                            if (wastage != 0 || mkchg != 0) 
                            {
                                vaamt = ((wastage * goldRte) + mkchg * (grosswt - stnwt));
                                if (goldRte * (grosswt - stnwt) != 0)
                                {
                                    vaper = ((vaamt * 100) / (goldRte * (grosswt - stnwt)));
                                }
                            }

                            if (vaper != 0)
                            {
                                vaamt = (((grosswt - stnwt) * goldRte) * vaper / 100);
                            } 
                            else {
                                if (vaamt > 0 && goldRte * (grosswt - stnwt) != 0) {
                                    vaper = ((vaamt * 100) / (goldRte * (grosswt - stnwt)));
                                }
                            }        

                            // Fill response object
                            resp.setGrwt(String.format("%.3f", grosswt));
                            resp.setStwt(String.format("%.3f", stnwt));
                            resp.setNetwt(String.format("%.3f", (grosswt - stnwt)));
                            resp.setActualwt(String.format("%.3f", txtactualwt));
                            resp.setSalesEditable(salesEditable);
                            resp.setSman(req.getSalesmanCode());

                            // GST details
                            double taxPer = req.getGstPer();
                            double igstPer = req.getIgstPer();

                            String pBillCheckSql = "select count(*) from itemmaster where item_code = ? and bill_type = 'P'";
                            Integer isPBill = jdbcTemplate.queryForObject(pBillCheckSql, Integer.class, rs.get("ITEMCODE"));
                            if (isPBill == null || isPBill == 0) {
                                resp.setWastage(String.format("%.3f", wastage)); // which is 0.000
                                resp.setMkchg("0.00");
                                resp.setVaper(String.format("%.2f", vaper));
                                resp.setVaamt(String.format("%.2f", vaamt));
                                resp.setStnchg(String.format("%.2f", stnchg));
                                resp.setGoldamt(String.format("%.2f", goldamt));
                                resp.setAmount(String.format("%.2f", (goldamt + stnchg + vaamt)));
                            } else {
                                resp.setWastage("0.000");
                                resp.setMkchg("0.00");
                                resp.setVaper("0.00");
                                resp.setVaamt("0.00");
                                resp.setStnchg("0.00");
                                resp.setGoldamt("0.00");
                                
                                // P items amount lookup / tax calculations
                                if (req.getTabSaleRowCount() == 0) {
                                    String taxSql = "SELECT a.unit FROM categorymaster AS a JOIN itemmaster AS b ON a.categ_code = b.item_categ WHERE b.item_code = ?";
                                    Double tax = 0.0;
                                    try {
                                        tax = jdbcTemplate.queryForObject(taxSql, Double.class, rs.get("ITEMCODE"));
                                    } catch (Exception ignored) {}

                                    if (req.isIgstSelected()) {
                                        igstPer = tax != null ? tax : 0.0;
                                    } else {
                                        taxPer = tax != null ? tax : 0.0;
                                    }
                                }

                                double pAmt = 0.0;
                                try {
                                    pAmt = Double.parseDouble(String.valueOf(rs.get("p_amt")));
                                } catch (Exception ignored) {}

                                double amt = (pAmt / (100 + taxPer + igstPer) * 100);
                                resp.setAmount(String.format("%.2f", amt));
                            }

                            resp.setGstper(taxPer);
                            resp.setIgstper(igstPer);

                            // Populating otherItem for dual-item barcodes:
                            if (othitwt > 0) {
                                String othitemcode = "";
                                try {
                                    othitemcode = jdbcTemplate.queryForObject("select ot_itcode from mainstock where barcode = ? and ot_itwt > 0 limit 1", String.class, dbBarcode);
                                } catch (Exception ignored) {}

                                if (othitemcode != null && !othitemcode.trim().isEmpty()) {
                                    SalesBarcodeResponseDto otherItem = new SalesBarcodeResponseDto();
                                    otherItem.setBarcode(dbBarcode);
                                    otherItem.setItemCode(othitemcode);

                                    String othDesc = "";
                                    try {
                                        othDesc = jdbcTemplate.queryForObject("select item_desc from itemmaster where item_code = ?", String.class, othitemcode);
                                    } catch (Exception ignored) {}
                                    otherItem.setItemDesc(othDesc);

                                    otherItem.setCntr(resp.getCntr());
                                    otherItem.setQty("0");
                                    otherItem.setGrwt(String.format("%.3f", othitwt));
                                    otherItem.setStwt("0.000");
                                    otherItem.setNetwt(String.format("%.3f", othitwt));
                                    otherItem.setActualwt(String.format("%.3f", othitwt));
                                    otherItem.setWastage("0.000");
                                    otherItem.setMkchg("0.00");
                                    otherItem.setVaper("0.00");
                                    otherItem.setVaamt("0.00");
                                    otherItem.setStnchg("0.00");
                                    otherItem.setNoded("0");
                                    otherItem.setWtded("0.000");
                                    otherItem.setWtadd("0.000");
                                    otherItem.setSman(req.getSalesmanCode());
                                    otherItem.setSalesEditable(null);
                                    otherItem.setSuccess(null);

                                    // Get Gold Rate of the other item:
                                    double othGoldRate = 0.0;
                                    try {
                                        String rateSql = "SELECT coalesce(sum(rate), 0) FROM goldratemaster g WHERE code IN (SELECT unit FROM itemmaster WHERE item_code = ?)";
                                        Double r = jdbcTemplate.queryForObject(rateSql, Double.class, othitemcode);
                                        if (r != null) {
                                            othGoldRate = r;
                                        }
                                    } catch (Exception ignored) {}

                                    double othGoldAmt = othitwt * othGoldRate;
                                    otherItem.setGoldamt(String.format("%.2f", othGoldAmt));
                                    otherItem.setAmount(String.format("%.2f", othGoldAmt));
                                    
                                    resp.setOtherItem(otherItem);
                                }
                            }

                            // Stone details
                            String stoneCheckSql = "select count(*) from barcodeandstone where barcode = ?";
                            Integer hasStone = jdbcTemplate.queryForObject(stoneCheckSql, Integer.class, barcode);
                            if (hasStone != null && hasStone > 0) {
                                String stoneDetailsSql = "select b.stonecode, b.nos, b.stonewt, b.rate, b.amount, " +
                                        "s.s_unit as sUnit, s.s_type as sType, s.s_dtype as sDtype " +
                                        "from barcodeandstone b " +
                                        "left join stonemaster s on s.s_code = b.stonecode " +
                                        "where b.barcode = ?";
                                List<Map<String, Object>> stoneDetails = jdbcTemplate.queryForList(stoneDetailsSql, barcode);
                                resp.setStoneDetails(stoneDetails);
                            } else {
                                resp.setStoneDetails(new ArrayList<>());
                            }

                            // Check previous barcode warning
                            String rfidCheckSql = "select count(*) from mainstock where rfid = 'PRVB' and barcode = ?";
                            Integer rfidCount = jdbcTemplate.queryForObject(rfidCheckSql, Integer.class, barcode);
                            if (rfidCount != null && rfidCount > 0) {
                                resp.setSuccess(false);
                                resp.setWarningMessage("Previous Barcode Cannot Be Entered ");
                                resp.setAction("CLEAR_ALL");
                                return resp;
                            }

                            // Check saleest barcode duplicate in other estimate
                            String duplicateEstSql = "select count(*) from saleest where est_barcode = ? and est_no <> ?";
                            Integer duplicateEstCount = jdbcTemplate.queryForObject(duplicateEstSql, Integer.class, barcode, estNo);
                            if (duplicateEstCount != null && duplicateEstCount > 0) {
                                String estNoInOther = "";
                                try {
                                    estNoInOther = jdbcTemplate.queryForObject("select est_no from saleest where est_barcode = ? limit 1", String.class, barcode);
                                } catch (Exception ignored) {}
                                resp.setSuccess(false);
                                resp.setWarningMessage("Barcode exists in ( " + estNoInOther + " ) estimate");
                                resp.setAction("CLEAR_ALL");
                                return resp;
                            }

                            resp.setSuccess(true);
                        } else {
                            resp.setSuccess(false);
                            resp.setAction("FOCUS_BARCODE");
                        }
                    } catch (Exception ce) {
                        logger.error("Error parsing stock details for barcode {}: {}", barcode, ce.getMessage(), ce);
                        resp.setSuccess(false);
                        resp.setWarningMessage("Error parsing stock details: " + ce.getMessage());
                    }
                } else {
                    resp.setSuccess(false);
                    resp.setWarningMessage("Barcode Is Already Entered ");
                    resp.setAction("CLEAR_ALL");
                }
            } else {
                String estNoBilled = "";
                try {
                    estNoBilled = jdbcTemplate.queryForObject("select est_no from sbilltran where est_barcode = ? limit 1", String.class, barcode);
                } catch (Exception ignored) {}
                resp.setSuccess(false);
                resp.setWarningMessage("Barcode is already billed in ( " + estNoBilled + " ) estimate");
                resp.setAction("CLEAR_ALL");
            }
        } else {
            // Check if transferred to back office
            String transSql = "select count(*) from mainstock where barcode = ? and itemsold = true and sslno > 0";
            Integer transCount = jdbcTemplate.queryForObject(transSql, Integer.class, barcode);
            if (transCount != null && transCount > 0) {
                resp.setSuccess(false);
                resp.setWarningMessage(" Item Already Transfered to Back Office ");
                resp.setAction("FOCUS_BARCODE");
            } else {
                resp.setSuccess(false);
                resp.setWarningMessage(" Invalid Barcode Entry");
                resp.setAction("CLEAR_ALL");
            }
        }

        return resp;
    }
}
