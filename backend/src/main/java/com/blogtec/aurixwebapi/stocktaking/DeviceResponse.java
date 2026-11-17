package com.blogtec.aurixwebapi.stocktaking;


import java.time.LocalDateTime;
import java.util.UUID;

public class DeviceResponse {

    private UUID deviceId;
    private String deviceName;
    private String deviceModel;
    private String osVersion;
    private LocalDateTime date;

    public DeviceResponse(
            UUID deviceId,
            String deviceName,
            String deviceModel,
            String osVersion,
            LocalDateTime date) {
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.deviceModel = deviceModel;
        this.osVersion = osVersion;
        this.date = date;
    }

    public UUID getDeviceId() {
        return deviceId;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public String getDeviceModel() {
        return deviceModel;
    }

    public String getOsVersion() {
        return osVersion;
    }

    public LocalDateTime getDate() {
        return date;
    }
}

