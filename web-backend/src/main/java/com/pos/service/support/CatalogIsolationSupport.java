package com.pos.service.support;

import com.pos.catalog.entity.Product;
import com.pos.domain.businessconfig.BusinessTypeCodes;
import com.pos.entity.Store;
import com.pos.exception.PosExceptions;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Граница каталогов grocery / pharmacy. Аптека не читается и не пишется через grocery API.
 */
@Component
public class CatalogIsolationSupport {

    public boolean isPharmacyCode(String code) {
        return StringUtils.hasText(code)
            && BusinessTypeCodes.PHARMACY.equals(BusinessTypeCodes.normalize(code));
    }

    public boolean isPharmacyProduct(Product product) {
        if (product == null || product.getBusinessType() == null) {
            return false;
        }
        return isPharmacyCode(product.getBusinessType().getCode());
    }

    public boolean isPharmacyStore(Store store) {
        return store != null && isPharmacyCode(store.getBusinessType());
    }

    public void hidePharmacyFromGrocery(Product product) {
        if (isPharmacyProduct(product)) {
            throw PosExceptions.notFound("Product", product.getId());
        }
    }

    public void rejectPharmacyCodeOnGroceryWrite(String businessTypeCode) {
        if (isPharmacyCode(businessTypeCode)) {
            throw PosExceptions.badRequest("Pharmacy products must be managed via pharmacy-service (/api/v1/pharmacy/**)");
        }
    }

    public void rejectPharmacyStoreOnGrocery(Store store) {
        if (isPharmacyStore(store)) {
            throw PosExceptions.badRequest("Pharmacy store requires pharmacy-service (/api/v1/pharmacy/**)");
        }
    }

    public void rejectPharmacySalesInMonolith(Store store) {
        if (isPharmacyStore(store)) {
            throw PosExceptions.badRequest("Аптека: оформление продаж через /api/v1/pharmacy/sales");
        }
    }

    /** Void / partial return for pharmacy receipts must go through pharmacy-service. */
    public void rejectPharmacySaleMutationInMonolith(Store store) {
        if (isPharmacyStore(store)) {
            throw PosExceptions.badRequest("Аптека: возврат/отмена через /api/v1/pharmacy/sales");
        }
    }

    public void rejectPharmacyFromGroceryWrite(Product product) {
        if (isPharmacyProduct(product)) {
            throw PosExceptions.badRequest("Pharmacy products must be managed via pharmacy-service (/api/v1/pharmacy/**)");
        }
    }

    public void assertSaleCatalogMatchesStore(Store store, Product product) {
        if (isPharmacyStore(store)) {
            throw PosExceptions.badRequest("Аптека: оформление продаж через /api/v1/pharmacy/sales");
        }
        if (isPharmacyProduct(product)) {
            throw PosExceptions.badRequest("Grocery checkout cannot sell pharmacy products");
        }
    }
}
