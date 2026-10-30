package com.pos.sales.service.impl;

import com.pos.exception.ResourceNotFoundException;
import com.pos.sales.dto.cashregister.CashRegisterHeartbeatRequest;
import com.pos.sales.dto.cashregister.CashRegisterHeartbeatResponse;
import com.pos.sales.entity.CashRegister;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.sales.service.CashRegisterHeartbeatService;
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
public class CashRegisterHeartbeatServiceImpl implements CashRegisterHeartbeatService {

    private final CashRegisterRepository cashRegisterRepository;
    private final TenantAccessSupport tenantAccess;

    @Override
    public CashRegisterHeartbeatResponse heartbeat(Long id, CashRegisterHeartbeatRequest request) {
        CashRegister register = cashRegisterRepository.findDetailById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found"));
        tenantAccess.assertCanAccessStore(register.getStore());

        register.setLastSeenAt(Instant.now());
        if (request != null && StringUtils.hasText(request.workstationName())) {
            register.setWorkstationName(request.workstationName().trim());
        }
        if (request != null && StringUtils.hasText(request.appVersion())) {
            register.setAppVersion(request.appVersion().trim());
        }
        CashRegister saved = cashRegisterRepository.save(register);
        LogUtil.info(
            CashRegisterHeartbeatServiceImpl.class,
            "Cash register heartbeat: id={}, storeId={}",
            saved.getId(),
            saved.getStore().getId()
        );
        return new CashRegisterHeartbeatResponse(saved.getId(), saved.getLastSeenAt(), saved.getStatus());
    }
}
