package com.blogtec.aurixwebapi.dynamic;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DynamicQueryServiceTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query query;

    @InjectMocks
    private DynamicQueryService dynamicQueryService;

    @BeforeEach
    void setUp() {
        // Common setup if needed
    }

    @Test
    void testIsQueryValid_ValidSelectQuery_ReturnsTrue() {
        String validQuery = "SELECT * FROM bar_designmaster WHERE code = :code";
        Map<String, Object> params = new HashMap<>();
        params.put("code", 101);

        when(entityManager.createNativeQuery(validQuery)).thenReturn(query);
        when(query.setHint(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of(new Object()));

        boolean result = dynamicQueryService.isQueryValid(validQuery, params);

        assertTrue(result);
        verify(query).setParameter("code", 101);
    }

    @Test
    void testIsQueryValid_EmptyQuery_ReturnsFalse() {
        boolean result = dynamicQueryService.isQueryValid("", null);
        assertFalse(result);
    }

    @Test
    void testIsQueryValid_NonSelectQuery_ReturnsFalse() {
        String insertQuery = "INSERT INTO bar_designmaster (code) VALUES (1)";
        boolean result = dynamicQueryService.isQueryValid(insertQuery, null);
        assertFalse(result);
    }

    @Test
    void testIsQueryValid_RestrictedKeywordDrop_ReturnsFalse() {
        String dropQuery = "SELECT * FROM users; DROP TABLE users;";
        boolean result = dynamicQueryService.isQueryValid(dropQuery, null);
        assertFalse(result);
    }

    @Test
    void testIsQueryValid_RestrictedKeywordDelete_ReturnsFalse() {
        String deleteQuery = "SELECT * FROM users WHERE id = 1 AND delete = true";
        boolean result = dynamicQueryService.isQueryValid(deleteQuery, null);
        assertFalse(result);
    }

    @Test
    void testIsQueryValid_NoResults_ReturnsFalse() {
        String validQuery = "SELECT * FROM bar_designmaster WHERE code = 999999";

        when(entityManager.createNativeQuery(validQuery)).thenReturn(query);
        when(query.setHint(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(Collections.emptyList());

        boolean result = dynamicQueryService.isQueryValid(validQuery, null);

        assertFalse(result);
    }
}
