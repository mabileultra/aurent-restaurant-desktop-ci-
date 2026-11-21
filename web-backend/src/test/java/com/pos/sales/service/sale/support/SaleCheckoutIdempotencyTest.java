package com.pos.sales.service.sale.support;

import com.pos.sales.dto.sale.SaleResponse;
import com.pos.sales.entity.Sale;
import com.pos.sales.mapper.SaleMapper;
import com.pos.sales.repository.SaleRepository;
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
class SaleCheckoutIdempotencyTest {

    @Mock
    private SaleRepository saleRepository;
    @Mock
    private SaleMapper saleMapper;
    @InjectMocks
    private SaleCheckoutIdempotency idempotency;

    @Test
    void findExisting_nullId_emptyWithoutLookup() {
        assertThat(idempotency.findExisting(null)).isEmpty();
        verifyNoInteractions(saleRepository, saleMapper);
    }

    @Test
    void findExisting_knownId_mapsSale() {
        UUID id = UUID.fromString("11111111-1111-1111-1111-111111111111");
        Sale sale = Sale.builder().clientSaleId(id).build();
        SaleResponse response = org.mockito.Mockito.mock(SaleResponse.class);
        when(saleRepository.findByClientSaleId(id)).thenReturn(Optional.of(sale));
        when(saleMapper.toResponse(sale)).thenReturn(response);

        assertThat(idempotency.findExisting(id)).contains(response);
    }
}
