package com.pos.integrations.finance.service.support;

import com.pos.catalog.api.CatalogFacade;
import com.pos.catalog.dto.ref.ProductRef;
import com.pos.catalog.entity.Product;
import com.pos.inventory.entity.StockLot;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.sales.entity.SaleItemLot;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinanceSaleCostCalculatorTest {

    @Mock
    private CatalogFacade catalogFacade;

    @InjectMocks
    private FinanceSaleCostCalculator calculator;

    @Test
    void usesLotPurchasePriceWhenPresent() {
        UUID productId = UUID.randomUUID();
        Product product = Product.builder().id(productId).costPrice(new BigDecimal("100")).build();
        StockLot lot = StockLot.builder().purchasePrice(new BigDecimal("80")).build();
        SaleItem item = SaleItem.builder()
            .productId(productId)
            .productName("Item")
            .quantity(new BigDecimal("2"))
            .returnedQuantity(BigDecimal.ZERO)
            .lotAllocations(List.of(SaleItemLot.builder().lot(lot).quantity(new BigDecimal("2")).build()))
            .build();
        Sale sale = Sale.builder().items(List.of(item)).build();

        assertEquals(new BigDecimal("160.00"), calculator.totalCost(sale));
    }

    @Test
    void fallsBackToCatalogCostWhenLotsMissing() {
        UUID productId = UUID.randomUUID();
        Product product = Product.builder().id(productId).costPrice(new BigDecimal("50.5")).build();
        when(catalogFacade.getById(productId)).thenReturn(new ProductRef(
            productId,
            1,
            "SKU",
            "Item",
            null,
            null,
            BigDecimal.TEN,
            new BigDecimal("50.5"),
            "PCS",
            true,
            false
        ));
        SaleItem item = SaleItem.builder()
            .productId(productId)
            .productName("Item")
            .quantity(new BigDecimal("3"))
            .returnedQuantity(BigDecimal.ZERO)
            .build();
        Sale sale = Sale.builder().items(List.of(item)).build();

        assertEquals(new BigDecimal("151.50"), calculator.totalCost(sale));
    }
}
