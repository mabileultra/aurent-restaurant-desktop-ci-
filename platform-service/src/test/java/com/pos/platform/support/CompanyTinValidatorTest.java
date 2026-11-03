package com.pos.platform.support;

import com.pos.platform.exception.BadRequestException;
import com.pos.platform.repository.CompanyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyTinValidatorTest {

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private CompanyTinValidator validator;

    @Test
    void blankBecomesNull() {
        assertNull(validator.normalizeAndValidateUnique("  ", null));
        assertNull(validator.normalizeAndValidateUnique(null, null));
    }

    @Test
    void rejectsNonNineDigits() {
        assertThrows(BadRequestException.class, () -> validator.normalizeAndValidateUnique("abc12", null));
        assertThrows(BadRequestException.class, () -> validator.normalizeAndValidateUnique("12345678", null));
    }

    @Test
    void rejectsDuplicate() {
        when(companyRepository.existsByTin("123456789")).thenReturn(true);
        assertThrows(BadRequestException.class, () -> validator.normalizeAndValidateUnique("123456789", null));
    }

    @Test
    void acceptsUniqueNineDigits() {
        when(companyRepository.existsByTin("123456789")).thenReturn(false);
        assertEquals("123456789", validator.normalizeAndValidateUnique("123456789", null));
    }
}
