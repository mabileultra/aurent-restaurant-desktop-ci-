package com.pos.inventory.service.stock.support;

import com.pos.entity.Store;
import com.pos.exception.PosExceptions;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StockTransferStoreGuard {

    private final StoreRepository storeRepository;
    private final TenantAccessSupport tenantAccess;

    public StorePair requireSameCompanyPair(Integer fromStoreId, Integer toStoreId) {
        if (fromStoreId.equals(toStoreId)) {
            throw PosExceptions.badRequest("From and to store must differ");
        }
        Store fromStore = storeRepository.findById(fromStoreId)
            .orElseThrow(() -> PosExceptions.notFound("From store"));
        Store toStore = storeRepository.findById(toStoreId)
            .orElseThrow(() -> PosExceptions.notFound("To store"));
        tenantAccess.assertCanAccessStore(fromStore);
        tenantAccess.assertCanAccessStore(toStore);
        if (fromStore.getCompany() == null
            || toStore.getCompany() == null
            || !fromStore.getCompany().getId().equals(toStore.getCompany().getId())) {
            throw PosExceptions.badRequest("Transfer is allowed only between stores of the same company");
        }
        return new StorePair(fromStore, toStore);
    }

    public record StorePair(Store fromStore, Store toStore) {}
}
