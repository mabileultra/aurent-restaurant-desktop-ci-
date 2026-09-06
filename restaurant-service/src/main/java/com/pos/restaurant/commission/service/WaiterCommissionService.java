package com.pos.restaurant.commission.service;

import com.pos.restaurant.commission.dto.WaiterCommissionReportResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionSettingsResponse;
import com.pos.restaurant.order.entity.FloorOrder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface WaiterCommissionService {

    WaiterCommissionSettingsResponse getSettings(Integer storeId);

    WaiterCommissionSettingsResponse setDefaultPercent(Integer storeId, BigDecimal percent);

    WaiterCommissionSettingsResponse setWaiterPercent(Integer storeId, UUID userId, BigDecimal percent);

    WaiterCommissionSettingsResponse clearWaiterPercent(Integer storeId, UUID userId);

    WaiterCommissionSettingsResponse applyToAll(Integer storeId, BigDecimal percent);

    void applyOnPayment(FloorOrder order, BigDecimal subtotal);

    WaiterCommissionReportResponse report(Integer storeId, Instant from, Instant to);
}
