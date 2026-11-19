package com.pos.catalog.service.tasnif.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.pos.catalog.config.TasnifProperties;
import com.pos.catalog.dto.tasnif.MxikPackageDto;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

/**
 * Tasnif history отдаёт полный packageNames (коробка=N), information — часто только штуку.
 */
@Component
@RequiredArgsConstructor
public class TasnifMxikHistoryPackagesClient {

    private final RestClient tasnifRestClient;
    private final TasnifProperties properties;

    public List<MxikPackageDto> fetchPackageNames(String mxik, String lang) {
        if (!properties.isEnabled() || mxik == null || mxik.isBlank()) {
            return List.of();
        }
        URI uri = UriComponentsBuilder
            .fromUriString(properties.getBaseUrl())
            .path("/integration-mxik/get/history/{mxik}")
            .queryParam("lang", lang == null || lang.isBlank() ? properties.getDefaultLang() : lang)
            .buildAndExpand(mxik.trim())
            .toUri();
        try {
            JsonNode root = tasnifRestClient.get()
                .uri(uri)
                .retrieve()
                .body(JsonNode.class);
            if (root == null || !root.path("success").asBoolean(false)) {
                return List.of();
            }
            JsonNode data = root.path("data");
            if (data.isMissingNode() || data.isNull()) {
                return List.of();
            }
            JsonNode names = data.path("packageNames");
            if (!names.isArray()) {
                names = data.path("packages");
            }
            return TasnifMxikPackageMapper.mapPackages(names);
        } catch (RestClientException ex) {
            LogUtil.warn(TasnifMxikHistoryPackagesClient.class, "tasnif history packages: {}", ex.getMessage());
            return List.of();
        }
    }
}
