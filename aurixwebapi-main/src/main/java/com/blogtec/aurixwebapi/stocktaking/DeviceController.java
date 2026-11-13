package com.blogtec.aurixwebapi.stocktaking;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @PostMapping
    public ResponseEntity<DeviceResponse> registerDevice(
            @RequestBody DeviceRequest request) {

        DeviceResponse response = deviceService.saveDevice(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }
}
