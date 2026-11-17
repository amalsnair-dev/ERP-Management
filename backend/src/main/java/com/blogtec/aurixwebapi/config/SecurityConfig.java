package com.blogtec.aurixwebapi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    public SecurityConfig() {

    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF for REST APIs
                .csrf(csrf -> csrf.disable())
                // Enable CORS and supply our configuration source
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Configure authorization
                .authorizeHttpRequests(auth -> auth
                        // Allow preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public endpoints
                        .requestMatchers("/user/**").permitAll()
                        .requestMatchers("/cashmark/**").permitAll()
                        .requestMatchers("/customer/**").permitAll()
                        .requestMatchers("/barcodeapi/**").permitAll()
                        .requestMatchers("/salesmanmaster/**").permitAll()
                        .requestMatchers("/easytotal/**").permitAll()
                        .requestMatchers("/dailycustomer/**").permitAll()
                        .requestMatchers("/customerlounge/**").permitAll()
                        .requestMatchers("/setdiscount/**").permitAll()
                        .requestMatchers("/company/**").permitAll()
                        .requestMatchers("/discountdetails/**").permitAll()
                        .requestMatchers("/image/**").permitAll()
                        .requestMatchers("/heating/**").permitAll()
                        .requestMatchers("/salesentry/**").permitAll()
                        .requestMatchers("/sales-crm/**").permitAll()
                        .requestMatchers("/apiuser/**").permitAll()
                        .requestMatchers("/api/**").permitAll()
                        .requestMatchers("/systemdetails/**").permitAll()
                        .requestMatchers("/giftmaster/**").permitAll()

                        .requestMatchers("/careof/**").permitAll()
                        .requestMatchers("/salesdelete/**").permitAll()
                        .requestMatchers("/salesprint/**").permitAll()
                        .requestMatchers("/saleschecking/**").permitAll()
                        .requestMatchers("/api/query/**").permitAll()
                        .requestMatchers("/api/metadata/**").permitAll()
                        // Swagger & OpenAPI endpoints
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        // Everything else requires authentication
                        .anyRequest().authenticated());

        // Stateless session (for APIs)
        http.sessionManagement(session -> session
                .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS));

        return http.build();
    }

    @Bean
    public org.springframework.web.filter.CorsFilter corsFilter() {
        return new org.springframework.web.filter.CorsFilter(corsConfigurationSource());
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        int configPort = ServerPortConfig.getServerPort();

        // Explicit origins you want to allow (good practice to keep some explicit)
        List<String> explicitOrigins = new ArrayList<>(List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173",
                "http://localhost:9090",
                "http://localhost:" + configPort));

        // Add project scheme location as allowed origin
        String location = ServerPortConfig.getProjectSchemeIp();
        if (location != null && !location.isEmpty()) {
            String origin = location.endsWith("/") ? location.substring(0, location.length() - 1) : location;
            explicitOrigins.add(origin);
        }

        // Add detected system IPs as explicit origins (optional)
        Set<String> localIps = getAllSystemIPs();
        for (String ip : localIps) {
            explicitOrigins.add("http://" + ip + ":3000");
            explicitOrigins.add("http://" + ip + ":3001");
            explicitOrigins.add("http://" + ip + ":8080");
            explicitOrigins.add("http://" + ip + ":5173");
            explicitOrigins.add("http://" + ip + ":9090");
            explicitOrigins.add("http://" + ip + ":" + configPort);
        }

        // Allow patterns for dev/LAN access
        configuration.addAllowedOriginPattern("*");

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // Utility: Detect all IPv4 addresses on the system (non-loopback)
    private Set<String> getAllSystemIPs() {
        Set<String> ips = new HashSet<>();
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface networkInterface = interfaces.nextElement();
                if (networkInterface.isUp() && !networkInterface.isLoopback()) {
                    Enumeration<InetAddress> addresses = networkInterface.getInetAddresses();
                    while (addresses.hasMoreElements()) {
                        InetAddress address = addresses.nextElement();
                        if (!address.isLoopbackAddress() && address.getHostAddress().indexOf(":") == -1) {
                            ips.add(address.getHostAddress());
                        }
                    }
                }
            }
        } catch (SocketException e) {
            logger.error("Failed to detect system network interfaces: {}", e.getMessage(), e);
        }
        return ips;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
