package com.pos.restaurant.edge.service;

import com.pos.restaurant.edge.dto.catalog.EdgeCatalogImportRequest;
import com.pos.restaurant.edge.dto.catalog.EdgeCatalogSnapshot;
import com.pos.restaurant.edge.support.EdgeCatalogGhostOrderReconciler;
import com.pos.restaurant.edge.support.EdgeCatalogKitchenBootstrapWriter;
import com.pos.restaurant.edge.support.EdgeCatalogModifierWriter;
import com.pos.restaurant.edge.support.EdgeCatalogOrderBootstrapWriter;
import com.pos.restaurant.edge.support.EdgeCatalogRecipeSettingsWriter;
import com.pos.restaurant.edge.support.EdgeCatalogSequenceSync;
import com.pos.restaurant.edge.support.EdgeCatalogStructureWriter;
import com.pos.restaurant.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

/**
 * Edge catalog bootstrap orchestrator — delegates each slice to a writer (SRP).
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.restaurant.edge", name = "enabled", havingValue = "true")
public class EdgeCatalogImportService {

    private final JdbcTemplate jdbc;
    private final EdgeCatalogStructureWriter structureWriter;
    private final EdgeCatalogModifierWriter modifierWriter;
    private final EdgeCatalogRecipeSettingsWriter recipeSettingsWriter;
    private final EdgeCatalogOrderBootstrapWriter orderBootstrapWriter;
    private final EdgeCatalogGhostOrderReconciler ghostOrderReconciler;
    private final EdgeCatalogKitchenBootstrapWriter kitchenBootstrapWriter;
    private final EdgeCatalogSequenceSync sequenceSync;
    private final ObjectProvider<EdgeStoreService> edgeStoreService;

    @Value("${app.restaurant.edge.bootstrap-secret:}")
    private String bootstrapSecret;

    @Transactional
    public Map<String, Object> importSnapshot(EdgeCatalogImportRequest request) {
        EdgeCatalogSnapshot snap = request.snapshot();
        if (snap == null || snap.companyId() == null || snap.storeId() == null) {
            throw new BusinessException("Invalid catalog snapshot");
        }
        if (StringUtils.hasText(bootstrapSecret)
            && !bootstrapSecret.equals(String.valueOf(request.bootstrapSecret()))) {
            if (!hasCatalog(snap.companyId(), snap.storeId())) {
                throw new BusinessException("Invalid bootstrap secret");
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.putAll(structureWriter.applyStructure(snap));
        result.putAll(modifierWriter.apply(snap));
        result.putAll(recipeSettingsWriter.apply(snap));
        result.putAll(orderBootstrapWriter.apply(snap));
        result.putAll(ghostOrderReconciler.apply(snap));
        result.putAll(kitchenBootstrapWriter.apply(snap));

        EdgeStoreService stores = edgeStoreService.getIfAvailable();
        if (stores != null) {
            stores.upsertFromCatalog(snap.companyId(), snap.storeId());
        }
        sequenceSync.syncSequences();

        result.put("hasCatalog", hasCatalog(snap.companyId(), snap.storeId()));
        result.put("companyId", snap.companyId());
        result.put("storeId", snap.storeId());
        return result;
    }

    @Transactional(readOnly = true)
    public boolean hasCatalog(Integer companyId, Integer storeId) {
        if (companyId == null || storeId == null) {
            return hasAnyCatalog();
        }
        Integer halls = jdbc.queryForObject(
            "SELECT COUNT(*) FROM floor_halls WHERE company_id = ? AND store_id = ?",
            Integer.class,
            companyId,
            storeId
        );
        if (halls != null && halls > 0) {
            return true;
        }
        Integer items = jdbc.queryForObject(
            "SELECT COUNT(*) FROM menu_items WHERE company_id = ? AND store_id = ?",
            Integer.class,
            companyId,
            storeId
        );
        return items != null && items > 0;
    }

    @Transactional(readOnly = true)
    public boolean hasAnyCatalog() {
        Integer halls = jdbc.queryForObject("SELECT COUNT(*) FROM floor_halls", Integer.class);
        if (halls != null && halls > 0) {
            return true;
        }
        Integer items = jdbc.queryForObject("SELECT COUNT(*) FROM menu_items", Integer.class);
        return items != null && items > 0;
    }
}
