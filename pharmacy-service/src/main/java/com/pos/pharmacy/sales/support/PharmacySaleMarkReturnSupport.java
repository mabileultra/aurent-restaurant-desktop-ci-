package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.marks.service.PharmacyStockMarkService;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.service.PharmacySoldMarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Возврат КМ: снять sale_sold_marks и вернуть stock_marks в IN_STOCK.
 * Немаркированные позиции не трогает.
 */
@Component
@RequiredArgsConstructor
public class PharmacySaleMarkReturnSupport {

    private final PharmacySoldMarkService soldMarkService;
    private final PharmacyStockMarkService stockMarkService;

    /** Частичный возврат: qty упаковок → столько же уникальных КМ по позиции. */
    public void restoreForPartialReturn(Sale sale, Map<UUID, BigDecimal> returnQtyByItemId) {
        if (sale == null || returnQtyByItemId == null || returnQtyByItemId.isEmpty()) {
            return;
        }
        Map<UUID, Integer> limitByItem = new LinkedHashMap<>();
        returnQtyByItemId.forEach((itemId, qty) -> {
            int packs = toPackCount(qty);
            if (packs > 0) {
                limitByItem.put(itemId, packs);
            }
        });
        if (limitByItem.isEmpty()) {
            return;
        }
        List<String> codes = soldMarkService.unregisterForReturn(sale.getId(), limitByItem);
        if (!codes.isEmpty()) {
            stockMarkService.restoreOnReturn(sale.getStoreId(), sale.getId(), codes);
        }
    }

    /** Полный void оставшихся позиций — все ещё «проданные» КМ по чеку. */
    public void restoreAllRemaining(Sale sale) {
        if (sale == null) {
            return;
        }
        List<String> codes = soldMarkService.unregisterAllForSale(sale.getId());
        if (!codes.isEmpty()) {
            stockMarkService.restoreOnReturn(sale.getStoreId(), sale.getId(), codes);
        }
    }

    private static int toPackCount(BigDecimal qty) {
        if (qty == null || qty.signum() <= 0) {
            return 0;
        }
        return qty.setScale(0, java.math.RoundingMode.UP).intValue();
    }
}
