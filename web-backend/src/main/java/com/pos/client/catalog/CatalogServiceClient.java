package com.pos.client.catalog;

import com.pos.catalog.dto.ref.ProductRef;
import com.pos.config.catalog.CatalogServiceProperties;
import com.pos.shared.log.LogUtil;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Internal HTTP client for catalog-service. Not wired into {@code CatalogFacade} yet (Wave 4.1).
 */
@Component
public class CatalogServiceClient {

    private static final ParameterizedTypeReference<List<CatalogRemoteRef>> REF_LIST =
        new ParameterizedTypeReference<>() {
        };

    private final RestClient catalogRestClient;
    private final CatalogServiceProperties properties;
    private final CatalogRemoteRefMapper mapper;

    public CatalogServiceClient(
        RestClient catalogRestClient,
        CatalogServiceProperties properties,
        CatalogRemoteRefMapper mapper
    ) {
        this.catalogRestClient = catalogRestClient;
        this.properties = properties;
        this.mapper = mapper;
    }

    public boolean isEnabled() {
        return properties.isEnabled();
    }

    public Optional<ProductRef> findById(UUID productId) {
        if (!properties.isEnabled() || productId == null) {
            return Optional.empty();
        }
        return CatalogServiceClientSupport.getOptional(
            mapper,
            "catalog-service getById " + productId,
            () -> catalogRestClient.get()
                .uri("/internal/catalog/products/{id}", productId)
                .retrieve()
                .body(CatalogRemoteRef.class)
        );
    }

    public Optional<ProductRef> findActiveById(UUID productId, Integer companyId) {
        if (!properties.isEnabled() || productId == null || companyId == null) {
            return Optional.empty();
        }
        return CatalogServiceClientSupport.getOptional(
            mapper,
            "catalog-service requireActive " + productId,
            () -> catalogRestClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/internal/catalog/products/{id}/active")
                    .queryParam("companyId", companyId)
                    .build(productId))
                .retrieve()
                .body(CatalogRemoteRef.class)
        );
    }

    public Optional<ProductRef> findByBarcode(Integer companyId, String barcode) {
        if (!properties.isEnabled() || companyId == null || barcode == null || barcode.isBlank()) {
            return Optional.empty();
        }
        return CatalogServiceClientSupport.getOptional(
            mapper,
            "catalog-service byBarcode",
            () -> catalogRestClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/internal/catalog/products/by-barcode")
                    .queryParam("companyId", companyId)
                    .queryParam("barcode", barcode.trim())
                    .build())
                .retrieve()
                .body(CatalogRemoteRef.class)
        );
    }

    public List<ProductRef> searchActive(Integer companyId, String q, int limit) {
        if (!properties.isEnabled() || companyId == null) {
            return List.of();
        }
        try {
            List<CatalogRemoteRef> body = catalogRestClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/internal/catalog/products/search")
                    .queryParam("companyId", companyId)
                    .queryParam("q", q == null ? "" : q)
                    .queryParam("limit", limit)
                    .build())
                .retrieve()
                .body(REF_LIST);
            if (body == null || body.isEmpty()) {
                return List.of();
            }
            return body.stream().map(mapper::toProductRef).toList();
        } catch (Exception ex) {
            LogUtil.warn(CatalogServiceClient.class, "catalog-service search failed", ex);
            return List.of();
        }
    }

    public Optional<CatalogRemoteStats> fetchStats(Integer companyId) {
        if (!properties.isEnabled()) {
            return Optional.empty();
        }
        try {
            CatalogRemoteStats body = catalogRestClient.get()
                .uri(uriBuilder -> {
                    var b = uriBuilder.path("/internal/catalog/stats");
                    if (companyId != null) {
                        b.queryParam("companyId", companyId);
                    }
                    return b.build();
                })
                .retrieve()
                .body(CatalogRemoteStats.class);
            return Optional.ofNullable(body);
        } catch (Exception ex) {
            LogUtil.warn(CatalogServiceClient.class, "catalog-service stats failed", ex);
            return Optional.empty();
        }
    }

    public Optional<CatalogRemoteOutboxStats> fetchOutboxStats() {
        if (!properties.isEnabled()) {
            return Optional.empty();
        }
        try {
            CatalogRemoteOutboxStats body = catalogRestClient.get()
                .uri("/internal/catalog/outbox/stats")
                .retrieve()
                .body(CatalogRemoteOutboxStats.class);
            return Optional.ofNullable(body);
        } catch (Exception ex) {
            LogUtil.warn(CatalogServiceClient.class, "catalog-service outbox stats failed", ex);
            return Optional.empty();
        }
    }

    public List<CatalogRemoteOutboxRow> fetchOutboxFeed(Instant since, int limit) {
        if (!properties.isEnabled()) {
            return List.of();
        }
        Instant safeSince = since != null ? since : Instant.EPOCH;
        try {
            List<CatalogRemoteOutboxRow> body = catalogRestClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/internal/catalog/outbox/feed")
                    .queryParam("since", safeSince.toString())
                    .queryParam("limit", Math.min(Math.max(limit, 1), 200))
                    .build())
                .retrieve()
                .body(new ParameterizedTypeReference<>() {
                });
            return body == null ? List.of() : body;
        } catch (Exception ex) {
            LogUtil.warn(CatalogServiceClient.class, "catalog-service outbox feed failed", ex);
            return List.of();
        }
    }

    public void deactivateCategory(UUID categoryId) {
        tryDeactivateCategory(categoryId);
    }

    public boolean tryDeactivateCategory(UUID categoryId) {
        if (!properties.dualWriteEnabled() || categoryId == null) {
            return false;
        }
        try {
            catalogRestClient.post()
                .uri("/internal/catalog/categories/{id}/deactivate", categoryId)
                .retrieve()
                .toBodilessEntity();
            return true;
        } catch (Exception ex) {
            LogUtil.warn(CatalogServiceClient.class,
                "catalog-service category deactivate failed id=" + categoryId, ex);
            return false;
        }
    }

    public void deactivateProduct(UUID productId) {
        tryDeactivateProduct(productId);
    }

    public boolean tryDeactivateProduct(UUID productId) {
        if (!properties.dualWriteEnabled() || productId == null) {
            return false;
        }
        try {
            catalogRestClient.post()
                .uri("/internal/catalog/products/{id}/deactivate", productId)
                .retrieve()
                .toBodilessEntity();
            return true;
        } catch (Exception ex) {
            LogUtil.warn(CatalogServiceClient.class,
                "catalog-service product deactivate failed id=" + productId, ex);
            return false;
        }
    }

    public void upsertCategory(CatalogCategoryUpsertRequest request) {
        tryUpsertCategory(request);
    }

    public boolean tryUpsertCategory(CatalogCategoryUpsertRequest request) {
        if (!properties.dualWriteEnabled() || request == null || request.id() == null) {
            return false;
        }
        try {
            catalogRestClient.put()
                .uri("/internal/catalog/categories/{id}", request.id())
                .body(request)
                .retrieve()
                .toBodilessEntity();
            return true;
        } catch (Exception ex) {
            LogUtil.warn(CatalogServiceClient.class,
                "catalog-service category upsert failed id=" + request.id(), ex);
            return false;
        }
    }

    /** Best-effort dual-write; never throws to callers. */
    public void upsertProduct(CatalogProductUpsertRequest request) {
        tryUpsertProduct(request);
    }

    /** @return true if HTTP upsert succeeded */
    public boolean tryUpsertProduct(CatalogProductUpsertRequest request) {
        if (!properties.dualWriteEnabled() || request == null || request.id() == null) {
            return false;
        }
        try {
            catalogRestClient.put()
                .uri("/internal/catalog/products/{id}", request.id())
                .body(request)
                .retrieve()
                .toBodilessEntity();
            return true;
        } catch (Exception ex) {
            LogUtil.warn(CatalogServiceClient.class,
                "catalog-service upsert failed productId=" + request.id(), ex);
            return false;
        }
    }
}
