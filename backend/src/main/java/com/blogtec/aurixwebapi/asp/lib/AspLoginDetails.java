package com.blogtec.aurixwebapi.asp.lib;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Modern Spring Boot implementation of AspLoginDetails for auditing and logging system access.
 */
@Component
public class AspLoginDetails {

    private static final Logger logger = LoggerFactory.getLogger(AspLoginDetails.class);

    private final JdbcTemplate jdbcTemplate;

    public AspLoginDetails(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 🔥 BEST OPTION: Automatically extracts Client MAC ID & IP address from HTTP HttpServletRequest.
     */
    public void getClientAccess(HttpServletRequest request, int userid, String framename, String operation, String description, String shopcode) {
        String clientMac = null;
        String clientIp = null;

        if (request != null) {
            clientMac = request.getHeader("X-Device-MAC");
            if (clientMac == null || clientMac.trim().isEmpty()) {
                clientMac = request.getHeader("X-Client-MAC");
            }
            clientIp = extractClientIp(request);
        }

        String hostInfo = (clientIp != null && !clientIp.isEmpty()) ? clientIp : getLocalHost();
        getClientAccess(userid, framename, operation, description, shopcode, clientMac, hostInfo);
    }

    /**
     * Full parameter method supporting custom client MAC ID and custom host info.
     */
    public void getClientAccess(int userid, String framename, String operation, String description, String shopcode, String clientMacId, String hostInfo) {
        try {
            LocalDate currentDate = LocalDate.now();
            LocalTime currentTime = LocalTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss.SS");
            String formattedTime = currentTime.format(formatter);

            String hostName = (hostInfo != null && !hostInfo.trim().isEmpty()) ? hostInfo : getLocalHost();
            String macId = (clientMacId != null && !clientMacId.trim().isEmpty()) ? clientMacId : getMAC();

            String sql = """
                INSERT INTO systemdetails (
                    slno, systemdate, dbdate, userid, time, systemdetails, mac_id, operator, narration, frame, shopcode
                ) VALUES (
                    (SELECT COALESCE(MAX(slno + 1), 1) FROM systemdetails),
                    ?,
                    (SELECT today FROM goldrate LIMIT 1),
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                """;

            jdbcTemplate.update(
                sql,
                currentDate,
                userid,
                formattedTime,
                hostName,
                macId,
                operation,
                description,
                framename,
                shopcode
            );

        } catch (Exception e) {
            logger.error("Error inserting system details log for user {}: {}", userid, e.getMessage(), e);
        }
    }

    public void getClientAccess(int userid, String framename, String operation, String description, String shopcode, String clientMacId) {
        getClientAccess(userid, framename, operation, description, shopcode, clientMacId, getLocalHost());
    }

    public void getClientAccess(int userid, String framename, String operation, String description, String shopcode) {
        getClientAccess(userid, framename, operation, description, shopcode, null, getLocalHost());
    }

    /**
     * Helper to extract real Client IP address from HTTP request (handles proxies/load balancers).
     */
    public static String extractClientIp(HttpServletRequest request) {
        if (request == null) return "UNKNOWN";
        String[] headers = {
            "X-Forwarded-For",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_CLIENT_IP",
            "HTTP_X_FORWARDED_FOR",
            "X-Real-IP"
        };
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // If multiple proxies, return first IP
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    /**
     * Backward-compatible static method taking a JDBC Connection.
     */
    public static void getClientAccess(Connection conn, int userid, String framename, String operation, String description, String shopcode) {
        try {
            LocalDate currentDate = LocalDate.now();
            LocalTime currentTime = LocalTime.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss.SS");
            String formattedTime = currentTime.format(formatter);

            String hostName = getLocalHost();
            String macId = getMAC();

            String sql = """
                INSERT INTO systemdetails (
                    slno, systemdate, dbdate, userid, time, systemdetails, mac_id, operator, narration, frame, shopcode
                ) VALUES (
                    (SELECT COALESCE(MAX(slno + 1), 1) FROM systemdetails),
                    ?,
                    (SELECT today FROM goldrate LIMIT 1),
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                """;

            try (PreparedStatement st = conn.prepareStatement(sql)) {
                st.setObject(1, currentDate);
                st.setInt(2, userid);
                st.setString(3, formattedTime);
                st.setString(4, hostName);
                st.setString(5, macId);
                st.setString(6, operation);
                st.setString(7, description);
                st.setString(8, framename);
                st.setString(9, shopcode);
                st.executeUpdate();
            }
        } catch (Exception e) {
            logger.error("Error executing static getClientAccess for user {}: {}", userid, e.getMessage(), e);
        }
    }

    public static String getLocalHost() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }

    public static String getMAC() {
        try {
            InetAddress ip = InetAddress.getLocalHost();
            NetworkInterface network = NetworkInterface.getByInetAddress(ip);
            if (network != null) {
                byte[] mac = network.getHardwareAddress();
                if (mac != null) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < mac.length; i++) {
                        sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? "-" : ""));
                    }
                    return sb.toString();
                }
            }
        } catch (Exception e) {
            logger.warn("Could not retrieve MAC address: {}", e.getMessage());
        }
        return "UNKNOWN";
    }
}
