package com.pos.sales.service.impl;

import com.pos.sales.dto.cashregister.CashRegisterDetailResponse;
import com.pos.sales.dto.cashregister.CashRegisterRowResponse;
import com.pos.sales.dto.cashregister.UpsertCashRegisterRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.sales.entity.CashRegister;
import com.pos.entity.Store;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.sales.mapper.CashRegisterMapper;
import com.pos.sales.repository.CashRegisterRepository;
import com.pos.sales.repository.spec.CashRegisterSpecifications;
import com.pos.sales.service.CashRegisterService;
import com.pos.sales.support.CashRegisterStatusToggle;
import com.pos.repository.StoreRepository;
import com.pos.service.support.TenantAccessSupport;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CashRegisterServiceImpl implements CashRegisterService {

    private static final String STATUS_ACTIVE = CashRegisterStatusToggle.STATUS_ACTIVE;

    private final CashRegisterRepository cashRegisterRepository;
    private final StoreRepository storeRepository;
    private final CashRegisterMapper cashRegisterMapper;
    private final TenantAccessSupport tenantAccess;
    private final CashRegisterStatusToggle cashRegisterStatusToggle;

    @Override
    public PageResponse<CashRegisterRowResponse> list(
        Integer storeId,
        String storeSearch,
        String equipmentModel,
        String equipmentSerial,
        String fiscalCardId,
        Pageable pageable
    ) {
        Integer companyId = tenantAccess.requireEffectiveCompanyId();
        if (storeId != null) {
            requireAccessibleStore(storeId);
        }
        var spec = CashRegisterSpecifications.filter(
            companyId, storeId, storeSearch, equipmentModel, equipmentSerial, fiscalCardId
        );
        Pageable sorted = pageable.getSort().isSorted()
            ? pageable
            : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Order.asc("store.name"), Sort.Order.asc("registerNumber")));
        Page<CashRegister> page = cashRegisterRepository.findAll(spec, sorted);
        return PageResponse.from(page.map(cashRegisterMapper::toRowResponse));
    }

    @Override
    public List<String> listDistinctEquipmentSerials() {
        return cashRegisterRepository.findDistinctEquipmentSerials(tenantAccess.requireEffectiveCompanyId());
    }

    @Override
    public CashRegisterDetailResponse getById(Long id) {
        CashRegister register = cashRegisterRepository.findDetailById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found: " + id));
        Store store = register.getStore();
        if (store == null || !store.isActive() || store.getCompany() == null) {
            throw new BadRequestException("Cash register is not available");
        }
        tenantAccess.assertCanAccessStore(store);
        return cashRegisterMapper.toDetailResponse(register);
    }

    @Override
    @Transactional
    public CashRegisterRowResponse toggleStatus(Long id) {
        CashRegister register = cashRegisterRepository.findDetailById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found: " + id));
        Store store = register.getStore();
        if (store == null || !store.isActive() || store.getCompany() == null) {
            throw new BadRequestException("Cash register store is not available");
        }
        tenantAccess.assertCanAccessStore(store);
        cashRegisterStatusToggle.apply(register);
        CashRegister saved = cashRegisterRepository.save(register);
        LogUtil.info(
            CashRegisterServiceImpl.class,
            "Cash register status toggled: id={}, status={}",
            id,
            saved.getStatus()
        );
        return cashRegisterMapper.toRowResponse(saved);
    }

    @Override
    @Transactional
    public CashRegisterRowResponse create(UpsertCashRegisterRequest request) {
        Store store = requireAccessibleStore(request.storeId());
        int registerNumber = resolveRegisterNumber(store.getId(), request.registerNumber(), null);
        assertUniqueRegister(store.getId(), registerNumber, null);
        assertUniqueDeviceId(request.deviceId(), null);

        CashRegister register = CashRegister.builder()
            .store(store)
            .registerNumber(registerNumber)
            .equipmentModel(trimToNull(request.equipmentModel()))
            .equipmentSerial(trimToNull(request.equipmentSerial()))
            .fiscalCardId(trimToNull(request.fiscalCardId()))
            .deviceId(trimToNull(request.deviceId()))
            .workstationName(trimToNull(request.workstationName()))
            .status(STATUS_ACTIVE)
            .build();
        CashRegister saved = cashRegisterRepository.save(register);
        LogUtil.info(CashRegisterServiceImpl.class, "Cash register created manually: id={}, storeId={}", saved.getId(), store.getId());
        return cashRegisterMapper.toRowResponse(saved);
    }

    @Override
    @Transactional
    public CashRegisterRowResponse update(Long id, UpsertCashRegisterRequest request) {
        CashRegister register = cashRegisterRepository.findDetailById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cash register not found: " + id));
        Store currentStore = register.getStore();
        tenantAccess.assertCanAccessStore(currentStore);

        Store store = requireAccessibleStore(request.storeId());
        int registerNumber = resolveRegisterNumber(store.getId(), request.registerNumber(), register.getRegisterNumber());
        assertUniqueRegister(store.getId(), registerNumber, id);
        assertUniqueDeviceId(request.deviceId(), id);

        register.setStore(store);
        register.setRegisterNumber(registerNumber);
        register.setEquipmentModel(trimToNull(request.equipmentModel()));
        register.setEquipmentSerial(trimToNull(request.equipmentSerial()));
        register.setFiscalCardId(trimToNull(request.fiscalCardId()));
        register.setDeviceId(trimToNull(request.deviceId()));
        register.setWorkstationName(trimToNull(request.workstationName()));

        CashRegister saved = cashRegisterRepository.save(register);
        LogUtil.info(CashRegisterServiceImpl.class, "Cash register updated: id={}", id);
        return cashRegisterMapper.toRowResponse(saved);
    }

    private Store requireAccessibleStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found: " + storeId));
        tenantAccess.assertCanAccessStore(store);
        if (!store.isActive() || store.getCompany() == null) {
            throw new BadRequestException("Store is not available");
        }
        return store;
    }

    private int resolveRegisterNumber(Integer storeId, Integer requested, Integer current) {
        if (requested != null && requested > 0) {
            return requested;
        }
        if (current != null && current > 0) {
            return current;
        }
        return cashRegisterRepository.findMaxRegisterNumberByStoreId(storeId) + 1;
    }

    private void assertUniqueRegister(Integer storeId, Integer registerNumber, Long ignoreId) {
        boolean exists = ignoreId == null
            ? cashRegisterRepository.existsByStore_IdAndRegisterNumber(storeId, registerNumber)
            : cashRegisterRepository.existsByStore_IdAndRegisterNumberAndIdNot(storeId, registerNumber, ignoreId);
        if (exists) {
            throw new BadRequestException("Касса с номером " + registerNumber + " уже есть в этом магазине");
        }
    }

    private void assertUniqueDeviceId(String deviceId, Long ignoreId) {
        String normalized = trimToNull(deviceId);
        if (!StringUtils.hasText(normalized)) {
            return;
        }
        boolean exists = ignoreId == null
            ? cashRegisterRepository.existsByDeviceId(normalized)
            : cashRegisterRepository.existsByDeviceIdAndIdNot(normalized, ignoreId);
        if (exists) {
            throw new BadRequestException("Касса с таким deviceId уже зарегистрирована");
        }
    }

    private static String trimToNull(String raw) {
        if (!StringUtils.hasText(raw)) {
            return null;
        }
        return raw.trim();
    }

}
