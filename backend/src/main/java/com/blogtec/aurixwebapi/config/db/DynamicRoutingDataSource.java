package com.blogtec.aurixwebapi.config.db;

import com.blogtec.aurixwebapi.config.DynamicDBConnection;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.concurrent.ConcurrentHashMap;
@SuppressWarnings("null")
public class DynamicRoutingDataSource extends AbstractRoutingDataSource {

    private final ConcurrentHashMap<Object, DataSource> customDataSources = new ConcurrentHashMap<>();
    private final DataSourceCreator dataSourceCreator;

   
	public DynamicRoutingDataSource(DataSourceCreator dataSourceCreator, DataSource defaultDataSource) {
        this.dataSourceCreator = dataSourceCreator;
        setDefaultTargetDataSource(defaultDataSource);
        setTargetDataSources(new java.util.HashMap<>());
    }

    @Override
    protected Object determineCurrentLookupKey() {
        return DynamicDBConnection.getCurrentDatabase();
    }

    @Override
    protected DataSource determineTargetDataSource() {
        Object lookupKey = determineCurrentLookupKey();

        // If lookupKey is null or matches the default target, route to default datasource
        if (lookupKey == null || DynamicDBConnection.getDefaultDatabaseName().equals(lookupKey)) {
            return super.determineTargetDataSource();
        }

        // Dynamically compute/cache and return the HikariDataSource for the target database
        return this.customDataSources.computeIfAbsent(lookupKey, key -> 
            dataSourceCreator.createDataSource((String) key)
        );
    }
}
