package com.pos.service.crm.impl;

import com.pos.dto.crm.internal.CourierRefDto;
import com.pos.dto.crm.internal.StoreRefDto;
import com.pos.entity.Store;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.StoreRepository;
import com.pos.repository.UserRepository;
import com.pos.service.crm.CrmDirectoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CrmDirectoryServiceImpl implements CrmDirectoryService {

    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    @Override
    public StoreRefDto getStore(Integer id) {
        Store store = storeRepository.findByIdWithCompany(id)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found: " + id));
        return new StoreRefDto(
            store.getId(),
            store.getName(),
            store.getCompany() != null ? store.getCompany().getId() : null
        );
    }

    @Override
    public List<CourierRefDto> listCouriers(Integer companyId) {
        return userRepository.findActiveByRoleNameAndCompanyId("COURIER", companyId).stream()
            .map(u -> new CourierRefDto(u.getId(), u.getFullName(), u.getEmail()))
            .toList();
    }
}
