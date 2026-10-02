package com.pos.restaurant.shift.support;

import com.pos.restaurant.shift.domain.CashOpType;
import com.pos.restaurant.shift.repository.RestaurantCashOpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ShiftCashOpTotalsLoader {

    private final RestaurantCashOpRepository cashOpRepository;

    public ShiftCashMath.Drawer totals(UUID shiftId) {
        if (shiftId == null) {
            return ShiftCashMath.Drawer.zero();
        }
        return totals(List.of(shiftId)).getOrDefault(shiftId, ShiftCashMath.Drawer.zero());
    }

    public Map<UUID, ShiftCashMath.Drawer> totals(Collection<UUID> shiftIds) {
        Map<UUID, ShiftCashMath.Drawer> result = new HashMap<>();
        if (shiftIds == null || shiftIds.isEmpty()) {
            return result;
        }
        for (UUID id : shiftIds) {
            result.put(id, ShiftCashMath.Drawer.zero());
        }
        for (Object[] row : cashOpRepository.sumByShiftAndType(shiftIds)) {
            UUID shiftId = (UUID) row[0];
            CashOpType type = (CashOpType) row[1];
            BigDecimal amount = (BigDecimal) row[2];
            result.put(shiftId, result.getOrDefault(shiftId, ShiftCashMath.Drawer.zero()).plus(type, amount));
        }
        return result;
    }
}
