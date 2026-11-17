package com.blogtec.aurixwebapi.stocktaking;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByDeviceId(UUID deviceId);

    boolean existsByDeviceId(UUID deviceId);
}

