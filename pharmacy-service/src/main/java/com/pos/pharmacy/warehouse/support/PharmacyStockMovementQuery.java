package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.common.TenantSupport;
import com.pos.pharmacy.warehouse.dto.PharmacyStockMovementResponse;
import com.pos.pharmacy.warehouse.entity.StockMovement;
import com.pos.pharmacy.warehouse.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Журнал движений по товару (этап 6). */
@Component
@RequiredArgsConstructor
public class PharmacyStockMovementQuery {

    private final TenantSupport tenant;
    private final StockMovementRepository stockMovementRepository;

    @Transactional(readOnly = true)
    public List<PharmacyStockMovementResponse> listForProduct(UUID productId, Integer storeId, int limit) {
        Integer companyId = tenant.requireCompanyId();
        int size = Math.max(1, Math.min(limit, 200));
        return stockMovementRepository
            .findByProduct(companyId, productId, storeId, PageRequest.of(0, size))
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private PharmacyStockMovementResponse toResponse(StockMovement m) {
        return new PharmacyStockMovementResponse(
            m.getId(),
            m.getStoreId(),
            m.getProductId(),
            m.getLotId(),
            m.getMovementType(),
            m.getQuantity(),
            m.getReferenceType(),
            m.getReferenceId(),
            m.getNotes(),
            m.getCreatedAt(),
            m.getCreatedBy()
        );
    }
}
