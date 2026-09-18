package com.pos.sales.support;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.entity.CashRegister;
import org.springframework.util.StringUtils;

final class CashRegisterTerminalMetadata {

    private CashRegisterTerminalMetadata() {}

    static String normalizeDeviceId(String raw) {
        String value = normalizeText(raw);
        return StringUtils.hasText(value) ? value : null;
    }

    static String normalizeText(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return raw.trim();
    }

    static void apply(CashRegister register, RegisterTerminalRequest request, String deviceId) {
        if (StringUtils.hasText(deviceId)) {
            register.setDeviceId(deviceId);
        }
        String model = normalizeText(request.equipmentModel());
        if (StringUtils.hasText(model)) {
            register.setEquipmentModel(model);
        }
        String serial = normalizeText(request.equipmentSerial());
        if (StringUtils.hasText(serial)) {
            register.setEquipmentSerial(serial);
        }
        String fiscal = normalizeText(request.fiscalCardId());
        if (StringUtils.hasText(fiscal)) {
            register.setFiscalCardId(fiscal);
        }
        String workstation = normalizeText(request.workstationName());
        if (StringUtils.hasText(workstation)) {
            register.setWorkstationName(workstation);
        }
    }
}
