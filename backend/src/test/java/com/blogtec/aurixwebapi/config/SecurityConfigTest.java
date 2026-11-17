package com.blogtec.aurixwebapi.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = SecurityConfigTest.TestConfig.class)
class SecurityConfigTest {

    @Configuration
    @EnableWebMvc
    @Import(SecurityConfig.class)
    static class TestConfig {
    }

    @Autowired
    private SecurityFilterChain securityFilterChain;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void testSecurityBeansInstantiated() {
        assertNotNull(securityFilterChain, "SecurityFilterChain should be configured");
        assertNotNull(passwordEncoder, "PasswordEncoder bean should be loaded");
    }

    @Test
    void testPasswordEncoder_BCryptHashing() {
        String rawPassword = "mySecurePassword123";
        String encoded = passwordEncoder.encode(rawPassword);

        assertNotEquals(rawPassword, encoded);
        assertTrue(passwordEncoder.matches(rawPassword, encoded));
    }
}
