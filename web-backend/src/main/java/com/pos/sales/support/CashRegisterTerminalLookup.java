package com.pos.sales.support;

import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CashRegisterTerminalLookup {

    static final String STATUS_ACTIVE = "ACTIVE";

    private final CashRegisterRepository cashRegisterRepository;

    public Optional<CashRegister> findByDeviceId(String deviceId) {
        if (!StringUtils.hasText(deviceId)) {
            return Optional.empty();
        }
        return cashRegisterRepository.findByDeviceId(deviceId);
    }

    public Optional<CashRegister> findActiveBySerial(Integer storeId, String serial) {
        if (!StringUtils.hasText(serial)) {
            return Optional.empty();
        }
        return cashRegisterRepository.findByStore_IdAndEquipmentSerialIgnoreCaseAndStatusIgnoreCase(
            storeId,
            serial,
            STATUS_ACTIVE
        );
    }

    public Optional<CashRegister> findActiveUnbound(Integer storeId) {
        List<CashRegister> unbound = cashRegisterRepository.findUnboundByStoreAndStatus(storeId, STATUS_ACTIVE);
        if (unbound.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(unbound.get(0));
    }

    public long countActive(Integer storeId) {
        return cashRegisterRepository.countByStore_IdAndStatusIgnoreCase(storeId, STATUS_ACTIVE);
    }

    public static boolean isActive(CashRegister register) {
        return register != null && STATUS_ACTIVE.equalsIgnoreCase(register.getStatus());
    }
}
