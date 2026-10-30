package com.pos.integrations.multikassa.repository;

import com.pos.integrations.multikassa.entity.CashRegisterMultikassaSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CashRegisterMultikassaSettingsRepository
    extends JpaRepository<CashRegisterMultikassaSettings, Long> {

    /**
     * Upsert флагов QR / require без полного admin-save.
     * Создаёт строку настроек, если её ещё не было (типичный кейс «Multikassa выкл»).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
        INSERT INTO cash_register_multikassa_settings AS s
            (cash_register_id, enabled, base_url, require_before_sale, print_fiscal_qr, updated_at)
        VALUES
            (:registerId, COALESCE(:enabled, FALSE), :baseUrl, COALESCE(:requireBefore, FALSE), COALESCE(:printQr, TRUE), NOW())
        ON CONFLICT (cash_register_id) DO UPDATE SET
            enabled = COALESCE(:enabled, s.enabled),
            print_fiscal_qr = COALESCE(:printQr, s.print_fiscal_qr),
            require_before_sale = COALESCE(:requireBefore, s.require_before_sale),
            updated_at = NOW()
        """, nativeQuery = true)
    int upsertFlags(
        @Param("registerId") Long registerId,
        @Param("baseUrl") String baseUrl,
        @Param("printQr") Boolean printQr,
        @Param("requireBefore") Boolean requireBefore,
        @Param("enabled") Boolean enabled
    );
}
