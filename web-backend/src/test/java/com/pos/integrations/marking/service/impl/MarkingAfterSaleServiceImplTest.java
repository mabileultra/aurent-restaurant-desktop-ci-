package com.pos.integrations.marking.service.impl;

import com.pos.integrations.marking.service.MarkingAfterSaleService;
import com.pos.sales.dto.sale.SaleItemRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MarkingAfterSaleServiceImplTest {

    private final MarkingAfterSaleServiceImpl service = new MarkingAfterSaleServiceImpl();

    @Test
    void codesOfCollectsLineMarks() {
        SaleItemRequest line = new SaleItemRequest(
            UUID.randomUUID(),
            BigDecimal.ONE,
            null,
            null,
            List.of("  KM1  ", "KM1", "KM2")
        );
        assertEquals(List.of("KM1", "KM2"), MarkingAfterSaleService.codesOf(List.of(line)));
    }

    @Test
    void enqueueAfterSaleDoesNotCallAsl() {
        service.enqueueAfterSale(7, List.of("KM1"), true);
    }
}
