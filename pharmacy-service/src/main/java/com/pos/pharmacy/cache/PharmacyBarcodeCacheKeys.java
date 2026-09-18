package com.pos.pharmacy.cache;

import com.pos.pharmacy.catalog.support.PharmacyBarcodeVariants;
import org.springframework.util.StringUtils;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Ключи Redis для hot-path кассы: companyId:storeId:normalizedBarcode.
 */
public final class PharmacyBarcodeCacheKeys {

    private PharmacyBarcodeCacheKeys() {
    }

    public static String of(Integer companyId, Integer storeId, String barcode) {
        return PharmacyCacheNames.PRODUCT_BARCODE
            + ':' + companyId
            + ':' + storeId
            + ':' + normalize(barcode);
    }

    public static String storePrefix(Integer companyId, Integer storeId) {
        return PharmacyCacheNames.PRODUCT_BARCODE + ':' + companyId + ':' + storeId + ':';
    }

    public static String companyPrefix(Integer companyId) {
        return PharmacyCacheNames.PRODUCT_BARCODE + ':' + companyId + ':';
    }

    public static List<String> keysForScan(Integer companyId, Integer storeId, String rawBarcode) {
        if (companyId == null || storeId == null || !StringUtils.hasText(rawBarcode)) {
            return List.of();
        }
        Set<String> keys = new LinkedHashSet<>();
        for (String variant : PharmacyBarcodeVariants.of(rawBarcode)) {
            keys.add(of(companyId, storeId, variant));
        }
        if (keys.isEmpty()) {
            keys.add(of(companyId, storeId, rawBarcode.trim()));
        }
        return List.copyOf(keys);
    }

    public static String normalize(String barcode) {
        if (!StringUtils.hasText(barcode)) {
            return "";
        }
        return barcode.trim();
    }
}
