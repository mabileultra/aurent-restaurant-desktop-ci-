package com.pos.integrations.finance.service.support;

import com.pos.catalog.entity.Product;
import com.pos.inventory.entity.StockLot;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.sales.entity.SaleItemLot;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FinanceSaleCostCalculatorTest {

    @Test
    void usesLotPurchasePriceWhenPresent() {
        Product product = Product.builder().costPrice(new BigDecimal("100")).build();
        StockLot lot = StockLot.builder().purchasePrice(new BigDecimal("80")).build();
        SaleItem item = SaleItem.builder()
            .product(product)
            .quantity(new BigDecimal("2"))
            .returnedQuantity(BigDecimal.ZERO)
            .lotAllocations(List.of(SaleItemLot.builder().lot(lot).quantity(new BigDecimal("2")).build()))
            .build();
        Sale sale = Sale.builder().items(List.of(item)).build();

        assertEquals(new BigDecimal("160.00"), FinanceSaleCostCalculator.totalCost(sale));
    }

    @Test
    void fallsBackToProductCostWhenLotsMissing() {
        Product product = Product.builder().costPrice(new BigDecimal("50.5")).build();
        SaleItem item = SaleItem.builder()
            .product(product)
            .quantity(new BigDecimal("3"))
            .returnedQuantity(BigDecimal.ZERO)
            .build();
        Sale sale = Sale.builder().items(List.of(item)).build();

        assertEquals(new BigDecimal("151.50"), FinanceSaleCostCalculator.totalCost(sale));
    }
}
