package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.config.PharmacyTasnifProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Как verifyProductImportTasnif: штрихкод → ИКПУ → имя.
 * Сеть не роняет импорт/backfill.
 */
@Component
public class PharmacyTasnifProductResolve {

    private final PharmacyImportTasnifClient client;
    private final PharmacyTasnifProperties properties;

    public PharmacyTasnifProductResolve(
        PharmacyImportTasnifClient client,
        PharmacyTasnifProperties properties
    ) {
        this.client = client;
        this.properties = properties;
    }

    public PharmacyImportTasnifHit resolve(String barcode, String ikpu, String name, boolean allowNameSearch) {
        if (!properties.isEnabled()) {
            return PharmacyImportTasnifHit.miss();
        }
        if (StringUtils.hasText(barcode)) {
            PharmacyImportTasnifHit byBarcode = client.fetchByBarcode(barcode.trim());
            if (byBarcode != null && byBarcode.found()) {
                return byBarcode;
            }
        }
        if (StringUtils.hasText(ikpu)) {
            PharmacyImportTasnifHit byIkpu = client.fetch(ikpu.trim());
            if (byIkpu != null && byIkpu.found()) {
                return byIkpu;
            }
        }
        if (allowNameSearch && StringUtils.hasText(name) && name.trim().length() >= 2) {
            PharmacyImportTasnifHit byName = client.searchByName(name.trim());
            if (byName != null && byName.found()) {
                return byName;
            }
        }
        return PharmacyImportTasnifHit.miss();
    }
}
