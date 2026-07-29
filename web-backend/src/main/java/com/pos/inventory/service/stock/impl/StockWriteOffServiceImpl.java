package com.pos.inventory.service.stock.impl;

import com.pos.domain.StockMovementType;
import com.pos.domain.WriteOffReason;
import com.pos.inventory.dto.stock.CreateWriteOffRequest;
import com.pos.inventory.dto.stock.WriteOffRowResponse;
import com.pos.catalog.entity.Product;
import com.pos.inventory.entity.StockMovement;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.PosExceptions;
import com.pos.catalog.repository.ProductRepository;
import com.pos.security.CurrentUserProvider;
import com.pos.inventory.service.stock.StockWriteOffService;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.inventory.service.stock.support.StockDocumentSupport;
import com.pos.inventory.service.stock.support.StockMovementPersistence;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.QuantityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Transactional
public class StockWriteOffServiceImpl implements StockWriteOffService {

    private final ProductRepository productRepository;
    private final StockMovementPersistence stockMovementPersistence;
    private final StoreStockService storeStockService;
    private final CurrentUserProvider currentUserProvider;
    private final TenantAccessSupport tenantAccess;
    private final StockDocumentSupport stockDocument;

    @Override
    public WriteOffRowResponse create(CreateWriteOffRequest request) {
        BigDecimal qty = QuantityUtil.normalize(request.quantity());
        stockDocument.requirePositiveQuantity(qty);
        Product product = stockDocument.requireActiveProduct(request.productId());
        tenantAccess.assertProductBelongsToTenant(product);
        WriteOffReason reason;
        try {
            reason = WriteOffReason.parse(request.reason());
        } catch (IllegalArgumentException ex) {
            throw PosExceptions.badRequest(ex.getMessage());
        }
        Store store = storeStockService.resolveStoreForProduct(product, request.storeId());
        com.pos.util.QuantityValidator.validate(product, qty);
        storeStockService.requireAvailable(product, store, qty);
        User user = currentUserProvider.requireCurrentUser();

        storeStockService.decrease(product, store, qty);
        productRepository.save(product);

        String notes = request.notes() != null ? request.notes().trim() : null;
        StockMovement movement = StockMovement.builder()
            .product(product)
            .store(store)
            .movementType(StockMovementType.WRITE_OFF)
            .writeOffReason(reason.name())
            .quantity(qty.negate())
            .notes(notes)
            .createdBy(user)
            .build();
        StockMovement saved = stockMovementPersistence.save(movement);
        return toRow(saved, product);
    }

    private WriteOffRowResponse toRow(StockMovement m, Product product) {
        BigDecimal units = m.getQuantity().signum() < 0 ? m.getQuantity().negate() : m.getQuantity();
        BigDecimal loss = product.getCostPrice()
            .multiply(units)
            .setScale(2, RoundingMode.HALF_UP);
        String createdByName = m.getCreatedBy() != null ? m.getCreatedBy().getFullName() : null;
        String storeName = m.getStore() != null ? m.getStore().getName() : null;
        return new WriteOffRowResponse(
            m.getId(),
            m.getCreatedAt(),
            product.getId(),
            product.getName(),
            product.getSku(),
            units,
            m.getWriteOffReason() != null ? m.getWriteOffReason() : WriteOffReason.OTHER.name(),
            m.getNotes(),
            m.getStore() != null ? m.getStore().getId() : null,
            storeName,
            createdByName,
            loss
        );
    }
}
