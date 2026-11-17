package com.blogtec.aurixwebapi.sales;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SalesDeleteService {

    private static final Logger log = LoggerFactory.getLogger(SalesDeleteService.class);

    private final JdbcTemplate jdbcTemplate;

    public SalesDeleteService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

 

    // ✅ DELETE ONLY
    @Transactional
    public String deleteEstimate(Long estNo) {

        jdbcTemplate.update("DELETE FROM EstMstr WHERE est_no = ?", estNo);
        jdbcTemplate.update("DELETE FROM SaleEst WHERE est_no = ?", estNo);
        jdbcTemplate.update("DELETE FROM PureEst WHERE est_no = ?", estNo);
        jdbcTemplate.update("DELETE FROM StoneEst WHERE est_no = ?", estNo);
        jdbcTemplate.update("DELETE FROM saleadvest WHERE est_no = ?", estNo);
        jdbcTemplate.update("DELETE FROM crnest WHERE est_no = ?", estNo);
        jdbcTemplate.update("DELETE FROM salesmanbilldata WHERE estno = ?", estNo);

        return "DELETED_SUCCESS";
    }

    @Transactional
    public String deleteSalesman(Long estNo) {
        jdbcTemplate.update("DELETE FROM salesmanbilldata WHERE estno = ? AND mode = 'S'", estNo);
        return "SALESMAN_DELETED_SUCCESS";
    }

    // ✅ PASSWORD VERIFICATION
    public boolean verifyPassword(String code, String inputPassword) {
        try {
            String dbPassword = jdbcTemplate.queryForObject(
                    "SELECT value FROM passwordtbl WHERE code = ?", String.class, code);
            
            if (dbPassword != null && inputPassword != null) {
                return inputPassword.trim().toLowerCase().equals(dbPassword.trim().toLowerCase());
            }
        } catch (Exception e) {
            // Log error or handle cases where code doesn't exist
            log.error("Password check failed for code: {} - {}", code, e.getMessage(), e);
        }
        return false;
    }
}