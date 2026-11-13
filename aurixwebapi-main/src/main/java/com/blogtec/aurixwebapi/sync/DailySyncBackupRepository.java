package com.blogtec.aurixwebapi.sync;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailySyncBackupRepository extends JpaRepository<DailySyncBackup, Integer> {
    Optional<DailySyncBackup> findByShopcodeAndSummaryDate(String shopcode, LocalDate summaryDate);
    List<DailySyncBackup> findByShopcodeAndSyncStatusOrderBySummaryDateAsc(String shopcode, String syncStatus);
}


