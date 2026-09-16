package com.pos.integrations.restaurant.service.impl;

import com.pos.catalog.entity.Product;
import com.pos.catalog.repository.ProductRepository;
import com.pos.domain.StockMovementType;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.integrations.restaurant.dto.RestaurantStockConsumeRequest;
import com.pos.integrations.restaurant.service.RestaurantStockRestoreService;
import com.pos.inventory.entity.StockMovement;
import com.pos.inventory.repository.StockMovementRepository;
import com.pos.inventory.service.stock.StoreStockService;
import com.pos.inventory.service.stock.support.StockMovementPersistence;
import com.pos.repository.StoreRepository;
import com.pos.repository.UserRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RestaurantStockRestoreServiceImpl implements RestaurantStockRestoreService {

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final StoreStockService storeStockService;
    private final StockMovementPersistence stockMovementPersistence;

    @Override
    @Transactional
    public void restore(RestaurantStockConsumeRequest request) {
        if (stockMovementRepository.existsByReferenceIdAndMovementType(request.saleId(), StockMovementType.RETURN)) {
            LogUtil.info(RestaurantStockRestoreServiceImpl.class, "Restaurant stock already restored: saleId={}", request.saleId());
            return;
        }
        Store store = storeRepository.findById(request.storeId()).orElse(null);
        if (store == null || store.getCompany() == null || !store.getCompany().getId().equals(request.companyId())) {
            LogUtil.warn(RestaurantStockRestoreServiceImpl.class, "Restaurant stock restore skipped: store mismatch saleId={}", request.saleId());
            return;
        }
        User user = request.createdBy() == null ? null : userRepository.findById(request.createdBy()).orElse(null);
        String notes = "Возврат ресторана " + (request.receiptNumber() == null ? request.saleId() : request.receiptNumber());
        for (RestaurantStockConsumeRequest.Line line : request.lines()) {
            Product product = productRepository.findById(line.productId()).orElse(null);
            if (product == null) {
                continue;
            }
            if (product.getCompany() != null && !request.companyId().equals(product.getCompany().getId())) {
                continue;
            }
            storeStockService.increase(product, store, line.quantity());
            productRepository.save(product);
            stockMovementPersistence.save(StockMovement.builder()
                .product(product)
                .store(store)
                .movementType(StockMovementType.RETURN)
                .quantity(line.quantity())
                .referenceId(request.saleId())
                .createdBy(user)
                .notes(notes)
                .build(), request.receiptNumber());
        }
    }
}
