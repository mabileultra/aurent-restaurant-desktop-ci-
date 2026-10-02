package com.pos.restaurant.localfirst.repository;

import com.pos.restaurant.localfirst.entity.DeviceClientEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface DeviceClientEventRepository extends JpaRepository<DeviceClientEvent, UUID> {

    Optional<DeviceClientEvent> findByCompanyIdAndDeviceIdAndClientEventId(
        Integer companyId,
        String deviceId,
        String clientEventId
    );

    boolean existsByCompanyIdAndDeviceIdAndClientEventId(
        Integer companyId,
        String deviceId,
        String clientEventId
    );
}
