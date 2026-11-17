package com.blogtec.aurixwebapi.sync.builders;

import com.blogtec.aurixwebapi.dto.SyncPayloadDto.OrderSyncDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.Map;

@Component
public class OrderSummaryBuilder {

    private static final Logger logger = LoggerFactory.getLogger(OrderSummaryBuilder.class);

    private final JdbcTemplate jdbcTemplate;

    public OrderSummaryBuilder(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public OrderSyncDto buildOrderSummary(Date sqlDate) {
        OrderSyncDto dto = new OrderSyncDto();
        try {
            Map<String, Object> r = jdbcTemplate.queryForMap(
                    "SELECT COALESCE(SUM(s.adv_amt),0) AS amt FROM saleadvdetails s JOIN sbillmstr m ON m.bill_no=s.bill_no WHERE s.adv_name='ORDER' AND m.est_dte=?",
                    sqlDate);
            dto.closedOrders = toBd(r.get("amt"));
        } catch (Exception e) {
            logger.warn("closedOrders: {}", e.getMessage());
        }
        try {
            Map<String, Object> r = jdbcTemplate.queryForMap(
                    "SELECT COALESCE(SUM(b.cash_amount+b.credit_amount),0) AS amt FROM ordermaster a JOIN ordertrans b ON a.invoiceno=b.invoiceno WHERE b.advance_date IS NULL AND a.order_date=?",
                    sqlDate);
            dto.todayOpenOrders = toBd(r.get("amt"));
        } catch (Exception e) {
            logger.warn("todayOpenOrders: {}", e.getMessage());
        }
        try {
            Map<String, Object> r = jdbcTemplate.queryForMap(
                    "SELECT COALESCE(SUM(b.cash_amount+b.credit_amount),0) AS amt FROM ordermaster a JOIN ordertrans b ON a.invoiceno=b.invoiceno WHERE b.advance_date=? AND b.addl='A'",
                    sqlDate);
            dto.advanceOrders = toBd(r.get("amt"));
        } catch (Exception e) {
            logger.warn("advanceOrders: {}", e.getMessage());
        }
        try {
            Map<String, Object> r = jdbcTemplate.queryForMap(
                    "SELECT COALESCE(SUM(b.cash_amount+b.credit_amount),0) AS amt FROM ordermaster a JOIN ordertrans b ON a.invoiceno=b.invoiceno WHERE b.advance_date=? AND b.addl='P'",
                    sqlDate);
            dto.paymentOrders = toBd(r.get("amt"));
        } catch (Exception e) {
            logger.warn("paymentOrders: {}", e.getMessage());
        }
        try {
            Map<String, Object> r = jdbcTemplate.queryForMap(
                    "SELECT COALESCE(SUM(b.cash_amount+b.credit_amount),0) AS amt FROM ordermaster a JOIN ordertrans b ON a.invoiceno=b.invoiceno WHERE a.order_status=false");
            dto.balanceOrders = toBd(r.get("amt"));
        } catch (Exception e) {
            logger.warn("balanceOrders: {}", e.getMessage());
        }
        dto.openingOrderAmount = dto.balanceOrders.add(dto.closedOrders)
                .subtract(dto.todayOpenOrders).subtract(dto.advanceOrders).subtract(dto.paymentOrders);
        return dto;
    }

    private BigDecimal toBd(Object val) {
        if (val == null) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(val.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
