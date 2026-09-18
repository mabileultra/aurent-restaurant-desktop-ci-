package com.pos.sales.service.impl;

import com.pos.sales.dto.cashregister.RegisterTerminalRequest;
import com.pos.sales.dto.cashregister.RegisterTerminalResponse;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.entity.User;
import com.pos.sales.service.CashRegisterTerminalService;
import com.pos.sales.support.CashRegisterTerminalResolver;
import com.pos.sales.support.TerminalResolveResult;
import com.pos.security.CurrentUserProvider;
import com.pos.service.support.CashierSaleSupport;
import com.pos.service.support.TenantAccessSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CashRegisterTerminalServiceImpl implements CashRegisterTerminalService {

    private final CashierSaleSupport cashierSaleSupport;
    private final CurrentUserProvider currentUserProvider;
    private final TenantAccessSupport tenantAccess;
    private final CashRegisterTerminalResolver cashRegisterTerminalResolver;

    @Override
    public RegisterTerminalResponse registerForStore(Integer storeId, RegisterTerminalRequest request) {
        TerminalResolveResult result = resolveForStore(storeId, request);
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
        return resolveForStore(storeId, request).register();
    }

    private TerminalResolveResult resolveForStore(Integer storeId, RegisterTerminalRequest request) {
        User actor = currentUserProvider.requireCurrentUser();
        Store store = cashierSaleSupport.requireStoreForSale(actor, storeId);
        tenantAccess.assertCanAccessStore(store);
        return cashRegisterTerminalResolver.resolve(store, request);
    }
}
