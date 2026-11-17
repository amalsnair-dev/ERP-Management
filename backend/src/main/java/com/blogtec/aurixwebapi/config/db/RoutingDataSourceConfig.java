package com.blogtec.aurixwebapi.config.db;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class RoutingDataSourceConfig {

    @Bean
    public DataSource defaultDataSource(DataSourceCreator dataSourceCreator) {
        return dataSourceCreator.createDataSource(dataSourceCreator.getDefaultDatabaseName());
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSourceCreator dataSourceCreator, DataSource defaultDataSource) {
        DynamicRoutingDataSource routingDataSource = new DynamicRoutingDataSource(dataSourceCreator, defaultDataSource);
        routingDataSource.afterPropertiesSet();
        return routingDataSource;
    }
}
