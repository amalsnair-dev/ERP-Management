package com.blogtec.aurixwebapi.sales;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SalesPrintServices {

    private static final Logger logger = LoggerFactory.getLogger(SalesPrintServices.class);

    private final JdbcTemplate jdbcTemplate;

    public SalesPrintServices(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // =========================
    // MAIN METHOD
    // =========================
    public String print(Long estNo, String type) {
        if ("T".equalsIgnoreCase(type)) {
            return buildThermal(estNo);
        } else {
            return buildEstimate(estNo);
        }
    }

    // =========================
    // THERMAL FORMAT (32 CHAR)
    // =========================
    private String buildThermal(Long estNo) {

        StringBuilder sb = new StringBuilder();
        int width = 42;

        try {
            Map<String, Object> head = jdbcTemplate.queryForMap(
                    "SELECT * FROM estmstr WHERE est_no=?", estNo);

            String date = formatDate(head.get("est_dte"));
            String sman = get(head, "est_sman1");
            String rate = format(getDouble(head, "est_grate"));

            sb.append(center("ESTIMATE ONLY", width)).append("\n\n");
            sb.append(estNo).append("  ").append(sman).append("\n");
            sb.append("Date : ").append(date).append(" Rate : ").append(rate).append("\n\n");

            sb.append("Name   : ").append(get(head, "est_cunm")).append("\n");
            sb.append("Address: ").append(get(head, "est_add1")).append("\n");
            sb.append("Place  : ").append(get(head, "est_add2")).append("\n");
            sb.append("Phone  : ").append(get(head, "est_phone")).append("\n\n");

            sb.append("---SALES ITEMS").append("-".repeat(width - 14)).append("\n");
            sb.append("  Gross  Stone    Net   Stone         \n");
            sb.append(" Weight Weight Weight  Charge   Amount\n");
            sb.append("-".repeat(width)).append("\n");

            List<Map<String, Object>> items = jdbcTemplate.queryForList(
                    "SELECT * FROM saleest WHERE est_no=? ORDER BY it_slno", estNo);

            double totalAmt = 0;
            int totalQty = 0;
            double totalGrwt = 0;
            double totalNtwt = 0;
            double totalGval = 0;
            double totalVaamt = 0;

            for (Map<String, Object> row : items) {

                String name = get(row, "est_itdesc");
                int qty = getInt(row, "est_qty");
                double grwt = getDouble(row, "est_wt");
                double stwt = getDouble(row, "est_stnwt");
                double ntwt = getDouble(row, "est_ntwt");
                double vap = getDouble(row, "est_vaper");
                double stamt = getDouble(row, "est_stnch");
                double amt = getDouble(row, "est_tamt");
                
                totalGval += getDouble(row, "est_gamt");
                totalVaamt += getDouble(row, "est_vamt");

                totalAmt += amt;
                totalQty += qty;
                totalGrwt += grwt;
                totalNtwt += ntwt;

                // Line 1: Weights and Amount
                sb.append(padLeft(format3(grwt), 7)).append(" ")
                  .append(padLeft(stwt > 0 ? format3(stwt) : "", 6)).append(" ")
                  .append(padLeft(format3(ntwt), 9)).append(" ")
                  .append(padLeft(stamt > 0 ? format(stamt) : "", 7)).append(" ")
                  .append(padLeft(String.format("%.0f", amt), 8)).append("\n");

                // Line 2: VAP - : - Qty - : - Name
                sb.append(format1(vap)).append(" - : - ")
                  .append(qty).append(" - ")
                  .append(name).append("\n\n");
            }

            double tax = getTax(estNo);
            double discount = getDouble(head, "est_discount");

            sb.append("-".repeat(width)).append("\n");
            sb.append(padLeft(format3(totalGrwt), 7)).append(" ")
              .append("      ").append(" ")
              .append(padLeft(format3(totalNtwt), 9)).append(" ")
              .append("       ").append(" ")
              .append(padLeft(String.format("%.0f", totalAmt), 8)).append("\n");
            
            sb.append("Total Qty = ").append(totalQty).append("\n");
            sb.append("-".repeat(width)).append("\n");

            sb.append(right("Gold Value : " + padLeft(String.format("%.0f", totalGval), 15), width)).append("\n");
            sb.append(right("Value Addition : " + padLeft(String.format("%.0f", totalVaamt), 15), width)).append("\n");
            sb.append(right("Amount : " + padLeft(String.format("%.0f", totalAmt), 15), width)).append("\n");
            sb.append(right("GST : " + padLeft(String.format("%.0f", tax), 15), width)).append("\n");
            if (discount > 0) {
                sb.append(right("Cash Discount : " + padLeft(String.format("%.0f", discount), 15), width)).append("\n");
            }
            sb.append(right("=".repeat(16), width)).append("\n");
            sb.append(right("Bill Amount : " + padLeft(String.format("%.0f", totalAmt + tax - discount), 15), width)).append("\n");
            sb.append(right("=".repeat(16), width)).append("\n\n");

            sb.append(center("****600***** THANK YOU **************", width));

        } catch (Exception e) {
            logger.error("Failed to build thermal sales estimate for estNo {}: {}", estNo, e.getMessage(), e);
            return "ERROR";
        }

        return sb.toString();
    }

    // =========================
    // ESTIMATE FORMAT (80 CHAR)
    // =========================
    private String buildEstimate(Long estNo) {

        StringBuilder sb = new StringBuilder();
        int width = 80;

        try {
            Map<String, Object> head = jdbcTemplate.queryForMap(
                    "SELECT * FROM estmstr WHERE est_no=?", estNo);

            String date = formatDate(head.get("est_dte"));

            sb.append(center("ESTIMATE ONLY", width)).append("\n");

            String sMan = get(head, "est_sman1");
            String rate = format(getDouble(head, "est_grate"));

            sb.append(estNo).append("###").append(sMan).append("###")
              .append("  Date : ").append(date)
              .append(padLeft("Rate / Grm : " + rate, 38))
              .append("\n");

            sb.append("Name   : ").append(get(head, "est_cunm")).append("\n");

            sb.append("---SALES ITEMS").append("-".repeat(width - 14)).append("\n");
            sb.append("                      |   |   Gross|  Stone|     Net| VA |  Stone|         \n");
            sb.append("Description           |Qty|  Weight| Weight|  Weight|  % | Charge|   Amount\n");
            sb.append("-".repeat(width)).append("\n");

            List<Map<String, Object>> items = jdbcTemplate.queryForList(
                    "SELECT * FROM saleest WHERE est_no=? ORDER BY it_slno", estNo);

            double totalAmt = 0;
            int totalQty = 0;
            double totalGrwt = 0;
            double totalNtwt = 0;

            for (Map<String, Object> row : items) {

                String name = get(row, "est_itdesc");
                int qty = getInt(row, "est_qty");
                double grwt = getDouble(row, "est_wt");
                double stwt = getDouble(row, "est_stnwt");
                double ntwt = getDouble(row, "est_ntwt");
                double vap = getDouble(row, "est_vaper");
                double stamt = getDouble(row, "est_stnch");
                double amt = getDouble(row, "est_tamt");

                totalAmt += amt;
                totalQty += qty;
                totalGrwt += grwt;
                totalNtwt += ntwt;

                sb.append(padRight(name, 22)).append("|")
                  .append(padLeft(String.valueOf(qty), 3)).append("|")
                  .append(padLeft(format3(grwt), 8)).append("|")
                  .append(padLeft(stwt > 0 ? format3(stwt) : "", 7)).append("|")
                  .append(padLeft(format3(ntwt), 8)).append("|")
                  .append(padLeft(format1(vap), 4)).append("|")
                  .append(padLeft(stamt > 0 ? format(stamt) : "", 7)).append("|")
                  .append(padLeft(String.format("%.0f", amt), 9)).append("\n");
            }

            double tax = getTax(estNo);

            sb.append("-".repeat(width)).append("\n");
            sb.append(padRight("TOTAL", 22)).append("|")
              .append(padLeft(String.valueOf(totalQty), 3)).append("|")
              .append(padLeft(format3(totalGrwt), 8)).append("|")
              .append("       |")
              .append(padLeft(format3(totalNtwt), 8)).append("|")
              .append("    |")
              .append("       |")
              .append(padLeft(String.format("%.0f", totalAmt), 9)).append("\n");
            sb.append("-".repeat(width)).append("\n");

            sb.append(right("GST Amount : " + padLeft(String.format("%.0f", tax), 16), width)).append("\n");
            sb.append(right("Net Bill Amount : " + padLeft(String.format("%.0f", totalAmt + tax), 16), width)).append("\n");
            sb.append(right("================", width)).append("\n\n");

            sb.append(center("****600***** THANK YOU **************", width));

        } catch (Exception e) {
            logger.error("Failed to build 80-char sales estimate for estNo {}: {}", estNo, e.getMessage(), e);
            return "ERROR";
        }

        return sb.toString();
    }

    // =========================
    // COMMON HELPERS
    // =========================

    private String get(Map<String, Object> map, String key) {
        return map.get(key) != null ? map.get(key).toString() : "";
    }

    private int getInt(Map<String, Object> map, String key) {
        return map.get(key) != null ? ((Number) map.get(key)).intValue() : 0;
    }

    private double getDouble(Map<String, Object> map, String key) {
        return map.get(key) != null ? ((Number) map.get(key)).doubleValue() : 0;
    }

    private double getTax(Long estNo) {
        Double tax = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(est_gstamt+est_igstamt+est_othtaxamt),0) FROM saleest WHERE est_no=?",
                Double.class, estNo);
        return tax != null ? tax : 0;
    }

    private String format(double val) {
        return String.format("%.2f", val);
    }

    private String format1(double val) {
        return String.format("%.1f", val);
    }

    private String format3(double val) {
        return String.format("%.3f", val);
    }

    private String formatDate(Object dateObj) {
        try {
            return new SimpleDateFormat("dd-MM-yyyy").format(dateObj);
        } catch (Exception e) {
            return "";
        }
    }

    private String center(String text, int width) {
        int pad = (width - text.length()) / 2;
        return " ".repeat(Math.max(0, pad)) + text;
    }

    private String right(String text, int width) {
        return String.format("%" + width + "s", text);
    }

    private String padLeft(String text, int width) {
        return String.format("%" + width + "s", text);
    }

    private String padRight(String text, int width) {
        return String.format("%-" + width + "s", text);
    }
}
