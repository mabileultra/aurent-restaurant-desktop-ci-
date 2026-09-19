package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.warehouse.repository.StockReceiptRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PharmacyReceiptNumberAllocatorTest {

    @Test
    void skipsTakenNumbersNotCountedByTodayInserts() {
        StockReceiptRepository repository = mock(StockReceiptRepository.class);
        PharmacyReceiptNumberFormat format = new PharmacyReceiptNumberFormat();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Tashkent"));
        String prefix = format.prefix(today);
        when(repository.findReceiptNumbersStartingWith(prefix))
            .thenReturn(List.of(format.format(today, 1), format.format(today, 2)));

        String next = new PharmacyReceiptNumberAllocator(repository, format).next();

        assertEquals(format.format(today, 3), next);
    }

    @Test
    void startsAtOneWhenNoneTaken() {
        StockReceiptRepository repository = mock(StockReceiptRepository.class);
        PharmacyReceiptNumberFormat format = new PharmacyReceiptNumberFormat();
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Tashkent"));
        when(repository.findReceiptNumbersStartingWith(format.prefix(today))).thenReturn(List.of());

        String next = new PharmacyReceiptNumberAllocator(repository, format).next();

        assertEquals(format.format(today, 1), next);
    }
}
