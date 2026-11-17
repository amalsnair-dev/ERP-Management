package com.blogtec.aurixwebapi.stocktaking;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.blogtec.aurixwebapi.stocktaking.*;

@Repository
public class StockTakingRepository {

    private final JdbcTemplate jdbcTemplate;

    public StockTakingRepository(JdbcTemplate jdbcTemplate) {

        this.jdbcTemplate = jdbcTemplate;
    }

    public Long getNextStockSerial() {

        String sql = """
                SELECT COALESCE(MAX(stockserial), 0) + 1
                FROM lastno
                """;

        return jdbcTemplate.queryForObject(
                sql,
                Long.class
        );
    }

    public void insertStockTaking(StockTakingDto stockTaking) {

        String insertSql = """
                INSERT INTO stkchkmaster
                (slno, sdate, operator, counter, itcode, mac_id, ip)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;

        jdbcTemplate.update(
                insertSql,
                stockTaking.getSlno(),
                stockTaking.getDate(),
                stockTaking.getOperator(),
                stockTaking.getCounter(),
                stockTaking.getItem(),
                stockTaking.getMacId(),
                stockTaking.getIp()
        );

        String updateSql = """
                UPDATE lastno
                SET stockserial = ?
                """;

        jdbcTemplate.update(
                updateSql,
                stockTaking.getSlno()
        );
    }

    public void deleteStockTaking(String slno) {

        String sql = """
                DELETE FROM stkchkmaster
                WHERE slno = ?
                """;

        jdbcTemplate.update(
                sql,
                slno
        );
    }

    public boolean masterEntryExists(String slno) {

        String sql = """
                SELECT EXISTS (
                    SELECT 1
                    FROM stkchkmaster
                    WHERE slno = ?
                )
                """;

        Boolean exists = jdbcTemplate.queryForObject(
                sql,
                Boolean.class,
                slno
        );

        return Boolean.TRUE.equals(exists);
    }

    public boolean barcodeExists(String barcode) {

        String sql = """
                SELECT EXISTS (
                    SELECT 1
                    FROM mainstock
                    WHERE barcode = ?
                )
                """;

        Boolean exists = jdbcTemplate.queryForObject(
                sql,
                Boolean.class,
                barcode
        );

        return Boolean.TRUE.equals(exists);
    }

    public boolean barcodeIsAvailable(String barcode) {

        String sql = """
                SELECT EXISTS (
                    SELECT 1
                    FROM mainstock
                    WHERE barcode = ?
                      AND itemsold = false
                )
                """;

        Boolean available = jdbcTemplate.queryForObject(
                sql,
                Boolean.class,
                barcode
        );

        return Boolean.TRUE.equals(available);
    }

    public boolean categoryMatches(String slno, String barcode) {

        String sql = """
                SELECT EXISTS (
    SELECT 1
    FROM stkchkmaster m
    JOIN itemmaster master_item
        ON master_item.item_code = m.itcode
    JOIN mainstock stock
        ON stock.barcode = ?
    WHERE m.slno = ?
      AND master_item.counter = stock.counter_code
)
                """;

        Boolean matches = jdbcTemplate.queryForObject(
                sql,
                Boolean.class,
                barcode,
                slno
        );

        return Boolean.TRUE.equals(matches);
    }

    public boolean barcodeAlreadyEntered(
            String slno,
            String barcode) {

        String sql = """
                SELECT EXISTS (
                    SELECT 1
                    FROM stkchktrans
                    WHERE slno = ?
                      AND brcode = ?
                )
                """;

        Boolean exists = jdbcTemplate.queryForObject(
                sql,
                Boolean.class,
                slno,
                barcode
        );

        return Boolean.TRUE.equals(exists);
    }

    public StockTakingItemDetails findBarcodeDetails(
            String barcode) {

        String sql = """
                SELECT
                    a.barcode,
                    a.itemcode,
                    a.grossweight,
                    a.num,
                    a.netweight,
                    b.item_desc
                FROM mainstock a
                JOIN itemmaster b
                    ON a.itemcode = b.item_code
                WHERE a.barcode = ?
                """;

        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> new StockTakingItemDetails(
                        rs.getString("barcode"),
                        rs.getString("itemcode"),
                        rs.getBigDecimal("grossweight"),
                        rs.getBigDecimal("num"),
                        rs.getBigDecimal("netweight"),
                        rs.getString("item_desc")
                ),
                barcode
        );
    }
    
    public Integer getNextTransactionCounter() {

        String sql = """
                SELECT COALESCE(MAX(ctr), 0) + 1
                FROM stkchktrans
                """;

        return jdbcTemplate.queryForObject(
                sql,
                Integer.class
        );
    }
    
    public StockTakingStoneDetails findStoneDetails(String barcode) {

        String sql = """
                SELECT
                    COALESCE(SUM(stonewt), 0) AS carat_weight,
                    COALESCE(SUM(nos), 0) AS stone_count
                FROM barcodeandstone
                WHERE barcode = ?
                  AND stonetype = 'D'
                """;

        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> new StockTakingStoneDetails(
                        rs.getBigDecimal("carat_weight"),
                        rs.getBigDecimal("stone_count")
                ),
                barcode
        );
    }

    public void insertStockTakingTransaction(
        String slno,
        int ctr,
        StockTakingItemDetails details,
        StockTakingStoneDetails stoneDetails,
        String macId,
        String ip) {

    String sql = """
            INSERT INTO stkchktrans
            (slno, ctr, brcode, itcode, gwt, nwt, qty, cwt, cnos, mac_id, ip)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """;

    jdbcTemplate.update(
            sql,
            slno,
            ctr,
            details.getBarcode(),
            details.getItemCode(),
            details.getGrossWeight(),
            details.getNetWeight(),
            details.getNum(),
            stoneDetails.getCaratWeight(),
            stoneDetails.getStoneCount(),
            macId,
            ip
    );
}
    
    public void deleteStockTakingTransaction(
            String barcode) {

        String sql =
                "DELETE FROM stkchktrans " +
                "WHERE brcode = ?";

        jdbcTemplate.update(
                sql,
                barcode
        );
    }
}