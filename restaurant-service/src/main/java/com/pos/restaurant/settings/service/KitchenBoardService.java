package com.pos.restaurant.settings.service;

import com.pos.restaurant.settings.dto.KitchenBoardSettingsResponse;

public interface KitchenBoardService {

    KitchenBoardSettingsResponse get(Integer storeId);

    KitchenBoardSettingsResponse setEnabled(Integer storeId, boolean enabled);

    boolean isEnabled(Integer companyId, Integer storeId);
}
