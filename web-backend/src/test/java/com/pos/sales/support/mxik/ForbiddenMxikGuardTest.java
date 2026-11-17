package com.pos.sales.support.mxik;

import com.pos.catalog.entity.Product;
import com.pos.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ForbiddenMxikGuardTest {

    private final ForbiddenMxikGuard guard = new ForbiddenMxikGuard();

    @Test
    void blocksEachForbiddenCode() {
        for (String code : ForbiddenMxikCodes.all()) {
            Product p = product("Item " + code, code);
            BadRequestException ex = assertThrows(BadRequestException.class, () -> guard.assertProductAllowed(p));
            assertEquals(ForbiddenMxikCodes.REASON_CODE, ex.context().get("reasonCode"));
            assertEquals(code, ex.context().get("mxik"));
            assertTrue(ex.getMessage().contains(code));
        }
    }

    @Test
    void allowsNormalIkpu() {
        Product p = product("Tea", "03004409005039001");
        assertDoesNotThrow(() -> guard.assertProductsAllowed(List.of(p)));
    }

    @Test
    void normalizesSpacesAndPrefixes() {
        Product p = product("Bad", " 06302001004033010 ");
        assertThrows(BadRequestException.class, () -> guard.assertProductAllowed(p));
    }

    private static Product product(String name, String ikpu) {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setName(name);
        p.setIkpu(ikpu);
        return p;
    }
}
