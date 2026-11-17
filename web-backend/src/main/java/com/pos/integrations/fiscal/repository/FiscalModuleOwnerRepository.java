package com.pos.integrations.fiscal.repository;

import com.pos.integrations.fiscal.support.FiscalModuleOwner;
import com.pos.sales.entity.CashRegister;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Поиск кассы, за которой уже закреплён идентификатор ФМ (AUR-19).
 * {@code key} — значение после {@code LOWER(TRIM(...))}; {@code excludeId = null} означает
 * «исключать некого» (создание новой кассы), а не {@code id <> NULL}.
 */
public interface FiscalModuleOwnerRepository extends Repository<CashRegister, Long> {

    String OWNER = "new com.pos.integrations.fiscal.support.FiscalModuleOwner("
        + "c.id, c.registerNumber, s.id, s.name, co.id, c.status)";

    @Query("SELECT " + OWNER + """
         FROM CashRegister c JOIN c.store s LEFT JOIN s.company co
        WHERE c.fiscalCardId IS NOT NULL AND LOWER(TRIM(c.fiscalCardId)) = :key
          AND (:excludeId IS NULL OR c.id <> :excludeId)
        ORDER BY c.id
        """)
    List<FiscalModuleOwner> findByFiscalCardId(@Param("key") String key, @Param("excludeId") Long excludeId);

    @Query("SELECT " + OWNER + """
         FROM CashRegisterMultikassaSettings m JOIN m.cashRegister c JOIN c.store s LEFT JOIN s.company co
        WHERE m.terminalId IS NOT NULL AND LOWER(TRIM(m.terminalId)) = :key
          AND (:excludeId IS NULL OR c.id <> :excludeId)
        ORDER BY c.id
        """)
    List<FiscalModuleOwner> findByMultikassaTerminalId(@Param("key") String key, @Param("excludeId") Long excludeId);

    @Query("SELECT " + OWNER + """
         FROM CashRegisterMultikassaSettings m JOIN m.cashRegister c JOIN c.store s LEFT JOIN s.company co
        WHERE m.moduleNumber IS NOT NULL AND LOWER(TRIM(m.moduleNumber)) = :key
          AND (:excludeId IS NULL OR c.id <> :excludeId)
        ORDER BY c.id
        """)
    List<FiscalModuleOwner> findByMultikassaModuleNumber(@Param("key") String key, @Param("excludeId") Long excludeId);

    @Query("SELECT " + OWNER + """
         FROM CashRegisterMultikassaSettings m JOIN m.cashRegister c JOIN c.store s LEFT JOIN s.company co
        WHERE m.selectedDriveId IS NOT NULL AND LOWER(TRIM(m.selectedDriveId)) = :key
          AND (:excludeId IS NULL OR c.id <> :excludeId)
        ORDER BY c.id
        """)
    List<FiscalModuleOwner> findByMultikassaSelectedDriveId(@Param("key") String key, @Param("excludeId") Long excludeId);

    @Query("SELECT " + OWNER + """
         FROM CashRegisterFiscalDriveSettings f JOIN f.cashRegister c JOIN c.store s LEFT JOIN s.company co
        WHERE f.factoryId IS NOT NULL AND LOWER(TRIM(f.factoryId)) = :key
          AND (:excludeId IS NULL OR c.id <> :excludeId)
        ORDER BY c.id
        """)
    List<FiscalModuleOwner> findByFiscalDriveFactoryId(@Param("key") String key, @Param("excludeId") Long excludeId);

    @Query("SELECT " + OWNER + """
         FROM CashRegisterFiscalDriveSettings f JOIN f.cashRegister c JOIN c.store s LEFT JOIN s.company co
        WHERE f.terminalId IS NOT NULL AND LOWER(TRIM(f.terminalId)) = :key
          AND (:excludeId IS NULL OR c.id <> :excludeId)
        ORDER BY c.id
        """)
    List<FiscalModuleOwner> findByFiscalDriveTerminalId(@Param("key") String key, @Param("excludeId") Long excludeId);
}
