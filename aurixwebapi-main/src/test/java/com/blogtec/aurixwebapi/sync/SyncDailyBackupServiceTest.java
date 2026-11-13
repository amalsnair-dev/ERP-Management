package com.blogtec.aurixwebapi.sync;

import com.blogtec.aurixwebapi.dto.GetCustDataDto;
import com.blogtec.aurixwebapi.sync.builders.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.client.RestTemplate;

import java.sql.Date;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SyncDailyBackupServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private SummaryMasterRepository summaryMasterRepository;

    @Mock
    private SummaryDetailsRepository summaryDetailsRepository;

    @Mock
    private DailySyncBackupRepository dailySyncBackupRepository;

    @Mock
    private GetCustDataDto getCustDataDto;

    @Mock
    private SchemeSummaryBuilder schemeSummaryBuilder;

    @Mock
    private OrderSummaryBuilder orderSummaryBuilder;

    @Mock
    private NumanaCatHeadBuilder numanaCatHeadBuilder;

    @Mock
    private SplitupSummaryBuilder splitupSummaryBuilder;

    @Mock
    private DateAndRateBuilder dateAndRateBuilder;

    @Mock
    private MetalSummaryBuilder metalSummaryBuilder;

    @Mock
    private CollectionSummaryBuilder collectionSummaryBuilder;

    @Mock
    private CashSummaryBuilder cashSummaryBuilder;

    @Mock
    private SmithReportBuilder smithReportBuilder;

    private SyncDailySummaryService service;

    @BeforeEach
    void setUp() {
        service = new SyncDailySummaryService(
                jdbcTemplate,
                restTemplate,
                objectMapper,
                summaryMasterRepository,
                summaryDetailsRepository,
                dailySyncBackupRepository,
                getCustDataDto,
                schemeSummaryBuilder,
                orderSummaryBuilder,
                numanaCatHeadBuilder,
                splitupSummaryBuilder,
                dateAndRateBuilder,
                metalSummaryBuilder,
                collectionSummaryBuilder,
                cashSummaryBuilder,
                smithReportBuilder
        );
    }

    @Test
    void testSaveOrUpdateLocalBackup_NewRecord() {
        String shopCode = "1";
        LocalDate date = LocalDate.of(2026, 11, 4);
        String payload = "{\"test\":\"json\"}";

        when(dailySyncBackupRepository.findByShopcodeAndSummaryDate(shopCode, date))
                .thenReturn(Optional.empty());

        service.saveOrUpdateLocalBackup(shopCode, date, payload, "PENDING");

        ArgumentCaptor<DailySyncBackup> captor = ArgumentCaptor.forClass(DailySyncBackup.class);
        verify(dailySyncBackupRepository).save(captor.capture());

        DailySyncBackup saved = captor.getValue();
        assertEquals(shopCode, saved.getShopcode());
        assertEquals(date, saved.getSummaryDate());
        assertEquals(payload, saved.getPayloadData());
        assertEquals("PENDING", saved.getSyncStatus());
    }

    @Test
    void testSaveOrUpdateLocalBackup_ExistingRecordUpdate() {
        String shopCode = "1";
        LocalDate date = LocalDate.of(2026, 11, 4);
        String oldPayload = "{\"test\":\"old\"}";
        String newPayload = "{\"test\":\"new\"}";

        DailySyncBackup existing = DailySyncBackup.builder()
                .id(10)
                .shopcode(shopCode)
                .summaryDate(date)
                .payloadData(oldPayload)
                .syncStatus("PENDING")
                .build();

        when(dailySyncBackupRepository.findByShopcodeAndSummaryDate(shopCode, date))
                .thenReturn(Optional.of(existing));

        service.saveOrUpdateLocalBackup(shopCode, date, newPayload, "SYNCED");

        verify(dailySyncBackupRepository).save(existing);
        assertEquals(10, existing.getId());
        assertEquals(newPayload, existing.getPayloadData());
        assertEquals("SYNCED", existing.getSyncStatus());
        assertNotNull(existing.getUpdatedAt());
    }

    @Test
    void testCleanupOldBackups_WithConfiguredDays() {
        LocalDate today = LocalDate.of(2026, 11, 4);
        Map<String, Object> configRow = new HashMap<>();
        configRow.put("flag", true);
        configRow.put("amount", 7.0);

        when(jdbcTemplate.queryForList(contains("SYNC BACKUP RETENTION DAYS")))
                .thenReturn(List.of(configRow));

        when(jdbcTemplate.update(anyString(), any(Date.class))).thenReturn(3);

        service.cleanupOldBackups(today);

        LocalDate expectedCutoff = today.minusDays(7);
        verify(jdbcTemplate).update(
                eq("DELETE FROM sync_daily_backup WHERE summary_date < ?"),
                eq(Date.valueOf(expectedCutoff))
        );
    }

    @Test
    void testRetryPendingBackups_PushesPendingSuccessfully() {
        String shopCode = "1";
        LocalDate today = LocalDate.of(2026, 11, 4);
        LocalDate yesterday = LocalDate.of(2026, 11, 3);

        DailySyncBackup pendingYesterday = DailySyncBackup.builder()
                .id(1)
                .shopcode(shopCode)
                .summaryDate(yesterday)
                .payloadData("{\"yesterday\":true}")
                .syncStatus("PENDING")
                .build();

        when(dailySyncBackupRepository.findByShopcodeAndSyncStatusOrderBySummaryDateAsc(shopCode, "PENDING"))
                .thenReturn(List.of(pendingYesterday));

        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("OK"));

        service.retryPendingBackups(shopCode, today);

        verify(restTemplate).postForEntity(anyString(), any(HttpEntity.class), eq(String.class));
        assertEquals("SYNCED", pendingYesterday.getSyncStatus());
        verify(dailySyncBackupRepository).save(pendingYesterday);
    }

    @Test
    void testGetLocalDailyBackup() {
        String shopCode = "1";
        LocalDate date = LocalDate.of(2026, 11, 4);
        DailySyncBackup backup = DailySyncBackup.builder()
                .shopcode(shopCode)
                .summaryDate(date)
                .build();

        when(dailySyncBackupRepository.findByShopcodeAndSummaryDate(shopCode, date))
                .thenReturn(Optional.of(backup));

        Optional<DailySyncBackup> result = service.getLocalDailyBackup(shopCode, date);
        assertTrue(result.isPresent());
        assertEquals(shopCode, result.get().getShopcode());
    }
}

