package com.pos.sales.support;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.integrations.fiscal.support.FiscalModuleBindingGuard;
import com.pos.integrations.fiscal.support.FiscalModuleField;
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
    private final FiscalModuleBindingGuard fiscalModuleGuard;

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
            assertFiscalCardAvailable(store, safe, byDevice.getId());
            return heartbeat(byDevice, storeId, safe, deviceId);
        }

        boolean releasedSameStoreInactive = byDevice != null
            && !CashRegisterTerminalLookup.isActive(byDevice)
            && isSameStore(byDevice, storeId);

        // Целевая касса определяется только чтением: при конфликте ФМ (409) ни одна сущность
        // не успевает измениться, а транзакция CashRegisterTerminalServiceImpl откатывается целиком.
        CashRegister bySerial = lookup.findActiveBySerial(storeId, serial).orElse(null);
        CashRegister unbound = bySerial == null ? lookup.findActiveUnbound(storeId).orElse(null) : null;
        CashRegister target = bySerial != null ? bySerial : unbound;
        assertFiscalCardAvailable(store, safe, target != null ? target.getId() : null);

        if (byDevice != null) {
            releaseBinding(byDevice, storeId, deviceId);
        }

        if (unbound != null) {
            LogUtil.info(
                CashRegisterTerminalResolver.class,
                "Terminal rebound to unbound register: registerId={}, storeId={}, deviceId={}",
                unbound.getId(),
                storeId,
                deviceId
            );
        }
        if (target != null) {
            return heartbeat(target, storeId, safe, deviceId);
        }

        if (releasedSameStoreInactive) {
            throwIfNoAttachTarget(storeId);
        }

        return createNew(store, storeId, safe, deviceId, serial);
    }

    /**
     * AUR-19: fiscalCardId терминала не должен быть закреплён за другой кассой.
     * {@code registerId = null} — будет создана новая касса.
     */
    private void assertFiscalCardAvailable(Store store, RegisterTerminalRequest request, Long registerId) {
        Integer companyId = store.getCompany() != null ? store.getCompany().getId() : null;
        fiscalModuleGuard.assertAvailable(
            FiscalModuleField.CASH_REGISTER_FISCAL_CARD_ID,
            request.fiscalCardId(),
            registerId,
            companyId
        );
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
