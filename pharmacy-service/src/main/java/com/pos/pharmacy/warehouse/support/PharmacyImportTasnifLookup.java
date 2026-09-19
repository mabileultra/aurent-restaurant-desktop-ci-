package com.pos.pharmacy.warehouse.support;

import com.pos.pharmacy.config.PharmacyTasnifProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.concurrent.ConcurrentHashMap;

/** Кэш МХИК внутри одного импорта: одинаковые коды не бьют тасниф повторно. */
@Component
public class PharmacyImportTasnifLookup {

    private final PharmacyImportTasnifClient client;
    private final PharmacyTasnifProperties properties;
    private final ConcurrentHashMap<String, PharmacyImportTasnifHit> cache = new ConcurrentHashMap<>();

    public PharmacyImportTasnifLookup(
        PharmacyImportTasnifClient client,
        PharmacyTasnifProperties properties
    ) {
        this.client = client;
        this.properties = properties;
    }

    public PharmacyImportTasnifHit byMxik(String ikpu) {
        if (!properties.isEnabled() || !StringUtils.hasText(ikpu)) {
            return null;
        }
        String key = ikpu.replaceAll("\\D", "");
        if (key.length() < 10) {
            return null;
        }
        PharmacyImportTasnifHit cached = cache.get(key);
        if (cached != null) {
            return cached;
        }
        PharmacyImportTasnifHit hit = client.fetch(key);
        if (hit == null) {
            return null;
        }
        PharmacyImportTasnifHit race = cache.putIfAbsent(key, hit);
        return race != null ? race : hit;
    }
}
