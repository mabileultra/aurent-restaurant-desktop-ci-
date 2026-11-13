package com.pos.pharmacy.catalog.registry.repository;

import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DrugRegistryEntryRepository extends JpaRepository<DrugRegistryEntry, UUID> {

    List<DrugRegistryEntry> findByImportIdAndNameKey(UUID importId, String nameKey);

    /** Кандидаты: точный name_key (без ®) или торговое имя — префикс названия товара. */
    @Query(value = """
        SELECT * FROM drug_registry_entries e
        WHERE e.import_id = CAST(:importId AS uuid)
          AND (
            regexp_replace(e.name_key, '[®™©]', '', 'g') = :productKey
            OR (
              char_length(regexp_replace(e.name_key, '[®™©]', '', 'g')) >= 4
              AND (
                :productKey LIKE regexp_replace(e.name_key, '[®™©]', '', 'g') || ' %'
                OR :productKey LIKE regexp_replace(e.name_key, '[®™©]', '', 'g') || '/%'
                OR :productKey LIKE regexp_replace(e.name_key, '[®™©]', '', 'g') || '-%'
                OR :productKey LIKE regexp_replace(e.name_key, '[®™©]', '', 'g') || '(%'
              )
            )
          )
        """, nativeQuery = true)
    List<DrugRegistryEntry> findMatchCandidates(
        @Param("importId") UUID importId,
        @Param("productKey") String productKey
    );

    @Query("""
        SELECT e FROM DrugRegistryEntry e
        WHERE e.importId = :importId
          AND (
            LOWER(e.tradeName) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(COALESCE(e.registrationNumber, '')) LIKE LOWER(CONCAT('%', :q, '%'))
          )
        ORDER BY e.tradeName
        """)
    List<DrugRegistryEntry> search(
        @Param("importId") UUID importId,
        @Param("q") String q,
        Pageable pageable
    );
}
