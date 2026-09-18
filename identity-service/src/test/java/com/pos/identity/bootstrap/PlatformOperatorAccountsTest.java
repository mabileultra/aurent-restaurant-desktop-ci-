package com.pos.identity.bootstrap;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PlatformOperatorAccountsTest {

    @Test
    void sharedLoginIsSinglePlatformAdmin() {
        assertEquals("platformadmin", PlatformOperatorAccounts.USERNAME);
        assertEquals("password", PlatformOperatorAccounts.PASSWORD);
        assertEquals("platformadmin@platform.local", PlatformOperatorAccounts.EMAIL);
    }
}
