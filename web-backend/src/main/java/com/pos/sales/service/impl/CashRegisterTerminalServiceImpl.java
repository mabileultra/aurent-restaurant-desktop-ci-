package com.pos.sales.service.impl;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.dto.cashregister.RegisterTerminalResponse;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.sales.service.CashRegisterTerminalService;
import com.pos.security.CurrentUserProvider;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Transactional
public class CashRegisterTerminalServiceImpl implements CashRegisterTerminalService {

    private static final String STATUS_ACTIVE = "ACTIVE";

    private final CashRegisterRepository cashRegisterRepository;
    private final CashierSaleSupport cashierSaleSupport;
    private final CurrentUserProvider currentUserProvider;
    private final TenantAccessSupport tenantAccess;

    @Override
    public RegisterTerminalResponse registerForStore(Integer storeId, RegisterTerminalRequest request) {
        ResolveResult result = resolveOrCreate(storeId, request);
        CashRegister register = result.register();
        return new RegisterTerminalResponse(
            register.getId(),
            register.getRegisterNumber(),
            register.getEquipmentSerial(),
            register.getDeviceId(),
            result.created()
        );
    }

    @Override
    public CashRegister resolveActiveRegister(Integer storeId, RegisterTerminalRequest request) {
        return resolveOrCreate(storeId, request).register();
    }

    private ResolveResult resolveOrCreate(Integer storeId, RegisterTerminalRequest request) {
        RegisterTerminalRequest safe = request != null ? request : new RegisterTerminalRequest(null, null, null, null, null);
        User actor = currentUserProvider.requireCurrentUser();
        Store store = cashierSaleSupport.requireStoreForSale(actor, storeId);
        tenantAccess.assertCanAccessStore(store);

        String deviceId = normalizeDeviceId(safe.deviceId());
        String serial = normalizeText(safe.equipmentSerial());

        if (!StringUtils.hasText(deviceId) && !StringUtils.hasText(serial)) {
            throw new BadRequestException("Укажите deviceId или серийный номер терминала");
        }

        CashRegister existing = findExisting(storeId, deviceId, serial);
        if (existing != null) {
            assertSameStore(existing, storeId);
            assertActive(existing);
            applyTerminalMetadata(existing, safe, deviceId);
            existing.setLastSeenAt(Instant.now());
            CashRegister saved = cashRegisterRepository.save(existing);
            LogUtil.info(
                CashRegisterTerminalServiceImpl.class,
                "Terminal heartbeat: registerId={}, storeId={}, deviceId={}",
                saved.getId(),
                storeId,
                saved.getDeviceId()
            );
            return new ResolveResult(saved, false);
        }

        int nextNumber = cashRegisterRepository.findMaxRegisterNumberByStoreId(storeId) + 1;
        CashRegister created = CashRegister.builder()
            .store(store)
            .registerNumber(nextNumber)
            .equipmentModel(normalizeText(safe.equipmentModel()))
            .equipmentSerial(serial)
            .fiscalCardId(normalizeText(safe.fiscalCardId()))
            .deviceId(deviceId)
            .workstationName(normalizeText(safe.workstationName()))
            .lastSeenAt(Instant.now())
            .status(STATUS_ACTIVE)
            .build();
        CashRegister saved = cashRegisterRepository.save(created);
        LogUtil.info(
            CashRegisterTerminalServiceImpl.class,
            "Auto-registered cash register: id={}, storeId={}, number={}, deviceId={}",
            saved.getId(),
            storeId,
            saved.getRegisterNumber(),
            saved.getDeviceId()
        );
        return new ResolveResult(saved, true);
    }

    private CashRegister findExisting(Integer storeId, String deviceId, String serial) {
        if (StringUtils.hasText(deviceId)) {
            var byDevice = cashRegisterRepository.findByDeviceId(deviceId);
            if (byDevice.isPresent()) {
                return byDevice.get();
            }
        }
        if (StringUtils.hasText(serial)) {
            return cashRegisterRepository.findByStore_IdAndEquipmentSerialIgnoreCase(storeId, serial).orElse(null);
        }
        return null;
    }

    private static void assertSameStore(CashRegister register, Integer storeId) {
        if (register.getStore() == null || !register.getStore().getId().equals(storeId)) {
            throw new BadRequestException("Эта касса зарегистрирована в другом магазине");
        }
    }

    private static void assertActive(CashRegister register) {
        if (!STATUS_ACTIVE.equalsIgnoreCase(register.getStatus())) {
            throw new BadRequestException("Касса отключена администратором");
        }
    }

    private static void applyTerminalMetadata(
        CashRegister register,
        RegisterTerminalRequest request,
        String deviceId
    ) {
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

    private static String normalizeDeviceId(String raw) {
        String value = normalizeText(raw);
        return StringUtils.hasText(value) ? value : null;
    }

    private static String normalizeText(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return raw.trim();
    }

    private record ResolveResult(CashRegister register, boolean created) {}
}
