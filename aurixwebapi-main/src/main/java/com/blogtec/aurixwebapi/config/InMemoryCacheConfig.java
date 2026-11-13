package com.blogtec.aurixwebapi.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * In-Memory Cache Configuration.
 *
 * Replaces Redis with a simple, reliable ConcurrentMapCache.
 * This is ideal for a local LAN deployment where a Redis server is not available.
 * All @Cacheable methods will store data in JVM memory — no external dependencies needed.
 *
 * Trade-off: Cache is cleared on every server restart (no persistence).
 * This is acceptable since the app runs locally and data rarely changes.
 */
@Configuration
public class InMemoryCacheConfig {

    @Bean
    public CacheManager cacheManager() {
        // ConcurrentMapCacheManager creates caches on-demand for any cache name used
        // in @Cacheable("stones"), @Cacheable("salesmen"), etc.
        return new ConcurrentMapCacheManager();
    }
}
