package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.entity.Product;
import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;
import com.pos.pharmacy.catalog.registry.service.DrugRegistryLookupService;
import com.pos.pharmacy.catalog.repository.ProductRepository;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.support.PharmacyDbFieldLimits;
import com.pos.pharmacy.warehouse.support.PharmacyImportTasnifHit;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptSupport;
import com.pos.pharmacy.warehouse.support.PharmacyTasnifProductResolve;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Пишет официальные поля из госреестра при однозначном совпадении.
 * Сначала тасниф (штрихкод→ИКПУ→имя), затем мягкий матч реестра по имени.
 * Цена и остаток не трогает.
 */
@Component
@RequiredArgsConstructor
public class DrugRegistryCardFill {

    public static final String ATTR_REGISTRATION = "registration_number";
    public static final String ATTR_ATC = "atc_code";

    private final DrugRegistryLookupService lookup;
    private final ProductAttributeService attributes;
    private final PharmacyTasnifProductResolve tasnifResolve;
    private final ProductRepository products;

    public record Official(String manufacturer, String country, Boolean prescription) {
    }

    public Official blanks(String name, String manufacturer, String country, Boolean prescription) {
        DrugRegistryEntry hit = lookup.unanimous(name).orElse(null);
        if (hit == null) {
            return new Official(blank(manufacturer), blank(country), prescription);
        }
        return new Official(
            prefer(hit.getManufacturer(), manufacturer),
            prefer(hit.getCountry(), country),
            hit.getPrescriptionRequired() != null ? hit.getPrescriptionRequired() : prescription
        );
    }

    public void putMissing(Map<String, String> attrs, String name) {
        DrugRegistryEntry hit = lookup.unanimous(name).orElse(null);
        if (hit == null || attrs == null) {
            return;
        }
        put(attrs, PharmacyReceiptSupport.ATTR_MANUFACTURER, hit.getManufacturer());
        put(attrs, PharmacyReceiptSupport.ATTR_COUNTRY, hit.getCountry());
        put(attrs, PharmacyReceiptSupport.ATTR_DOSAGE_FORM, hit.getDosageForm());
        put(attrs, ATTR_ATC, hit.getAtcCode());
        put(attrs, ATTR_REGISTRATION, hit.getRegistrationNumber());
        if (hit.getPrescriptionRequired() != null) {
            attrs.put(
                PharmacyReceiptSupport.ATTR_PRESCRIPTION_REQUIRED,
                Boolean.TRUE.equals(hit.getPrescriptionRequired()) ? "true" : "false"
            );
        }
    }

    /** Backfill: тасниф по штрихкоду/ИКПУ (без массового name-search) + реестр. */
    public boolean applyMissing(Product product) {
        return enrichProduct(product, false);
    }

    /** Создание/ручная карточка: полный тасниф включая поиск по имени. */
    public boolean applyOnCreate(Product product) {
        return enrichProduct(product, true);
    }

    private boolean enrichProduct(Product product, boolean allowNameSearch) {
        if (product == null || product.getId() == null || !StringUtils.hasText(product.getName())) {
            return false;
        }
        boolean changed = applyTasnif(product, allowNameSearch);
        changed |= applyRegistryAttrs(product.getId(), product.getName());
        return changed;
    }

    public boolean applyMissing(UUID productId, String name) {
        if (productId == null || !StringUtils.hasText(name)) {
            return false;
        }
        return applyRegistryAttrs(productId, name);
    }

    /** Создание/импорт: полный тасниф включая поиск по имени. */
    public PharmacyImportTasnifHit resolveTasnif(String barcode, String ikpu, String name) {
        return tasnifResolve.resolve(barcode, ikpu, name, true);
    }

    private boolean applyTasnif(Product product, boolean allowNameSearch) {
        PharmacyImportTasnifHit hit = tasnifResolve.resolve(
            product.getBarcode(),
            product.getIkpu(),
            product.getName(),
            allowNameSearch
        );
        if (hit == null || !hit.found() || !StringUtils.hasText(hit.mxik())) {
            return false;
        }
        boolean changed = false;
        String mxik = PharmacyDbFieldLimits.ikpu(hit.mxik());
        if (!StringUtils.hasText(product.getIkpu()) && StringUtils.hasText(mxik)) {
            product.setIkpu(mxik);
            product.setIkpuStatus("FOUND");
            changed = true;
        } else if (StringUtils.hasText(product.getIkpu()) && "UNKNOWN".equals(product.getIkpuStatus())) {
            product.setIkpuStatus("FOUND");
            changed = true;
        }
        if (!StringUtils.hasText(product.getPackageCode()) && StringUtils.hasText(hit.packageCode())) {
            product.setPackageCode(PharmacyDbFieldLimits.packageCode(hit.packageCode()));
            changed = true;
        }
        if (hit.labeled() && !product.isMarkedProduct()) {
            product.setMarkedProduct(true);
            changed = true;
        }
        if (changed) {
            products.save(product);
        }
        return changed;
    }

    private boolean applyRegistryAttrs(UUID productId, String name) {
        Map<String, String> before = attributes.getAttributes(productId);
        Map<String, String> next = new LinkedHashMap<>(before);
        putMissing(next, name);
        boolean changed = false;
        for (Map.Entry<String, String> entry : next.entrySet()) {
            if (entry.getValue() != null && !Objects.equals(entry.getValue(), before.get(entry.getKey()))) {
                attributes.upsertAttribute(productId, entry.getKey(), entry.getValue());
                changed = true;
            }
        }
        return changed;
    }

    private static void put(Map<String, String> attrs, String key, String value) {
        if (StringUtils.hasText(value)) {
            attrs.put(key, value.trim());
        }
    }

    private static String prefer(String registry, String current) {
        if (StringUtils.hasText(registry)) {
            return registry.trim();
        }
        return blank(current);
    }

    private static String blank(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
