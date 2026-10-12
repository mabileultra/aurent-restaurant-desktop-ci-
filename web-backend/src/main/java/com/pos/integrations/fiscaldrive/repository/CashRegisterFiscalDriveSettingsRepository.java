package com.pos.integrations.fiscaldrive.repository;

import com.pos.integrations.fiscaldrive.entity.CashRegisterFiscalDriveSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashRegisterFiscalDriveSettingsRepository
    extends JpaRepository<CashRegisterFiscalDriveSettings, Long> {
}
