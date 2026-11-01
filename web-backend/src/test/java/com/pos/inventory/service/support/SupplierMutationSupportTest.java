package com.pos.inventory.service.support;

import com.pos.exception.BadRequestException;
import com.pos.inventory.entity.Supplier;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SupplierMutationSupportTest {

    @Test
    void acceptsTwentyDigitAccount() {
        Supplier s = new Supplier();
        SupplierMutationSupport.applyFields(
            s,
            "Acme",
            "309718166",
            "2020 8000 1234 5678 9012",
            "+998 (90) 123-45-67"
        );
        assertEquals("20208000123456789012", s.getAccountNumber());
        assertEquals("+998 (90) 123-45-67", s.getPhone());
    }

    @Test
    void rejectsShortAccount() {
        assertThrows(
            BadRequestException.class,
            () -> SupplierMutationSupport.validateAccountNumber("12345")
        );
    }

    @Test
    void rejectsIncompletePhone() {
        assertThrows(
            BadRequestException.class,
            () -> SupplierMutationSupport.validatePhone("+998 (90) 123")
        );
    }
}
