package com.blogtec.aurixwebapi.sync;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sync_daily_backup", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"shopcode", "summary_date"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailySyncBackup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "shopcode", nullable = false)
    private String shopcode;

    @Column(name = "summary_date", nullable = false)
    private LocalDate summaryDate;

    @Column(name = "payload_data", columnDefinition = "TEXT", nullable = false)
    private String payloadData;

    @Column(name = "sync_status", length = 30)
    private String syncStatus;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (syncStatus == null) syncStatus = "PENDING";
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

