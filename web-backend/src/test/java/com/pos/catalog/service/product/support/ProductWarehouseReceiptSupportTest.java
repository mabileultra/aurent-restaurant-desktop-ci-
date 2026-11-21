package com.pos.catalog.service.product.support;

import com.pos.catalog.dto.product.ProductResponse;
import com.pos.catalog.service.product.ProductResponseAssembler;
import com.pos.inventory.repository.StockReceiptLineRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductWarehouseReceiptSupportTest {

    @Mock
    StockReceiptLineRepository stockReceiptLineRepository;
    @Mock
    ProductResponseAssembler assembler;

    @InjectMocks
    ProductWarehouseReceiptSupport support;

    @Test
    void productIdsForReceiptFilter_blank_returnsNull() {
        assertThat(support.productIdsForReceiptFilter(1, "  ")).isNull();
        assertThat(support.productIdsForReceiptFilter(1, null)).isNull();
    }

    @Test
    void productIdsForReceiptFilter_delegatesWithContainsPattern() {
        UUID id = UUID.randomUUID();
        when(stockReceiptLineRepository.findProductIdsByReceiptNumberContains(eq(7), eq("%REC-1%")))
            .thenReturn(List.of(id));

        assertThat(support.productIdsForReceiptFilter(7, "REC-1")).containsExactly(id);
    }

    @Test
    void productIdsForReceiptFilter_escapesLikeMetacharacters() {
        UUID id = UUID.randomUUID();
        when(stockReceiptLineRepository.findProductIdsByReceiptNumberContains(eq(7), eq("%100\\%OFF%")))
            .thenReturn(List.of(id));

        assertThat(support.productIdsForReceiptFilter(7, "100%OFF")).containsExactly(id);
    }

    @Test
    void withLatestReceiptNumbers_mapsPerProduct() {
        UUID id = UUID.randomUUID();
        ProductResponse base = org.mockito.Mockito.mock(ProductResponse.class);
        ProductResponse enriched = org.mockito.Mockito.mock(ProductResponse.class);
        when(base.id()).thenReturn(id);
        when(stockReceiptLineRepository.findLatestReceiptNumberByProductIds(eq(3), any()))
            .thenReturn(List.<Object[]>of(new Object[]{id, "REC-9"}));
        when(assembler.withLastReceiptNumber(base, "REC-9")).thenReturn(enriched);

        assertThat(support.withLatestReceiptNumbers(3, List.of(base))).containsExactly(enriched);
        verify(assembler).withLastReceiptNumber(base, "REC-9");
    }
}
