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
import java.util.function.Function;

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
        PharmacyImportTasnifHit hit = get(
            b -> b.queryParam("mxikCode", code),
            1,
            "mxik=" + code
        );
        return withMxik(hit, code);
    }

    @Override
    public PharmacyImportTasnifHit fetchByBarcode(String barcode) {
        if (!StringUtils.hasText(barcode)) {
            return PharmacyImportTasnifHit.miss();
        }
        String digits = barcode.replaceAll("\\D", "");
        if (digits.length() < 8) {
            return PharmacyImportTasnifHit.miss();
        }
        return get(b -> b.queryParam("shtrixCode", digits), 1, "barcode=" + digits);
    }

    @Override
    public PharmacyImportTasnifHit searchByName(String name) {
        if (!StringUtils.hasText(name) || name.trim().length() < 2) {
            return PharmacyImportTasnifHit.miss();
        }
        String q = name.trim();
        return get(
            b -> b.queryParam("search_text", q),
            8,
            "name",
            root -> PharmacyImportTasnifPayloadRead.pickForName(root, q)
        );
    }

    private PharmacyImportTasnifHit get(
        Function<UriComponentsBuilder, UriComponentsBuilder> params,
        int size,
        String logKey
    ) {
        return get(params, size, logKey, PharmacyImportTasnifPayloadRead::first);
    }

    private PharmacyImportTasnifHit get(
        Function<UriComponentsBuilder, UriComponentsBuilder> params,
        int size,
        String logKey,
        Function<JsonNode, PharmacyImportTasnifHit> read
    ) {
        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(properties.getBaseUrl())
            .path("/integration-mxik/get/information")
            .queryParam("page", 0)
            .queryParam("size", size)
            .queryParam("type", properties.getSearchType())
            .queryParam("lang", properties.getDefaultLang());
        URI uri = params.apply(builder).build().toUri();
        try {
            return restClient.get()
                .uri(uri)
                .exchange((request, response) -> {
                    if (response.getStatusCode().isError()) {
                        LogUtil.warn(
                            PharmacyImportTasnifClientImpl.class,
                            "tasnif HTTP {} {}",
                            response.getStatusCode().value(),
                            logKey
                        );
                        return PharmacyImportTasnifHit.miss();
                    }
                    return read.apply(response.bodyTo(JsonNode.class));
                });
        } catch (RestClientException ex) {
            LogUtil.warn(PharmacyImportTasnifClientImpl.class, "tasnif lookup failed {}: {}", logKey, ex.getMessage());
            return PharmacyImportTasnifHit.miss();
        }
    }

    private static PharmacyImportTasnifHit withMxik(PharmacyImportTasnifHit hit, String code) {
        if (hit == null || !hit.found() || StringUtils.hasText(hit.mxik())) {
            return hit == null ? PharmacyImportTasnifHit.miss() : hit;
        }
        return new PharmacyImportTasnifHit(hit.found(), hit.labeled(), hit.packageCode(), hit.catalogText(), code);
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
