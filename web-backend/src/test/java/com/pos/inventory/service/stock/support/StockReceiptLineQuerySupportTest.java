package com.pos.inventory.service.stock.support;

import com.pos.dto.shared.PageResponse;
import com.pos.entity.Store;
import com.pos.exception.ResourceNotFoundException;
import com.pos.inventory.dto.warehouse.StockReceiptLineResponse;
import com.pos.inventory.entity.StockReceipt;
import com.pos.inventory.entity.StockReceiptLine;
import com.pos.inventory.repository.StockReceiptLineRepository;
import com.pos.inventory.repository.StockReceiptRepository;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.api.PageLimits;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockReceiptLineQuerySupportTest {

    @Mock
    private StockReceiptRepository stockReceiptRepository;
    @Mock
    private StockReceiptLineRepository stockReceiptLineRepository;
    @Mock
    private StockReceiptLineMapper lineMapper;
    @Mock
    private TenantAccessSupport tenantAccess;

    @InjectMocks
    private StockReceiptLineQuerySupport support;

    @Test
    void listLines_returnsMappedPage() {
        UUID receiptId = UUID.randomUUID();
        Store store = new Store();
        StockReceipt receipt = StockReceipt.builder().id(receiptId).store(store).build();
        StockReceiptLine line = StockReceiptLine.builder()
            .id(UUID.randomUUID())
            .productName("Milk")
            .quantity(BigDecimal.ONE)
            .build();
        StockReceiptLineResponse mapped = new StockReceiptLineResponse(
            line.getId(), null, "Milk", null,
            BigDecimal.ONE, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN
        );
        Pageable pageable = PageRequest.of(0, PageLimits.DEFAULT_SIZE);
        Pageable bounded = PageRequest.of(0, PageLimits.DEFAULT_SIZE);

        when(stockReceiptRepository.findHeaderById(receiptId)).thenReturn(Optional.of(receipt));
        when(stockReceiptLineRepository.findPageByReceiptId(eq(receiptId), eq(bounded)))
            .thenReturn(new PageImpl<>(List.of(line), bounded, 1));
        when(lineMapper.toResponse(line)).thenReturn(mapped);

        PageResponse<StockReceiptLineResponse> page = support.listLines(receiptId, pageable);

        assertEquals(1, page.totalElements());
        assertEquals("Milk", page.content().get(0).productName());
        verify(tenantAccess).assertCanAccessStore(store);
    }

    @Test
    void listLines_capsSizeViaPageLimits() {
        UUID receiptId = UUID.randomUUID();
        StockReceipt receipt = StockReceipt.builder().id(receiptId).build();
        when(stockReceiptRepository.findHeaderById(receiptId)).thenReturn(Optional.of(receipt));
        when(stockReceiptLineRepository.findPageByReceiptId(eq(receiptId), org.mockito.ArgumentMatchers.any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of()));

        support.listLines(receiptId, PageRequest.of(0, 500));

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(stockReceiptLineRepository).findPageByReceiptId(eq(receiptId), captor.capture());
        assertEquals(PageLimits.MAX_SIZE, captor.getValue().getPageSize());
    }

    @Test
    void listLines_missingReceipt_throwsNotFound() {
        UUID receiptId = UUID.randomUUID();
        when(stockReceiptRepository.findHeaderById(receiptId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
            () -> support.listLines(receiptId, PageRequest.of(0, PageLimits.DEFAULT_SIZE)));
    }
}
