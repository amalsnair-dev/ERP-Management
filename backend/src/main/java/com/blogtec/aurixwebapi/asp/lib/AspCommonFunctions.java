package com.blogtec.aurixwebapi.asp.lib;

/*
 * created by Nidhin
 */
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.sql.Time;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.blogtec.aurixwebapi.apiuser.ApiUserService;

@SuppressWarnings({ "unchecked" })
public class AspCommonFunctions {

    public static <T> T checkNull(T value, T setValue) {
        return (value != null) ? value : reqNonNull(setValue, "setValue");
    }

    public static <T> T reqNonNull(T setValue, String message) {
        if (setValue == null)
            throw new NullPointerException(message);
        return setValue;
    }

    public static String checkNull(String value) {
        return checkNull(value, "");
    }

    public static int checkNull(int value) {
        return checkNull(value, 0);
    }

    public static Double checkNull(Double value) {
        return checkNull(value, 0.0);
    }

    public static Integer checkNull(Integer value) {
        return checkNull(value, 0);
    }

    public static BigDecimal checkNull(BigDecimal value) {
        return checkNull(value, BigDecimal.ZERO);
    }

    // public static Time checkNull(Time value) {
    // return checkNull(value, new Time(System.currentTimeMillis()));
    // }
    public static Time checkNull(Time value) {
        return checkNull(value, getISTTime());
    }

    public static Time getISTTime() {
        ZoneId istZoneId = ZoneId.of("Asia/Kolkata");
        LocalTime istTime = LocalTime.now(istZoneId);
        return Time.valueOf(istTime);
    }

    public static Date checkNull(Date date) {

        return checkNull(date, null);
    }

    public static LocalDate checkNull(LocalDate date) {

        return checkNull(date, null);
    }

    public static boolean authUser(String username, String password, String shopcode, ApiUserService apiUserService) {

        try {
            boolean isAuthenticated = apiUserService.authenticate(username, password, shopcode);
            return !isAuthenticated; // true = invalid
        } catch (Exception e) {
            return true;
        }
    }

    public static <T> ResponseEntity<T> Invalid() {
        return (ResponseEntity<T>) ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid username or password");
    }

    public static <T> Map<String, List<T>> responseMap(String key, List<T> value) {
        Map<String, List<T>> response = new HashMap<>();
        response.put(key, value);
        return response;
    }

    public static <T> Map<String, Object> responseMap(String key, Object value) {
        Map<String, Object> response = new HashMap<>();
        response.put(key, value);
        return response;
    }

    public static String addchar(int len, char cr) {
        char[] zeros = new char[len];
        Arrays.fill(zeros, cr);
        return new String(zeros);
    }

    public static LocalDate getFinancialYearStartDate(LocalDate date) {
        int year = date.getMonthValue() < 4 ? date.getYear() - 1 : date.getYear();
        return LocalDate.of(year, 4, 1); // April 1st
    }

    public static LocalDate toLocalDate(Object dateObj) {
        if (dateObj instanceof java.sql.Date) {
            return ((java.sql.Date) dateObj).toLocalDate();
        } else if (dateObj instanceof LocalDate) {
            return (LocalDate) dateObj;
        }
        return null;
    }

    public static String encode(String value) {
        try {
            return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return value;
        }
    }

    public static String getLocalHost() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "UNKNOWN";
        }
    }

    public static String getMAC() {
        try {
            java.net.InetAddress ip = java.net.InetAddress.getLocalHost();
            java.net.NetworkInterface network = java.net.NetworkInterface.getByInetAddress(ip);
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
            // Fallback
        }
        return "UNKNOWN";
    }
}

