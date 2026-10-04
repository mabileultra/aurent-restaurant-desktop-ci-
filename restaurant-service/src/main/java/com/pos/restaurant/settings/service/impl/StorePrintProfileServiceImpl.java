package com.pos.restaurant.settings.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.restaurant.exception.ValidationException;
import com.pos.restaurant.floor.support.FloorTenantSupport;
import com.pos.restaurant.settings.dto.StorePrintProfileResponse;
import com.pos.restaurant.settings.entity.RestaurantStoreSetting;
import com.pos.restaurant.settings.repository.RestaurantStoreSettingRepository;
import com.pos.restaurant.settings.service.StorePrintProfileService;
import com.pos.restaurant.settings.support.StorePrintProfileDefaults;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class StorePrintProfileServiceImpl implements StorePrintProfileService {

    private static final int MAX_LOGO_CHARS = 400_000;

    private final RestaurantStoreSettingRepository repository;
    private final FloorTenantSupport tenantSupport;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public StorePrintProfileResponse get(Integer storeId) {
        Integer companyId = tenantSupport.requireCompanyId();
        String raw = repository.findByCompanyIdAndStoreId(companyId, storeId)
            .map(RestaurantStoreSetting::getPrintProfileJson)
            .orElse(null);
        return new StorePrintProfileResponse(storeId, mergeRaw(raw));
    }

    @Override
    @Transactional
    public StorePrintProfileResponse save(Integer storeId, Map<String, Object> profile) {
        Integer companyId = tenantSupport.requireCompanyId();
        Map<String, Object> merged = StorePrintProfileDefaults.merge(profile);
        Object logo = merged.get("logoDataUrl");
        if (logo instanceof String s && s.length() > MAX_LOGO_CHARS) {
            throw new ValidationException("Logo image is too large");
        }
        String json;
        try {
            json = objectMapper.writeValueAsString(merged);
        } catch (Exception ex) {
            throw new ValidationException("Invalid print profile");
        }
        RestaurantStoreSetting row = repository.findByCompanyIdAndStoreId(companyId, storeId)
            .orElseGet(() -> RestaurantStoreSetting.builder()
                .companyId(companyId)
                .storeId(storeId)
                .build());
        row.setPrintProfileJson(json);
        repository.save(row);
        return new StorePrintProfileResponse(storeId, merged);
    }

    private Map<String, Object> mergeRaw(String raw) {
        if (raw == null || raw.isBlank()) {
            return StorePrintProfileDefaults.factory();
        }
        try {
            Map<String, Object> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
            return StorePrintProfileDefaults.merge(parsed);
        } catch (Exception ignored) {
            return StorePrintProfileDefaults.factory();
        }
    }
}
