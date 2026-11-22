package com.pos.sales.service.cashier.support;

import com.pos.sales.entity.CashierShift;
import com.pos.sales.repository.CashierShiftRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OpenCashierShiftLookupTest {

    private static final UUID CASHIER = UUID.fromString("4ca13ab7-d336-41ed-9bb6-114e7db22746");
    private static final Integer STORE = 126;

    private CashierShiftRepository repository;
    private OpenCashierShiftLookup lookup;

    @BeforeEach
    void setUp() {
        repository = mock(CashierShiftRepository.class);
        lookup = new OpenCashierShiftLookup(repository);
    }

    @Test
    void findOpenAndCloseDuplicates_keepsOldestAndClosesExtras() {
        CashierShift older = openShift(Instant.parse("2026-11-20T05:05:17.526Z"));
        CashierShift newer = openShift(Instant.parse("2026-11-20T05:05:17.544Z"));
        when(repository.findAllByCashierIdAndStoreIdAndStatusOrderByOpenedAtAsc(
            eq(CASHIER), eq(STORE), eq(CashierShift.ShiftStatus.OPEN)
        )).thenReturn(List.of(older, newer));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Optional<CashierShift> result = lookup.findOpenAndCloseDuplicates(CASHIER, STORE);

        assertTrue(result.isPresent());
        assertEquals(older.getId(), result.get().getId());
        assertEquals(CashierShift.ShiftStatus.OPEN, older.getStatus());
        assertEquals(CashierShift.ShiftStatus.CLOSED, newer.getStatus());
        verify(repository).save(newer);
        verify(repository, never()).save(older);
    }

    @Test
    void findOpenAndCloseDuplicates_singleOpen_unchanged() {
        CashierShift only = openShift(Instant.parse("2026-11-20T05:05:17Z"));
        when(repository.findAllByCashierIdAndStoreIdAndStatusOrderByOpenedAtAsc(
            eq(CASHIER), eq(STORE), eq(CashierShift.ShiftStatus.OPEN)
        )).thenReturn(List.of(only));

        Optional<CashierShift> result = lookup.findOpenAndCloseDuplicates(CASHIER, STORE);

        assertTrue(result.isPresent());
        assertEquals(only.getId(), result.get().getId());
        verify(repository, never()).save(any());
    }

    private static CashierShift openShift(Instant openedAt) {
        return CashierShift.builder()
            .id(UUID.randomUUID())
            .status(CashierShift.ShiftStatus.OPEN)
            .openedAt(openedAt)
            .periodStartedAt(openedAt)
            .build();
    }
}
