package com.pos.integrations.fiscaldrive.service;

import com.pos.integrations.fiscaldrive.dto.FiscalDriveSettingsResponse;
import com.pos.integrations.fiscaldrive.dto.SaveFiscalDriveSettingsRequest;

public interface FiscalDriveSettingsService {

    FiscalDriveSettingsResponse getSettings(Long cashRegisterId);

    FiscalDriveSettingsResponse saveSettings(Long cashRegisterId, SaveFiscalDriveSettingsRequest request);
}
