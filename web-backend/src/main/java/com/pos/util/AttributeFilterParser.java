package com.pos.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.exception.BadRequestException;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public final class AttributeFilterParser {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, String>> MAP_TYPE = new TypeReference<>() {};

    private AttributeFilterParser() {
    }

    public static Map<String, String> parse(String attributeFiltersJson) {
        if (!StringUtils.hasText(attributeFiltersJson)) {
            return Collections.emptyMap();
        }
        try {
            Map<String, String> raw = MAPPER.readValue(attributeFiltersJson, MAP_TYPE);
            Map<String, String> normalized = new LinkedHashMap<>();
            for (Map.Entry<String, String> entry : raw.entrySet()) {
                if (!StringUtils.hasText(entry.getKey()) || !StringUtils.hasText(entry.getValue())) {
                    continue;
                }
                normalized.put(entry.getKey().trim().toLowerCase(), entry.getValue().trim());
            }
            return normalized;
        } catch (Exception ex) {
            throw new BadRequestException("Invalid attributeFilters JSON");
        }
    }
}
