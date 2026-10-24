package com.pos.integrations.marking.service.impl;

import com.pos.entity.Company;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.integrations.marking.dto.MarkSoldCheckResponse;
import com.pos.integrations.marking.entity.SaleSoldMark;
import com.pos.integrations.marking.repository.SaleSoldMarkRepository;
import com.pos.integrations.marking.support.MarkingIdentityKeys;
import com.pos.sales.entity.Sale;
import com.pos.sales.entity.SaleItem;
import com.pos.sales.repository.SaleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarkingSoldJournalServiceImplTest {

    private static final String KM = "0104780083110808217Ф*7щгЮ93Вкф7";
    private static final String KI = "0104780083110808217Ф*7щгЮ";

    @Mock
    private SaleSoldMarkRepository soldMarkRepository;
    @Mock
    private SaleRepository saleRepository;
    @InjectMocks
    private MarkingSoldJournalServiceImpl service;

    @Test
    void registerThenSamePackWithOtherTailIsSold() {
        Sale sale = saleWithOneItem();
        service.registerSaleMarks(sale, List.of(List.of(KM)));

        ArgumentCaptor<List<SaleSoldMark>> captor = ArgumentCaptor.forClass(List.class);
        verify(soldMarkRepository).saveAll(captor.capture());
        Set<String> stored = captor.getValue().stream().map(SaleSoldMark::getMarkKey).collect(java.util.stream.Collectors.toSet());
        assertTrue(stored.containsAll(MarkingIdentityKeys.keysOf(KM)));

        when(soldMarkRepository.findByCompanyIdAndMarkKeyIn(eq(3), any()))
            .thenReturn(List.of(SaleSoldMark.builder()
                .saleId(sale.getId())
                .markKey("id:" + KI.toLowerCase())
                .build()));
        when(saleRepository.findById(sale.getId())).thenReturn(Optional.of(sale));

        MarkSoldCheckResponse hit = service.checkSold(3, KI);
        assertTrue(hit.sold());
        assertEquals("SOLD", hit.status());
        assertEquals("R-1", hit.receiptNumber());
    }

    @Test
    void assertNotSoldBlocksSecondCheckout() {
        when(soldMarkRepository.existsByCompanyIdAndMarkKeyIn(eq(3), any())).thenReturn(true);
        assertThrows(BadRequestException.class, () -> service.assertNotSold(3, List.of(KM)));
    }

    @Test
    void unknownCodeIsNotSold() {
        when(soldMarkRepository.findByCompanyIdAndMarkKeyIn(eq(3), any())).thenReturn(List.of());
        MarkSoldCheckResponse miss = service.checkSold(3, KM);
        assertFalse(miss.sold());
    }

    private static Sale saleWithOneItem() {
        Company company = new Company();
        company.setId(3);
        Store store = new Store();
        store.setId(7);
        store.setCompany(company);
        SaleItem item = SaleItem.builder().id(UUID.randomUUID()).build();
        Sale sale = Sale.builder()
            .id(UUID.randomUUID())
            .receiptNumber("R-1")
            .company(company)
            .store(store)
            .items(List.of(item))
            .build();
        item.setSale(sale);
        return sale;
    }
}
