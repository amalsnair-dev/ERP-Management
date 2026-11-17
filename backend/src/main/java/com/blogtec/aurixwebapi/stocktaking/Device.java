package com.blogtec.aurixwebapi.stocktaking;


import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "device")
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
        name = "device_id",
        nullable = false,
        unique = true,
        columnDefinition = "uuid"
    )
    private UUID deviceId;

    @Column(name = "device_model")
    private String deviceModel;

    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "os_version")
    private String osVersion;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    protected Device() {
    }

    @PrePersist
    protected void onCreate() {
        if (deviceId == null) {
            deviceId = UUID.randomUUID();
        }

        if (date == null) {
            date = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public UUID getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(UUID deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceModel() {
        return deviceModel;
    }

    public void setDeviceModel(String deviceModel) {
        this.deviceModel = deviceModel;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getOsVersion() {
        return osVersion;
    }

    public void setOsVersion(String osVersion) {
        this.osVersion = osVersion;
    }

    public LocalDateTime getDate() {
        return date;
    }
}
