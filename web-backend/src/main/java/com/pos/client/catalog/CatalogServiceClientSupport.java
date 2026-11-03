package com.pos.client.catalog;

import com.pos.catalog.dto.ref.ProductRef;
import com.pos.exception.ServiceUnavailableException;
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
        Supplier<CatalogRemoteRef> call,
        boolean strictRemoteOnly
    ) {
        try {
            return Optional.ofNullable(mapper.toProductRef(call.get()));
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                return Optional.empty();
            }
            return fail(operation, ex, strictRemoteOnly);
        } catch (Exception ex) {
            return fail(operation, ex, strictRemoteOnly);
        }
    }

    private static Optional<ProductRef> fail(String operation, Exception ex, boolean strictRemoteOnly) {
        LogUtil.warn(CatalogServiceClient.class, operation + " failed", ex);
        if (strictRemoteOnly) {
            throw new ServiceUnavailableException("catalog-service unavailable (REMOTE_ONLY read)", ex);
        }
        return Optional.empty();
    }
}
