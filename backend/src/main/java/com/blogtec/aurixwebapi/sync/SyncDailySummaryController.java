package com.blogtec.aurixwebapi.sync;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;


@RestController
@RequestMapping("/api/sync")
@Tag(name = "Sync Daily Summary API", description = "Endpoints for legacy database synchronization operations")
public class SyncDailySummaryController {

    private final SyncDailySummaryService service;

    public SyncDailySummaryController(SyncDailySummaryService service) {
        this.service = service;
    }

    @PostMapping("/sync-daily-summary")
    @Operation(summary = "Sync Daily Summary", description = "Fetches local metrics/summaries and sends them to the remote office API")
    public ResponseEntity<String> syncDailySummary(@RequestBody SyncDailySummaryRequest request) {
        return service.syncDailySummary(request);
    }

    @RequestMapping(value = "/trigger", method = {RequestMethod.GET, RequestMethod.POST})
    @Operation(summary = "Trigger Immediate Sync", description = "Manually triggers an immediate synchronization of daily summary data to the central server")
    public ResponseEntity<String> triggerSync() {
        return service.executeImmediateSync();
    }

    @GetMapping("/daily-backup")
    @Operation(summary = "Get Local Daily Backup", description = "Retrieves the single-column JSON backup of daily sales, purchase, orders, schemes, smith reports etc.")
    public ResponseEntity<?> getDailyBackup(
            @RequestParam(value = "shopcode", required = false) String shopcode,
            @RequestParam(value = "date", required = false) String date) {
        String targetShop = (shopcode != null && !shopcode.trim().isEmpty()) ? shopcode.trim() : service.fetchShopCode();
        LocalDate targetDate = (date != null && !date.trim().isEmpty()) ? LocalDate.parse(date.trim()) : LocalDate.now();

        Optional<DailySyncBackup> backup = service.getLocalDailyBackup(targetShop, targetDate);
        if (backup.isPresent()) {
            return ResponseEntity.ok(backup.get());
        } else {
            return ResponseEntity.status(404).body("No local backup found for shop " + targetShop + " and date " + targetDate);
        }
    }
}
