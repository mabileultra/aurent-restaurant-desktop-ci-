package com.pos.client.catalog;

import com.pos.catalog.dto.ref.ProductRef;
import org.springframework.stereotype.Component;

@Component
public class CatalogRemoteRefMapper {

    public ProductRef toProductRef(CatalogRemoteRef remote) {
        if (remote == null) {
            return null;
        }
        return new ProductRef(
            remote.id(),
            remote.companyId(),
            remote.sku(),
            remote.name(),
            remote.barcode(),
            remote.ikpu(),
            remote.sellingPrice(),
            remote.costPrice(),
            remote.unitCode(),
            remote.active(),
            remote.weighted()
        );
    }
}
