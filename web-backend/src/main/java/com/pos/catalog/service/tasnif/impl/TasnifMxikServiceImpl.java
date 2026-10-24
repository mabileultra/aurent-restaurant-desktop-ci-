package com.pos.catalog.service.tasnif.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.pos.catalog.config.TasnifProperties;
import com.pos.catalog.dto.tasnif.MxikCatalogItemDto;
import com.pos.catalog.dto.tasnif.MxikLookupDto;
import com.pos.catalog.dto.tasnif.MxikPackageDto;
import com.pos.catalog.dto.tasnif.MxikSearchResponse;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.catalog.service.tasnif.TasnifMxikService;
import com.pos.shared.log.LogUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
public class TasnifMxikServiceImpl implements TasnifMxikService {

    private final RestClient tasnifRestClient;
    private final TasnifProperties properties;

    @Override
    public MxikSearchResponse search(String query, String lang, int page, int size) {
        String q = query != null ? query.trim() : "";
        if (q.length() < 2) {
            throw new BadRequestException("Введите минимум 2 символа для поиска");
        }
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 50);

        String digits = normalizeDigits(q);
        String resolvedLang = resolveLang(lang);
        List<Consumer<UriComponentsBuilder>> strategies = new ArrayList<>();
        if (digits.length() >= 17 && isMostlyDigits(q)) {
            strategies.add(builder -> builder.queryParam("mxikCode", digits));
        } else if (digits.length() >= 8 && digits.length() <= 14 && isMostlyDigits(q)) {
            strategies.add(builder -> builder.queryParam("shtrixCode", digits));
        } else if (digits.length() >= 15 && isMostlyDigits(q)) {
            strategies.add(builder -> builder.queryParam("mxikCode", digits));
        }
        strategies.add(builder -> builder.queryParam("search_text", q));

        MxikSearchResponse empty = new MxikSearchResponse(List.of(), safePage, safeSize, 0);
        for (Consumer<UriComponentsBuilder> strategy : strategies) {
            MxikSearchResponse page = fetchOrEmpty(resolvedLang, safePage, safeSize, properties.getSearchType(), strategy);
            if (!page.items().isEmpty()) {
                return page;
            }
        }
        return empty;
    }

    @Override
    public MxikCatalogItemDto getByMxik(String mxik, String lang) {
        String code = normalizeDigits(mxik);
        if (code.length() < 10) {
            throw new BadRequestException("Некорректный код ИКПУ");
        }
        MxikSearchResponse page = fetchPage(
            resolveLang(lang), 0, 1, properties.getSearchType(),
            b -> b.queryParam("mxikCode", code)
        );
        if (page.items().isEmpty()) {
            throw new ResourceNotFoundException("Товар не найден в tasnif.soliq.uz");
        }
        return page.items().get(0);
    }

    @Override
    public MxikLookupDto lookupByIkpu(String ikpu, String lang) {
        MxikCatalogItemDto item = getByMxik(ikpu, lang);
        return toLookup(item, firstPackage(item), lang);
    }

    @Override
    public MxikLookupDto lookupByBarcode(String barcode, String lang) {
        String code = normalizeDigits(barcode);
        if (code.length() < 8) {
            throw new BadRequestException("Штрихкод должен содержать не менее 8 цифр");
        }
        MxikSearchResponse page = fetchOrEmpty(
            resolveLang(lang), 0, 1, properties.getSearchType(),
            b -> b.queryParam("shtrixCode", code)
        );
        if (page.items().isEmpty()) {
            page = fetchOrEmpty(
                resolveLang(lang), 0, 1, properties.getSearchType(),
                b -> b.queryParam("search_text", code)
            );
        }
        if (page.items().isEmpty()) {
            throw new ResourceNotFoundException("Товар не найден в tasnif.soliq.uz");
        }
        MxikCatalogItemDto item = page.items().get(0);
        return toLookup(item, firstPackage(item), lang);
    }

    private MxikSearchResponse fetchOrEmpty(
        String lang,
        int page,
        int size,
        int type,
        Consumer<UriComponentsBuilder> params
    ) {
        try {
            return fetchPage(lang, page, size, type, params);
        } catch (ResourceNotFoundException ex) {
            return new MxikSearchResponse(List.of(), page, size, 0);
        }
    }

    private MxikSearchResponse fetchPage(
        String lang,
        int page,
        int size,
        int type,
        Consumer<UriComponentsBuilder> params
    ) {
        if (!properties.isEnabled()) {
            throw new BadRequestException("Сервис tasnif.soliq.uz отключён");
        }

        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(properties.getBaseUrl())
            .path("/integration-mxik/get/information")
            .queryParam("page", page)
            .queryParam("size", size)
            .queryParam("type", type)
            .queryParam("lang", lang);
        params.accept(builder);

        // Абсолютный URI + объект (не String) — иначе RestClient либо падает с
        // "URI is not absolute", либо повторно кодирует кириллицу в query.
        URI uri = builder.build().toUri();

        try {
            JsonNode root = tasnifRestClient.get()
                .uri(uri)
                .retrieve()
                .body(JsonNode.class);

            if (root == null || !root.path("success").asBoolean(false)) {
                String reason = root != null ? root.path("reason").asText("No data") : "Empty response";
                throw new ResourceNotFoundException("tasnif: " + reason);
            }

            JsonNode data = root.path("data");
            List<MxikCatalogItemDto> items = new ArrayList<>();
            if (data.isArray()) {
                for (JsonNode node : data) {
                    items.add(mapItem(node, lang));
                }
            }

            long total = root.path("recordTotal").asLong(items.size());
            return new MxikSearchResponse(items, page, size, total);
        } catch (ResourceNotFoundException | BadRequestException ex) {
            throw ex;
        } catch (RestClientException ex) {
            LogUtil.error(TasnifMxikServiceImpl.class, "tasnif API error: {}", ex.getMessage());
            throw new BadRequestException("Не удалось связаться с tasnif.soliq.uz");
        }
    }

    private MxikCatalogItemDto mapItem(JsonNode item, String lang) {
        List<MxikPackageDto> packages = mapPackages(item.path("packages"), lang);
        String name = text(item, "name");
        String description = text(item, "description");
        String barcode = resolveBarcode(item);
        return new MxikCatalogItemDto(
            text(item, "mxik"),
            StringUtils.hasText(name) ? name : description,
            description,
            barcode,
            barcode,
            item.path("label").asInt(0) != 0,
            item.path("usePackage").asInt(0) == 1,
            packages
        );
    }

    private static String resolveBarcode(JsonNode item) {
        return firstNonBlank(
            text(item, "internalCode"),
            text(item, "shtrixCode"),
            text(item, "barcode"),
            text(item, "internal_code")
        );
    }

    private List<MxikPackageDto> mapPackages(JsonNode packagesNode, String lang) {
        List<MxikPackageDto> list = new ArrayList<>();
        if (!packagesNode.isArray()) {
            return list;
        }
        for (JsonNode pkg : packagesNode) {
            list.add(new MxikPackageDto(
                nodeAsString(pkg.get("code")),
                text(pkg, "mxikCode"),
                text(pkg, "nameRu"),
                text(pkg, "nameUz"),
                text(pkg, "nameLat"),
                text(pkg, "packageType")
            ));
        }
        return list;
    }

    private MxikLookupDto toLookup(MxikCatalogItemDto item, MxikPackageDto pkg, String lang) {
        String unit = pkg != null ? pickUnitName(pkg, lang) : null;
        return new MxikLookupDto(
            item.mxik(),
            item.name(),
            item.description(),
            item.barcode(),
            unit,
            pkg != null ? pkg.packageType() : null,
            pkg != null ? pkg.code() : null,
            item.markedProduct(),
            item.usePackage()
        );
    }

    private static MxikPackageDto firstPackage(MxikCatalogItemDto item) {
        if (item.packages() == null || item.packages().isEmpty()) {
            return null;
        }
        return item.packages().get(0);
    }

    private static String pickUnitName(MxikPackageDto pkg, String lang) {
        if ("ru".equalsIgnoreCase(lang)) {
            return firstNonBlank(pkg.nameRu(), pkg.nameUz(), pkg.nameLat());
        }
        return firstNonBlank(pkg.nameUz(), pkg.nameRu(), pkg.nameLat());
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (StringUtils.hasText(v)) {
                return v.trim();
            }
        }
        return null;
    }

    private static String text(JsonNode node, String field) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        return nodeAsString(node.get(field));
    }

    private static String nodeAsString(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isNumber()) {
            return node.numberValue().toString();
        }
        String v = node.asText(null);
        return StringUtils.hasText(v) ? v.trim() : null;
    }

    private static String normalizeDigits(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        return raw.replaceAll("\\D", "");
    }

    private static boolean isMostlyDigits(String raw) {
        String digits = normalizeDigits(raw);
        return digits.length() >= 8 && digits.length() >= raw.replaceAll("\\s", "").length() * 0.8;
    }

    private String resolveLang(String lang) {
        if (!StringUtils.hasText(lang)) {
            return properties.getDefaultLang();
        }
        String l = lang.trim().toLowerCase();
        return "ru".equals(l) ? "ru" : "uz";
    }
}
