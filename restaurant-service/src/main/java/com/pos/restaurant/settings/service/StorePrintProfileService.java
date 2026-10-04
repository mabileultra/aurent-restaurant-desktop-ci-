package com.pos.restaurant.settings.service;

import com.pos.restaurant.settings.dto.StorePrintProfileResponse;

import java.util.Map;

public interface StorePrintProfileService {

    StorePrintProfileResponse get(Integer storeId);

    StorePrintProfileResponse save(Integer storeId, Map<String, Object> profile);
}
