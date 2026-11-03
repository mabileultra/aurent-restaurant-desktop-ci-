package com.pos.integrations.restaurant.service.impl;

import com.pos.domain.StockMovementType;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.integrations.restaurant.dto.RestaurantStockConsumeRequest;
import com.pos.integrations.restaurant.service.RestaurantStockConsumeService;
import com.pos.inventory.repository.StockMovementRepository;
import com.pos.inventory.service.stock.support.ProductStockAdjuster;
import com.pos.repository.StoreRepository;
import com.pos.repository.UserRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RestaurantStockConsumeServiceImpl implements RestaurantStockConsumeService {

    private final StockMovementRepository stockMovementRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final ProductStockAdjuster productStockAdjuster;

    @Override
    @Transactional
    public void consume(RestaurantStockConsumeRequest request) {
        if (stockMovementRepository.existsByReferenceId(request.saleId())) {
            LogUtil.info(RestaurantStockConsumeServiceImpl.class, "Restaurant stock already consumed: saleId={}", request.saleId());
            return;
        }
        Store store = storeRepository.findById(request.storeId()).orElse(null);
        if (store == null || store.getCompany() == null || !store.getCompany().getId().equals(request.companyId())) {
            LogUtil.warn(RestaurantStockConsumeServiceImpl.class, "Restaurant stock consume skipped: store mismatch saleId={}", request.saleId());
            return;
        }
        User user = request.createdBy() == null ? null : userRepository.findById(request.createdBy()).orElse(null);
        String notes = "Ресторан " + (request.receiptNumber() == null ? request.saleId() : request.receiptNumber());
        for (RestaurantStockConsumeRequest.Line line : request.lines()) {
            productStockAdjuster.applyForCompany(
                line.productId(),
                request.companyId(),
                store,
                line.quantity(),
                StockMovementType.SALE,
                line.quantity().negate(),
                request.saleId(),
                user,
                notes,
                request.receiptNumber()
            );
        }
    }
}
