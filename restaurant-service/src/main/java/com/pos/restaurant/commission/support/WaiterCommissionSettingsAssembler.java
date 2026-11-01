package com.pos.restaurant.commission.support;

import com.pos.restaurant.commission.dto.WaiterCommissionOverrideResponse;
import com.pos.restaurant.commission.dto.WaiterCommissionSettingsResponse;
import com.pos.restaurant.commission.entity.WaiterCommissionSetting;
import com.pos.restaurant.commission.repository.WaiterCommissionSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class WaiterCommissionSettingsAssembler {

    private final WaiterCommissionSettingRepository repository;

    public WaiterCommissionSettingsResponse assemble(Integer companyId, Integer storeId) {
        BigDecimal defaultPercent = repository.findStoreDefault(companyId, storeId)
            .map(WaiterCommissionSetting::getPercent)
            .orElse(BigDecimal.ZERO);
        List<WaiterCommissionOverrideResponse> overrides = repository.findOverrides(companyId, storeId).stream()
            .map(s -> new WaiterCommissionOverrideResponse(s.getUserId(), s.getPercent()))
            .toList();
        return new WaiterCommissionSettingsResponse(defaultPercent, overrides);
    }
}
