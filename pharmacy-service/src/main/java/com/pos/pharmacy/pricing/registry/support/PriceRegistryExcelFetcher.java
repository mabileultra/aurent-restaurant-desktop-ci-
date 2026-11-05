package com.pos.pharmacy.pricing.registry.support;

import com.pos.pharmacy.exception.BusinessException;
import com.pos.pharmacy.exception.PharmacyErrors;
import com.pos.pharmacy.exception.errorcode.PharmacyPriceRegistryErrors;
import com.pos.shared.log.LogUtil;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Locale;

/** Jsoup: найти ссылку на .xlsx на pharm.gov.uz и скачать во временный файл. */
@Component
public class PriceRegistryExcelFetcher {

    private final String pageUrl;
    private final HttpClient http = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(30))
        .followRedirects(HttpClient.Redirect.NORMAL)
        .build();

    public PriceRegistryExcelFetcher(
        @Value("${app.pharmacy.price-registry.page-url:https://pharm.gov.uz}") String pageUrl
    ) {
        this.pageUrl = pageUrl;
    }

    public FetchedExcel fetchLatest() {
        String excelUrl = resolveExcelUrl();
        Path temp;
        try {
            temp = Files.createTempFile("pharm-price-registry-", ".xlsx");
        } catch (IOException e) {
            throw PharmacyErrors.of(
                PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_FETCH_FAILED,
                "Не удалось создать временный файл"
            );
        }
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(excelUrl))
                .timeout(Duration.ofMinutes(3))
                .GET()
                .header("User-Agent", "AurentPharmacyPriceRegistry/1.0")
                .build();
            HttpResponse<InputStream> response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                Files.deleteIfExists(temp);
                throw PharmacyErrors.of(
                    PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_FETCH_FAILED,
                    "HTTP " + response.statusCode() + " при скачивании " + excelUrl
                );
            }
            try (InputStream in = response.body()) {
                Files.copy(in, temp, StandardCopyOption.REPLACE_EXISTING);
            }
            LogUtil.info(PriceRegistryExcelFetcher.class, "Downloaded registry excel from {}", excelUrl);
            return new FetchedExcel(excelUrl, temp.getFileName().toString(), temp);
        } catch (BusinessException ex) {
            safeDelete(temp);
            throw ex;
        } catch (Exception e) {
            safeDelete(temp);
            LogUtil.error(PriceRegistryExcelFetcher.class, "Registry download failed: {}", e.toString());
            throw PharmacyErrors.of(
                PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_FETCH_FAILED,
                e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            );
        }
    }

    private String resolveExcelUrl() {
        try {
            Document doc = Jsoup.connect(pageUrl)
                .userAgent("AurentPharmacyPriceRegistry/1.0")
                .timeout(30_000)
                .get();
            for (Element link : doc.select("a[href]")) {
                String href = link.attr("abs:href");
                if (href == null || href.isBlank()) {
                    continue;
                }
                String lower = href.toLowerCase(Locale.ROOT);
                if (!(lower.contains(".xlsx") || lower.contains(".xls"))) {
                    continue;
                }
                String text = (link.text() + " " + href).toLowerCase(Locale.ROOT);
                if (text.contains("референт")
                    || text.contains("предел")
                    || text.contains("рознич")
                    || text.contains("реестр")
                    || text.contains("narx")
                    || text.contains("price")
                    || lower.endsWith(".xlsx")
                    || lower.endsWith(".xls")) {
                    return href;
                }
            }
            for (Element link : doc.select("a[href]")) {
                String href = link.attr("abs:href");
                if (href == null) {
                    continue;
                }
                String lower = href.toLowerCase(Locale.ROOT);
                if (lower.endsWith(".xlsx") || lower.contains(".xlsx?")) {
                    return href;
                }
            }
        } catch (IOException e) {
            LogUtil.error(PriceRegistryExcelFetcher.class, "Page fetch failed: {}", e.toString());
            throw PharmacyErrors.of(
                PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_FETCH_FAILED,
                e.getMessage() != null ? e.getMessage() : "network"
            );
        }
        throw PharmacyErrors.of(PharmacyPriceRegistryErrors.PHARM_PRICE_REGISTRY_LINK_NOT_FOUND);
    }

    private static void safeDelete(Path temp) {
        try {
            Files.deleteIfExists(temp);
        } catch (IOException ignored) {
            // best-effort
        }
    }

    public record FetchedExcel(String sourceUrl, String fileName, Path path) {}
}
