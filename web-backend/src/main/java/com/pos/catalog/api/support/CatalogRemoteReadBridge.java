package com.pos.catalog.api.support;

import com.pos.catalog.dto.ref.ProductRef;
import com.pos.client.catalog.CatalogServiceClient;
import com.pos.config.catalog.CatalogReadMode;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;

/**
 * Wave 4.2 / 5.1: catalog-service read bridge controlled by {@code app.catalog.read-mode}.
 */
@Component
@RequiredArgsConstructor
public class CatalogRemoteReadBridge {

    private final CatalogServiceProperties properties;
    private final CatalogServiceClient catalogServiceClient;

    public Optional<ProductRef> getById(UUID productId, Supplier<Optional<ProductRef>> local) {
        return switch (properties.effectiveReadMode()) {
            case LOCAL_ONLY -> local.get();
            case REMOTE_ONLY -> catalogServiceClient.findById(productId);
            case REMOTE_FIRST -> remoteFirst(
                catalogServiceClient.findById(productId),
                local,
                "productId=" + productId
            );
        };
    }

    public Optional<ProductRef> findActiveById(
        UUID productId,
        Integer companyId,
        Supplier<Optional<ProductRef>> local
    ) {
        return switch (properties.effectiveReadMode()) {
            case LOCAL_ONLY -> local.get();
            case REMOTE_ONLY -> catalogServiceClient.findActiveById(productId, companyId);
            case REMOTE_FIRST -> remoteFirst(
                catalogServiceClient.findActiveById(productId, companyId),
                local,
                "active productId=" + productId
            );
        };
    }

    public Optional<ProductRef> findByBarcode(
        Integer companyId,
        String barcode,
        Supplier<Optional<ProductRef>> local
    ) {
        return switch (properties.effectiveReadMode()) {
            case LOCAL_ONLY -> local.get();
            case REMOTE_ONLY -> catalogServiceClient.findByBarcode(companyId, barcode);
            case REMOTE_FIRST -> remoteFirst(
                catalogServiceClient.findByBarcode(companyId, barcode),
                local,
                "barcode"
            );
        };
    }

    public List<ProductRef> searchActive(
        Integer companyId,
        String searchText,
        int limit,
        Supplier<List<ProductRef>> local
    ) {
        return switch (properties.effectiveReadMode()) {
            case LOCAL_ONLY -> local.get();
            case REMOTE_ONLY -> catalogServiceClient.searchActive(companyId, searchText, limit);
            case REMOTE_FIRST -> {
                List<ProductRef> remote = catalogServiceClient.searchActive(companyId, searchText, limit);
                if (!remote.isEmpty()) {
                    yield remote;
                }
                yield local.get();
            }
        };
    }

    private Optional<ProductRef> remoteFirst(
        Optional<ProductRef> remote,
        Supplier<Optional<ProductRef>> local,
        String context
    ) {
        if (remote.isPresent()) {
            return remote;
        }
        Optional<ProductRef> fallback = local.get();
        if (fallback.isPresent()) {
            LogUtil.warn(CatalogRemoteReadBridge.class,
                "catalog REMOTE_FIRST miss, local hit ({})", context);
        }
        return fallback;
    }
}
