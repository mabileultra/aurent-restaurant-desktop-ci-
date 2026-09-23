package com.pos.pharmacy.warehouse.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.pos.pharmacy.config.PharmacyTasnifProperties;
import com.pos.shared.log.LogUtil;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@Component
public class PharmacyImportTasnifClientImpl implements PharmacyImportTasnifClient {

    private final RestClient restClient;
    private final PharmacyTasnifProperties properties;

    public PharmacyImportTasnifClientImpl(
        @Qualifier("pharmacyTasnifRestClient") RestClient restClient,
        PharmacyTasnifProperties properties
    ) {
        this.restClient = restClient;
        this.properties = properties;
    }

    @Override
    public PharmacyImportTasnifHit fetch(String mxik) {
        if (!StringUtils.hasText(mxik)) {
            return PharmacyImportTasnifHit.miss();
        }
        String code = normalizeMxik(mxik);
        if (code == null) {
            return PharmacyImportTasnifHit.miss();
        }
        URI uri = UriComponentsBuilder
            .fromUriString(properties.getBaseUrl())
            .path("/integration-mxik/get/information")
            .queryParam("page", 0)
            .queryParam("size", 1)
            .queryParam("type", properties.getSearchType())
            .queryParam("lang", properties.getDefaultLang())
            .queryParam("mxikCode", code)
            .build()
            .toUri();
        try {
            return restClient.get()
                .uri(uri)
                .exchange((request, response) -> {
                    if (response.getStatusCode().isError()) {
                        LogUtil.warn(
                            PharmacyImportTasnifClientImpl.class,
                            "tasnif HTTP {} mxik={}",
                            response.getStatusCode().value(),
                            code
                        );
                        return PharmacyImportTasnifHit.miss();
                    }
                    JsonNode root = response.bodyTo(JsonNode.class);
                    return PharmacyImportTasnifPayloadRead.first(root);
                });
        } catch (RestClientException ex) {
            LogUtil.warn(PharmacyImportTasnifClientImpl.class, "tasnif lookup failed mxik={}: {}", code, ex.getMessage());
            return PharmacyImportTasnifHit.miss();
        }
    }

    /** Тасниф принимает ровно 17 цифр; Excel часто теряет ведущий 0. */
    static String normalizeMxik(String mxik) {
        String digits = mxik.replaceAll("\\D", "");
        if (digits.length() < 14) {
            return null;
        }
        return PharmacyImportIkpu.pad17(digits);
    }
}
