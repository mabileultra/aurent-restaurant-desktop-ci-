package com.pos.pharmacy.marks.service.impl;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.marks.dto.StockMarkCheckResponse;
import com.pos.pharmacy.marks.dto.StockMarkRegisterItem;
import com.pos.pharmacy.marks.dto.StockMarkRegisterRequest;
import com.pos.pharmacy.marks.dto.StockMarkRegisterResponse;
import com.pos.pharmacy.marks.entity.StockMark;
import com.pos.pharmacy.marks.entity.StockMarkStatus;
import com.pos.pharmacy.marks.repository.StockMarkRepository;
import com.pos.pharmacy.marks.support.StockMarkKeys;
import com.pos.pharmacy.security.PharmacyTenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacyStockMarkServiceImplTest {

    private static final String MARK = "010478001234567821SERIAL91CRYPT";

    @Mock
    private StockMarkRepository stockMarkRepository;

    private PharmacyStockMarkServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PharmacyStockMarkServiceImpl(
            new StockMarkQueryServiceImpl(stockMarkRepository),
            new StockMarkRegisterServiceImpl(stockMarkRepository),
            new StockMarkWithdrawStateServiceImpl(stockMarkRepository),
            new StockMarkReturnServiceImpl(stockMarkRepository)
        );
        PharmacyTenantContext.set(10, UUID.randomUUID(), "ADMIN");
    }

    @AfterEach
    void tearDown() {
        PharmacyTenantContext.clear();
    }

    @Test
    void findInStockReturnsProductWhenPresent() {
        UUID productId = UUID.randomUUID();
        UUID markId = UUID.randomUUID();
        StockMark row = StockMark.builder()
            .id(markId)
            .companyId(10)
            .storeId(5)
            .productId(productId)
            .markCode(MARK)
            .markKey(StockMarkKeys.primaryKey(MARK))
            .status(StockMarkStatus.IN_STOCK)
            .build();
        when(stockMarkRepository.findByCompanyIdAndMarkKeyIn(eq(10), anyCollection()))
            .thenReturn(List.of(row));

        StockMarkCheckResponse response = service.findInStock(5, MARK);

        assertTrue(response.found());
        assertFalse(response.alreadySold());
        assertEquals(productId, response.productId());
        assertEquals(markId, response.markId());
    }

    @Test
    void findInStockIgnoresOtherStore() {
        StockMark row = StockMark.builder()
            .id(UUID.randomUUID())
            .companyId(10)
            .storeId(99)
            .productId(UUID.randomUUID())
            .markCode(MARK)
            .markKey(StockMarkKeys.primaryKey(MARK))
            .status(StockMarkStatus.IN_STOCK)
            .build();
        when(stockMarkRepository.findByCompanyIdAndMarkKeyIn(eq(10), anyCollection()))
            .thenReturn(List.of(row));

        assertFalse(service.findInStock(5, MARK).found());
    }

    @Test
    void findInStockReportsAlreadySold() {
        StockMark row = StockMark.builder()
            .id(UUID.randomUUID())
            .companyId(10)
            .storeId(5)
            .productId(UUID.randomUUID())
            .markCode(MARK)
            .markKey(StockMarkKeys.primaryKey(MARK))
            .status(StockMarkStatus.PENDING_WITHDRAW)
            .build();
        when(stockMarkRepository.findByCompanyIdAndMarkKeyIn(eq(10), anyCollection()))
            .thenReturn(List.of(row));

        StockMarkCheckResponse response = service.findInStock(5, MARK);
        assertFalse(response.found());
        assertTrue(response.alreadySold());
        assertEquals(StockMarkStatus.PENDING_WITHDRAW, response.status());
    }

    @Test
    void markPendingWithdrawUpdatesInStockRows() {
        UUID saleId = UUID.randomUUID();
        StockMark row = StockMark.builder()
            .id(UUID.randomUUID())
            .companyId(10)
            .storeId(5)
            .productId(UUID.randomUUID())
            .markCode(MARK)
            .markKey(StockMarkKeys.primaryKey(MARK))
            .status(StockMarkStatus.IN_STOCK)
            .build();
        when(stockMarkRepository.findByCompanyIdAndMarkKeyIn(eq(10), anyCollection()))
            .thenReturn(List.of(row));
        when(stockMarkRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        int updated = service.markPendingWithdraw(5, saleId, List.of(MARK));

        assertEquals(1, updated);
        assertEquals(StockMarkStatus.PENDING_WITHDRAW, row.getStatus());
        assertEquals(saleId, row.getSaleId());
        assertTrue(row.getSoldAt() != null);
    }

    @Test
    void registerCreatesRowsForAllIdentityKeys() {
        when(stockMarkRepository.findByCompanyIdAndMarkKeyIn(eq(10), anyCollection()))
            .thenReturn(List.of());
        when(stockMarkRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID productId = UUID.randomUUID();
        StockMarkRegisterResponse response = service.registerInStock(new StockMarkRegisterRequest(
            5,
            null,
            List.of(new StockMarkRegisterItem(productId, MARK, null, null, "INTRODUCED"))
        ));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<StockMark>> captor = ArgumentCaptor.forClass(List.class);
        verify(stockMarkRepository).saveAll(captor.capture());
        Set<String> expectedKeys = StockMarkKeys.allKeys(MARK);
        assertEquals(expectedKeys.size(), captor.getValue().size());
        assertEquals(expectedKeys.size(), response.registered());
        assertTrue(captor.getValue().stream().allMatch(m -> m.getStatus() == StockMarkStatus.IN_STOCK));
        assertTrue(captor.getValue().stream().allMatch(m -> productId.equals(m.getProductId())));
    }

    @Test
    void registerRejectsAlreadyInStock() {
        StockMark existing = StockMark.builder()
            .id(UUID.randomUUID())
            .companyId(10)
            .storeId(5)
            .productId(UUID.randomUUID())
            .markCode(MARK)
            .markKey(StockMarkKeys.primaryKey(MARK))
            .status(StockMarkStatus.IN_STOCK)
            .build();
        when(stockMarkRepository.findByCompanyIdAndMarkKeyIn(eq(10), anyCollection()))
            .thenReturn(List.of(existing));

        assertThrows(BusinessException.class, () -> service.registerInStock(new StockMarkRegisterRequest(
            5,
            null,
            List.of(new StockMarkRegisterItem(UUID.randomUUID(), MARK, null, null, null))
        )));
    }

    @Test
    void registerReopensReturnedMark() {
        String key = StockMarkKeys.primaryKey(MARK);
        StockMark returned = StockMark.builder()
            .id(UUID.randomUUID())
            .companyId(10)
            .storeId(5)
            .productId(UUID.randomUUID())
            .markCode(MARK)
            .markKey(key)
            .status(StockMarkStatus.RETURNED)
            .saleId(UUID.randomUUID())
            .build();
        when(stockMarkRepository.findByCompanyIdAndMarkKeyIn(eq(10), anyCollection()))
            .thenReturn(List.of(returned));
        when(stockMarkRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        UUID productId = UUID.randomUUID();
        service.registerInStock(new StockMarkRegisterRequest(
            5,
            null,
            List.of(new StockMarkRegisterItem(productId, MARK, null, null, "OK"))
        ));

        assertEquals(StockMarkStatus.IN_STOCK, returned.getStatus());
        assertEquals(productId, returned.getProductId());
        assertEquals(null, returned.getSaleId());
    }
}
