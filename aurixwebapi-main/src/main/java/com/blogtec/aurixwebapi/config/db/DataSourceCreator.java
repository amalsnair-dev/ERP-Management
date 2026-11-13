package com.blogtec.aurixwebapi.config.db;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class DataSourceCreator {

    @Value("${spring.datasource.url}")
    private String defaultUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Value("${spring.datasource.hikari.max-lifetime:1800000}")
    private long maxLifetime;

    @Value("${spring.datasource.hikari.idle-timeout:600000}")
    private long idleTimeout;

    @Value("${spring.datasource.hikari.connection-timeout:30000}")
    private long connectionTimeout;

    @Value("${spring.datasource.hikari.validation-timeout:5000}")
    private long validationTimeout;

    @Value("${spring.datasource.hikari.keepalive-time:300000}")
    private long keepaliveTime;

    private String defaultDatabaseName;

    @PostConstruct
    public void init() {
        this.defaultDatabaseName = extractDatabaseName(defaultUrl);
    }

    public String getDefaultDatabaseName() {
        return defaultDatabaseName;
    }

    public DataSource createDataSource(String dbName) {
        ensureDatabaseExists(dbName);

        HikariConfig config = new HikariConfig();

        String customUrl = replaceDatabaseName(defaultUrl, dbName);

        config.setJdbcUrl(customUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");

        // Apply Hikari Connection Pool properties
        config.setMaxLifetime(maxLifetime);
        config.setIdleTimeout(idleTimeout);
        config.setConnectionTimeout(connectionTimeout);
        config.setValidationTimeout(validationTimeout);
        config.setKeepaliveTime(keepaliveTime);
        config.setMaximumPoolSize(10);
        config.setPoolName("HikariPool-" + dbName);

        return new HikariDataSource(config);
    }

    private String extractDatabaseName(String url) {
        int dbNameStart = url.lastIndexOf('/');
        if (dbNameStart == -1) {
            throw new IllegalArgumentException("Invalid JDBC URL format: " + url);
        }
        int queryStart = url.indexOf('?', dbNameStart);
        if (queryStart == -1) {
            return url.substring(dbNameStart + 1);
        } else {
            return url.substring(dbNameStart + 1, queryStart);
        }
    }

    private String replaceDatabaseName(String url, String newDbName) {
        int dbNameStart = url.lastIndexOf('/');
        if (dbNameStart == -1) {
            throw new IllegalArgumentException("Invalid JDBC URL format: " + url);
        }
        int queryStart = url.indexOf('?', dbNameStart);
        if (queryStart == -1) {
            return url.substring(0, dbNameStart + 1) + newDbName;
        } else {
            return url.substring(0, dbNameStart + 1) + newDbName + url.substring(queryStart);
        }
    }

    private void ensureDatabaseExists(String dbName) {
        if (dbName == null || dbName.trim().isEmpty() || defaultUrl == null) {
            return;
        }
        try {
            Class.forName("org.postgresql.Driver");
            Pattern pattern = Pattern.compile("jdbc:postgresql://([^/]+)/");
            Matcher matcher = pattern.matcher(defaultUrl);
            if (!matcher.find()) {
                return;
            }
            String hostPort = matcher.group(1);
            String postgresUrl = "jdbc:postgresql://" + hostPort + "/postgres";

            try (Connection conn = DriverManager.getConnection(postgresUrl, username, password);
                 Statement stmt = conn.createStatement()) {

                String checkSql = "SELECT 1 FROM pg_database WHERE datname = '" + dbName + "'";
                try (ResultSet rs = stmt.executeQuery(checkSql)) {
                    if (!rs.next()) {
                        stmt.executeUpdate("CREATE DATABASE \"" + dbName + "\"");
                    }
                }
            }
        } catch (Exception ignored) {
        }
    }
}
