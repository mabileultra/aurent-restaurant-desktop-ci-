package com.pos.restaurant.commission.support;

import com.pos.restaurant.commission.repository.WaiterCommissionSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WaiterCommissionRateResolver {

    private final WaiterCommissionSettingRepository repository;

    public BigDecimal resolvePercent(Integer companyId, Integer storeId, UUID waiterUserId) {
        if (waiterUserId != null) {
            BigDecimal override = repository.findByStoreAndUser(companyId, storeId, waiterUserId)
                .map(s -> s.getPercent())
                .orElse(null);
            if (override != null) {
                return override;
            }
        }
        return repository.findStoreDefault(companyId, storeId)
            .map(s -> s.getPercent())
            .orElse(BigDecimal.ZERO);
    }
}
