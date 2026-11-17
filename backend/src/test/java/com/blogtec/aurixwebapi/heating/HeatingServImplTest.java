package com.blogtec.aurixwebapi.heating;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import com.blogtec.aurixwebapi.dto.HeatingDto;

@ExtendWith(MockitoExtension.class)
public class HeatingServImplTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private HeatingServImpl heatingServImpl;

    private HeatingDto testDto;

    @BeforeEach
    public void setUp() {
        testDto = new HeatingDto();
        testDto.setEstno(12345);
        testDto.setRowId(1);
        testDto.setEntryDate(LocalDate.now());
        testDto.setSmCode("SM01");
        testDto.setGldSlv("G");
        testDto.setCustId("C001");
        testDto.setCustName("Test Customer");
        testDto.setPhone("9876543210");
        testDto.setItemCode("ITEM01");
        testDto.setQty(2);
        testDto.setGrwt(new BigDecimal("10.5"));
        testDto.setStwt(new BigDecimal("2.0"));
        testDto.setNtwt(new BigDecimal("8.5"));
        testDto.setRemark("Test Remark");
        testDto.setRecGrwt(new BigDecimal("10.0"));
        testDto.setRecStwt(new BigDecimal("2.0"));
        testDto.setRecNtwt(new BigDecimal("8.0"));
        testDto.setRecRemark("Received");
        testDto.setUserId(1);
        testDto.setSmName("Salesman One");
        testDto.setShopCode("S001");
        testDto.setIssFlag(false);
        testDto.setRecFlag(false);
        testDto.setSaveFlag(false);
    }

    // ─── addHeat ─────────────────────────────────────────────────────────────

    @Test
    public void testAddHeat_Success() {
        when(jdbcTemplate.update(anyString(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any(),
                any(), any(), any(), any(), any(), any()))
                .thenReturn(1);

        HeatingDto result = heatingServImpl.addHeat(testDto);

        assertNotNull(result);
        assertEquals(12345, result.getEstno());
        assertEquals("Test Customer", result.getCustName());
    }

    // ─── updateHeat ──────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    @Test
    public void testUpdateHeat_ExistingRecord() {
        List<HeatingDto> existingList = new ArrayList<>();
        existingList.add(testDto);

        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(12345), eq(1)))
                .thenReturn(existingList);
        when(jdbcTemplate.update(anyString(),
                any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(1);

        HeatingDto updateData = new HeatingDto();
        updateData.setRecGrwt(new BigDecimal("12.0"));

        HeatingDto updated = heatingServImpl.updateHeat(12345, 1, updateData);

        assertNotNull(updated);
        assertEquals(new BigDecimal("12.0"), updated.getRecGrwt());
        assertEquals(true, updated.getSaveFlag());
    }

    @SuppressWarnings("unchecked")
    @Test
    public void testUpdateHeat_NotFound() {
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(12345), eq(1)))
                .thenReturn(new ArrayList<>());

        HeatingDto updated = heatingServImpl.updateHeat(12345, 1, testDto);

        assertNull(updated);
    }

    // ─── updateFlag ──────────────────────────────────────────────────────────

    @Test
    public void testUpdateFlag_Success() {
        when(jdbcTemplate.update(anyString(), eq(12345))).thenReturn(1);

        ResponseEntity<?> response = heatingServImpl.updateFlag(12345);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Daily Heating Record with Estno : 12345 has been updated successfully", response.getBody());
    }

    @Test
    public void testUpdateFlag_NotFound() {
        when(jdbcTemplate.update(anyString(), eq(12345))).thenReturn(0);

        ResponseEntity<?> response = heatingServImpl.updateFlag(12345);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Daily Heating Record with Estno : 12345 Not Found", response.getBody());
    }

    // ─── deleteHeat ──────────────────────────────────────────────────────────

    @Test
    public void testDeleteHeat_Success() {
        when(jdbcTemplate.update(anyString(), eq(12345))).thenReturn(1);

        ResponseEntity<?> response = heatingServImpl.deleteHeat(12345);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Daily Heating Record with Estno : 12345 has been deleted successfully", response.getBody());
    }

    @Test
    public void testDeleteHeat_NotFound() {
        when(jdbcTemplate.update(anyString(), eq(12345))).thenReturn(0);

        ResponseEntity<?> response = heatingServImpl.deleteHeat(12345);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Daily Heating Record with Estno : 12345 Not Found", response.getBody());
    }

    // ─── getByEstno ──────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    @Test
    public void testGetByEstno() {
        List<HeatingDto> expected = List.of(testDto);

        when(jdbcTemplate.query(anyString(), any(RowMapper.class), eq(12345)))
                .thenReturn(expected);

        List<HeatingDto> result = heatingServImpl.getByEstno(12345);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(12345, result.get(0).getEstno());
    }
}
