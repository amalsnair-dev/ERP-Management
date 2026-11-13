package com.blogtec.aurixwebapi.stocktaking;



import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;

    public DeviceService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    @Transactional
    public DeviceResponse saveDevice(DeviceRequest request) {

        Device device = new Device();

        device.setDeviceId(UUID.randomUUID());
        device.setDeviceName(request.getDeviceName());
        device.setDeviceModel(request.getDeviceModel());
        device.setOsVersion(request.getOsVersion());

        Device savedDevice = deviceRepository.save(device);

        return new DeviceResponse(
                savedDevice.getDeviceId(),
                savedDevice.getDeviceName(),
                savedDevice.getDeviceModel(),
                savedDevice.getOsVersion(),
                savedDevice.getDate()
        );
    }
}
