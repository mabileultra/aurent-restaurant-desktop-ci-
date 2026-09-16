package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.sales.domain.SaleEnums;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.entity.SaleItem;
import com.pos.shared.money.TenderNet;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PharmacySaleNetAmountsTest {

    @Test
    void partialReturnReducesHeaderRevenue() {
        Sale sale = sale("10000.00", "10000.00", "0.00", "2.000", "1.000", "10000.00");
        TenderNet net = PharmacySaleNetAmounts.remaining(sale);
        assertEquals(new BigDecimal("5000.00"), net.total());
        assertEquals(new BigDecimal("5000.00"), net.cash());
    }

    @Test
    void fullReturnZeroesRevenue() {
        Sale sale = sale("8000.00", "0.00", "8000.00", "1.000", "1.000", "8000.00");
        TenderNet net = PharmacySaleNetAmounts.remaining(sale);
        assertEquals(new BigDecimal("0.00"), net.total());
        assertEquals(new BigDecimal("0.00"), net.card());
    }

    private static Sale sale(
        String total,
        String cash,
        String card,
        String qty,
        String returned,
        String lineTotal
    ) {
        Sale sale = Sale.builder()
            .totalAmount(new BigDecimal(total))
            .cashAmount(new BigDecimal(cash))
            .cardAmount(new BigDecimal(card))
            .taxTotal(BigDecimal.ZERO)
            .paymentMethod(SaleEnums.PaymentMethod.CASH)
            .build();
        SaleItem item = SaleItem.builder()
            .quantity(new BigDecimal(qty))
            .returnedQuantity(new BigDecimal(returned))
            .lineTotal(new BigDecimal(lineTotal))
            .productName("Paracetamol")
            .unitPrice(new BigDecimal(lineTotal))
            .build();
        item.setSale(sale);
        sale.setItems(List.of(item));
        return sale;
    }
}
