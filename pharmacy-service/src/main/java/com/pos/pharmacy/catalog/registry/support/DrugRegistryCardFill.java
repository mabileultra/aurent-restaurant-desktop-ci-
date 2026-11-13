package com.pos.pharmacy.catalog.registry.support;

import com.pos.pharmacy.catalog.registry.entity.DrugRegistryEntry;
import com.pos.pharmacy.catalog.registry.service.DrugRegistryLookupService;
import com.pos.pharmacy.catalog.service.ProductAttributeService;
import com.pos.pharmacy.warehouse.support.PharmacyReceiptSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Дописывает пустые официальные поля. Цену, остаток и штрихкод не трогает. */
@Component
@RequiredArgsConstructor
public class DrugRegistryCardFill {

    public static final String ATTR_REGISTRATION = "registration_number";
    public static final String ATTR_ATC = "atc_code";

    private final DrugRegistryLookupService lookup;
    private final ProductAttributeService attributes;

    public record Official(String manufacturer, String country, Boolean prescription) {
    }

    public Official blanks(String name, String manufacturer, String country, Boolean prescription) {
        DrugRegistryEntry hit = lookup.unanimous(name).orElse(null);
        if (hit == null) {
            return new Official(blank(manufacturer), blank(country), prescription);
        }
        return new Official(
            first(manufacturer, hit.getManufacturer()),
            first(country, hit.getCountry()),
            prescription != null ? prescription : hit.getPrescriptionRequired()
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
        if (!StringUtils.hasText(attrs.get(PharmacyReceiptSupport.ATTR_PRESCRIPTION_REQUIRED))
            && hit.getPrescriptionRequired() != null) {
            attrs.put(
                PharmacyReceiptSupport.ATTR_PRESCRIPTION_REQUIRED,
                Boolean.TRUE.equals(hit.getPrescriptionRequired()) ? "true" : "false"
            );
        }
    }

    public boolean applyMissing(UUID productId, String name) {
        if (productId == null || !StringUtils.hasText(name)) {
            return false;
        }
        Map<String, String> before = attributes.getAttributes(productId);
        Map<String, String> next = new LinkedHashMap<>(before);
        putMissing(next, name);
        boolean changed = false;
        for (Map.Entry<String, String> entry : next.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().equals(before.get(entry.getKey()))) {
                attributes.upsertAttribute(productId, entry.getKey(), entry.getValue());
                changed = true;
            }
        }
        return changed;
    }

    private static void put(Map<String, String> attrs, String key, String value) {
        if (!StringUtils.hasText(attrs.get(key)) && StringUtils.hasText(value)) {
            attrs.put(key, value.trim());
        }
    }

    private static String first(String current, String registry) {
        if (StringUtils.hasText(current)) {
            return current.trim();
        }
        return blank(registry);
    }

    private static String blank(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
