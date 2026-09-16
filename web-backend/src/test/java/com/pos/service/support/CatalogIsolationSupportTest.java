package com.pos.service.support;

import com.pos.catalog.entity.Product;
import com.pos.domain.businessconfig.BusinessTypeCodes;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CatalogIsolationSupportTest {

    private final CatalogIsolationSupport isolation = new CatalogIsolationSupport();

    @Test
    void groceryProductIsNotPharmacy() {
        Product grocery = Product.builder().id(UUID.randomUUID()).build();
        assertFalse(isolation.isPharmacyProduct(grocery));
        isolation.hidePharmacyFromGrocery(grocery);
        isolation.rejectPharmacyFromGroceryWrite(grocery);
    }

    @Test
    void pharmacyProductHiddenFromGrocery() {
        Product pharmacy = pharmacyProduct();
        assertTrue(isolation.isPharmacyProduct(pharmacy));
        assertThrows(ResourceNotFoundException.class, () -> isolation.hidePharmacyFromGrocery(pharmacy));
        assertThrows(BadRequestException.class, () -> isolation.rejectPharmacyFromGroceryWrite(pharmacy));
    }

    @Test
    void pharmacyCodeRejectedOnGroceryWrite() {
        assertThrows(
            BadRequestException.class,
            () -> isolation.rejectPharmacyCodeOnGroceryWrite(BusinessTypeCodes.PHARMACY)
        );
        isolation.rejectPharmacyCodeOnGroceryWrite("UNIVERSAL");
        isolation.rejectPharmacyCodeOnGroceryWrite(null);
    }

    @Test
    void checkoutRejectsPharmacyInMonolith() {
        Store pharmacyStore = Store.builder().businessType(BusinessTypeCodes.PHARMACY).build();
        Store groceryStore = Store.builder().businessType("UNIVERSAL").build();
        Product pharmacy = pharmacyProduct();
        Product grocery = Product.builder().id(UUID.randomUUID()).build();

        isolation.assertSaleCatalogMatchesStore(groceryStore, grocery);
        assertThrows(BadRequestException.class, () -> isolation.assertSaleCatalogMatchesStore(pharmacyStore, grocery));
        assertThrows(BadRequestException.class, () -> isolation.assertSaleCatalogMatchesStore(pharmacyStore, pharmacy));
        assertThrows(BadRequestException.class, () -> isolation.assertSaleCatalogMatchesStore(groceryStore, pharmacy));
    assertThrows(BadRequestException.class, () -> isolation.rejectPharmacySalesInMonolith(pharmacyStore));
        assertThrows(BadRequestException.class, () -> isolation.rejectPharmacySaleMutationInMonolith(pharmacyStore));
        isolation.rejectPharmacySaleMutationInMonolith(groceryStore);
    }

    @Test
    void pharmacyStoreRejectedOnGrocery() {
        Store pharmacy = Store.builder().businessType("pharmacy").build();
        assertThrows(BadRequestException.class, () -> isolation.rejectPharmacyStoreOnGrocery(pharmacy));
    }

    private static Product pharmacyProduct() {
        return Product.builder()
            .id(UUID.randomUUID())
            .businessType(BusinessTypeDefinition.builder().code(BusinessTypeCodes.PHARMACY).build())
            .build();
    }
}
