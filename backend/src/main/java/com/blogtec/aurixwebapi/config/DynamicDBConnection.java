package com.blogtec.aurixwebapi.config;

import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.blogtec.aurixwebapi.config.db.DataSourceCreator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DynamicDBConnection {

    private static final Logger logger = LoggerFactory.getLogger(DynamicDBConnection.class);

    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();
    private static DataSource routingDataSource;
    private static String defaultDatabaseName = "billsoft";

    @Autowired
    public void setRoutingDataSource(DataSource dataSource) {
        DynamicDBConnection.routingDataSource = dataSource;
    }

    @Autowired
    public void setDataSourceCreator(DataSourceCreator creator) {
        DynamicDBConnection.defaultDatabaseName = creator.getDefaultDatabaseName();
    }

    public static void setCurrentDatabase(String dbName) {
        CONTEXT.set(dbName);
    }

    public static String getCurrentDatabase() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }

    public static String getDefaultDatabaseName() {
        return defaultDatabaseName;
    }

    public static Connection getConnection(String year) {
        if (routingDataSource == null) {
            logger.error("DynamicDBConnection: Routing DataSource not initialized yet!");
            return null;
        }

        Connection conn = null;
        String oldDb = getCurrentDatabase();

        String dbName = defaultDatabaseName;
        try {
            if (year != null && !year.trim().isEmpty()) {
                dbName = defaultDatabaseName + year.trim();
            }

            setCurrentDatabase(dbName);
            conn = routingDataSource.getConnection();
            logger.info("Connected to: {} via routing datasource", dbName);

        } catch (SQLException e) {
            logger.error("Failed to connect to dynamic database {}: {}", dbName, e.getMessage(), e);
        } finally {
            if (oldDb != null) {
                setCurrentDatabase(oldDb);
            } else {
                clear();
            }
        }

        return conn;
    }
}