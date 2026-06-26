package com.pos.service.impl;

import com.pos.domain.businessconfig.BusinessTypeCodes;
import com.pos.dto.business.BusinessConfigResponse;
import com.pos.entity.BusinessTypeDefinition;
import com.pos.entity.Store;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.BusinessTypeDefinitionRepository;
import com.pos.repository.StoreRepository;
import com.pos.service.BusinessConfigService;
import com.pos.service.businessconfig.support.BusinessConfigAssembler;
import com.pos.service.support.TenantAccessSupport;
import com.pos.util.BusinessTypeParser;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BusinessConfigServiceImpl implements BusinessConfigService {

    private final BusinessTypeDefinitionRepository typeRepository;
    private final StoreRepository storeRepository;
    private final BusinessConfigAssembler configAssembler;
    private final TenantAccessSupport tenantAccess;

    @Override
    @Cacheable(value = "businessConfig", key = "#code?.toUpperCase()")
    public BusinessConfigResponse getByCode(String code) {
        String normalized = BusinessTypeParser.parseOrDefault(code, BusinessTypeCodes.UNIVERSAL);
        BusinessTypeDefinition type = typeRepository.findActiveDetailedByCode(normalized)
            .or(() -> typeRepository.findActiveDetailedByCode(BusinessTypeCodes.UNIVERSAL))
            .orElseThrow(() -> new ResourceNotFoundException("Business config not found"));
        return configAssembler.assemble(type);
    }

    @Override
    public BusinessConfigResponse getForStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
            .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        tenantAccess.assertCanAccessCompany(store.getCompany().getId());
        if (store.getBusinessTypeDefinition() != null) {
            return getByCode(store.getBusinessTypeDefinition().getCode());
        }
        return getByCode(store.getBusinessType());
    }
}
