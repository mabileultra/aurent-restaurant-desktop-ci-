package com.pos.restaurant.settings.service;

import com.pos.restaurant.settings.dto.ForeignTableOrderSettingsResponse;

public interface ForeignTableOrderService {

    ForeignTableOrderSettingsResponse get(Integer storeId);

    ForeignTableOrderSettingsResponse setAllowed(Integer storeId, boolean allowed);

    /** Default true when no row yet — preserves current open-hall behaviour. */
    boolean isAllowed(Integer companyId, Integer storeId);
}
