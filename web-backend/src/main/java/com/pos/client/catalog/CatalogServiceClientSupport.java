package com.pos.client.catalog;

import com.pos.catalog.dto.ref.ProductRef;
import com.pos.shared.log.LogUtil;
import org.springframework.web.client.RestClientResponseException;

import java.util.Optional;
import java.util.function.Supplier;

final class CatalogServiceClientSupport {

    private CatalogServiceClientSupport() {
    }

    static Optional<ProductRef> getOptional(
        CatalogRemoteRefMapper mapper,
        String operation,
        Supplier<CatalogRemoteRef> call
    ) {
        try {
            return Optional.ofNullable(mapper.toProductRef(call.get()));
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                return Optional.empty();
            }
            LogUtil.warn(CatalogServiceClient.class, operation + " failed", ex);
            return Optional.empty();
        } catch (Exception ex) {
            LogUtil.warn(CatalogServiceClient.class, operation + " failed", ex);
            return Optional.empty();
        }
    }
}
