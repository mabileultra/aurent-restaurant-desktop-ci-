package com.pos.pharmacy.warehouse.support;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Разбор ответа tasnif.soliq.uz /integration-mxik/get/information. */
public final class PharmacyImportTasnifPayloadRead {

    private PharmacyImportTasnifPayloadRead() {
    }

    public static PharmacyImportTasnifHit first(JsonNode root) {
        if (root == null || !root.path("success").asBoolean(false)) {
            return PharmacyImportTasnifHit.miss();
        }
        JsonNode data = root.path("data");
        if (!data.isArray() || data.isEmpty()) {
            return PharmacyImportTasnifHit.miss();
        }
        return item(data.get(0));
    }

    static PharmacyImportTasnifHit item(JsonNode node) {
        if (node == null || node.isNull()) {
            return PharmacyImportTasnifHit.miss();
        }
        List<String> packages = new ArrayList<>();
        JsonNode pkgs = node.path("packages");
        if (pkgs.isArray()) {
            for (JsonNode pkg : pkgs) {
                String code = text(pkg, "code");
                if (StringUtils.hasText(code)) {
                    packages.add(code);
                }
            }
        }
        String name = text(node, "name");
        String description = text(node, "description");
        String catalog = join(name, description);
        boolean labeled = node.path("label").asInt(0) != 0;
        String mxik = firstNonBlank(text(node, "mxik"), text(node, "mxikCode"), text(node, "ikpu"));
        return new PharmacyImportTasnifHit(
            true,
            labeled,
            PharmacyImportTasnifPackagePick.single(packages),
            catalog,
            mxik
        );
    }

    /** Поиск по имени: точное совпадение name, иначе единственный hit. */
    public static PharmacyImportTasnifHit pickForName(JsonNode root, String queryName) {
        if (root == null || !root.path("success").asBoolean(false)) {
            return PharmacyImportTasnifHit.miss();
        }
        JsonNode data = root.path("data");
        if (!data.isArray() || data.isEmpty()) {
            return PharmacyImportTasnifHit.miss();
        }
        String want = queryName == null ? "" : queryName.trim().toLowerCase(Locale.ROOT);
        PharmacyImportTasnifHit exact = null;
        for (JsonNode node : data) {
            PharmacyImportTasnifHit hit = item(node);
            if (!hit.found()) {
                continue;
            }
            String hitName = text(node, "name");
            if (hitName != null && hitName.trim().toLowerCase(Locale.ROOT).equals(want)) {
                exact = hit;
                break;
            }
        }
        if (exact != null) {
            return exact;
        }
        if (data.size() == 1) {
            return item(data.get(0));
        }
        return PharmacyImportTasnifHit.miss();
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private static String join(String left, String right) {
        if (!StringUtils.hasText(left)) {
            return right == null ? "" : right;
        }
        if (!StringUtils.hasText(right)) {
            return left;
        }
        return left + " " + right;
    }

    private static String text(JsonNode node, String field) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || value.isMissingNode()) {
            return null;
        }
        String text = value.asText(null);
        return StringUtils.hasText(text) ? text.trim() : null;
    }
}
