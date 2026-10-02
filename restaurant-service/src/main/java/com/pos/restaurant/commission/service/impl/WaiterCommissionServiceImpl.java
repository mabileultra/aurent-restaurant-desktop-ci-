package com.pos.restaurant.commission.service.impl;

import com.pos.restaurant.commission.dto.WaiterCommissionOverrideResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionOrdersResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionReportResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionSettingsResponse;
import com.pos.restaurant.commission.entity.WaiterCommissionSetting;
import com.pos.restaurant.commission.repository.WaiterCommissionSettingRepository;
import com.pos.restaurant.commission.service.WaiterCommissionService;
import com.pos.restaurant.commission.support.WaiterCommissionCalculator;
import com.pos.restaurant.commission.support.WaiterCommissionRateResolver;
import com.pos.restaurant.commission.support.WaiterCommissionReportAssembler;
import com.pos.restaurant.analytics.support.AnalyticsPeriodResolver;
import com.pos.restaurant.exception.BusinessException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.entity.FloorOrder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WaiterCommissionServiceImpl implements WaiterCommissionService {

    private final WaiterCommissionSettingRepository repository;
    private final WaiterCommissionCalculator calculator;
    private final WaiterCommissionRateResolver rateResolver;
    private final WaiterCommissionReportAssembler reportAssembler;
    private final FloorTenantSupport tenantSupport;
    private final AnalyticsPeriodResolver periodResolver;

    @Override
    @Transactional(readOnly = true)
    public WaiterCommissionSettingsResponse getSettings(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return toResponse(companyId, storeId);
    }

    @Override
    @Transactional
    public WaiterCommissionSettingsResponse setDefaultPercent(Integer storeId, BigDecimal percent) {
        Integer companyId = tenantSupport.requireCompanyId();
        BigDecimal value = calculator.normalizePercent(percent);
        WaiterCommissionSetting setting = repository.findStoreDefault(companyId, storeId)
            .orElseGet(() -> WaiterCommissionSetting.builder()
                .companyId(companyId)
                .storeId(storeId)
                .userId(null)
                .build());
        setting.setPercent(value);
        repository.save(setting);
        return toResponse(companyId, storeId);
    }

    @Override
    @Transactional
    public WaiterCommissionSettingsResponse setWaiterPercent(Integer storeId, UUID userId, BigDecimal percent) {
        if (userId == null) {
            throw new BusinessException("Waiter user id is required");
        }
        Integer companyId = tenantSupport.requireCompanyId();
        BigDecimal value = calculator.normalizePercent(percent);
        WaiterCommissionSetting setting = repository.findByStoreAndUser(companyId, storeId, userId)
            .orElseGet(() -> WaiterCommissionSetting.builder()
                .companyId(companyId)
                .storeId(storeId)
                .userId(userId)
                .build());
        setting.setPercent(value);
        repository.save(setting);
        return toResponse(companyId, storeId);
    }

    @Override
    @Transactional
    public WaiterCommissionSettingsResponse clearWaiterPercent(Integer storeId, UUID userId) {
        if (userId == null) {
            throw new BusinessException("Waiter user id is required");
        }
        Integer companyId = tenantSupport.requireCompanyId();
        repository.findByStoreAndUser(companyId, storeId, userId).ifPresent(repository::delete);
        return toResponse(companyId, storeId);
    }

    @Override
    @Transactional
    public WaiterCommissionSettingsResponse applyToAll(Integer storeId, BigDecimal percent) {
        Integer companyId = tenantSupport.requireCompanyId();
        BigDecimal value = calculator.normalizePercent(percent);
        repository.deleteOverrides(companyId, storeId);
        WaiterCommissionSetting setting = repository.findStoreDefault(companyId, storeId)
            .orElseGet(() -> WaiterCommissionSetting.builder()
                .companyId(companyId)
                .storeId(storeId)
                .userId(null)
                .build());
        setting.setPercent(value);
        repository.save(setting);
        return toResponse(companyId, storeId);
    }

    @Override
    @Transactional
    public void applyOnPayment(FloorOrder order, BigDecimal subtotal) {
        if (order == null) {
            return;
        }
        if (!calculator.applies(order.getChannel())) {
            order.setCommissionPercent(null);
            order.setCommissionBaseAmount(null);
            order.setCommissionAmount(null);
            return;
        }
        UUID waiterId = order.getWaiterUserId();
        BigDecimal percent = rateResolver.resolvePercent(order.getCompanyId(), order.getStoreId(), waiterId);
        BigDecimal base = subtotal == null ? BigDecimal.ZERO : subtotal;
        BigDecimal amount = calculator.amount(base, percent);
        order.setCommissionPercent(percent);
        order.setCommissionBaseAmount(base);
        order.setCommissionAmount(amount);
    }

    @Override
    @Transactional(readOnly = true)
    public WaiterCommissionReportResponse report(Integer storeId, Instant from, Instant to) {
        Integer companyId = tenantSupport.requireCompanyId();
        var period = periodResolver.resolve(from, to);
        return reportAssembler.build(companyId, storeId, period.from(), period.to());
    }

    @Override
    @Transactional(readOnly = true)
    public WaiterCommissionOrdersResponse waiterOrders(
        Integer storeId,
        UUID waiterUserId,
        Instant from,
        Instant to,
        int page,
        int size
    ) {
        Integer companyId = tenantSupport.requireCompanyId();
        var period = periodResolver.resolve(from, to);
        return reportAssembler.orders(companyId, storeId, waiterUserId, period.from(), period.to(), page, size);
    }

    private WaiterCommissionSettingsResponse toResponse(Integer companyId, Integer storeId) {
        BigDecimal defaultPercent = repository.findStoreDefault(companyId, storeId)
            .map(WaiterCommissionSetting::getPercent)
            .orElse(BigDecimal.ZERO);
        List<WaiterCommissionOverrideResponse> overrides = repository.findOverrides(companyId, storeId).stream()
            .map(s -> new WaiterCommissionOverrideResponse(s.getUserId(), s.getPercent()))
            .toList();
        return new WaiterCommissionSettingsResponse(defaultPercent, overrides);
    }
}
