package com.pos.restaurant.commission.support;

import com.pos.restaurant.commission.dto.WaiterCommissionSettingsResponse;
import com.pos.restaurant.commission.entity.WaiterCommissionSetting;
import com.pos.restaurant.commission.repository.WaiterCommissionSettingRepository;
import com.pos.restaurant.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WaiterCommissionSettingsWriter {

    private final WaiterCommissionSettingRepository repository;
    private final WaiterCommissionCalculator calculator;
    private final WaiterCommissionSettingsAssembler settingsAssembler;

    @Transactional
    public WaiterCommissionSettingsResponse setDefault(Integer companyId, Integer storeId, BigDecimal percent) {
        BigDecimal value = calculator.normalizePercent(percent);
        WaiterCommissionSetting setting = repository.findStoreDefault(companyId, storeId)
            .orElseGet(() -> base(companyId, storeId, null));
        setting.setPercent(value);
        repository.save(setting);
        return settingsAssembler.assemble(companyId, storeId);
    }

    @Transactional
    public WaiterCommissionSettingsResponse setWaiter(
        Integer companyId, Integer storeId, UUID userId, BigDecimal percent
    ) {
        requireUserId(userId);
        BigDecimal value = calculator.normalizePercent(percent);
        WaiterCommissionSetting setting = repository.findByStoreAndUser(companyId, storeId, userId)
            .orElseGet(() -> base(companyId, storeId, userId));
        setting.setPercent(value);
        repository.save(setting);
        return settingsAssembler.assemble(companyId, storeId);
    }

    @Transactional
    public WaiterCommissionSettingsResponse clearWaiter(Integer companyId, Integer storeId, UUID userId) {
        requireUserId(userId);
        repository.findByStoreAndUser(companyId, storeId, userId).ifPresent(repository::delete);
        return settingsAssembler.assemble(companyId, storeId);
    }

    @Transactional
    public WaiterCommissionSettingsResponse applyToAll(Integer companyId, Integer storeId, BigDecimal percent) {
        BigDecimal value = calculator.normalizePercent(percent);
        repository.deleteOverrides(companyId, storeId);
        WaiterCommissionSetting setting = repository.findStoreDefault(companyId, storeId)
            .orElseGet(() -> base(companyId, storeId, null));
        setting.setPercent(value);
        repository.save(setting);
        return settingsAssembler.assemble(companyId, storeId);
    }

    private static WaiterCommissionSetting base(Integer companyId, Integer storeId, UUID userId) {
        return WaiterCommissionSetting.builder()
            .companyId(companyId)
            .storeId(storeId)
            .userId(userId)
            .build();
    }

    private static void requireUserId(UUID userId) {
        if (userId == null) {
            throw new BusinessException("Waiter user id is required");
        }
    }
}
