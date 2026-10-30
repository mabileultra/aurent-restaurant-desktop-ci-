package com.pos.restaurant.settings.service;

import com.pos.restaurant.settings.dto.MenuPhotoSettingsResponse;

public interface MenuPhotoService {

    MenuPhotoSettingsResponse get(Integer storeId);

    MenuPhotoSettingsResponse setEnabled(Integer storeId, boolean enabled);
}
