package com.pos.sales.service.sale.support;

import com.pos.sales.dto.sale.SaleResponse;
import com.pos.sales.mapper.SaleMapper;
import com.pos.sales.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Online checkout retry: same clientSaleId → same sale (no second stock/OFD side-effects).
 */
@Component
@RequiredArgsConstructor
public class SaleCheckoutIdempotency {

    private final SaleRepository saleRepository;
    private final SaleMapper saleMapper;

    public Optional<SaleResponse> findExisting(UUID clientSaleId) {
        if (clientSaleId == null) {
            return Optional.empty();
        }
        return saleRepository.findByClientSaleId(clientSaleId).map(saleMapper::toResponse);
    }
}
