package com.pos.pharmacy.warehouse.support;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class PharmacyImportTasnifEnricher {

    private final PharmacyImportTasnifLookup lookup;

    public PharmacyImportTasnifEnricher(PharmacyImportTasnifLookup lookup) {
        this.lookup = lookup;
    }

    public PharmacyImportCatalogHints apply(String ikpu, boolean invoiceMarked, Boolean invoiceRx) {
        PharmacyImportTasnifHit hit = lookup.byMxik(ikpu);
        boolean marked = PharmacyImportMarkedDecide.apply(invoiceMarked, hit);
        Boolean rx = invoiceRx != null ? invoiceRx : PharmacyImportTasnifRxLook.of(hit);
        String packageCode = hit != null && hit.found() ? hit.packageCode() : null;
        String status = null;
        if (StringUtils.hasText(ikpu)) {
            status = hit != null && hit.found() ? "FOUND" : "MANUAL";
        }
        return new PharmacyImportCatalogHints(marked, rx, packageCode, status);
    }
}
