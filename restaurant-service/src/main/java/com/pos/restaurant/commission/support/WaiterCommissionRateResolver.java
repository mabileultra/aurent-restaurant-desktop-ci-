package com.pos.restaurant.commission.support;

import com.pos.restaurant.commission.entity.WaiterCommissionSetting;
import com.pos.restaurant.commission.repository.WaiterCommissionSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Resolves waiter % with one store lookup (override preferred over default).
 * Hot path: called on every DINE_IN bill/pay.
 */
@Component
@RequiredArgsConstructor
public class WaiterCommissionRateResolver {

    private final WaiterCommissionSettingRepository repository;

    public BigDecimal resolvePercent(Integer companyId, Integer storeId, UUID waiterUserId) {
        if (waiterUserId == null) {
            return repository.findStoreDefault(companyId, storeId)
                .map(WaiterCommissionSetting::getPercent)
                .orElse(BigDecimal.ZERO);
        }

        List<WaiterCommissionSetting> rows = repository.findDefaultAndOverride(companyId, storeId, waiterUserId);
        BigDecimal override = null;
        BigDecimal storeDefault = null;
        for (WaiterCommissionSetting row : rows) {
            if (row.getUserId() == null) {
                storeDefault = row.getPercent();
            } else if (waiterUserId.equals(row.getUserId())) {
                override = row.getPercent();
            }
        }
        if (override != null) {
            return override;
        }
        return storeDefault != null ? storeDefault : BigDecimal.ZERO;
    }
}
