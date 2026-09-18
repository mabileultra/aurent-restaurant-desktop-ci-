package com.pos.sales.support;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Store;

final class CashRegisterTerminalFixtures {

    private CashRegisterTerminalFixtures() {}

    static Store store(int id) {
        return Store.builder().id(id).name("Shop-" + id).build();
    }

    static CashRegister register(Store store, Long id, int number, String status, String deviceId) {
        return CashRegister.builder()
            .id(id)
            .store(store)
            .registerNumber(number)
            .deviceId(deviceId)
            .status(status)
            .equipmentModel("old-model")
            .equipmentSerial("old-sn")
            .fiscalCardId("old-fiscal")
            .workstationName("old-pc")
            .build();
    }

    static RegisterTerminalRequest device(String deviceId) {
        return new RegisterTerminalRequest(deviceId, null, null, null, null);
    }

    static RegisterTerminalRequest serial(String serial) {
        return new RegisterTerminalRequest(null, serial, null, null, null);
    }

    static RegisterTerminalRequest full(
        String deviceId,
        String serial,
        String model,
        String fiscal,
        String workstation
    ) {
        return new RegisterTerminalRequest(deviceId, serial, model, fiscal, workstation);
    }
}
