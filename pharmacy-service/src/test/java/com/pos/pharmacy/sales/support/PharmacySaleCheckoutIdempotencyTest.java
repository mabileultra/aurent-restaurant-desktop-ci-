package com.pos.pharmacy.sales.support;

import com.pos.pharmacy.sales.dto.SaleResponse;
import com.pos.pharmacy.sales.entity.Sale;
import com.pos.pharmacy.sales.repository.SaleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PharmacySaleCheckoutIdempotencyTest {

    @Mock
    private SaleRepository saleRepository;
    @Mock
    private SaleMapper saleMapper;
    @InjectMocks
    private PharmacySaleCheckoutIdempotency idempotency;

    @Test
    void findExisting_nullId_emptyWithoutLookup() {
        assertThat(idempotency.findExisting(null)).isEmpty();
        verifyNoInteractions(saleRepository, saleMapper);
    }

    @Test
    void findExisting_knownId_mapsSale() {
        UUID id = UUID.fromString("22222222-2222-2222-2222-222222222222");
        Sale sale = Sale.builder().clientSaleId(id).build();
        SaleResponse response = org.mockito.Mockito.mock(SaleResponse.class);
        when(saleRepository.findByClientSaleId(id)).thenReturn(Optional.of(sale));
        when(saleMapper.toResponse(sale)).thenReturn(response);

        assertThat(idempotency.findExisting(id)).contains(response);
    }
}
