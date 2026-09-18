package com.pos.sales.support;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.entity.CashRegister;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CashRegisterTerminalMetadataTest {

    @Test
    void normalizeDeviceIdTrimsAndRejectsBlank() {
        assertThat(CashRegisterTerminalMetadata.normalizeDeviceId("  abc  ")).isEqualTo("abc");
        assertThat(CashRegisterTerminalMetadata.normalizeDeviceId("   ")).isNull();
        assertThat(CashRegisterTerminalMetadata.normalizeDeviceId(null)).isNull();
    }

    @Test
    void normalizeTextTrimsAndRejectsBlank() {
        assertThat(CashRegisterTerminalMetadata.normalizeText("  SN  ")).isEqualTo("SN");
        assertThat(CashRegisterTerminalMetadata.normalizeText("")).isNull();
        assertThat(CashRegisterTerminalMetadata.normalizeText(null)).isNull();
    }

    @Test
    void applyWritesOnlyNonBlankFields() {
        CashRegister register = CashRegister.builder()
            .deviceId("old-device")
            .equipmentModel("old-model")
            .equipmentSerial("old-sn")
            .fiscalCardId("old-fiscal")
            .workstationName("old-pc")
            .build();

        CashRegisterTerminalMetadata.apply(
            register,
            new RegisterTerminalRequest("  new-device  ", "  SN-2  ", "  M-2  ", "  F-2  ", "  Desk  "),
            "new-device"
        );

        assertThat(register.getDeviceId()).isEqualTo("new-device");
        assertThat(register.getEquipmentSerial()).isEqualTo("SN-2");
        assertThat(register.getEquipmentModel()).isEqualTo("M-2");
        assertThat(register.getFiscalCardId()).isEqualTo("F-2");
        assertThat(register.getWorkstationName()).isEqualTo("Desk");
    }

    @Test
    void applyKeepsPreviousValuesWhenIncomingBlank() {
        CashRegister register = CashRegister.builder()
            .deviceId("keep-device")
            .equipmentModel("keep-model")
            .equipmentSerial("keep-sn")
            .fiscalCardId("keep-fiscal")
            .workstationName("keep-pc")
            .build();

        CashRegisterTerminalMetadata.apply(
            register,
            new RegisterTerminalRequest(null, "  ", "", null, "   "),
            "  "
        );

        assertThat(register.getDeviceId()).isEqualTo("keep-device");
        assertThat(register.getEquipmentModel()).isEqualTo("keep-model");
        assertThat(register.getEquipmentSerial()).isEqualTo("keep-sn");
        assertThat(register.getFiscalCardId()).isEqualTo("keep-fiscal");
        assertThat(register.getWorkstationName()).isEqualTo("keep-pc");
    }
}
