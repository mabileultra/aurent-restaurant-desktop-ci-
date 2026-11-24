package com.pos.inventory.service.stock.support;

import com.pos.inventory.repository.StockReceiptRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockReceiptNumberAllocatorTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    @Mock
    private StockReceiptRepository stockReceiptRepository;

    @Spy
    private StockReceiptNumberFormat format = new StockReceiptNumberFormat();

    @InjectMocks
    private StockReceiptNumberAllocator allocator;

    @Test
    void next_skipsGapsAfterDeletes() {
        LocalDate today = LocalDate.now(ZONE);
        String prefix = format.prefix(today);
        when(stockReceiptRepository.findReceiptNumbersStartingWith(startsWith("REC-")))
            .thenReturn(List.of(prefix + "0001", prefix + "0003"));

        assertEquals(prefix + "0004", allocator.next());
    }

    @Test
    void next_startsAtOneWhenEmpty() {
        LocalDate today = LocalDate.now(ZONE);
        String prefix = format.prefix(today);
        when(stockReceiptRepository.findReceiptNumbersStartingWith(startsWith("REC-")))
            .thenReturn(List.of());

        assertEquals(prefix + "0001", allocator.next());
    }
}
