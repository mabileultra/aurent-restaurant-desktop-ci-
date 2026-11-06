package com.pos.identity.service.access.support;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.identity.exception.BadRequestException;

import java.util.LinkedHashMap;
import java.util.Map;

final class ModuleAccessJson {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Boolean>> MAP_TYPE = new TypeReference<>() {};

    private ModuleAccessJson() {}

    static String toJson(Map<String, Boolean> modules) {
        try {
            return MAPPER.writeValueAsString(modules != null ? modules : Map.of());
        } catch (Exception e) {
            throw new BadRequestException("Failed to serialize module access snapshot");
        }
    }

    static Map<String, Boolean> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            Map<String, Boolean> parsed = MAPPER.readValue(json, MAP_TYPE);
            return parsed != null ? new LinkedHashMap<>(parsed) : Map.of();
        } catch (Exception e) {
            return Map.of();
        }
    }
}
