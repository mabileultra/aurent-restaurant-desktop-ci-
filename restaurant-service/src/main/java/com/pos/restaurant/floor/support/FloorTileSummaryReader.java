package com.pos.restaurant.floor.support;

import com.pos.restaurant.order.repository.FloorOrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FloorTileSummaryReader {

    private final FloorOrderItemRepository itemRepository;

    public Map<UUID, FloorTileNumbers> load(Collection<UUID> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, FloorTileNumbers> totals = new HashMap<>();
        for (Object[] row : itemRepository.summarizeTiles(orderIds)) {
            UUID orderId = toUuid(row[0]);
            int linesCount = ((Number) row[1]).intValue();
            totals.put(orderId, new FloorTileNumbers(toMoney(row[2]), linesCount));
        }
        return totals;
    }

    private static UUID toUuid(Object value) {
        if (value instanceof UUID id) {
            return id;
        }
        return UUID.fromString(value.toString());
    }

    private static BigDecimal toMoney(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal money) {
            return money;
        }
        return new BigDecimal(value.toString());
    }
}
