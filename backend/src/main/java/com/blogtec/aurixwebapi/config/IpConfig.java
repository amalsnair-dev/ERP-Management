package com.blogtec.aurixwebapi.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class IpConfig {

    private static final Logger logger = LoggerFactory.getLogger(IpConfig.class);

    // ==========================================
    // 🌐 Computed URLs
    // ==========================================
    public static String webAppUrl;
    public static String projectSchemeUrl;
    public static String syncApiUrl;
//    public static String projectsyncapiUrl;

    // ==========================================
    // 🚀 Initialization
    // ==========================================
    @PostConstruct
    public void init() {

        try {

            int webAppPort = ServerPortConfig.getServerPort();

            String projectSchemeIp = ServerPortConfig.getProjectSchemeIp();
            String context = ServerPortConfig.getProjectSchemeContext();

            // Handle trailing slash in projectSchemeIp
            if (projectSchemeIp.endsWith("/")) {
                projectSchemeIp = projectSchemeIp.substring(0, projectSchemeIp.length() - 1);
            }

            webAppUrl = "http://localhost:" + webAppPort + "/aurixweb/";

            if (projectSchemeIp.startsWith("https://") || webAppPort == 443 || webAppPort == 80) {
                projectSchemeUrl = projectSchemeIp + "/" + context + "/";
            } else {
                projectSchemeUrl = projectSchemeIp + ":" + webAppPort + "/" + context + "/";
            }

            // ==========================================
            // 🔗 Compute syncApiUrl from projectsyncapi config
            // ==========================================
            String syncApiIp = ServerPortConfig.getSyncApiIp();
            String syncApiContext = ServerPortConfig.getSyncApiContext();
            int syncApiPort = ServerPortConfig.getSyncApiPort();

            if (syncApiIp != null && !syncApiIp.isEmpty()) {
                if (syncApiIp.endsWith("/")) {
                    syncApiIp = syncApiIp.substring(0, syncApiIp.length() - 1);
                }
                if (syncApiIp.startsWith("https://") || syncApiPort == 443 || syncApiPort == 80) {
                    syncApiUrl = syncApiIp + "/" + syncApiContext + "/";
                } else {
                    syncApiUrl = syncApiIp + ":" + syncApiPort + "/" + syncApiContext + "/";
                }
            }

        } catch (Exception e) {
            logger.error("Failed to initialize IP configurations: {}", e.getMessage(), e);
        }
    }

    // ==========================================
    // 🌍 Static Getters
    // ==========================================
    public static String getWebAppUrl() {
        return webAppUrl;
    }

    public static String getProjectSchemeUrl() {
        return projectSchemeUrl;
    }

    public static String getSyncApiUrl() {
        return syncApiUrl;
    }
}