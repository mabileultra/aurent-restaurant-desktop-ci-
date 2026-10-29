package com.pos.identity.util;

import com.pos.identity.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmailAddressRulesTest {

    @Test
    void acceptsOrdinaryAddress() {
        assertEquals("jgi@ghi.com", EmailAddressRules.require("  JGI@ghi.com "));
        assertTrue(EmailAddressRules.isValid("user.name+tag@example.co.uk"));
    }

    @Test
    void rejectsMissingDomainAndBlank() {
        assertFalse(EmailAddressRules.isValid("not-an-email"));
        assertFalse(EmailAddressRules.isValid("user@localhost"));
        assertFalse(EmailAddressRules.isValid("a@b.c"));
        assertFalse(EmailAddressRules.isValid("a..b@example.com"));
        assertFalse(EmailAddressRules.isValid(""));
        assertFalse(EmailAddressRules.isValid(null));
        assertThrows(BadRequestException.class, () -> EmailAddressRules.require("jgi@ghi"));
    }
}
