package com.pos.sales.support;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class CashRegisterTerminalResolver {

    private final CashRegisterRepository cashRegisterRepository;
    private final CashRegisterTerminalLookup lookup;

    public TerminalResolveResult resolve(Store store, RegisterTerminalRequest request) {
        RegisterTerminalRequest safe = request != null
            ? request
            : new RegisterTerminalRequest(null, null, null, null, null);
        Integer storeId = store.getId();
        String deviceId = CashRegisterTerminalMetadata.normalizeDeviceId(safe.deviceId());
        String serial = CashRegisterTerminalMetadata.normalizeText(safe.equipmentSerial());

        if (!StringUtils.hasText(deviceId) && !StringUtils.hasText(serial)) {
            throw new BadRequestException("Укажите deviceId или серийный номер терминала");
        }

        CashRegister byDevice = lookup.findByDeviceId(deviceId).orElse(null);
        if (byDevice != null && CashRegisterTerminalLookup.isActive(byDevice) && isSameStore(byDevice, storeId)) {
            return heartbeat(byDevice, storeId, safe, deviceId);
        }

        boolean releasedSameStoreInactive = false;
        if (byDevice != null) {
            releasedSameStoreInactive =
                !CashRegisterTerminalLookup.isActive(byDevice) && isSameStore(byDevice, storeId);
            releaseBinding(byDevice, storeId, deviceId);
        }

        CashRegister bySerial = lookup.findActiveBySerial(storeId, serial).orElse(null);
        if (bySerial != null) {
            return heartbeat(bySerial, storeId, safe, deviceId);
        }

        CashRegister unbound = lookup.findActiveUnbound(storeId).orElse(null);
        if (unbound != null) {
            LogUtil.info(
                CashRegisterTerminalResolver.class,
                "Terminal rebound to unbound register: registerId={}, storeId={}, deviceId={}",
                unbound.getId(),
                storeId,
                deviceId
            );
            return heartbeat(unbound, storeId, safe, deviceId);
        }

        if (releasedSameStoreInactive) {
            throwIfNoAttachTarget(storeId);
        }

        return createNew(store, storeId, safe, deviceId, serial);
    }

    private void releaseBinding(CashRegister byDevice, Integer toStoreId, String deviceId) {
        Integer fromStoreId = byDevice.getStore() != null ? byDevice.getStore().getId() : null;
        byDevice.setDeviceId(null);
        cashRegisterRepository.saveAndFlush(byDevice);
        LogUtil.info(
            CashRegisterTerminalResolver.class,
            "Released deviceId from register: registerId={}, fromStoreId={}, toStoreId={}, deviceId={}",
            byDevice.getId(),
            fromStoreId,
            toStoreId,
            deviceId
        );
    }

    private TerminalResolveResult heartbeat(
        CashRegister register,
        Integer storeId,
        RegisterTerminalRequest request,
        String deviceId
    ) {
        CashRegisterTerminalMetadata.apply(register, request, deviceId);
        register.setLastSeenAt(Instant.now());
        CashRegister saved = cashRegisterRepository.save(register);
        LogUtil.info(
            CashRegisterTerminalResolver.class,
            "Terminal heartbeat: registerId={}, storeId={}, deviceId={}",
            saved.getId(),
            storeId,
            saved.getDeviceId()
        );
        return new TerminalResolveResult(saved, false);
    }

    private TerminalResolveResult createNew(
        Store store,
        Integer storeId,
        RegisterTerminalRequest request,
        String deviceId,
        String serial
    ) {
        int nextNumber = cashRegisterRepository.findMaxRegisterNumberByStoreId(storeId) + 1;
        CashRegister created = CashRegister.builder()
            .store(store)
            .registerNumber(nextNumber)
            .equipmentModel(CashRegisterTerminalMetadata.normalizeText(request.equipmentModel()))
            .equipmentSerial(serial)
            .fiscalCardId(CashRegisterTerminalMetadata.normalizeText(request.fiscalCardId()))
            .deviceId(deviceId)
            .workstationName(CashRegisterTerminalMetadata.normalizeText(request.workstationName()))
            .lastSeenAt(Instant.now())
            .status(CashRegisterTerminalLookup.STATUS_ACTIVE)
            .build();
        CashRegister saved = cashRegisterRepository.save(created);
        LogUtil.info(
            CashRegisterTerminalResolver.class,
            "Auto-registered cash register: id={}, storeId={}, number={}, deviceId={}",
            saved.getId(),
            storeId,
            saved.getRegisterNumber(),
            saved.getDeviceId()
        );
        return new TerminalResolveResult(saved, true);
    }

    private void throwIfNoAttachTarget(Integer storeId) {
        if (lookup.countActive(storeId) == 0) {
            throw new BadRequestException("Касса отключена администратором");
        }
        throw new BadRequestException(
            "Активная касса уже зарегистрирована на другом устройстве. "
                + "Выключите ту кассу в списке или очистите ID устройства"
        );
    }

    private static boolean isSameStore(CashRegister register, Integer storeId) {
        return register.getStore() != null && storeId.equals(register.getStore().getId());
    }
}
