package com.blogtec.aurixwebapi.sync;

import com.blogtec.aurixwebapi.config.IpConfig;
import com.blogtec.aurixwebapi.config.ServerPortConfig;
import com.blogtec.aurixwebapi.dto.GetCustDataDto;
import com.blogtec.aurixwebapi.dto.SyncPayloadDto;
import com.blogtec.aurixwebapi.dto.SyncPayloadDto.*;
import com.blogtec.aurixwebapi.sync.builders.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.scheduling.annotation.Scheduled;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Base64;

@Service
public class SyncDailySummaryService {

    private static final Logger logger = LoggerFactory.getLogger(SyncDailySummaryService.class);

    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GetCustDataDto getCustDataDto;
    private final SummaryMasterRepository summaryMasterRepository;
    private final SummaryDetailsRepository summaryDetailsRepository;
    private final DailySyncBackupRepository dailySyncBackupRepository;
    private final SchemeSummaryBuilder schemeSummaryBuilder;
    private final OrderSummaryBuilder orderSummaryBuilder;
    private final NumanaCatHeadBuilder numanaCatHeadBuilder;
    private final SplitupSummaryBuilder splitupSummaryBuilder;
    private final DateAndRateBuilder dateAndRateBuilder;
    private final MetalSummaryBuilder metalSummaryBuilder;
    private final CollectionSummaryBuilder collectionSummaryBuilder;
    private final CashSummaryBuilder cashSummaryBuilder;
    private final SmithReportBuilder smithReportBuilder;

    public SyncDailySummaryService(JdbcTemplate jdbcTemplate,
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            SummaryMasterRepository summaryMasterRepository,
            SummaryDetailsRepository summaryDetailsRepository,
            DailySyncBackupRepository dailySyncBackupRepository,
            GetCustDataDto getCustDataDto,
            SchemeSummaryBuilder schemeSummaryBuilder,
            OrderSummaryBuilder orderSummaryBuilder,
            NumanaCatHeadBuilder numanaCatHeadBuilder,
            SplitupSummaryBuilder splitupSummaryBuilder,
            DateAndRateBuilder dateAndRateBuilder,
            MetalSummaryBuilder metalSummaryBuilder,
            CollectionSummaryBuilder collectionSummaryBuilder,
            CashSummaryBuilder cashSummaryBuilder,
            SmithReportBuilder smithReportBuilder) {
        this.jdbcTemplate = jdbcTemplate;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.summaryMasterRepository = summaryMasterRepository;
        this.summaryDetailsRepository = summaryDetailsRepository;
        this.dailySyncBackupRepository = dailySyncBackupRepository;
        this.getCustDataDto = getCustDataDto;
        this.schemeSummaryBuilder = schemeSummaryBuilder;
        this.orderSummaryBuilder = orderSummaryBuilder;
        this.numanaCatHeadBuilder = numanaCatHeadBuilder;
        this.splitupSummaryBuilder = splitupSummaryBuilder;
        this.dateAndRateBuilder = dateAndRateBuilder;
        this.metalSummaryBuilder = metalSummaryBuilder;
        this.collectionSummaryBuilder = collectionSummaryBuilder;
        this.cashSummaryBuilder = cashSummaryBuilder;
        this.smithReportBuilder = smithReportBuilder;
    }

    private long lastSyncTime = 0;
    private String lastClosedSyncedDate = null;
    private String lastSyncedFingerprint = null;
    private String lastSyncedDate = null;

    public void resetSyncTime() {
        this.lastSyncTime = 0;
    }

    public ResponseEntity<String> executeImmediateSync() {
        String shopCode = fetchShopCode();
        String companyCode = fetchCompanyCode();
        String currentDate = fetchBusinessDate();
        logger.info("Executing immediate manual sync - Company: {}, Shop: {}, Date: {}", companyCode, shopCode,
                currentDate);
        SyncDailySummaryRequest request = new SyncDailySummaryRequest(companyCode, shopCode, currentDate);
        return syncDailySummary(request);
    }

    public boolean isDayReset() {
        String currentDate = fetchBusinessDate();
        if (currentDate != null) {
            try {
                return isDayReset(LocalDate.parse(currentDate));
            } catch (Exception ignored) {
            }
        }
        return isDayReset(LocalDate.now());
    }

    public boolean isDayReset(LocalDate businessDate) {
        // 1. Check restflag from dateandrate for the business date
        if (businessDate != null) {
            try {
                List<Boolean> list = jdbcTemplate.query(
                        "SELECT restflag FROM dateandrate WHERE thisday = ? ORDER BY datatime DESC LIMIT 1",
                        (rs, rowNum) -> {
                            Object obj = rs.getObject("restflag");
                            if (obj instanceof Boolean) return (Boolean) obj;
                            if (obj instanceof Number) return ((Number) obj).intValue() == 1;
                            if (obj != null) {
                                String s = obj.toString().trim();
                                return "true".equalsIgnoreCase(s) || "t".equalsIgnoreCase(s) || "1".equals(s);
                            }
                            return false;
                        },
                        java.sql.Date.valueOf(businessDate));
                if (!list.isEmpty() && Boolean.TRUE.equals(list.get(0))) {
                    return true;
                }
            } catch (Exception e) {
                logger.debug("Could not query dateandrate restflag: {}", e.getMessage());
            }
        }

        // 2. Fallback check for reset flag from goldrate
        try {
            Integer reset = jdbcTemplate.queryForObject("SELECT reset FROM goldrate LIMIT 1", Integer.class);
            return reset != null && reset == 1;
        } catch (Exception e) {
            logger.debug("Could not query goldrate reset flag: {}", e.getMessage());
            return false;
        }
    }

    private String computeDataFingerprint(Date sqlDate) {
        try {
            Long billCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM sbillmstr WHERE est_dte = ?", Long.class, sqlDate);
            Long cashCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM cashmarkings WHERE marking_date = ?", Long.class, sqlDate);
            Double cashTotal = jdbcTemplate.queryForObject(
                    "SELECT coalesce(sum(cash_collected),0) FROM cashmarkings WHERE marking_date = ?", Double.class,
                    sqlDate);
            if ((cashCount == null || cashCount == 0) && (cashTotal == null || cashTotal == 0.0)) {
                try {
                    cashCount = jdbcTemplate.queryForObject(
                            "SELECT count(*) FROM temp_cashmarkings WHERE marking_date = ?", Long.class, sqlDate);
                    cashTotal = jdbcTemplate.queryForObject(
                            "SELECT coalesce(sum(cash_collected),0) FROM temp_cashmarkings WHERE marking_date = ?", Double.class,
                            sqlDate);
                } catch (Exception ignored) {
                }
            }
            return billCount + "_" + cashCount + "_" + cashTotal;
        } catch (Exception e) {
            logger.debug("Could not compute data fingerprint: {}", e.getMessage());
            return null;
        }
    }

    public String fetchShopCode() {
        String shopCode = null;
        try {
            List<String> list = jdbcTemplate.query("select value from company where key='shopcode'",
                    (rs, rowNum) -> rs.getString("value"));
            if (!list.isEmpty()) {
                shopCode = list.get(0);
            }
        } catch (Exception e) {
            logger.debug("Failed to fetch shopcode from company table: {}", e.getMessage());
        }
        return (shopCode == null || shopCode.trim().isEmpty()) ? "1" : shopCode.trim();
    }

    public String fetchCompanyCode() {
        String companyCode = null;
        try {
            List<String> list = jdbcTemplate.query("select value from company where key='companycode'",
                    (rs, rowNum) -> rs.getString("value"));
            if (!list.isEmpty()) {
                companyCode = list.get(0);
            }
        } catch (Exception e) {
            logger.debug("Failed to fetch companycode from company table: {}", e.getMessage());
        }
        return (companyCode == null || companyCode.trim().isEmpty()) ? "1" : companyCode.trim();
    }

    @Scheduled(initialDelay = 10000, fixedDelay = 10000)
    public void autoSyncDailySummary() {
        try {
            Boolean syncEnabled = false;
            long syncIntervalSeconds = 10; // Default fallback

            try {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                        "SELECT flag, amount FROM setdiscount WHERE details = 'SYNC SCHEDULER INTERVAL' AND flag = true");
                if (!rows.isEmpty()) {
                    Map<String, Object> row = rows.get(0);
                    syncEnabled = Boolean.TRUE.equals(row.get("flag"));
                    if (row.get("amount") != null) {
                        syncIntervalSeconds = ((Number) row.get("amount")).longValue();
                    }
                }
            } catch (Exception e) {
                logger.debug("Could not query setdiscount for SYNC SCHEDULER INTERVAL: {}", e.getMessage());
            }

            if (!syncEnabled) {
                return;
            }

            long currentTime = System.currentTimeMillis();
            if ((currentTime - lastSyncTime) < (syncIntervalSeconds * 1000)) {
                return; // Interval has not passed yet
            }
            lastSyncTime = currentTime;

            String currentDate = fetchBusinessDate();
            LocalDate businessDate = LocalDate.parse(currentDate);
            Date sqlDate = Date.valueOf(businessDate);
            boolean dayReset = isDayReset(businessDate);

            String shopCode = fetchShopCode();
            String companyCode = fetchCompanyCode();

            // 🔄 ALWAYS retry pending backups when internet is available, even if day is closed/reset!
            retryPendingBackups(shopCode, businessDate);

            // 1. If day is already reset & closed, and final sync was delivered, skip auto-sync
            if (dayReset && currentDate != null && currentDate.equals(lastClosedSyncedDate)) {
                logger.debug("Business date {} is already reset/closed and synced. Skipping auto-sync.",
                        currentDate);
                return;
            }

            // 2. If day is active (not reset), check if any new bill or cashmarking
            // occurred
            String currentFingerprint = computeDataFingerprint(sqlDate);

            if (!dayReset && currentFingerprint != null && currentFingerprint.equals(lastSyncedFingerprint)
                    && currentDate.equals(lastSyncedDate)) {
                logger.debug("No new sales or cashmarkings for date {}. Skipping redundant auto-sync.",
                        currentDate);
                return;
            }

            logger.debug("Automatic syncDailySummary running - CompanyCode: {}, ShopCode: {}, Date: {}", companyCode,
                    shopCode, currentDate);

            SyncDailySummaryRequest request = new SyncDailySummaryRequest(companyCode, shopCode, currentDate);
            syncDailySummary(request);
        } catch (Exception e) {
            logger.error("Error in autoSyncDailySummary scheduled task", e);
        }
    }

    private String fetchBusinessDate() {
        String currentDate = null;
        try {
            List<String> list = jdbcTemplate.query(
                    "select max(thisday)::text from dateandrate",
                    (rs, rowNum) -> rs.getString(1));
            if (!list.isEmpty() && list.get(0) != null) {
                LocalDate parsedDate = parseBusinessDateStr(list.get(0));
                if (parsedDate != null) {
                    currentDate = parsedDate.toString();
                }
            }
        } catch (Exception e) {
            logger.debug("Failed to fetch max date from dateandrate: {}", e.getMessage());
        }

        if (currentDate == null) {
            try {
                List<String> list = jdbcTemplate.query(
                        "select value from company where lower(key) in ('date', 'closedate', 'dbsdate', 'dbs.date') and value is not null and trim(value) != '' limit 1",
                        (rs, rowNum) -> rs.getString("value"));
                if (!list.isEmpty() && list.get(0) != null) {
                    LocalDate parsedDate = parseBusinessDateStr(list.get(0));
                    if (parsedDate != null) {
                        currentDate = parsedDate.toString();
                    }
                }
            } catch (Exception e) {
                logger.debug("Failed to fetch business date from company table: {}", e.getMessage());
            }
        }

        if (currentDate == null) {
            try {
                List<String> list = jdbcTemplate.query(
                        "select max(thisday)::text from dateandrate",
                        (rs, rowNum) -> rs.getString(1));
                if (!list.isEmpty() && list.get(0) != null) {
                    LocalDate parsedDate = parseBusinessDateStr(list.get(0));
                    if (parsedDate != null) {
                        currentDate = parsedDate.toString();
                    }
                }
            } catch (Exception e) {
                logger.debug("Failed to fetch max date from dateandrate: {}", e.getMessage());
            }
        }

        if (currentDate == null) {
            currentDate = LocalDate.now().toString();
        }
        return currentDate;
    }

    private LocalDate parseBusinessDateStr(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty())
            return null;
        dateStr = dateStr.trim();
        try {
            if (dateStr.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
                return LocalDate.parse(dateStr);
            } else if (dateStr.matches("^\\d{2}-\\d{2}-\\d{4}$")) {
                String[] parts = dateStr.split("-");
                return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0]));
            } else if (dateStr.matches("^\\d{2}/\\d{2}/\\d{4}$")) {
                String[] parts = dateStr.split("/");
                return LocalDate.of(Integer.parseInt(parts[2]), Integer.parseInt(parts[1]), Integer.parseInt(parts[0]));
            }
        } catch (Exception e) {
            logger.warn("Failed to parse business date string: {}", dateStr);
        }
        return null;
    }

    public ResponseEntity<String> syncDailySummary(SyncDailySummaryRequest request) {
        try {
            String shopCode = request.getBranchCode();
            String companyCode = request.getCompanyCode();
            LocalDate businessDate = LocalDate.parse(request.getDate());
            Date sqlDate = Date.valueOf(businessDate);

            logger.debug("syncDailySummary request - CompanyCode: {}, ShopCode: {}, Date: {}", companyCode, shopCode,
                    businessDate);

            SyncPayloadDto payload = buildPayload(companyCode, shopCode, businessDate, sqlDate);
            String jsonPayload = objectMapper.writeValueAsString(payload);
            logger.debug("Generated sync payload for date {}", businessDate);

            // 💾 1. Immediately backup the full daily summary payload into local single-column table to prevent data loss
            saveOrUpdateLocalBackup(shopCode, businessDate, jsonPayload, "PENDING");

            String apiBase = IpConfig.getSyncApiUrl();
            if (apiBase == null || apiBase.isEmpty())
                apiBase = "";
            String postUrl = apiBase + "api/sync/daily-summary";

            HttpHeaders headers = createSyncHeaders();
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            try {
                logger.debug("Sending sync payload to: {}", postUrl);
                ResponseEntity<String> response = restTemplate.postForEntity(postUrl, entity, String.class);
                logger.debug("Sync status: {} | Response: {}", response.getStatusCode(), response.getBody());

                if (response.getStatusCode().is2xxSuccessful()) {
                    // Update backup status to SYNCED
                    saveOrUpdateLocalBackup(shopCode, businessDate, jsonPayload, "SYNCED");

                    // Retry any older pending backups that previously failed
                    retryPendingBackups(shopCode, businessDate);

                    // Clean up backups older than configured retention days (default 7 days via setdiscount)
                    cleanupOldBackups(businessDate);

                    // Update sync fingerprint and state
                    lastSyncedFingerprint = computeDataFingerprint(sqlDate);
                    lastSyncedDate = businessDate.toString();

                    if (isDayReset()) {
                        lastClosedSyncedDate = businessDate.toString();
                        logger.info("Day-end closing sync completed and recorded for date: {}", lastClosedSyncedDate);
                    }

                    // Clean temp_numanacathead after successful sync so stale data is not
                    // repeatedly pushed
                    try {
                        jdbcTemplate.execute("DELETE FROM public.temp_numanacathead");
                        jdbcTemplate.execute("DELETE FROM public.temp_splituptable");
                        jdbcTemplate.execute("DELETE FROM public.temp_cashmarkings");
                        logger.debug("Cleaned up temp_numanacathead, temp_splituptable, and temp_cashmarkings after successful sync.");
                    } catch (Exception e) {
                        logger.debug("Failed to clean temp tables: {}", e.getMessage());
                    }
                }

                return response;
            } catch (Exception apiEx) {
                logger.warn("Could not send to central API at {}: {}. Local backup preserved as PENDING. Returning local JSON.", postUrl,
                        apiEx.getMessage());
                return ResponseEntity.ok(jsonPayload);
            }
        } catch (Exception ex) {
            logger.error("Error during syncDailySummary", ex);
            return ResponseEntity.internalServerError().body("Error: " + ex.getMessage());
        }
    }

    private SyncPayloadDto buildPayload(String companyCode, String shopCode, LocalDate businessDate, Date sqlDate) {
        SyncPayloadDto p = new SyncPayloadDto();
        p.companyCode = companyCode;
        p.branchCode = shopCode;
        p.date = businessDate.toString();
        // Independent of cashmarkings
        p.schemeSummary = schemeSummaryBuilder.buildSchemeSummary(shopCode, businessDate.toString());
        p.numanaCatHeads = numanaCatHeadBuilder.buildNumanaCatHeads();
        p.splitups = splitupSummaryBuilder.buildSplitupSummaries();
        p.dateAndRate = dateAndRateBuilder.buildDateAndRate(businessDate, shopCode);
        p.smithReports = smithReportBuilder.buildSmithReports(sqlDate);
        boolean hasCashMarkings = false;
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT count(counter_code) FROM cashmarkings WHERE marking_date = ?", Integer.class, sqlDate);
            if (count != null && count > 0) {
                hasCashMarkings = true;
            } else {
                Integer tempCount = jdbcTemplate.queryForObject(
                        "SELECT count(counter_code) FROM temp_cashmarkings WHERE marking_date = ?", Integer.class, sqlDate);
                if (tempCount != null && tempCount > 0) {
                    hasCashMarkings = true;
                    logger.info("Using fallback temp_cashmarkings for date {}", sqlDate);
                }
            }
        } catch (Exception e) {
            logger.warn("Error checking cashmarkings for date {}: {}", sqlDate, e.getMessage());
        }

        if (hasCashMarkings) {
            boolean isOldModel = cashSummaryBuilder.isOldModelEnabled();
            p.metalSummaries = metalSummaryBuilder.buildMetalSummaries(sqlDate, isOldModel);
            p.orderSummary = orderSummaryBuilder.buildOrderSummary(sqlDate);
            p.collectionSummary = collectionSummaryBuilder.buildCollectionSummary(shopCode, businessDate.toString(),
                    sqlDate);
            if (p.collectionSummary != null) {
                p.collectionDetails = p.collectionSummary.collectionDetails;
            }
            p.cashSummary = cashSummaryBuilder.buildCashSummary(sqlDate, isOldModel);
            saveLocalSummaryDetails(shopCode, businessDate, p.metalSummaries);
        } else {
            logger.info("cashmarkings is empty for date {}, skipping metal, order, collection, and cash summaries",
                    businessDate);
        }

        boolean dayReset = isDayReset(businessDate);
        p.isDayReset = dayReset;
        if (dayReset) {
            String rTime = null;
            if (p.dateAndRate != null && p.dateAndRate.resetTime != null && !p.dateAndRate.resetTime.trim().isEmpty()) {
                rTime = p.dateAndRate.resetTime.trim();
            }
            if (rTime == null) {
                try {
                    List<String> list = jdbcTemplate.query(
                            "SELECT reset_time::text FROM dateandrate WHERE thisday = ? ORDER BY datatime DESC LIMIT 1",
                            (rs, rowNum) -> rs.getString(1),
                            java.sql.Date.valueOf(businessDate));
                    if (!list.isEmpty() && list.get(0) != null) {
                        rTime = list.get(0).trim();
                    }
                } catch (Exception ignored) {}
            }
            if (rTime == null || rTime.trim().isEmpty()) {
                rTime = java.time.LocalTime.now().truncatedTo(java.time.temporal.ChronoUnit.SECONDS).toString();
            }
            p.resetTime = rTime;
            if (p.dateAndRate != null) {
                p.dateAndRate.restflag = true;
                p.dateAndRate.resetTime = rTime;
            }
            if (p.cashSummary != null) {
                p.cashSummary.resetTime = rTime;
            }
        }
        return p;
    }

    private void saveLocalSummaryDetails(String shopCode, LocalDate businessDate, List<MetalSyncDto> metalSummaries) {
        try {
            summaryDetailsRepository.deleteByShopcodeAndSummaryDate(shopCode, businessDate);
            List<SummaryMaster> masterList = summaryMasterRepository.findByShopcodeAndActiveTrueOrderBySlno(shopCode);
            Map<String, Integer> masterSlnoMap = new HashMap<>();
            for (SummaryMaster m : masterList) {
                if (m.getCounterCode() != null) {
                    masterSlnoMap.put(m.getCounterCode().toUpperCase(), m.getSlno());
                }
            }
            List<SummaryDetails> detailsToSave = new ArrayList<>();
            for (MetalSyncDto dto : metalSummaries) {
                if (dto.categoryCode != null) {
                    Integer masterSlno = masterSlnoMap.get(dto.categoryCode.toUpperCase());
                    SummaryDetails sd = new SummaryDetails();
                    sd.setShopcode(shopCode);
                    sd.setSummaryDate(businessDate);
                    sd.setSummarySlno(masterSlno != null ? masterSlno : 0);
                    sd.setWeight(dto.salesWeight != null ? dto.salesWeight.doubleValue() : 0.0);
                    sd.setAmount(dto.salesAmount != null ? dto.salesAmount.doubleValue() : 0.0);
                    detailsToSave.add(sd);
                }
            }
            if (!detailsToSave.isEmpty()) {
                summaryDetailsRepository.saveAll(detailsToSave);
                logger.debug("Saved {} rows to summary_details table for shopcode {} date {}", detailsToSave.size(),
                        shopCode, businessDate);
            }
        } catch (Exception e) {
            logger.warn("Error saving local summary details", e);
        }
    }

    public void saveOrUpdateLocalBackup(String shopcode, LocalDate summaryDate, String jsonPayload, String status) {
        try {
            DailySyncBackup backup = dailySyncBackupRepository.findByShopcodeAndSummaryDate(shopcode, summaryDate)
                    .orElseGet(() -> DailySyncBackup.builder()
                            .shopcode(shopcode)
                            .summaryDate(summaryDate)
                            .createdAt(LocalDateTime.now())
                            .build());

            backup.setPayloadData(jsonPayload);
            backup.setSyncStatus(status);
            backup.setUpdatedAt(LocalDateTime.now());
            dailySyncBackupRepository.save(backup);
            logger.info("Local daily backup saved for shop {} date {} with status {}", shopcode, summaryDate, status);
        } catch (Exception e) {
            logger.error("Failed to save local daily backup for shop {} date {}: {}", shopcode, summaryDate, e.getMessage());
        }
    }

    public Optional<DailySyncBackup> getLocalDailyBackup(String shopcode, LocalDate summaryDate) {
        return dailySyncBackupRepository.findByShopcodeAndSummaryDate(shopcode, summaryDate);
    }

    private HttpHeaders createSyncHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String syncUsername = ServerPortConfig.getSyncApiUsername();
        String syncPassword = ServerPortConfig.getSyncApiPassword();
        if (syncUsername != null && syncPassword != null) {
            String credentials = syncUsername + ":" + syncPassword;
            String encodedCredentials = Base64.getEncoder()
                    .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
            headers.set(HttpHeaders.AUTHORIZATION, "Basic " + encodedCredentials);
            logger.debug("Basic Auth header added for user: {}", syncUsername);
        } else {
            logger.warn("Sync API credentials not configured in sync.json - sending without auth");
        }
        return headers;
    }

    public void cleanupOldBackups(LocalDate currentDate) {
        try {
            int retentionDays = 7; // Default 7 days
            try {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                        "SELECT flag, amount FROM setdiscount WHERE details = 'SYNC BACKUP RETENTION DAYS' AND flag = true");
                if (!rows.isEmpty()) {
                    Map<String, Object> row = rows.get(0);
                    if (row.get("amount") != null) {
                        retentionDays = ((Number) row.get("amount")).intValue();
                    }
                }
            } catch (Exception e) {
                logger.debug("Could not query setdiscount for SYNC BACKUP RETENTION DAYS: {}", e.getMessage());
            }

            if (retentionDays > 0) {
                LocalDate cutoffDate = currentDate.minusDays(retentionDays);
                int deleted = jdbcTemplate.update(
                        "DELETE FROM sync_daily_backup WHERE summary_date < ?",
                        java.sql.Date.valueOf(cutoffDate));
                if (deleted > 0) {
                    logger.info("Cleaned up {} old sync backups older than {} days (cutoff: {})", deleted, retentionDays, cutoffDate);
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to cleanup old sync backups: {}", e.getMessage());
        }
    }

    public void retryPendingBackups(String shopCode, LocalDate currentBusinessDate) {
        try {
            List<DailySyncBackup> pendingList = dailySyncBackupRepository
                    .findByShopcodeAndSyncStatusOrderBySummaryDateAsc(shopCode, "PENDING");

            if (pendingList == null || pendingList.isEmpty()) {
                return;
            }

            String apiBase = IpConfig.getSyncApiUrl();
            if (apiBase == null || apiBase.isEmpty()) apiBase = "";
            String postUrl = apiBase + "api/sync/daily-summary";

            HttpHeaders headers = createSyncHeaders();

            for (DailySyncBackup pending : pendingList) {
                // If it's today's active date, let live sync handle it unless day is reset/closed
                if (pending.getSummaryDate() != null && pending.getSummaryDate().equals(currentBusinessDate)) {
                    if (!isDayReset(currentBusinessDate)) {
                        continue;
                    }
                }

                try {
                    logger.info("Retrying pending daily sync for shop {} date {}", shopCode, pending.getSummaryDate());
                    HttpEntity<String> entity = new HttpEntity<>(pending.getPayloadData(), headers);
                    ResponseEntity<String> response = restTemplate.postForEntity(postUrl, entity, String.class);
                    if (response.getStatusCode().is2xxSuccessful()) {
                        pending.setSyncStatus("SYNCED");
                        pending.setUpdatedAt(LocalDateTime.now());
                        dailySyncBackupRepository.save(pending);
                        logger.info("Successfully pushed pending daily backup to Central API for date: {}", pending.getSummaryDate());
                        if (pending.getSummaryDate() != null && pending.getSummaryDate().equals(currentBusinessDate) && isDayReset(currentBusinessDate)) {
                            lastClosedSyncedDate = currentBusinessDate.toString();
                        }
                    }
                } catch (Exception ex) {
                    logger.warn("Could not push pending backup for date {}: {}", pending.getSummaryDate(), ex.getMessage());
                    break; // Stop loop if central server or connection fails
                }
            }
        } catch (Exception e) {
            logger.debug("Error while retrying pending daily backups: {}", e.getMessage());
        }
    }
}