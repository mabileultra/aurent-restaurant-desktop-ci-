package com.pos.restaurant.commission.service.impl;

import com.pos.restaurant.commission.dto.WaiterCommissionOrderRow;
import com.pos.restaurant.commission.dto.WaiterCommissionReportResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionSettingsResponse;
import com.pos.restaurant.commission.service.WaiterCommissionService;
import com.pos.restaurant.commission.support.WaiterCommissionCalculator;
import com.pos.restaurant.commission.support.WaiterCommissionRateResolver;
import com.pos.restaurant.commission.support.WaiterCommissionReportAssembler;
import com.pos.restaurant.commission.support.WaiterCommissionSettingsAssembler;
import com.pos.restaurant.commission.support.WaiterCommissionSettingsWriter;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.order.entity.FloorOrder;
import com.pos.restaurant.report.support.StorePeriodSupport;
import com.pos.shared.api.InstantRange;
import com.pos.shared.api.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WaiterCommissionServiceImpl implements WaiterCommissionService {

    private final FloorTenantSupport tenantSupport;
    private final WaiterCommissionSettingsAssembler settingsAssembler;
    private final WaiterCommissionSettingsWriter settingsWriter;
    private final WaiterCommissionCalculator calculator;
    private final WaiterCommissionRateResolver rateResolver;
    private final WaiterCommissionReportAssembler reportAssembler;
    private final StorePeriodSupport storePeriodSupport;

    @Override
    @Transactional(readOnly = true)
    public WaiterCommissionSettingsResponse getSettings(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return settingsAssembler.assemble(companyId, storeId);
    }

    @Override
    public WaiterCommissionSettingsResponse setDefaultPercent(Integer storeId, BigDecimal percent) {
        Integer companyId = tenantSupport.requireCompanyId();
        return settingsWriter.setDefault(companyId, storeId, percent);
    }

    @Override
    public WaiterCommissionSettingsResponse setWaiterPercent(Integer storeId, UUID userId, BigDecimal percent) {
        Integer companyId = tenantSupport.requireCompanyId();
        return settingsWriter.setWaiter(companyId, storeId, userId, percent);
    }

    @Override
    public WaiterCommissionSettingsResponse clearWaiterPercent(Integer storeId, UUID userId) {
        Integer companyId = tenantSupport.requireCompanyId();
        return settingsWriter.clearWaiter(companyId, storeId, userId);
    }

    @Override
    public WaiterCommissionSettingsResponse applyToAll(Integer storeId, BigDecimal percent) {
        Integer companyId = tenantSupport.requireCompanyId();
        return settingsWriter.applyToAll(companyId, storeId, percent);
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
        order.setCommissionPercent(percent);
        order.setCommissionBaseAmount(base);
        order.setCommissionAmount(calculator.amount(base, percent));
    }

    @Override
    @Transactional(readOnly = true)
    public WaiterCommissionReportResponse report(Integer storeId, Instant from, Instant to) {
        Integer companyId = tenantSupport.requireCompanyId();
        InstantRange period = storePeriodSupport.resolve(from, to);
        return reportAssembler.build(companyId, storeId, period.from(), period.to());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<WaiterCommissionOrderRow> waiterOrders(
        Integer storeId,
        UUID waiterUserId,
        Instant from,
        Instant to,
        int page,
        int size
    ) {
        Integer companyId = tenantSupport.requireCompanyId();
        InstantRange period = storePeriodSupport.resolve(from, to);
        return reportAssembler.orders(
            companyId, storeId, waiterUserId, period.from(), period.to(), page, size
        );
    }
}
