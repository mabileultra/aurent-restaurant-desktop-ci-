package com.pos.catalog.service.tasnif.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.pos.catalog.dto.tasnif.MxikPackageDto;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Маппинг packages / packageNames из ответов Tasnif. */
public final class TasnifMxikPackageMapper {

    private TasnifMxikPackageMapper() {
    }

    public static List<MxikPackageDto> mapPackages(JsonNode packagesNode) {
        List<MxikPackageDto> list = new ArrayList<>();
        if (packagesNode == null || !packagesNode.isArray()) {
            return list;
        }
        for (JsonNode pkg : packagesNode) {
            MxikPackageDto mapped = mapOne(pkg);
            if (mapped != null) {
                list.add(mapped);
            }
        }
        return list;
    }

    /** information часто отдаёт только штуку; history.packageNames — полный набор (коробка=12). */
    public static List<MxikPackageDto> mergeByCode(List<MxikPackageDto> primary, List<MxikPackageDto> extra) {
        Map<String, MxikPackageDto> byCode = new LinkedHashMap<>();
        for (MxikPackageDto pkg : primary == null ? List.<MxikPackageDto>of() : primary) {
            if (pkg != null && StringUtils.hasText(pkg.code())) {
                byCode.put(pkg.code().trim(), pkg);
            }
        }
        for (MxikPackageDto pkg : extra == null ? List.<MxikPackageDto>of() : extra) {
            if (pkg == null || !StringUtils.hasText(pkg.code())) {
                continue;
            }
            byCode.putIfAbsent(pkg.code().trim(), pkg);
        }
        return new ArrayList<>(byCode.values());
    }

    private static MxikPackageDto mapOne(JsonNode pkg) {
        if (pkg == null || pkg.isNull()) {
            return null;
        }
        String code = nodeAsString(pkg.get("code"));
        if (!StringUtils.hasText(code)) {
            return null;
        }
        return new MxikPackageDto(
            code.trim(),
            text(pkg, "mxikCode"),
            text(pkg, "nameRu"),
            text(pkg, "nameUz"),
            text(pkg, "nameLat"),
            text(pkg, "packageType")
        );
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return StringUtils.hasText(text) ? text.trim() : null;
    }

    private static String nodeAsString(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.asText();
        }
        String text = node.asText();
        return StringUtils.hasText(text) ? text.trim() : null;
    }
}
