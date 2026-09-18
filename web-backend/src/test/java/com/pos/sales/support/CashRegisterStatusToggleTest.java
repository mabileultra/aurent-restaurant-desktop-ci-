package com.pos.sales.support;

import com.pos.sales.entity.CashRegister;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CashRegisterStatusToggleTest {

    private final CashRegisterStatusToggle toggle = new CashRegisterStatusToggle();

    @Test
    void disablingActiveRegisterClearsDeviceId() {
        CashRegister register = CashRegister.builder()
            .status("ACTIVE")
            .deviceId("laptop-1")
            .build();

        String next = toggle.apply(register);

        assertThat(next).isEqualTo("INACTIVE");
        assertThat(register.getStatus()).isEqualTo("INACTIVE");
        assertThat(register.getDeviceId()).isNull();
    }

    @Test
    void disablingIsCaseInsensitiveAndReleasesDevice() {
        CashRegister register = CashRegister.builder()
            .status("active")
            .deviceId("laptop-1")
            .build();

        toggle.apply(register);

        assertThat(register.getStatus()).isEqualTo("INACTIVE");
        assertThat(register.getDeviceId()).isNull();
    }

    @Test
    void enablingInactiveRegisterKeepsExistingDeviceId() {
        CashRegister register = CashRegister.builder()
            .status("INACTIVE")
            .deviceId("legacy-device")
            .build();

        String next = toggle.apply(register);

        assertThat(next).isEqualTo("ACTIVE");
        assertThat(register.getStatus()).isEqualTo("ACTIVE");
        assertThat(register.getDeviceId()).isEqualTo("legacy-device");
    }

    @Test
    void enablingBlankStatusTurnsRegisterActive() {
        CashRegister register = CashRegister.builder()
            .status(null)
            .deviceId("x")
            .build();

        toggle.apply(register);

        assertThat(register.getStatus()).isEqualTo("ACTIVE");
        assertThat(register.getDeviceId()).isEqualTo("x");
    }
}
