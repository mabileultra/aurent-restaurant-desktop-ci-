package com.pos.integrations.multikassa.repository;

import com.pos.integrations.multikassa.entity.CashRegisterMultikassaSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashRegisterMultikassaSettingsRepository
    extends JpaRepository<CashRegisterMultikassaSettings, Long> {
}
