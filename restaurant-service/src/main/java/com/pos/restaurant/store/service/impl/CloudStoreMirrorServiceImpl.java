package com.pos.restaurant.store.service.impl;

import com.pos.restaurant.edge.entity.EdgeStore;
import com.pos.restaurant.edge.repository.EdgeStoreRepository;
import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.store.dto.InternalStoreUpsertRequest;
import com.pos.restaurant.store.service.CloudStoreMirrorService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CloudStoreMirrorServiceImpl implements CloudStoreMirrorService {

    private final EdgeStoreRepository storeRepository;

    @Override
    @Transactional
    public void upsert(InternalStoreUpsertRequest request) {
        if (request == null || request.id() == null || request.companyId() == null) {
            throw new ValidationException("id and companyId required");
        }
        EdgeStore row = storeRepository.findById(request.id()).orElseGet(EdgeStore::new);
        row.setId(request.id());
        row.setCompanyId(request.companyId());
        String name = StringUtils.hasText(request.name()) ? request.name().trim() : row.getName();
        if (!StringUtils.hasText(name)) {
            name = "Точка #" + request.id();
        }
        row.setName(name);
        if (request.code() != null) {
            row.setCode(StringUtils.hasText(request.code()) ? request.code().trim() : null);
        }
        if (request.address() != null) {
            row.setAddress(request.address());
        }
        if (request.phone() != null) {
            row.setPhone(request.phone());
        }
        String type = StringUtils.hasText(request.businessType())
            ? request.businessType().trim().toUpperCase()
            : row.getBusinessType();
        if (!StringUtils.hasText(type)) {
            type = "RESTAURANT";
        }
        row.setBusinessType(type);
        row.setActive(request.active() == null || request.active());
        storeRepository.save(row);
        LogUtil.info(CloudStoreMirrorServiceImpl.class,
            "Mirrored store id={} companyId={} active={}", row.getId(), row.getCompanyId(), row.isActive());
    }

    @Override
    @Transactional
    public void deactivate(Integer storeId) {
        if (storeId == null) {
            return;
        }
        storeRepository.findById(storeId).ifPresent(row -> {
            row.setActive(false);
            storeRepository.save(row);
            LogUtil.info(CloudStoreMirrorServiceImpl.class, "Deactivated mirrored store id={}", storeId);
        });
    }
}
